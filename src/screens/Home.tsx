import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Pressable, Text} from '@gluestack-ui/themed';
import {
  Alert,
  Image,
  Linking,
  Platform,
  View,
  TouchableOpacity,
  LogBox,
  ScrollView,
} from 'react-native';
import MapView, {
  AnimatedRegion,
  Marker,
  PROVIDER_GOOGLE,
} from 'react-native-maps';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {Container} from '../components/Container';
import {colors as originalColors} from '../constants/colors';
import {HamburgerIcon, Notification} from '../components/Icons';
import {GOOGLE_API_KEY} from '../constants/contants';
import {NavigationString} from '../navigation/navigationStrings';
import PrimaryButton from '../components/Button/PrimaryButton';
import MapViewDirections from 'react-native-maps-directions';
import Icons from '../assets/Icons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {useTheme} from '../constants/ThemeContext';
import {useDispatch} from 'react-redux';
import {
  loadUserFromStorage,
  saveUserToStorage,
} from '../store/slice/UserSlice';
import {
  stopWatchingLocation,
  watchLocationContinuously,
  getCurrentLocationOnce,
} from '../utils/locationHelper';
import socketServices from '../utils/socketServices';
import AsyncStorage from '@react-native-async-storage/async-storage';
import OngoingRideModal from '../components/OngoingRideModal/OngoingRideModal';
import CustomBottomsheetRideALerts from './CustomBottomsheetRideALerts';
import CustomPaymentBottomSheet from './CustomPaymentBottomSheet';
import LinearGradient from 'react-native-linear-gradient';

LogBox.ignoreLogs(['Warning: ...']);

const newTheme = {
  primary: '#4F46E5',
  primaryLight: '#818CF8',
  primaryDark: '#4338CA',
  secondary: '#0EA5E9',
  secondaryLight: '#38BDF8',
  accent: '#10B981',
  accentLight: '#34D399',
  warning: '#F59E0B',
  danger: '#EF4444',
};

const fontFamily = {
  bold: 'Inter-Bold',
  semiBold: 'Inter-SemiBold',
  medium: 'Inter-Medium',
  regular: 'Inter-Regular',
};

const colors = {
  ...originalColors,
  themePrimary: newTheme.primary,
  emeraldGreen: newTheme.accent,
  black: originalColors.black,
};

const LATITUDE_DELTA = 0.003;
const LONGITUDE_DELTA = 0.003;

// Default to user's verified location (Ranchi, Kusum Vihar)
const DEFAULT_RANCHI_REGION = {
  latitude: 23.399888,
  longitude: 85.343735,
  latitudeDelta: 0.005,
  longitudeDelta: 0.005,
};

interface Location {
  latitude: number;
  longitude: number;
  address?: string;
  distance?: string;
}

interface State {
  curLoc: Location;
  destinationCords: Location;
  isLoading: boolean;
  coordinate: AnimatedRegion;
  distance?: number;
  routeDuration?: string;
}

