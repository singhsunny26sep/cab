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
import {colors} from '../constants/colors';
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
  setDropDetails,
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
  const [showOngoingRideModal, setShowOngoingRideModal] =
    useState<boolean>(false);
  const [remainTimeForPickup, setRemainTimeForPickup] = useState<any>(null);
  const [remainDurationForPickup, setRemainDurationForPickup] =
    useState<any>(null);
  const [showAlert, setShowAlert] = useState<boolean>(false);
  const [alertType, setAlertType] = useState<'confirmation' | 'rating' | null>(
    null,
  );
  const [completedRideData, setCompletedRideData] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [completedRideForPayment, setCompletedRideForPayment] =
    useState<any>(null);

  // Ride type selector state
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
      if (locationWatcherRef.current) {
        stopWatchingLocation();
      }
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

          socketServices.on(
            'driver_booking_response',
            handleDriverBookingResponse,
          );
        }
      } catch (error) {
        console.error('Socket initialization failed:', error);
      }
    };

    initializeSocket();

    return () => {
      setSocketInitialized(false);
      socketServices.removeListener(
        'onGoing_Booking_List',
        handleOngoingBooking,
      );
      socketServices.removeListener(
        'driver_booking_response',
        handleDriverBookingResponse,
      );
      if (locationWatcherRef.current) {
        stopWatchingLocation();
      }
    };
  }, [userLocalData]);

  const handleOngoingBooking = (onGoing_Booking: any) => {
    console.log(
      '<<<<<<<<<<<< onGoing_Booking_List >>>>>>>>>>>>',
      JSON.stringify(onGoing_Booking),
    );
    const ride = onGoing_Booking.data?.[0];
    handleRideStatusChange(ride);
  };

  const handleDriverBookingResponse = (onGoing_Booking: any) => {
    console.log(
      '<<<<<<<<<<<< driver_booking_response >>>>>>>>>>>>',
      JSON.stringify(onGoing_Booking),
    );
    const ride = onGoing_Booking?.data;
    handleRideStatusChange(ride);
  };

  const handleRideStatusChange = (ride: any) => {
    if (!ride) return;

    if (
      ride.bookingStatus === 'ongoing' &&
      ride.rideStatus === 'rideNotPicked'
    ) {
      setOngoingRide(ride);
      setShowOngoingRideModal(true);
      setCompletedRideData(null);
    } else if (
      ride.bookingStatus === 'ongoing' &&
      ride.rideStatus === 'ridePicked'
    ) {
      setOngoingRide(ride);
      setAlertType('confirmation');
      setShowAlert(true);
      setShowOngoingRideModal(false);
      setCompletedRideData(null);
    } else if (
      ride.bookingStatus === 'completed' &&
      ride.rideStatus === 'ridePicked'
    ) {
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
      console.log('location for customer going ===> ');
      if (socketInitialized) {
        console.log('location for customer going ===> ', location);
        socketServices.emit('registerClientLocation', {
          lat: location.latitude,
          lng: location.longitude,
        });
      }
    }, 1000);

    const locationWatcher = watchLocationContinuously(
      async (location: any) => {
        console.log('in continuous location ===', location);
        let currentPickupData = pickupData;
        if (!currentPickupData) {
          currentPickupData = await getLocationOnce();
        }
        if (!currentPickupData) return;

        const {latitude, longitude, heading} = location;
        const updatedPickupDetails = {
          ...currentPickupData,
          latitude,
          longitude,
        };

        dispatch(
          setPickupDetails({...updatedPickupDetails, latitude, longitude}),
        );

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
        console.log('error for continuoes...', error);
        if (error.code === 2) {
          Alert.alert('Device Location Lost', 'Please Enable location.', [
            {text: 'Cancel', style: 'cancel'},
            {
              text: 'Open Settings',
              onPress: () => {
                Linking.sendIntent(
                  'android.settings.LOCATION_SOURCE_SETTINGS',
                ).catch(() => {
                  Linking.openSettings();
                });
              },
            },
          ]);
        }
      },
    );
    locationWatcherRef.current = locationWatcher;
    return () => {
      if (locationWatcherRef.current) {
        stopWatchingLocation();
      }
    };
  }, [socketInitialized, pickupData]);

  const loadUserLocalDatas = async () => {
    const localData = await loadUserFromStorage();
    const userToken: any = await AsyncStorage.getItem('userToken');
    setUserLocalData({...localData, token: userToken});
  };

