import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  Box,
  Pressable,
  Text,
  useToast,
} from '@gluestack-ui/themed';
import {
  Alert,
  Dimensions,
  Image,
  Linking,
  Platform,
  View,
  TouchableOpacity,
} from 'react-native';
import MapView, {
  AnimatedRegion,
  Marker,
  PROVIDER_DEFAULT,
  PROVIDER_GOOGLE,
} from 'react-native-maps';
import { useFocusEffect, useNavigation} from '@react-navigation/native';
import axios from 'axios';
import {Container} from '../components/Container';
import {colors as originalColors} from '../constants/colors';
import {
  HamburgerIcon,
  Notification,
} from '../components/Icons';
import {deviceHeight, deviceWidth, GOOGLE_API_KEY} from '../constants/contants';
import {
  moderateScale,
  moderateScaleVertical,
  scale,
  textScale,
} from '../utils/responsiveSize';
import {NavigationString} from '../navigation/navigationStrings';
import PrimaryButton from '../components/Button/PrimaryButton';
import MapViewDirections from 'react-native-maps-directions';
import Icons from '../assets/Icons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {useTheme} from '../constants/ThemeContext';
import {useDispatch, useSelector} from 'react-redux';
import {RootState} from '../store/reduxStore/store';
import {
  loadUserFromStorage,
  saveUserToStorage,
  setPickupDetails,
} from '../store/slice/UserSlice';
import {
  stopWatchingLocation,
  watchLocationContinuously,
  getCurrentLocationOnce,
} from '../utils/locationHelper';
import socketServices from '../utils/socketServices';
import debounce from '../utils/debounce';
import AsyncStorage from '@react-native-async-storage/async-storage';
import OngoingRideModal from '../components/OngoingRideModal/OngoingRideModal';
import CustomBottomsheetRideALerts from './CustomBottomsheetRideALerts';
import CustomPaymentBottomSheet from './CustomPaymentBottomSheet';
import { ScrollView } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