const Home = () => {
  const {isDarkMode} = useTheme();
  const dispatch = useDispatch();
  const navigation = useNavigation<any>();
  const mapRef = useRef<MapView>(null);
  const markerRef = useRef<any>(null);
  const locationWatcherRef = useRef<any>(null);
  
  const [isMapReady, setIsMapReady] = useState(false);
  const [isMapLayoutRendered, setIsMapLayoutRendered] = useState(false);
  
  const initialZoomDoneRef = useRef(false);
  const latestLocationRef = useRef<{latitude: number; longitude: number} | null>(null);

  // Setup state with correct Ranchi coordinates by default
  const [state, setState] = useState<State>({
    curLoc: {latitude: 23.399888, longitude: 85.343735, address: ''},
    destinationCords: {latitude: 0, longitude: 0},
    isLoading: false,
    coordinate: new AnimatedRegion({
      latitude: 23.399888,
      longitude: 85.343735,
      latitudeDelta: LATITUDE_DELTA,
      longitudeDelta: LONGITUDE_DELTA,
    }),
    distance: 0,
    routeDuration: '0',
  });

  const [showLocationRoute, setShowLocationRoute] = useState(false);
  const [userLocalData, setUserLocalData] = useState<any>(null);
  const [socketInitialized, setSocketInitialized] = useState(false);
  const [pickupData, setPickupData] = useState<any>(null);
  const [ongoingRide, setOngoingRide] = useState<any>(null);
  const [showOngoingRideModal, setShowOngoingRideModal] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertType, setAlertType] = useState<'confirmation' | 'rating' | null>(null);
  const [completedRideData, setCompletedRideData] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [completedRideForPayment, setCompletedRideForPayment] = useState<any>(null);
  const [selectedRideType, setSelectedRideType] = useState<'bike' | 'car' | 'auto'>('auto');

  const [followUser, setFollowUser] = useState(true);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationRetryCount, setLocationRetryCount] = useState(0);

  // ---------- Enforced Camera Controller API ----------
  const forceCameraZoom = useCallback((lat: number, lng: number) => {
    if (!mapRef.current) return;
    
    console.log(`🚀 Forcing Zoom Camera to Target: ${lat}, ${lng}`);
    mapRef.current.animateCamera(
      {
        center: {latitude: lat, longitude: lng},
        zoom: 16, // Perfect street level view zoom
        pitch: 0,
        heading: 0,
      },
      {duration: 1200}
    );
  }, []);

  const zoomToCurrentLocation = useCallback(() => {
    const lat = latestLocationRef.current?.latitude || state.curLoc.latitude;
    const lng = latestLocationRef.current?.longitude || state.curLoc.longitude;
    
    if (lat && lng) {
      forceCameraZoom(lat, lng);
    }
  }, [state.curLoc.latitude, state.curLoc.longitude, forceCameraZoom]);

  // ---------- Sync and Zoom Saved Async Data ----------
  useEffect(() => {
    if (isMapReady && isMapLayoutRendered && userLocalData?.pickupDetails) {
      const {latitude, longitude, address} = userLocalData.pickupDetails;
      
      console.log("🎯 Auto Zooming Map to Stored App Data Location");
      
      latestLocationRef.current = {latitude, longitude};
      
      setState(prev => ({
        ...prev,
        curLoc: {latitude, longitude, address: address || prev.curLoc.address}
      }));

      state.coordinate.setValue({
        latitude,
        longitude,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      });

      forceCameraZoom(latitude, longitude);
      initialZoomDoneRef.current = true;
    }
  }, [isMapReady, isMapLayoutRendered, userLocalData, forceCameraZoom]);

  // ---------- Get live location device once ----------
  const getLocationOnce = async (retry = true): Promise<Location | null> => {
    setIsGettingLocation(true);
    try {
      const locationData = await getCurrentLocationOnce();
      if (!locationData) {
        if (retry && locationRetryCount < 3) {
          setLocationRetryCount(prev => prev + 1);
          await new Promise(resolve => setTimeout(resolve, 1000));
          return getLocationOnce(retry);
        }
        return null;
      }
      const {latitude, longitude} = locationData.coordinates;
      const {formatted} = locationData.address;
      const pickupDetails = {latitude, longitude, address: formatted};
      
      latestLocationRef.current = {latitude, longitude};
      setPickupData(pickupDetails);
      await saveUserToStorage({...userLocalData, pickupDetails});
      
      setState(prev => ({
        ...prev,
        curLoc: {latitude, longitude, address: formatted},
      }));

      state.coordinate.setValue({
        latitude,
        longitude,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      });

      if (isMapReady && isMapLayoutRendered) {
        forceCameraZoom(latitude, longitude);
        initialZoomDoneRef.current = true;
      }

      return pickupDetails;
    } catch (error) {
      console.error('Location once fetch error:', error);
      return null;
    } finally {
      setIsGettingLocation(false);
    }
  };

  const animateMarker = (latitude: number, longitude: number) => {
    if (Platform.OS === 'android' && markerRef.current) {
      markerRef.current.animateMarkerToCoordinate({latitude, longitude}, 600);
    } else {
      state.coordinate
        .timing({
          latitude,
          longitude,
          latitudeDelta: LATITUDE_DELTA,
          longitudeDelta: LONGITUDE_DELTA,
          useNativeDriver: false,
          duration: 600
        })
        .start();
    }
  };

  const onCenter = () => {
    zoomToCurrentLocation();
  };

  // ---------- Live GPS Stream Watcher Engine ----------
  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      let retryTimeout: NodeJS.Timeout;

      // Reset markers flags when opening screen
      initialZoomDoneRef.current = false;

      const initializeLocation = async () => {
        const freshLocation = await getLocationOnce();
        if (!isActive) return;
        if (!freshLocation) {
          retryTimeout = setTimeout(() => {
            if (isActive) initializeLocation();
          }, 3000);
        }
      };

      initializeLocation();

      const startWatcher = () => {
        if (locationWatcherRef.current) stopWatchingLocation();
        
        const watcher = watchLocationContinuously(
          (location: any) => {
            if (!isActive) return;
            const {latitude, longitude} = location;
            
            latestLocationRef.current = {latitude, longitude};

            setState(prev => ({
              ...prev,
              curLoc: {...prev.curLoc, latitude, longitude}
            }));

            animateMarker(latitude, longitude);

            // Dynamically Lock Map View Camera if route is not generated
            if (followUser && isMapReady && isMapLayoutRendered && !showLocationRoute) {
              mapRef.current?.animateCamera({
                center: {latitude, longitude}
              });
            }

            if (socketInitialized) {
              socketServices.emit('registerClientLocation', {
                lat: latitude,
                lng: longitude,
              });
            }
          },
          (error: any) => {
            if (error.code === 2) {
              Alert.alert('Location Disabled', 'Please enable location.', [
                {text: 'Cancel', style: 'cancel'},
                {text: 'Open Settings', onPress: () => Linking.openSettings()},
              ]);
            }
          },
        );
        locationWatcherRef.current = watcher;
      };
      
      startWatcher();

      return () => {
        isActive = false;
        clearTimeout(retryTimeout);
        if (locationWatcherRef.current) {
          stopWatchingLocation();
          locationWatcherRef.current = null;
        }
      };
    }, [socketInitialized, followUser, isMapReady, isMapLayoutRendered, showLocationRoute])
  );

  // ---------- Storage Bootloader Loader ----------
  useEffect(() => {
    const load = async () => {
      const localData = await loadUserFromStorage();
      const token = await AsyncStorage.getItem('userToken');
      setUserLocalData({...localData, token});
    };
    load();
  }, []);

  useEffect(() => {
    if (!userLocalData?.token) return;
    const initSocket = async () => {
      if (socketServices.isConnected()) {
        setSocketInitialized(true);
        socketServices.on('nearbyDriverList', setNearbyDrivers);
        socketServices.emit('onGoing_booking', {});
        socketServices.on('onGoing_Booking_List', handleOngoingBooking);
        socketServices.on('driver_booking_response', handleDriverBookingResponse);
      }
    };
    initSocket();
    return () => {
      socketServices.removeListener('onGoing_Booking_List', handleOngoingBooking);
      socketServices.removeListener('driver_booking_response', handleDriverBookingResponse);
    };
  }, [userLocalData]);

  const setNearbyDrivers = (data: any) => {};

  const handleOngoingBooking = (data: any) => {
    const ride = data.data?.[0];
    handleRideStatusChange(ride);
  };
  
  const handleDriverBookingResponse = (data: any) => {
    handleRideStatusChange(data?.data);
  };
  
  const handleRideStatusChange = (ride: any) => {
    if (!ride) return;
    if (ride.bookingStatus === 'ongoing' && ride.rideStatus === 'rideNotPicked') {
      setOngoingRide(ride);
      setShowOngoingRideModal(true);
    } else if (ride.bookingStatus === 'ongoing' && ride.rideStatus === 'ridePicked') {
      setOngoingRide(ride);
      setAlertType('confirmation');
      setShowAlert(true);
      setShowOngoingRideModal(false);
    } else if (ride.bookingStatus === 'completed' && ride.rideStatus === 'ridePicked') {
      setCompletedRideForPayment(ride);
      setShowPaymentModal(true);
      setOngoingRide(null);
    } else {
      setOngoingRide(null);
      setShowOngoingRideModal(false);
    }
  };

  const setDestination = (dest: any) => {
    if (dest) {
      setState(prev => ({...prev, destinationCords: dest}));
      setShowLocationRoute(true);
    }
  };

  const getEstimatedFare = (type?: string) => {
    const distance = state.distance || 0;
    if (type === 'car') return 50 + distance * 12;
    if (type === 'bike') return 20 + distance * 5;
    return 35 + distance * 8;
  };

  const renderRideTypeCard = (type: string, label: string, icon: any) => (
    <Pressable
      onPress={() => setSelectedRideType(type as any)}
      style={{
        flex: 1,
        alignItems: 'center',
        paddingVertical: 14,
        borderRadius: 20,
        backgroundColor:
          selectedRideType === type
            ? colors.themePrimary
            : isDarkMode
            ? '#1F2937'
            : '#FFF',
        borderWidth: selectedRideType === type ? 0 : 1,
        borderColor: isDarkMode ? '#374151' : '#E5E7EB',
      }}>
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor:
            selectedRideType === type
              ? 'rgba(255,255,255,0.2)'
              : isDarkMode
              ? '#374151'
              : '#F3F4F6',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 8,
        }}>
        <Image
          source={icon}
          style={{
            width: 32,
            height: 32,
            tintColor:
              selectedRideType === type
                ? '#FFF'
                : isDarkMode
                ? '#FFF'
                : '#4B5563',
          }}
        />
      </View>
      <Text
        style={{
          fontFamily: fontFamily.semiBold,
          fontSize: 12,
          color:
            selectedRideType === type
              ? '#FFF'
              : isDarkMode
              ? '#F9FAFB'
              : '#1F2937',
        }}>
        {label}
      </Text>
      {state.destinationCords?.address && (
        <Text
          style={{
            fontFamily: fontFamily.bold,
            fontSize: 13,
            color: selectedRideType === type ? '#FFF' : colors.themePrimary,
          }}>
          ₹{getEstimatedFare(type).toFixed(0)}
        </Text>
      )}
    </Pressable>
  );

  return (
    <Container
      statusBarStyle={isDarkMode ? 'light-content' : 'dark-content'}
      backgroundColor={isDarkMode ? '#111827' : '#F9FAFB'}>
      
      {/* Header */}
      <LinearGradient
        colors={isDarkMode ? ['#1F2937', '#111827'] : ['#FFF', '#F9FAFB']}
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingTop: Platform.OS === 'ios' ? 56 : 20,
          paddingBottom: 16,
          alignItems: 'center',
        }}>
        <Pressable
          onPress={() => navigation.openDrawer()}
          style={{
          }}>
          <HamburgerIcon />
        </Pressable>
        <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
          <LinearGradient
            colors={[newTheme.primary, newTheme.secondary]}
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              alignItems: 'center',
              justifyContent: 'center',
                }}>
            <Text style={{fontFamily: fontFamily.bold, fontSize: 22, color: '#FFF'}}>D</Text>
          </LinearGradient>
          <Text style={{fontFamily: fontFamily.bold, fontSize: 20, color: isDarkMode ? '#F9FAFB' : '#111827'}}>
            Dharam Cab
          </Text>
        </View>
        <Pressable
          onPress={() => navigation.navigate(NavigationString.Notifications)}
          style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            backgroundColor: isDarkMode ? '#374151' : '#FFF',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Notification />
        </Pressable>
      </LinearGradient>

      {/* Map View Component */}
      <MapView
        ref={mapRef}
        style={{flex: 1}}
        provider={PROVIDER_GOOGLE}
        followsUserLocation={false}
        initialRegion={DEFAULT_RANCHI_REGION}
        onLayout={() => setIsMapLayoutRendered(true)}
        onMapReady={() => setIsMapReady(true)}>
        
        <Marker.Animated
          ref={markerRef}
          coordinate={state.coordinate as any}
          title="Your Location">
          <View
            style={{
              backgroundColor: colors.themePrimary,
              borderRadius: 20,
              padding: 6,
              borderWidth: 2,
              borderColor: 'white',
            }}>
            <MaterialIcons name="my-location" size={16} color="white" />
          </View>
        </Marker.Animated>
        
        {showLocationRoute && state.destinationCords.latitude !== 0 && (
          <Marker coordinate={state.destinationCords} title="Destination">
            <View
              style={{
                backgroundColor: colors.emeraldGreen,
                borderRadius: 20,
                padding: 6,
                borderWidth: 2,
                borderColor: 'white',
              }}>
              <MaterialIcons name="location-on" size={16} color="white" />
            </View>
          </Marker>
        )}
        
        {showLocationRoute && state.destinationCords.latitude !== 0 && (
          <MapView
            origin={state.curLoc}
            destination={state.destinationCords}
            apikey={GOOGLE_API_KEY}
            strokeWidth={10}
            
            strokeColor={colors.themePrimary}
            edgePadding={{top: 50, right: 50, bottom: 300, left: 50}}
            onReady={result => {
              setState(prev => ({
                ...prev,
                distance: result.distance,
                routeDuration: result.duration.toString(),
              }));
              mapRef.current?.fitToCoordinates(result.coordinates, {
                edgePadding: {top: 50, right: 50, bottom: 320, left: 50},
                animated: true,
              });
            }}
            onError={err => console.log('Directions error:', err)}
          />
        )}
      </MapView>

      {/* Bottom Sheet UI Option Panels */}
      {!ongoingRide && (
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: isDarkMode ? '#1F2937' : '#FFF',
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            maxHeight: 520,
          }}>
          <View style={{alignItems: 'center', paddingTop: 12}}>
            <View
              style={{
                width: 40,
                height: 4,
                backgroundColor: isDarkMode ? '#4B5563' : '#E5E7EB',
                borderRadius: 2,
              }}
            />
          </View>
          <ScrollView contentContainerStyle={{paddingBottom: 24}}>
            <Pressable
              onPress={() =>
                navigation.navigate(NavigationString.SelectPath, {
                  fetchCordsValues: setDestination,
                  userLocation: state.curLoc,
                })
              }
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 20,
                paddingVertical: 16,
                gap: 14,
                backgroundColor: isDarkMode ? '#374151' : '#F3F4F6',
                marginHorizontal: 16,
                borderRadius: 20,
                marginBottom: 12,
              }}>
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: colors.themePrimary + '15',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <MaterialIcons name="my-location" size={22} color={colors.themePrimary} />
              </View>
              <View style={{flex: 1}}>
                <Text
                  numberOfLines={1}
                  style={{
                    fontFamily: fontFamily.semiBold,
                    fontSize: 14,
                    color: isDarkMode ? '#F9FAFB' : '#111827',
                  }}>
                  {state.curLoc.address || 'Select pickup location'}
                </Text>
                <Text style={{fontFamily: fontFamily.regular, fontSize: 11, color: isDarkMode ? '#9CA3AF' : '#6B7280'}}>
                  Current location
                </Text>
              </View>
              <MaterialIcons name="keyboard-arrow-right" size={24} color="#9CA3AF" />
            </Pressable>
            
            <Pressable
              onPress={() =>
                navigation.navigate(NavigationString.SelectPath, {
                  fetchCordsValues: setDestination,
                  userLocation: state.curLoc,
                  isDestination: true,
                })
              }
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 20,
                paddingVertical: 16,
                gap: 14,
                backgroundColor: isDarkMode ? '#374151' : '#F3F4F6',
                marginHorizontal: 16,
                borderRadius: 20,
                marginBottom: 12,
              }}>
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: colors.emeraldGreen + '15',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <MaterialIcons name="location-on" size={22} color={colors.emeraldGreen} />
              </View>
              <View style={{flex: 1}}>
                <Text
                  numberOfLines={1}
                  style={{
                    fontFamily: fontFamily.semiBold,
                    fontSize: 14,
                    color: isDarkMode ? '#F9FAFB' : '#111827',
                  }}>
                  {state.destinationCords?.address || 'Where to?'}
                </Text>
                <Text style={{fontFamily: fontFamily.regular, fontSize: 11, color: isDarkMode ? '#9CA3AF' : '#6B7280'}}>
                  {state.destinationCords?.address ? 'Destination set' : 'Enter destination address'}
                </Text>
              </View>
            </Pressable>
            
            <View style={{marginTop: 8, paddingHorizontal: 16}}>
              <Text style={{fontFamily: fontFamily.semiBold, fontSize: 16, marginBottom: 14, paddingLeft: 4}}>
                Choose your ride
              </Text>
              <View style={{flexDirection: 'row', gap: 12}}>
                {renderRideTypeCard('auto', 'Auto', Icons.Cycle)}
                {renderRideTypeCard('bike', 'Bike', Icons.Bike)}
                {renderRideTypeCard('car', 'Car', Icons.Car)}
              </View>
            </View>

            {!state.destinationCords?.address && (
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-around',
                  paddingHorizontal: 16,
                  paddingVertical: 20,
                  marginTop: 12,
                  borderTopWidth: 1,
                  borderTopColor: isDarkMode ? '#374151' : '#E5E7EB',
                }}>
                <TouchableOpacity>
                  <LinearGradient
                    colors={[newTheme.warning, '#FBBF24']}
                    style={{width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center'}}>
                    <MaterialIcons name="schedule" size={24} color="#FFF" />
                  </LinearGradient>
                  <Text style={{fontSize: 11, marginTop: 8}}>Schedule</Text>
                </TouchableOpacity>
                <TouchableOpacity>
                  <LinearGradient
                    colors={[newTheme.secondary, newTheme.secondaryLight]}
                    style={{width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center'}}>
                    <MaterialIcons name="local-offer" size={24} color="#FFF" />
                  </LinearGradient>
                  <Text style={{fontSize: 11, marginTop: 8}}>Offers</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate(NavigationString.Favourite)}>
                  <LinearGradient
                    colors={[newTheme.accent, newTheme.accentLight]}
                    style={{width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center'}}>
                    <MaterialIcons name="favorite-border" size={24} color="#FFF" />
                  </LinearGradient>
                  <Text style={{fontSize: 11, marginTop: 8}}>Favorites</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate(NavigationString.History)}>
                  <LinearGradient
                    colors={['#A78BFA', '#C4B5FD']}
                    style={{width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center'}}>
                    <MaterialIcons name="history" size={24} color="#FFF" />
                  </LinearGradient>
                  <Text style={{fontSize: 11, marginTop: 8}}>History</Text>
                </TouchableOpacity>
              </View>
            )}
            {state.destinationCords?.address && (
              <View style={{paddingHorizontal: 20, marginTop: 12}}>
                <PrimaryButton
                  onPress={() =>
                    navigation.navigate(NavigationString.AvailableTransport, {
                      transportType: selectedRideType,
                    })
                  }
                  buttonText="Go"
                  borderRadius={16}
                />
              </View>
            )}
          </ScrollView>
        </View>
      )}

      {/* Ride Alert Overlays and Modals */}
      <OngoingRideModal
        visible={showOngoingRideModal && !!ongoingRide}
        onClose={() => setShowOngoingRideModal(false)}
        rideData={ongoingRide}
        currentLocation={state.curLoc}
        isRideStarted={ongoingRide?.rideStatus === 'ridePicked'}
        setOngoingRide={setOngoingRide}
        setShowOngoingRideModal={setShowOngoingRideModal}
      />
      <CustomBottomsheetRideALerts
        visible={showAlert}
        onClose={() => {
          setShowAlert(false);
          setAlertType(null);
        }}
        type={alertType}
        rideData={alertType === 'rating' ? completedRideData : ongoingRide}
      />
      <CustomPaymentBottomSheet
        visible={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        rideData={completedRideForPayment}
        onPaymentSuccess={() => {
          setShowPaymentModal(false);
          setCompletedRideData(completedRideForPayment);
          setAlertType('rating');
          setShowAlert(true);
        }}
      />
      
      {ongoingRide && (
        <Pressable
          onPress={() => setShowOngoingRideModal(!showOngoingRideModal)}
          style={{
            position: 'absolute',
            bottom: 120,
            right: 20,
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: colors.themePrimary,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <MaterialIcons name="directions-car" size={26} color="#FFF" />
        </Pressable>
      )}

      {/* Floating Centering GPS Retarget Trigger */}
      <Pressable
        onPress={onCenter}
        onLongPress={() => setFollowUser(!followUser)}
        style={{
          position: 'absolute',
          bottom: ongoingRide ? 80 : 200,
          right: 20,
          width: 52,
          height: 52,
          borderRadius: 26,
          backgroundColor: isDarkMode ? '#374151' : '#FFF',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <MaterialIcons
          name={followUser ? 'my-location' : 'location-searching'}
          size={24}
          color={colors.themePrimary}
        />
      </Pressable>
    </Container>
  );
};

export default Home;