useEffect(() => {
     onCenter();
   }, [state.curLoc]);

   // Jab bhi Home screen pe focus aaye, map ko current location pe zoom karega
   useFocusEffect(
     useCallback(() => {
       onCenter();
     }, []),
   );

   const fetchCordsValues = async (newToCords: any) => {
    setState({
      ...state,
      destinationCords: {
        latitude: newToCords?.latitude,
        longitude: newToCords?.longitude,
        address: newToCords?.address,
        distance: newToCords?.distance,
      },
    });
    setShowLocationRoute(true);
  };

  const animate = (latitude: number, longitude: number) => {
    const newCoordinate = {latitude, longitude};
    if (Platform.OS == 'android') {
      if (markerRef.current) {
        markerRef.current.animateMarkerToCoordinate(newCoordinate, 1000);
      }
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
    if (
      ongoingRide?.rideCategory === 'car' ||
      ongoingRide?.rideCategory === 'taxi'
    ) {
      return (
        <Image
          source={Icons.CarTop1}
          style={{
            width: moderateScale(40),
            height: moderateScale(40),
            resizeMode: 'contain',
          }}
        />
      );
    } else if (
      ongoingRide?.rideCategory === 'bike' ||
      ongoingRide?.rideCategory === 'cycle'
    ) {
      return (
        <Image
          source={Icons.BikeTop1}
          style={{
            width: moderateScale(40),
            height: moderateScale(40),
            resizeMode: 'contain',
          }}
        />
      );
    }
    return null;
  };

  const renderRideTypeCard = (type: string, label: string, iconSource: any) => {
    const isSelected = selectedRideType === type;
    return (
      <Pressable
        onPress={() => setSelectedRideType(type as any)}
        style={[
          {
            flex: 1,
            alignItems: 'center',
            paddingVertical: moderateScaleVertical(12),
            paddingHorizontal: moderateScale(8),
            borderRadius: moderateScale(12),
            backgroundColor: isSelected
              ? colors.themePrimary
              : isDarkMode
              ? colors.black2
              : colors.white,
            borderWidth: isSelected ? 0 : 1,
            borderColor: isSelected
              ? colors.themePrimary
              : colors.borderColor,
          },
        ]}>
        <Image
          source={iconSource}
          style={{
            width: moderateScale(50),
            height: moderateScale(50),
            resizeMode: 'contain',
            marginBottom: moderateScaleVertical(6),
          }}
        />
        <Text
          style={{
            fontFamily: 'Poppins-Medium',
            fontSize: textScale(11),
            color: isSelected ? colors.white : colors.charcoalGray,
          }}>
          {label}
        </Text>
        {isSelected && (
          <View
            style={{
              width: moderateScale(8),
              height: moderateScale(8),
              borderRadius: moderateScale(4),
              backgroundColor: colors.white,
              marginTop: moderateScaleVertical(4),
            }}
          />
        )}
      </Pressable>
    );
  };

  const getEstimatedFare = () => {
    const distance = state.distance || 0;
    const baseFare = 35;
    const perKmRate = 8;
    const perMinuteRate = 2;
    const estimatedFare =
      baseFare + distance * perKmRate + 10 * perMinuteRate;
    return estimatedFare;
  };

  return (
    <Container
      statusBarStyle={isDarkMode ? 'light-content' : 'dark-content'}
      statusBarBackgroundColor={isDarkMode ? '#000000' : '#f5f5f5'}
      backgroundColor={isDarkMode ? '#000000' : colors.ivoryYellow}>
      {/* ======= TOP HEADER BAR ======= */}
      <Box
        flexDirection="row"
        alignItems="center"
        justifyContent="space-between"
        px={moderateScale(16)}
        py={moderateScaleVertical(12)}
        bgColor={isDarkMode ? colors.black2 : colors.white}
        shadowColor={isDarkMode ? '#000' : colors.gray4}
        shadowOffset={{width: 0, height: 2}}
        shadowOpacity={0.1}
        shadowRadius={moderateScale(4)}
        elevation={3}
        zIndex={10}>
        {/* Hamburger */}
        <Pressable
          onPress={() => navigation.openDrawer()}
          bgColor={isDarkMode ? colors.dimGray : colors.gray5}
          w={moderateScale(38)}
          h={moderateScale(38)}
          borderRadius={moderateScale(10)}
          alignItems="center"
          justifyContent="center">
          <HamburgerIcon />
        </Pressable>

        {/* Logo & Brand */}
        <Box flexDirection="row" alignItems="center" gap={moderateScale(6)}>
          <View
            style={{
              width: moderateScale(36),
              height: moderateScale(36),
              borderRadius: moderateScale(9),
              backgroundColor: colors.themePrimary,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Text
              style={{
                fontFamily: 'Poppins-Bold',
                fontSize: textScale(18),
                color: colors.white,
              }}>
              C
            </Text>
          </View>
          <Text
            fontFamily="Poppins-SemiBold"
            fontSize={textScale(18)}
            color={isDarkMode ? colors.white : colors.charcoalGray}>
            Dharam Cab
          </Text>
        </Box>

        {/* Notification Bell */}
        <Pressable
          onPress={() => navigation.navigate(NavigationString?.Notifications)}
          bgColor={isDarkMode ? colors.dimGray : colors.gray5}
          w={moderateScale(38)}
          h={moderateScale(38)}
          borderRadius={moderateScale(10)}
          alignItems="center"
          justifyContent="center">
          <Notification />
        </Pressable>
      </Box>

      <MapView
        style={{flex: 1}}
        ref={mapRef}
        provider={
          Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT
        }
        showsUserLocation={true}
        showsMyLocationButton={false}
        initialRegion={{
          ...state?.curLoc,
          latitudeDelta: LATITUDE_DELTA,
          longitudeDelta: LONGITUDE_DELTA,
        }}>
        <Marker.Animated ref={markerRef} coordinate={state?.coordinate as any}>
          <MaterialIcons
            name="location-on"
            size={scale(30)}
            color={colors.Amber}
          />
        </Marker.Animated>

        {!ongoingRide &&
          nearbyDrivers.map((driver, index) => {
            return (
              <Marker.Animated
                key={`driver-${driver._id}`}
                coordinate={
                  new AnimatedRegion({
                    latitude: driver?.location?.coordinates[1],
                    longitude: driver?.location?.coordinates[0],
                    latitudeDelta: LATITUDE_DELTA,
                    longitudeDelta: LONGITUDE_DELTA,
                  }) as any
                }
                anchor={{x: 0.5, y: 0.5}}>
                <Image
                  source={Icons.CarTop1}
                  style={{
                    width: moderateScale(40),
                    height: moderateScale(40),
                    resizeMode: 'contain',
                    transform: [{rotate: '180deg'}],
                  }}
                />
              </Marker.Animated>
            );
          })}

        {/* Destination Marker */}
        {ongoingRide?.destinationLocation && (
          <Marker
            coordinate={{
              latitude: ongoingRide.destinationLocation.latitude,
              longitude: ongoingRide.destinationLocation.longitude,
            }}>
            <MaterialIcons
              name="location-on"
              size={scale(20)}
              color={colors.green}
            />
          </Marker>
        )}

        {/* Driver Marker */}
        {ongoingRide?.driverCurrentLatLong?.latitude &&
          ongoingRide?.driverCurrentLatLong?.longitude && (
            <Marker
              coordinate={{
                latitude: ongoingRide.driverCurrentLatLong.latitude,
                longitude: ongoingRide.driverCurrentLatLong.longitude,
              }}
              anchor={{x: 0.5, y: 0.5}}>
              {renderDriverMarker()}
            </Marker>
          )}

        {/* Route between pickup and destination */}
        {ongoingRide?.pickupLocation && ongoingRide?.destinationLocation && (
          <MapViewDirections
            origin={{
              latitude: ongoingRide.pickupLocation.latitude,
              longitude: ongoingRide.pickupLocation.longitude,
            }}
            destination={{
              latitude: ongoingRide.destinationLocation.latitude,
              longitude: ongoingRide.destinationLocation.longitude,
            }}
            apikey={GOOGLE_API_KEY}
            strokeWidth={4}
            strokeColor={colors.themePrimary}
            mode="DRIVING"
            onReady={result => {
              if (
                mapRef.current &&
                result.coordinates &&
                result.coordinates.length > 0
              ) {
                mapRef.current.fitToCoordinates(result.coordinates, {
                  edgePadding: {
                    top: deviceHeight / 4,
                    left: deviceWidth / 4,
                    right: deviceWidth / 4,
                    bottom: deviceHeight / 4,
                  },
                  animated: true,
                });
              }
            }}
          />
        )}

        {/* Route between pickup and driver */}
        {ongoingRide?.pickupLocation && ongoingRide?.driverCurrentLatLong && (
          <MapViewDirections
            origin={{
              latitude: ongoingRide.pickupLocation.latitude,
              longitude: ongoingRide.pickupLocation.longitude,
            }}
            destination={{
              latitude: ongoingRide.driverCurrentLatLong.latitude,
              longitude: ongoingRide.driverCurrentLatLong.longitude,
            }}
            apikey={GOOGLE_API_KEY}
            strokeWidth={4}
            strokeColor={colors.black}
            mode="DRIVING"
            onReady={result => {
              console.log(
                'result.duration for driver to pickup -> ',
                result.duration,
              );
              setRemainTimeForPickup(result.duration);
              setRemainDurationForPickup(result.distance);
              if (
                mapRef.current &&
                result.coordinates &&
                result.coordinates.length > 0
              ) {
                mapRef.current.fitToCoordinates(result.coordinates, {
                  edgePadding: {
                    top: deviceHeight / 4,
                    left: deviceWidth / 4,
                    right: deviceWidth / 4,
                    bottom: deviceHeight / 4,
                  },
                  animated: true,
                });
              }
            }}
          />
        )}

        {!ongoingRide && Object?.keys(state.destinationCords).length > 0 && (
          <Marker
            coordinate={{
              ...state?.destinationCords,
            }}>
            <MaterialIcons
              name="location-on"
              size={scale(30)}
              color={colors.emeraldGreen}
            />
          </Marker>
        )}

        {!ongoingRide && Object?.keys(state.destinationCords).length > 0 && (
          <MapViewDirections
            origin={state?.curLoc}
            destination={state?.destinationCords}
            apikey={GOOGLE_API_KEY}
            strokeWidth={3}
            optimizeWaypoints={true}
            onReady={async result => {
              const hours = Math.floor(result.duration / 60);
              const remainingMinutes = Math.round(result.duration % 60);
              const formattedTime = `${hours}h ${remainingMinutes}m`;

              setState({
                ...state,
                distance: result.distance,
                routeDuration: formattedTime,
              });
              await saveUserToStorage({
                ...userLocalData,
                dropDetails: {
                  ...state.destinationCords,
                  distance: result.distance,
                  routeDuration: formattedTime,
                  routeDurationinMinutes: result.duration,
                },
              });
              if (
                result.coordinates &&
                result.coordinates.length > 0 &&
                mapRef.current
              ) {
                mapRef.current.fitToCoordinates(result.coordinates, {
                  edgePadding: {
                    top: deviceHeight / 4,
                    left: deviceWidth / 4,
                    right: deviceWidth / 4,
                    bottom: deviceHeight / 4,
                  },
                  animated: true,
                });
              }
            }}
            onError={errorMessage => {
              console.log('MapView Directions error:', errorMessage);
            }}
          />
        )}
      </MapView>

{/* ======= BOTTOM RIDE PANEL (Ola-style) ======= */}
       {!ongoingRide && (
         <Box
           position="absolute"
           bottom={0}
           left={0}
           right={0}
           bgColor={isDarkMode ? colors.black2 : colors.white}
           borderTopLeftRadius={moderateScale(24)}
           borderTopRightRadius={moderateScale(24)}
           shadowColor={isDarkMode ? '#000' : colors.gray}
           shadowOffset={{width: 0, height: -4}}
           shadowOpacity={0.15}
           shadowRadius={moderateScale(12)}
elevation={8}
            zIndex={5}
            height={moderateScale(380)}>
            <ScrollView
              scrollEnabled={true}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{paddingBottom: moderateScaleVertical(20)}}
              keyboardShouldPersistTaps="always"
              nestedScrollEnabled={true}
              overScrollMode="always">
             {/* Pickup Address Bar */}
             <Pressable
               onPress={() => {
                 navigation.navigate(NavigationString.SelectPath, {
                   fetchCordsValues,
                   userLocation: state?.curLoc,
                 });
               }}
               flexDirection="row"
               alignItems="center"
               px={moderateScale(16)}
               py={moderateScaleVertical(14)}
               gap={moderateScale(12)}
               borderBottomWidth={1}
               borderBottomColor={
                 isDarkMode ? colors.dimGray : colors.gray5
               }>
               <View
                 style={{
                   width: moderateScale(40),
                   height: moderateScale(40),
                   borderRadius: moderateScale(20),
                   backgroundColor: colors.themePrimary,
                   alignItems: 'center',
                   justifyContent: 'center',
                 }}>
                 <MaterialIcons
                   name="my-location"
                   size={scale(18)}
                   color={colors.white}
                 />
               </View>
               <Box flex={1}>
                 <Text
                   fontFamily="Poppins-Medium"
                   fontSize={textScale(13)}
                   color={isDarkMode ? colors.white : colors.charcoalGray}
                   numberOfLines={1}>
                   {state?.curLoc?.address || 'Getting your location...'}
                 </Text>
                 <Text
                   fontFamily="Poppins-Regular"
                   fontSize={textScale(11)}
                   color={isDarkMode ? colors.gray6 : colors.silverGray}
                   numberOfLines={1}>
                   Current location
                 </Text>
               </Box>
               {state?.destinationCords?.address ? (
                 <Box flexDirection="row" alignItems="center" gap={moderateScale(6)}>
                   <Box
                     style={{
                       width: moderateScale(10),
                       height: moderateScale(10),
                       borderRadius: moderateScale(5),
                       backgroundColor: colors.emeraldGreen,
                     }}
                   />
                   <Text
                     fontFamily="Poppins-Medium"
                     fontSize={textScale(11)}
                     color={isDarkMode ? colors.white : colors.dimGray}
                     numberOfLines={1}
                     style={{maxWidth: moderateScale(100)}}>
                     {state?.destinationCords?.address}
                   </Text>
                 </Box>
               ) : (
                 <View
                   style={{
                     width: moderateScale(10),
                     height: moderateScale(10),
                     borderRadius: moderateScale(5),
                     backgroundColor: colors.gray4,
                   }}
                 />
               )}
             </Pressable>

             {/* Estimated Fare */}
             {state?.destinationCords?.address && (
               <View
                 style={{
                   flexDirection: 'row',
                   alignItems: 'center',
                   justifyContent: 'space-between',
                   paddingHorizontal: moderateScale(16),
                   paddingVertical: moderateScaleVertical(12),
                   backgroundColor: isDarkMode
                     ? colors.black
                     : colors.primary3,
                 }}>
                 <View>
                   <Text
                     fontFamily="Poppins-Regular"
                     fontSize={textScale(12)}
                     color={isDarkMode ? colors.gray6 : colors.dimGray}>
                     Estimated Fare
                   </Text>
                   <Text
                     fontFamily="Poppins-Bold"
                     fontSize={textScale(24)}
                     color={isDarkMode ? colors.white : colors.charcoalGray}>
                     ₹{getEstimatedFare().toFixed(0)}
                   </Text>
                 </View>
                 <View
                   style={{
                     paddingHorizontal: moderateScale(12),
                     paddingVertical: moderateScaleVertical(6),
                     backgroundColor: isDarkMode
                       ? colors.dimGray
                       : colors.white,
                     borderRadius: moderateScale(20),
                   }}>
                   <Text
                     fontFamily="Poppins-Medium"
                     fontSize={textScale(10)}
                     color={isDarkMode ? colors.white : colors.charcoalGray}>
                     {state?.distance
                       ? `${Number(state.distance).toFixed(1)} km`
                       : '---'}
                   </Text>
                 </View>
               </View>
             )}

             {/* Ride Type Selectors */}
             {!state?.destinationCords?.address && (
               <Box mx={moderateScale(16)} mt={moderateScaleVertical(16)}>
                 <Text
                   fontFamily="Poppins-Medium"
                   fontSize={textScale(14)}
                   color={isDarkMode ? colors.white : colors.charcoalGray}
                   mb={moderateScaleVertical(10)}>
                   Choose Ride Type
                 </Text>
                 <View style={{flexDirection: 'row', gap: moderateScale(10)}}>
                   {renderRideTypeCard(
                     'auto',
                     'Auto',
                     Icons.Cycle,
                   )}
                   {renderRideTypeCard(
                     'bike',
                     'Bike',
                     Icons.Bike,
                   )}
                   {renderRideTypeCard(
                     'car',
                     'Car',
                     Icons.Car,
                   )}
                 </View>
               </Box>
             )}

             {/* Quick Actions */}
             {!state?.destinationCords?.address && (
               <View
                 style={{
                   flexDirection: 'row',
                   justifyContent: 'space-around',
                   paddingHorizontal: moderateScale(16),
                   paddingVertical: moderateScaleVertical(16),
                   borderTopWidth: 1,
                   borderTopColor: isDarkMode ? colors.dimGray : colors.gray5,
                   marginBottom:20
                 }}>
                 <TouchableOpacity
                   style={{
                     alignItems: 'center',
                     paddingVertical: moderateScaleVertical(8),
                     paddingHorizontal: moderateScale(14),
                     borderRadius: moderateScale(12),
                     backgroundColor: isDarkMode
                       ? colors.dimGray
                       : colors.gray5,
                   }}>
                   <View
                     style={{
                       width: moderateScale(40),
                       height: moderateScale(40),
                       borderRadius: moderateScale(20),
                       backgroundColor: colors.themePrimary,
                       alignItems: 'center',
                       justifyContent: 'center',
                       marginBottom: moderateScaleVertical(6),
                     }}>
                     <MaterialIcons
                       name="schedule"
                       size={scale(20)}
                       color={colors.white}
                     />
                   </View>
                   <Text
                     fontFamily="Poppins-Medium"
                     fontSize={textScale(10)}
                     color={isDarkMode ? colors.white : colors.gray}>
                     Schedule
                   </Text>
                 </TouchableOpacity>

                 <TouchableOpacity
                   style={{
                     alignItems: 'center',
                     paddingVertical: moderateScaleVertical(8),
                     paddingHorizontal: moderateScale(14),
                     borderRadius: moderateScale(12),
                     backgroundColor: isDarkMode
                       ? colors.dimGray
                       : colors.gray5,
                   }}>
                   <View
                     style={{
                       width: moderateScale(40),
                       height: moderateScale(40),
                       borderRadius: moderateScale(20),
                       backgroundColor: colors.themeTertiary,
                       alignItems: 'center',
                       justifyContent: 'center',
                       marginBottom: moderateScaleVertical(6),
                     }}>
                     <MaterialIcons
                       name="local-offer"
                       size={scale(20)}
                       color={colors.white}
                     />
                   </View>
                   <Text
                     fontFamily="Poppins-Medium"
                     fontSize={textScale(10)}
                     color={isDarkMode ? colors.white : colors.gray}>
                     Offers
                   </Text>
                 </TouchableOpacity>

                 <TouchableOpacity
                   style={{
                     alignItems: 'center',
                     paddingVertical: moderateScaleVertical(8),
                     paddingHorizontal: moderateScale(14),
                     borderRadius: moderateScale(12),
                     backgroundColor: isDarkMode
                       ? colors.dimGray
                       : colors.gray5,
                   }}
                   onPress={() =>
                     navigation.navigate(NavigationString.Favourite)
                   }>
                   <View
                     style={{
                       width: moderateScale(40),
                       height: moderateScale(40),
                       borderRadius: moderateScale(20),
                       backgroundColor: colors.ivoryYellow,
                       alignItems: 'center',
                       justifyContent: 'center',
                       marginBottom: moderateScaleVertical(6),
                       borderWidth: 1,
                       borderColor: colors.yellow,
                     }}>
                     <MaterialIcons
                       name="favorite-border"
                       size={scale(20)}
                       color={colors.yellow}
                     />
                   </View>
                   <Text
                     fontFamily="Poppins-Medium"
                     fontSize={textScale(10)}
                     color={isDarkMode ? colors.white : colors.gray}>
                     Favorites
                   </Text>
                 </TouchableOpacity>

                 <TouchableOpacity
                   style={{
                     alignItems: 'center',
                     paddingVertical: moderateScaleVertical(8),
                     paddingHorizontal: moderateScale(14),
                     borderRadius: moderateScale(12),
                     backgroundColor: isDarkMode
                       ? colors.dimGray
                       : colors.gray5,
                   }}
                   onPress={() =>
                     navigation.navigate(NavigationString.History)
                   }>
                   <View
                     style={{
                       width: moderateScale(40),
                       height: moderateScale(40),
                       borderRadius: moderateScale(20),
                       backgroundColor: colors.white1,
                       alignItems: 'center',
                       justifyContent: 'center',
                       marginBottom: moderateScaleVertical(6),
                       borderWidth: 1,
                       borderColor: colors.gray3,
                     }}>
                     <MaterialIcons
                       name="history"
                       size={scale(20)}
                       color={colors.themePrimary}
                     />
                   </View>
                   <Text
                     fontFamily="Poppins-Medium"
                     fontSize={textScale(10)}
                     color={isDarkMode ? colors.white : colors.gray}>
                     History
                   </Text>
                 </TouchableOpacity>
               </View>
             )}

             {/* Go Button - shown when destination is set */}
             {state?.destinationCords?.address && (
               <View
                 style={{
                   flexDirection: 'row',
                   alignItems: 'center',
                   paddingHorizontal: moderateScale(16),
                   paddingVertical: moderateScaleVertical(14),
                   borderTopWidth: 1,
                   borderTopColor: isDarkMode ? colors.dimGray : colors.gray5,
                 }}>
                 <PrimaryButton
                   onPress={() => {
                     navigation.navigate(NavigationString.AvailableTransport, {
                       transportType: selectedRideType,
                     });
                   }}
                   buttonText="Go"
                   flex={1}
                   fontSize={textScale(18)}
                   borderRadius={moderateScale(12)}
                 />
               </View>
             )}
           </ScrollView>
         </Box>
       )}
      <OngoingRideModal
        visible={showOngoingRideModal && ongoingRide !== null}
        onClose={() => setShowOngoingRideModal(false)}
        rideData={ongoingRide}
        currentLocation={state.curLoc}
        remainTimeForPickup={remainTimeForPickup}
        remainDurationForPickup={remainDurationForPickup}
        isRideStarted={
          ongoingRide?.rideStatus === 'ridePicked' &&
          ongoingRide?.bookingStatus === 'ongoing'
        }
        setOngoingRide={setOngoingRide}
        setShowOngoingRideModal={setShowOngoingRideModal}
      />

      <CustomBottomsheetRideALerts
        visible={showAlert}
        onClose={() => {
          setShowAlert(false);
          setAlertType(null);
          if (alertType === 'rating') {
            setOngoingRide(null);
            setCompletedRideData(null);
            setShowOngoingRideModal(false);
          }
        }}
        type={alertType}
        rideData={alertType === 'rating' ? completedRideData : ongoingRide}
      />

      <CustomPaymentBottomSheet
        visible={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        rideData={completedRideForPayment}
        onPaymentSuccess={handlePaymentSuccess}
      />

      {ongoingRide && (
        <Pressable
          onPress={() => setShowOngoingRideModal(!showOngoingRideModal)}
          position="absolute"
          bottom={moderateScaleVertical(120)}
          right={moderateScale(15)}
          bgColor={colors.themePrimary}
          w={moderateScale(50)}
          h={moderateScale(50)}
          borderRadius={moderateScale(25)}
          alignItems="center"
          justifyContent="center"
          shadowColor={isDarkMode ? '#000' : colors.themePrimary}
          shadowOffset={{width: 0, height: 4}}
          shadowOpacity={0.3}
          shadowRadius={moderateScale(8)}
          elevation={6}>
          <MaterialIcons
            name="directions-car"
            size={scale(22)}
            color={colors.white}
          />
        </Pressable>
      )}

      {/* ======= MY LOCATION BUTTON ======= */}
      <Pressable
        onPress={() => {
          onCenter();
        }}
        w={moderateScale(44)}
        h={moderateScale(44)}
        position="absolute"
        bgColor={colors.white}
        bottom={ongoingRide ? moderateScaleVertical(80) : moderateScaleVertical(220)}
        right={moderateScale(16)}
        justifyContent="center"
        alignItems="center"
        borderRadius={moderateScale(22)}
        shadowColor={isDarkMode ? '#000' : colors.gray}
        shadowOffset={{width: 0, height: 2}}
        shadowOpacity={0.2}
        shadowRadius={moderateScale(6)}
        elevation={4}
        mr={moderateScale(15)}>
        <MaterialIcons
          name="my-location"
          size={scale(22)}
          color={colors.themePrimary}
        />
      </Pressable>
    </Container>
  );
};

export default Home;