// ===== NEW THEME CONFIGURATION =====
const newTheme = {
  primary: '#4F46E5', // Indigo 600
  primaryLight: '#818CF8',
  primaryDark: '#4338CA',
  secondary: '#0EA5E9',
  secondaryLight: '#38BDF8',
  accent: '#10B981',
  accentLight: '#34D399',
  warning: '#F59E0B',
  danger: '#EF4444',
  background: {
    light: '#FFFFFF',
    dark: '#111827',
    cardLight: '#F9FAFB',
    cardDark: '#1F2937',
  },
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

const screen = Dimensions.get('window');
const ASPECT_RATIO = screen.width / screen.height;
const LATITUDE_DELTA = 0.003;
const LONGITUDE_DELTA = 0.003;

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
  const userData = useSelector((state: RootState) => state.user);
  const toast = useToast();
  const mapRef: any = useRef(null);
  const markerRef: any = useRef(null);
  const navigation = useNavigation<any>();
  const locationWatcherRef = useRef<any>(null);

  // state
  const [state, setState] = useState<State>({
    curLoc: {
      latitude: 26.263882,
      longitude: 78.130791,
      address: '',
    },
    destinationCords: {
      latitude: 0,
      longitude: 0,
    },
    isLoading: false,
    coordinate: new AnimatedRegion({
      latitude: 26.263882,
      longitude: 78.130791,
      latitudeDelta: LATITUDE_DELTA,
      longitudeDelta: LONGITUDE_DELTA,
    }),
    distance: 0,
    routeDuration: '0',
  });
  const [showLocationRoute, setShowLocationRoute] = useState(false);
  const [userLocalData, setUserLocalData] = useState<any>(null);
  const [socketInitialized, setSocketInitialized] = useState<boolean>(false);
  const [pickupData, setPickupData] = useState<any>(null);
  const [nearbyDrivers, setNearbyDrivers] = useState<any[]>([]);
  const [ongoingRide, setOngoingRide] = useState<any>(null);
  const [showOngoingRideModal, setShowOngoingRideModal] = useState<boolean>(false);
  const [remainTimeForPickup, setRemainTimeForPickup] = useState<any>(null);
  const [remainDurationForPickup, setRemainDurationForPickup] = useState<any>(null);
  const [showAlert, setShowAlert] = useState<boolean>(false);
  const [alertType, setAlertType] = useState<'confirmation' | 'rating' | null>(null);
  const [completedRideData, setCompletedRideData] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [completedRideForPayment, setCompletedRideForPayment] = useState<any>(null);
  const [selectedRideType, setSelectedRideType] = useState<'bike' | 'car' | 'auto'>('auto');

  const getLocationOnce = async () => {
    const locationData: any = await getCurrentLocationOnce();
    if (locationData) {
      const {latitude, longitude} = locationData.coordinates;
      const {formatted, city, country, state} = locationData.address;

      const pickupDetails = {
        latitude,
        longitude,
        address: formatted,
        city,
        country,
        state,
      };
      setPickupData(pickupDetails);
      await saveUserToStorage({
        ...userLocalData,
        pickupDetails: pickupDetails,
      });
      setState(prev => ({
        ...prev,
        curLoc: {latitude, longitude, address: formatted},
        coordinate: new AnimatedRegion({
          latitude,
          longitude,
          latitudeDelta: LATITUDE_DELTA,
          longitudeDelta: LONGITUDE_DELTA,
        }),
      }));
      return pickupDetails;
    }
  };

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await loadUserLocalDatas();
        await getLocationOnce();
      } catch (error) {
        console.error('Initialization error:', error);
      }
    };
    initializeApp();
    return () => {
      if (locationWatcherRef.current) stopWatchingLocation();
    };
  }, []);

  useEffect(() => {
    if (!userLocalData?.token) return;
    const initializeSocket = async () => {
      try {
        if (socketServices.isConnected()) {
          setSocketInitialized(true);
          socketServices.on('nearbyDriverList', (nearbyDriverList: any) => {
            setNearbyDrivers(nearbyDriverList);
          });
          socketServices.emit('onGoing_booking', {});
          socketServices.on('onGoing_Booking_List', handleOngoingBooking);
          socketServices.on('driver_booking_response', handleDriverBookingResponse);
        }
      } catch (error) {
        console.error('Socket initialization failed:', error);
      }
    };
    initializeSocket();
    return () => {
      setSocketInitialized(false);
      socketServices.removeListener('onGoing_Booking_List', handleOngoingBooking);
      socketServices.removeListener('driver_booking_response', handleDriverBookingResponse);
      if (locationWatcherRef.current) stopWatchingLocation();
    };
  }, [userLocalData]);

  const handleOngoingBooking = (onGoing_Booking: any) => {
    const ride = onGoing_Booking.data?.[0];
    handleRideStatusChange(ride);
  };

  const handleDriverBookingResponse = (onGoing_Booking: any) => {
    const ride = onGoing_Booking?.data;
    handleRideStatusChange(ride);
  };

  const handleRideStatusChange = (ride: any) => {
    if (!ride) return;
    if (ride.bookingStatus === 'ongoing' && ride.rideStatus === 'rideNotPicked') {
      setOngoingRide(ride);
      setShowOngoingRideModal(true);
      setCompletedRideData(null);
    } else if (ride.bookingStatus === 'ongoing' && ride.rideStatus === 'ridePicked') {
      setOngoingRide(ride);
      setAlertType('confirmation');
      setShowAlert(true);
      setShowOngoingRideModal(false);
      setCompletedRideData(null);
    } else if (ride.bookingStatus === 'completed' && ride.rideStatus === 'ridePicked') {
      setCompletedRideForPayment(ride);
      setShowPaymentModal(true);
      setOngoingRide(null);
      setShowOngoingRideModal(false);
    } else {
      setOngoingRide(null);
      setShowOngoingRideModal(false);
      setCompletedRideForPayment(null);
      setCompletedRideData(null);
    }
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    setCompletedRideData(completedRideForPayment);
    setAlertType('rating');
    setShowAlert(true);
  };

  useEffect(() => {
    if (!socketInitialized) return;
    const debouncedLocationUpdate = debounce((location: any) => {
      if (socketInitialized) {
        socketServices.emit('registerClientLocation', {
          lat: location.latitude,
          lng: location.longitude,
        });
      }
    }, 1000);

    const locationWatcher = watchLocationContinuously(
      async (location: any) => {
        let currentPickupData = pickupData;
        if (!currentPickupData) currentPickupData = await getLocationOnce();
        if (!currentPickupData) return;
        const {latitude, longitude} = location;
        const updatedPickupDetails = { ...currentPickupData, latitude, longitude };
        dispatch(setPickupDetails({...updatedPickupDetails, latitude, longitude}));
        setState(prev => ({
          ...prev,
          curLoc: {latitude, longitude, address: updatedPickupDetails?.address},
          coordinate: new AnimatedRegion({
            latitude,
            longitude,
            latitudeDelta: LATITUDE_DELTA,
            longitudeDelta: LONGITUDE_DELTA,
          }),
        }));
        animate(latitude, longitude);
        debouncedLocationUpdate({latitude, longitude});
      },
      (error: any) => {
        if (error.code === 2) {
          Alert.alert('Device Location Lost', 'Please Enable location.', [
            {text: 'Cancel', style: 'cancel'},
            {text: 'Open Settings', onPress: () => Linking.openSettings()},
          ]);
        }
      },
    );
    locationWatcherRef.current = locationWatcher;
    return () => {
      if (locationWatcherRef.current) stopWatchingLocation();
    };
  }, [socketInitialized, pickupData]);

  const loadUserLocalDatas = async () => {
    const localData = await loadUserFromStorage();
    const userToken: any = await AsyncStorage.getItem('userToken');
    setUserLocalData({...localData, token: userToken});
  };

  useEffect(() => {
    onCenter();
  }, []);
  useFocusEffect(useCallback(() => { onCenter(); }, []));

  // NEW: Function to set destination from SelectPath screen
  const setDestination = (destinationData: any) => {
    if (destinationData) {
      setState(prev => ({
        ...prev,
        destinationCords: {
          latitude: destinationData.latitude,
          longitude: destinationData.longitude,
          address: destinationData.address,
          distance: destinationData.distance,
        },
      }));
      setShowLocationRoute(true);
    }
  };

  const animate = (latitude: number, longitude: number) => {
    const newCoordinate = {latitude, longitude};
    if (Platform.OS == 'android') {
      if (markerRef.current) markerRef.current.animateMarkerToCoordinate(newCoordinate, 1000);
    } else {
      state?.coordinate.timing(newCoordinate as any).start();
    }
  };

  const onCenter = () => {
    if (mapRef.current && state.curLoc) {
      mapRef.current.animateToRegion(
        {
          latitude: state.curLoc.latitude,
          longitude: state.curLoc.longitude,
          latitudeDelta: LATITUDE_DELTA,
          longitudeDelta: LONGITUDE_DELTA,
        },
        500,
      );
    }
  };

  const renderDriverMarker = () => {
    if (ongoingRide?.rideCategory === 'car' || ongoingRide?.rideCategory === 'taxi') {
      return <Image source={Icons.CarTop1} style={{ width: moderateScale(40), height: moderateScale(40), resizeMode: 'contain' }} />;
    } else if (ongoingRide?.rideCategory === 'bike' || ongoingRide?.rideCategory === 'cycle') {
      return <Image source={Icons.BikeTop1} style={{ width: moderateScale(40), height: moderateScale(40), resizeMode: 'contain' }} />;
    }
    return null;
  };

  const renderRideTypeCard = (type: string, label: string, iconSource: any) => {
    const isSelected = selectedRideType === type;
    return (
      <Pressable onPress={() => setSelectedRideType(type as any)} style={[{
        flex: 1, alignItems: 'center', paddingVertical: moderateScaleVertical(14),
        paddingHorizontal: moderateScale(6), borderRadius: moderateScale(20),
        backgroundColor: isSelected ? colors.themePrimary : isDarkMode ? '#1F2937' : '#FFFFFF',
        borderWidth: isSelected ? 0 : 1, borderColor: isDarkMode ? '#374151' : '#E5E7EB',
        shadowColor: isSelected ? colors.themePrimary : '#000',
        shadowOffset: {width: 0, height: isSelected ? 6 : 2}, shadowOpacity: isSelected ? 0.2 : 0.05,
        shadowRadius: isSelected ? 12 : 4, elevation: isSelected ? 6 : 2,
        transform: [{scale: isSelected ? 1.02 : 1}],
      }]}>
        <View style={{
          width: moderateScale(56), height: moderateScale(56), borderRadius: moderateScale(28),
          backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : isDarkMode ? '#374151' : '#F3F4F6',
          alignItems: 'center', justifyContent: 'center', marginBottom: moderateScaleVertical(8),
        }}>
          <Image source={iconSource} style={{
            width: moderateScale(32), height: moderateScale(32), resizeMode: 'contain',
            tintColor: isSelected ? '#FFFFFF' : isDarkMode ? '#FFFFFF' : '#4B5563',
          }} />
        </View>
        <Text style={{ fontFamily: fontFamily.semiBold, fontSize: textScale(12),
          color: isSelected ? '#FFFFFF' : isDarkMode ? '#F9FAFB' : '#1F2937',
          marginBottom: moderateScaleVertical(4) }}>{label}</Text>
        {isSelected && <View style={{ width: moderateScale(24), height: moderateScale(4), borderRadius: moderateScale(2), backgroundColor: '#FFFFFF', marginTop: moderateScaleVertical(4) }} />}
      </Pressable>
    );
  };

  const getEstimatedFare = () => {
    const distance = state.distance || 0;
    const baseFare = 35, perKmRate = 8, perMinuteRate = 2;
    return baseFare + distance * perKmRate + 10 * perMinuteRate;
  };

  return (
    <Container
      statusBarStyle={isDarkMode ? 'light-content' : 'dark-content'}
      statusBarBackgroundColor={isDarkMode ? '#111827' : '#FFFFFF'}
      backgroundColor={isDarkMode ? '#111827' : '#F9FAFB'}>

      {/* Header */}
      <LinearGradient colors={isDarkMode ? ['#1F2937', '#111827'] : ['#FFFFFF', '#F9FAFB']} style={{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: moderateScale(20), paddingTop: moderateScaleVertical(Platform.OS === 'ios' ? 56 : 20),
        paddingBottom: moderateScaleVertical(16), borderBottomLeftRadius: moderateScale(24),
        borderBottomRightRadius: moderateScale(24), shadowColor: '#000', shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.05, shadowRadius: 12, elevation: 4,
      }}>
        <Pressable onPress={() => navigation.openDrawer()} style={{
          width: moderateScale(44), height: moderateScale(44), borderRadius: moderateScale(14),
          backgroundColor: isDarkMode ? '#374151' : '#FFFFFF', alignItems: 'center', justifyContent: 'center',
          shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
        }}><HamburgerIcon /></Pressable>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: moderateScale(10) }}>
          <LinearGradient colors={[newTheme.primary, newTheme.secondary]} style={{
            width: moderateScale(44), height: moderateScale(44), borderRadius: moderateScale(14),
            alignItems: 'center', justifyContent: 'center',
          }}><Text style={{ fontFamily: fontFamily.bold, fontSize: textScale(22), color: '#FFFFFF' }}>D</Text></LinearGradient>
          <Text style={{ fontFamily: fontFamily.bold, fontSize: textScale(20), color: isDarkMode ? '#F9FAFB' : '#111827', letterSpacing: -0.5 }}>Dharam Cab</Text>
        </View>

        <Pressable onPress={() => navigation.navigate(NavigationString?.Notifications)} style={{
          width: moderateScale(44), height: moderateScale(44), borderRadius: moderateScale(14),
          backgroundColor: isDarkMode ? '#374151' : '#FFFFFF', alignItems: 'center', justifyContent: 'center',
          shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
        }}><Notification /></Pressable>
      </LinearGradient>

      {/* Map View */}
      <MapView
        style={{ flex: 1 }} ref={mapRef}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
        showsUserLocation={true} showsMyLocationButton={false}
        initialRegion={{ ...state?.curLoc, latitudeDelta: LATITUDE_DELTA, longitudeDelta: LONGITUDE_DELTA }}>
        <Marker.Animated ref={markerRef} coordinate={state?.coordinate as any}>
          <MaterialIcons name="location-on" size={scale(36)} color={colors.themePrimary} />
        </Marker.Animated>
        {!ongoingRide && nearbyDrivers.map((driver) => (
          <Marker.Animated key={`driver-${driver._id}`}
            coordinate={new AnimatedRegion({ latitude: driver?.location?.coordinates[1], longitude: driver?.location?.coordinates[0], latitudeDelta: LATITUDE_DELTA, longitudeDelta: LONGITUDE_DELTA }) as any}
            anchor={{ x: 0.5, y: 0.5 }}>
            <Image source={Icons.CarTop1} style={{ width: moderateScale(40), height: moderateScale(40), resizeMode: 'contain', transform: [{ rotate: '180deg' }] }} />
          </Marker.Animated>
        ))}
        {ongoingRide?.destinationLocation && (
          <Marker coordinate={{ latitude: ongoingRide.destinationLocation.latitude, longitude: ongoingRide.destinationLocation.longitude }}>
            <MaterialIcons name="location-on" size={scale(28)} color={colors.emeraldGreen} />
          </Marker>
        )}
        {ongoingRide?.driverCurrentLatLong?.latitude && ongoingRide?.driverCurrentLatLong?.longitude && (
          <Marker coordinate={{ latitude: ongoingRide.driverCurrentLatLong.latitude, longitude: ongoingRide.driverCurrentLatLong.longitude }} anchor={{ x: 0.5, y: 0.5 }}>
            {renderDriverMarker()}
          </Marker>
        )}
        {ongoingRide?.pickupLocation && ongoingRide?.destinationLocation && (
          <MapViewDirections origin={ongoingRide.pickupLocation} destination={ongoingRide.destinationLocation}
            apikey={GOOGLE_API_KEY} strokeWidth={4} strokeColor={colors.themePrimary} mode="DRIVING"
            onReady={result => { if (mapRef.current && result.coordinates?.length) mapRef.current.fitToCoordinates(result.coordinates, { edgePadding: { top: deviceHeight / 4, left: deviceWidth / 4, right: deviceWidth / 4, bottom: deviceHeight / 4 }, animated: true }); }} />
        )}
        {ongoingRide?.pickupLocation && ongoingRide?.driverCurrentLatLong && (
          <MapViewDirections origin={ongoingRide.pickupLocation} destination={ongoingRide.driverCurrentLatLong}
            apikey={GOOGLE_API_KEY} strokeWidth={4} strokeColor={colors.black} mode="DRIVING"
            onReady={result => { setRemainTimeForPickup(result.duration); setRemainDurationForPickup(result.distance); if (mapRef.current && result.coordinates?.length) mapRef.current.fitToCoordinates(result.coordinates, { edgePadding: { top: deviceHeight / 4, left: deviceWidth / 4, right: deviceWidth / 4, bottom: deviceHeight / 4 }, animated: true }); }} />
        )}
        {!ongoingRide && Object.keys(state.destinationCords).length > 0 && (
          <Marker coordinate={state?.destinationCords}>
            <MaterialIcons name="location-on" size={scale(36)} color={colors.emeraldGreen} />
          </Marker>
        )}
        {!ongoingRide && Object.keys(state.destinationCords).length > 0 && (
          <MapViewDirections origin={state?.curLoc} destination={state?.destinationCords}
            apikey={GOOGLE_API_KEY} strokeWidth={3} optimizeWaypoints={true}
            onReady={async result => {
              const hours = Math.floor(result.duration / 60);
              const remainingMinutes = Math.round(result.duration % 60);
              const formattedTime = `${hours}h ${remainingMinutes}m`;
              setState(prev => ({ ...prev, distance: result.distance, routeDuration: formattedTime }));
              await saveUserToStorage({ ...userLocalData, dropDetails: { ...state.destinationCords, distance: result.distance, routeDuration: formattedTime, routeDurationinMinutes: result.duration } });
              if (result.coordinates?.length && mapRef.current) mapRef.current.fitToCoordinates(result.coordinates, { edgePadding: { top: deviceHeight / 4, left: deviceWidth / 4, right: deviceWidth / 4, bottom: deviceHeight / 4 }, animated: true });
            }}
            onError={errorMessage => console.log('MapView Directions error:', errorMessage)} />
        )}
      </MapView>

      {/* Bottom Sheet */}
      {!ongoingRide && (
        <View style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
          borderTopLeftRadius: moderateScale(28), borderTopRightRadius: moderateScale(28),
          shadowColor: '#000', shadowOffset: { width: 0, height: -8 }, shadowOpacity: 0.1, shadowRadius: 24, elevation: 20,
          maxHeight: moderateScale(520),
        }}>
          <View style={{ alignItems: 'center', paddingTop: moderateScaleVertical(12), paddingBottom: moderateScaleVertical(4) }}>
            <View style={{ width: moderateScale(40), height: moderateScale(4), backgroundColor: isDarkMode ? '#4B5563' : '#E5E7EB', borderRadius: moderateScale(2) }} />
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: moderateScaleVertical(24) }}
            keyboardShouldPersistTaps="always" nestedScrollEnabled={true}>

            {/* Pickup Location Card (unchanged) */}
            <Pressable onPress={() => { navigation.navigate(NavigationString.SelectPath, { fetchCordsValues: setDestination, userLocation: state?.curLoc }); }} style={{
              flexDirection: 'row', alignItems: 'center', paddingHorizontal: moderateScale(20), paddingVertical: moderateScaleVertical(16),
              gap: moderateScale(14), backgroundColor: isDarkMode ? '#374151' : '#F3F4F6',
              marginHorizontal: moderateScale(16), borderRadius: moderateScale(20), marginBottom: moderateScaleVertical(12),
            }}>
              <View style={{ width: moderateScale(48), height: moderateScale(48), borderRadius: moderateScale(24), backgroundColor: colors.themePrimary + '15', alignItems: 'center', justifyContent: 'center' }}>
                <MaterialIcons name="my-location" size={scale(22)} color={colors.themePrimary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: fontFamily.semiBold, fontSize: textScale(14), color: isDarkMode ? '#F9FAFB' : '#111827', marginBottom: moderateScaleVertical(2) }} numberOfLines={1}>
                  {state?.curLoc?.address || 'Select pickup location'}
                </Text>
                <Text style={{ fontFamily: fontFamily.regular, fontSize: textScale(11), color: isDarkMode ? '#9CA3AF' : '#6B7280' }} numberOfLines={1}>Current location</Text>
              </View>
              <MaterialIcons name="keyboard-arrow-right" size={scale(24)} color={isDarkMode ? '#9CA3AF' : '#9CA3AF'} />
            </Pressable>

            {/* NEW: Destination Input Card */}
            <Pressable onPress={() => { navigation.navigate(NavigationString.SelectPath, { fetchCordsValues: setDestination, userLocation: state?.curLoc, isDestination: true }); }} style={{
              flexDirection: 'row', alignItems: 'center', paddingHorizontal: moderateScale(20), paddingVertical: moderateScaleVertical(16),
              gap: moderateScale(14), backgroundColor: isDarkMode ? '#374151' : '#F3F4F6',
              marginHorizontal: moderateScale(16), borderRadius: moderateScale(20), marginBottom: moderateScaleVertical(12),
            }}>
              <View style={{ width: moderateScale(48), height: moderateScale(48), borderRadius: moderateScale(24), backgroundColor: colors.emeraldGreen + '15', alignItems: 'center', justifyContent: 'center' }}>
                <MaterialIcons name="location-on" size={scale(22)} color={colors.emeraldGreen} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: fontFamily.semiBold, fontSize: textScale(14), color: isDarkMode ? '#F9FAFB' : '#111827', marginBottom: moderateScaleVertical(2) }} numberOfLines={1}>
                  {state?.destinationCords?.address ? state.destinationCords.address : 'Where to?'}
                </Text>
                <Text style={{ fontFamily: fontFamily.regular, fontSize: textScale(11), color: isDarkMode ? '#9CA3AF' : '#6B7280' }} numberOfLines={1}>
                  {state?.destinationCords?.address ? 'Destination set' : 'Enter destination address'}
                </Text>
              </View>
              {state?.destinationCords?.address ? (
                <Pressable onPress={() => setState(prev => ({ ...prev, destinationCords: { latitude: 0, longitude: 0, address: '' } }))} style={{ padding: moderateScale(4) }}>
                  <MaterialIcons name="close" size={scale(20)} color={isDarkMode ? '#9CA3AF' : '#6B7280'} />
                </Pressable>
              ) : (
                <MaterialIcons name="keyboard-arrow-right" size={scale(24)} color={isDarkMode ? '#9CA3AF' : '#9CA3AF'} />
              )}
            </Pressable>

            {/* Fare Card (only when destination set) */}
            {state?.destinationCords?.address && (
              <LinearGradient colors={isDarkMode ? ['#374151', '#1F2937'] : [colors.themePrimary + '08', '#FFFFFF']} style={{
                flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                marginHorizontal: moderateScale(16), paddingHorizontal: moderateScale(20), paddingVertical: moderateScaleVertical(14),
                borderRadius: moderateScale(20), marginBottom: moderateScaleVertical(16),
                borderWidth: 1, borderColor: isDarkMode ? '#4B5563' : colors.themePrimary + '20',
              }}>
                <View>
                  <Text style={{ fontFamily: fontFamily.regular, fontSize: textScale(12), color: isDarkMode ? '#9CA3AF' : '#6B7280', marginBottom: moderateScaleVertical(2) }}>Estimated Fare</Text>
                  <Text style={{ fontFamily: fontFamily.bold, fontSize: textScale(28), color: isDarkMode ? '#F9FAFB' : '#111827', letterSpacing: -0.5 }}>₹{getEstimatedFare().toFixed(0)}</Text>
                </View>
                <View style={{ paddingHorizontal: moderateScale(16), paddingVertical: moderateScaleVertical(8), backgroundColor: isDarkMode ? '#4B5563' : '#FFFFFF', borderRadius: moderateScale(30), shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
                  <Text style={{ fontFamily: fontFamily.semiBold, fontSize: textScale(12), color: isDarkMode ? '#F9FAFB' : colors.themePrimary }}>{state?.distance ? `${Number(state.distance).toFixed(1)} km` : '---'}</Text>
                </View>
              </LinearGradient>
            )}

            {/* Ride Type Selection (only when destination NOT set) */}
            {!state?.destinationCords?.address && (
              <View style={{ marginTop: moderateScaleVertical(8), paddingHorizontal: moderateScale(16) }}>
                <Text style={{ fontFamily: fontFamily.semiBold, fontSize: textScale(16), color: isDarkMode ? '#F9FAFB' : '#111827', marginBottom: moderateScaleVertical(14), paddingLeft: moderateScale(4) }}>Choose your ride</Text>
                <View style={{ flexDirection: 'row', gap: moderateScale(12) }}>
                  {renderRideTypeCard('auto', 'Auto', Icons.Cycle)}
                  {renderRideTypeCard('bike', 'Bike', Icons.Bike)}
                  {renderRideTypeCard('car', 'Car', Icons.Car)}
                </View>
              </View>
            )}

            {/* Quick Actions (only when destination NOT set) */}
            {!state?.destinationCords?.address && (
              <View style={{
                flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: moderateScale(16),
                paddingVertical: moderateScaleVertical(20), marginTop: moderateScaleVertical(12), marginBottom: moderateScaleVertical(8),
                borderTopWidth: 1, borderTopColor: isDarkMode ? '#374151' : '#E5E7EB',
              }}>
                <TouchableOpacity style={{ alignItems: 'center', gap: moderateScaleVertical(8) }} activeOpacity={0.7}>
                  <LinearGradient colors={[newTheme.warning, '#FBBF24']} style={{ width: moderateScale(52), height: moderateScale(52), borderRadius: moderateScale(26), alignItems: 'center', justifyContent: 'center', shadowColor: newTheme.warning, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 }}>
                    <MaterialIcons name="schedule" size={scale(24)} color="#FFFFFF" />
                  </LinearGradient>
                  <Text style={{ fontFamily: fontFamily.medium, fontSize: textScale(11), color: isDarkMode ? '#F9FAFB' : '#4B5563' }}>Schedule</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ alignItems: 'center', gap: moderateScaleVertical(8) }} activeOpacity={0.7}>
                  <LinearGradient colors={[newTheme.secondary, newTheme.secondaryLight]} style={{ width: moderateScale(52), height: moderateScale(52), borderRadius: moderateScale(26), alignItems: 'center', justifyContent: 'center', shadowColor: newTheme.secondary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 }}>
                    <MaterialIcons name="local-offer" size={scale(24)} color="#FFFFFF" />
                  </LinearGradient>
                  <Text style={{ fontFamily: fontFamily.medium, fontSize: textScale(11), color: isDarkMode ? '#F9FAFB' : '#4B5563' }}>Offers</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ alignItems: 'center', gap: moderateScaleVertical(8) }} activeOpacity={0.7} onPress={() => navigation.navigate(NavigationString.Favourite)}>
                  <LinearGradient colors={[newTheme.accent, newTheme.accentLight]} style={{ width: moderateScale(52), height: moderateScale(52), borderRadius: moderateScale(26), alignItems: 'center', justifyContent: 'center', shadowColor: newTheme.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 }}>
                    <MaterialIcons name="favorite-border" size={scale(24)} color="#FFFFFF" />
                  </LinearGradient>
                  <Text style={{ fontFamily: fontFamily.medium, fontSize: textScale(11), color: isDarkMode ? '#F9FAFB' : '#4B5563' }}>Favorites</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ alignItems: 'center', gap: moderateScaleVertical(8) }} activeOpacity={0.7} onPress={() => navigation.navigate(NavigationString.History)}>
                  <LinearGradient colors={['#A78BFA', '#C4B5FD']} style={{ width: moderateScale(52), height: moderateScale(52), borderRadius: moderateScale(26), alignItems: 'center', justifyContent: 'center', shadowColor: '#A78BFA', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 }}>
                    <MaterialIcons name="history" size={scale(24)} color="#FFFFFF" />
                  </LinearGradient>
                  <Text style={{ fontFamily: fontFamily.medium, fontSize: textScale(11), color: isDarkMode ? '#F9FAFB' : '#4B5563' }}>History</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Go Button (only when destination set) */}
            {state?.destinationCords?.address && (
              <View style={{ paddingHorizontal: moderateScale(20), paddingVertical: moderateScaleVertical(8), marginBottom: moderateScaleVertical(12) }}>
                <PrimaryButton onPress={() => { navigation.navigate(NavigationString.AvailableTransport, { transportType: selectedRideType }); }}
                  buttonText="Go" flex={1} fontSize={textScale(18)} borderRadius={moderateScale(16)} />
              </View>
            )}
          </ScrollView>
        </View>
      )}

      {/* Modals (unchanged) */}
      <OngoingRideModal visible={showOngoingRideModal && ongoingRide !== null} onClose={() => setShowOngoingRideModal(false)}
        rideData={ongoingRide} currentLocation={state.curLoc} remainTimeForPickup={remainTimeForPickup}
        remainDurationForPickup={remainDurationForPickup} isRideStarted={ongoingRide?.rideStatus === 'ridePicked' && ongoingRide?.bookingStatus === 'ongoing'}
        setOngoingRide={setOngoingRide} setShowOngoingRideModal={setShowOngoingRideModal} />
      <CustomBottomsheetRideALerts visible={showAlert} onClose={() => { setShowAlert(false); setAlertType(null); if (alertType === 'rating') { setOngoingRide(null); setCompletedRideData(null); setShowOngoingRideModal(false); } }} type={alertType} rideData={alertType === 'rating' ? completedRideData : ongoingRide} />
      <CustomPaymentBottomSheet visible={showPaymentModal} onClose={() => setShowPaymentModal(false)} rideData={completedRideForPayment} onPaymentSuccess={handlePaymentSuccess} />

      {/* Floating Buttons */}
      {ongoingRide && (
        <Pressable onPress={() => setShowOngoingRideModal(!showOngoingRideModal)} style={{
          position: 'absolute', bottom: moderateScaleVertical(120), right: moderateScale(20),
          width: moderateScale(56), height: moderateScale(56), borderRadius: moderateScale(28),
          backgroundColor: colors.themePrimary, alignItems: 'center', justifyContent: 'center',
          shadowColor: colors.themePrimary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
        }}><MaterialIcons name="directions-car" size={scale(26)} color="#FFFFFF" /></Pressable>
      )}
      <Pressable onPress={() => onCenter()} style={{
        position: 'absolute', bottom: ongoingRide ? moderateScaleVertical(80) : moderateScaleVertical(200), right: moderateScale(20),
        width: moderateScale(52), height: moderateScale(52), borderRadius: moderateScale(26),
        backgroundColor: isDarkMode ? '#374151' : '#FFFFFF', alignItems: 'center', justifyContent: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 6,
      }}><MaterialIcons name="my-location" size={scale(24)} color={colors.themePrimary} /></Pressable>
    </Container>
  );
};

export default Home;