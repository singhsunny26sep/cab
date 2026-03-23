import {
  Box,
  CloseIcon,
  Icon,
  Pressable,
  Text,
  Toast,
  ToastTitle,
  useToast,
} from '@gluestack-ui/themed';
import {
  Alert,
  Dimensions,
  Image,
  Linking,
  Modal,
  Platform,
  TextInput,
  View,
} from 'react-native';
import React, {useEffect, useRef, useState, useCallback} from 'react';
import {ParamListBase, useNavigation, useRoute} from '@react-navigation/native';
import {DrawerNavigationProp} from '@react-navigation/drawer';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MapView, {
  AnimatedRegion,
  Marker,
  PROVIDER_DEFAULT,
  PROVIDER_GOOGLE,
} from 'react-native-maps';
import axios from 'axios';
import {Container} from '../components/Container';
import {colors} from '../constants/colors';
import {
  BetweenLineIcon,
  HamburgerIcon,
  LocationMakerRedIcon,
  LocationMakerYellowIcon,
  LocationTargetIcon,
  Notification,
  SearchIcon,
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
import {useTheme} from '../constants/ThemeContext';
import {useDispatch, useSelector} from 'react-redux';
import {RootState} from '../store/reduxStore/store';
import {
  loadUserFromStorage,
  saveUserToStorage,
  setDropDetails,
  setDropDistance,
  setPickupDetails,
} from '../store/slice/UserSlice';
import {
  checkDeviceLocationServices,
  requestLocationPermissions,
  stopWatchingLocation,
  watchLocationContinuously,
  openLocationSettings,
  getCurrentLocationOnce,
} from '../utils/locationHelper';
import socketServices from '../utils/socketServices';
import debounce from '../utils/debounce';
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment';
import OngoingRideModal from '../components/OngoingRideModal/OngoingRideModal';
import CustomBottomsheetRideALerts from './CustomBottomsheetRideALerts';
import CustomPaymentBottomSheet from './CustomPaymentBottomSheet';

const screen = Dimensions.get('window');
const ASPECT_RATIO = screen.width / screen.height;
const LATITUDE_DELTA = 0.003;
const LONGITUDE_DELTA = 0.003;

interface Location {
  latitude: number;
  longitude: number;
  address?: string;
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
  const navigation = useNavigation<DrawerNavigationProp<ParamListBase>>();
  const route: any = useRoute();
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
  const [completedRideData, setCompletedRideData] = useState<any>(null); // New state to store completed ride data
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [completedRideForPayment, setCompletedRideForPayment] = useState<any>(null);

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
        await requestLocationPermission();
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
      // Driver is on the way
      setOngoingRide(ride);
      setShowOngoingRideModal(true);
      setCompletedRideData(null); // Clear any completed ride data
    } else if (
      ride.bookingStatus === 'ongoing' &&
      ride.rideStatus === 'ridePicked'
    ) {
      // Ride picked - show confirmation
      setOngoingRide(ride);
      setAlertType('confirmation');
      setShowAlert(true);
      setShowOngoingRideModal(false);
      setCompletedRideData(null); // Clear any completed ride data
    } else if (
      ride.bookingStatus === 'completed' &&
      ride.rideStatus === 'ridePicked'
    ) {
          // Ride completed - show payment first
    setCompletedRideForPayment(ride);
    setShowPaymentModal(true);
    setOngoingRide(null);
    setShowOngoingRideModal(false);

      // Ride completed - show rating
      // setCompletedRideData(ride); // Store completed ride data
      // setOngoingRide(null); // Clear ongoing ride
      // setAlertType('rating');
      // setShowAlert(true);
      // setShowOngoingRideModal(false);
    } else {
          // Reset if no ongoing ride
    setOngoingRide(null);
    setShowOngoingRideModal(false);
    setCompletedRideForPayment(null);
    setCompletedRideData(null);

      // // Reset if no ongoing ride
      // setOngoingRide(null);
      // setShowOngoingRideModal(false);
      // setCompletedRideData(null);
    }
  };

  // handle payment success
  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    setCompletedRideData(completedRideForPayment);
    setAlertType('rating');
    setShowAlert(true);
  };

  useEffect(() => {
    if (!socketInitialized) return;
    
    const debouncedLocationUpdate = debounce((location: any) => {
      console.log("location for customer going ===> ", )
      if (socketInitialized) {
        console.log("location for customer going ===> ", location)
        socketServices.emit('registerClientLocation', {
          lat: location.latitude,
          lng: location.longitude,
        });

        // socketServices.on('nearbyDriverList', (nearbyDriverList: any) => {
        //   setNearbyDrivers(nearbyDriverList);
        // });
      }
    }, 1000);

    const locationWatcher = watchLocationContinuously(
      async (location: any) => {
        console.log("in continuous location ===", location)
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

        if (mapRef.current) {
          mapRef.current.animateToRegion(
            {
              latitude,
              longitude,
              latitudeDelta: LATITUDE_DELTA,
              longitudeDelta: LONGITUDE_DELTA,
            },
            500,
          );
        }
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

  const requestLocationPermission = async () => {
    try {
      const hasPermission = await requestLocationPermissions();
      if (!hasPermission) {
        setState(prevState => ({...prevState, isLoading: false}));
        return;
      }
      if (hasPermission) {
        const isLocationEnabled = await checkDeviceLocationServices();
        if (!isLocationEnabled) {
          Alert.alert(
            'Location Services Disabled',
            'Please enable device location services to track your location',
            [
              {text: 'Cancel', style: 'cancel'},
              {text: 'Open Settings', onPress: openLocationSettings},
            ],
          );
          setState(prevState => ({...prevState, isLoading: false}));
          return;
        }
      } else {
        setState(prevState => ({...prevState, isLoading: false}));
      }
    } catch (error) {
      console.error('Permission request error:', error);
      setState(prevState => ({...prevState, isLoading: false}));
    }
  };

  const loadUserLocalDatas = async () => {
    const localData = await loadUserFromStorage();
    const userToken: any = await AsyncStorage.getItem('userToken');
    setUserLocalData({...localData, token: userToken});
  };

  useEffect(() => {
    onCenter();
  }, [state.curLoc]);

  const fetchCordsValues = async (newToCords: any) => {
    setState({
      ...state,
      destinationCords: {
        latitude: newToCords?.latitude,
        longitude: newToCords?.longitude,
        address: newToCords?.address,
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

  return (
    <Container
      statusBarStyle={isDarkMode ? 'light-content' : 'dark-content'}
      statusBarBackgroundColor={isDarkMode ? '#000000' : '#f5f5f5'}
      backgroundColor={isDarkMode ? '#000000' : colors.ivoryYellow}>
      <MapView
        style={{flex: 1}}
        ref={mapRef}
        provider={
          Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT
        }
        showsUserLocation={true}
        showsMyLocationButton={true}
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

      <OngoingRideModal
        visible={showOngoingRideModal && ongoingRide !== null}
        onClose={() => setShowOngoingRideModal(false)}
        rideData={ongoingRide}
        currentLocation={state.curLoc}
        remainTimeForPickup={remainTimeForPickup}
        remainDurationForPickup={remainDurationForPickup}
        isRideStarted={ongoingRide?.rideStatus === "ridePicked" && ongoingRide?.bookingStatus === "ongoing"}
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
          bgColor={isDarkMode ? colors.white : colors.themePrimary}
          w={moderateScale(50)}
          h={moderateScale(50)}
          borderRadius={moderateScale(10)}
          alignItems="center"
          justifyContent="center">
          <MaterialIcons
            name="directions-car"
            size={scale(20)}
            color={isDarkMode ? colors.black : colors.black}
          />
          <Text>Rides</Text>
        </Pressable>
      )}

      <Box
        position="absolute"
        flexDirection="row"
        alignItems="center"
        gap={deviceWidth * 0.72}
        py={moderateScaleVertical(15)}
        px={moderateScale(15)}>
        <Pressable
          onPress={() => {
            navigation.openDrawer();
          }}
          bgColor={isDarkMode ? colors.white : colors.themePrimary}
          w={moderateScale(32)}
          h={moderateScale(32)}
          borderRadius={moderateScale(5)}
          alignItems="center"
          justifyContent="center">
          <HamburgerIcon />
        </Pressable>

        <Pressable
          onPress={() => navigation.navigate(NavigationString?.Notifications)}
          bgColor={isDarkMode ? colors.white : colors.themePrimary}
          w={moderateScale(32)}
          h={moderateScale(32)}
          borderRadius={moderateScale(5)}
          alignItems="center"
          justifyContent="center">
          <Notification />
        </Pressable>
      </Box>

      <Pressable
        onPress={() => {
          onCenter();
        }}
        w={moderateScale(50)}
        h={moderateScale(50)}
        position="absolute"
        bgColor={isDarkMode ? colors.white : colors.themePrimary}
        bottom={0}
        mb={
          ongoingRide ? moderateScaleVertical(55) : moderateScaleVertical(175)
        }
        right={0}
        justifyContent="center"
        alignItems="center"
        borderRadius={moderateScale(10)}
        mr={moderateScale(15)}>
        <MaterialIcons
          name="my-location"
          size={scale(30)}
          color={colors.black}
        />
      </Pressable>

      {!ongoingRide && (
        <Pressable
          hitSlop={20}
          onPress={() => {
            navigation.navigate(NavigationString.SelectPath, {
              fetchCordsValues,
              userLocation: state?.curLoc,
            });
          }}
          position="absolute"
          bottom={0}
          mb={moderateScaleVertical(110)}
          flexDirection="row"
          alignItems="center"
          bgColor={isDarkMode ? colors.black : colors.ivoryYellow}
          mx={moderateScale(10)}
          borderWidth={1}
          borderRadius={moderateScale(6)}
          borderColor={colors.themePrimary}
          pl={moderateScale(10)}
          h={moderateScale(45)}
          w={'94%'}>
          <SearchIcon />
          <TextInput
            placeholder="Where would you go?"
            placeholderTextColor={isDarkMode ? colors.white : colors.grayish}
            value={state?.destinationCords?.address ?? ''}
            numberOfLines={1}
            editable={false}
            style={{
              fontSize: textScale(12),
              lineHeight: textScale(14),
              fontFamily: 'Poppins-Medium',
              color: colors.mediumLightGray,
              flex: 1,
            }}
          />
        </Pressable>
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={showLocationRoute}>
        <View
          style={{
            flex: 1,
            justifyContent: 'flex-end',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          }}>
          <View
            style={{
              backgroundColor: isDarkMode ? colors.black : '#fff',
              width: '100%',
              height: '35%',
              borderTopLeftRadius: moderateScale(25),
              borderTopRightRadius: moderateScale(25),
              paddingTop: moderateScaleVertical(15),
            }}>
            <Pressable
              onPress={() => setShowLocationRoute(false)}
              alignSelf="flex-end"
              pr={moderateScale(15)}
              mb={moderateScaleVertical(10)}>
              <Icon as={CloseIcon} color="#5A5A5A" w="$4" h="$4" />
            </Pressable>

            <Text
              fontFamily={'$poppinsMedium'}
              fontSize={20}
              lineHeight={22}
              color={isDarkMode ? colors.white : colors.charcoalGray}
              numberOfLines={1}
              alignSelf="center">
              Select address
            </Text>
            <Box
              borderBottomWidth={1}
              borderBottomColor="#DDDDDD"
              my={moderateScaleVertical(10)}></Box>

            <Box mx={moderateScale(10)} my={moderateScaleVertical(15)}>
              <Box
                flexDirection="row"
                alignItems="center"
                gap={moderateScale(5)}>
                <LocationMakerRedIcon style={{alignSelf: 'flex-start'}} />
                <Box flex={1}>
                  <Box
                    flexDirection="row"
                    alignItems="center"
                    justifyContent="space-between">
                    <Text
                      fontFamily={'$poppinsMedium'}
                      fontSize={14}
                      lineHeight={16}
                      color={isDarkMode ? colors.white : colors.charcoalGray}
                      numberOfLines={1}>
                      Current Location
                    </Text>
                    <Text
                      fontFamily={'$poppinsMedium'}
                      fontSize={14}
                      lineHeight={16}
                      color={isDarkMode ? colors.white : colors.charcoalGray}
                      numberOfLines={1}>
                      {state.routeDuration}
                    </Text>
                  </Box>
                  <Text
                    fontFamily={'$poppinsRegular'}
                    fontSize={12}
                    lineHeight={14}
                    color={isDarkMode ? colors.white : colors.silverGray}
                    numberOfLines={1}>
                    {state?.curLoc?.address ?? 'N/A'}
                  </Text>
                </Box>
              </Box>

              <BetweenLineIcon style={{marginLeft: moderateScale(11)}} />

              <Box
                flexDirection="row"
                alignItems="center"
                gap={moderateScale(5)}>
                <LocationMakerYellowIcon style={{alignSelf: 'flex-start'}} />
                <Box flex={1}>
                  <Box
                    flexDirection="row"
                    alignItems="center"
                    justifyContent="space-between">
                    <Text
                      fontFamily={'$poppinsMedium'}
                      fontSize={14}
                      lineHeight={16}
                      color={isDarkMode ? colors.white : colors.charcoalGray}
                      numberOfLines={1}>
                      Destination Location
                    </Text>
                    <Text
                      fontFamily={'$poppinsMedium'}
                      fontSize={14}
                      lineHeight={16}
                      color={isDarkMode ? colors.white : colors.charcoalGray}
                      numberOfLines={1}>
                      {state?.distance ?? 'N/A'} Kms
                    </Text>
                  </Box>
                  <Text
                    fontFamily={'$poppinsRegular'}
                    fontSize={12}
                    lineHeight={14}
                    color={isDarkMode ? colors.white : colors.silverGray}
                    numberOfLines={1}>
                    {state?.destinationCords?.address ?? 'N/A'}
                  </Text>
                </Box>
              </Box>
            </Box>

            <PrimaryButton
              buttonText="Confirm Location"
              onPress={() => {
                navigation.navigate(NavigationString.AvailableTransport);
                fetchCordsValues({
                  latitude: 0,
                  longitude: 0,
                  address: '',
                });
                setShowLocationRoute(false);
              }}
              marginHorizontal={moderateScale(15)}
            />
          </View>
        </View>
      </Modal>
    </Container>
  );
};

export default Home;
