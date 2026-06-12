import React, {useState, useRef, useEffect} from 'react';
import {
  StyleSheet,
  View,
  Dimensions,
  Platform,
  Image,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import {Container} from '../components/Container';
import {colors} from '../constants/colors';
import MapView, {
  Marker,
  AnimatedRegion,
  PROVIDER_DEFAULT,
  PROVIDER_GOOGLE,
} from 'react-native-maps';
import {
  customerCancelRideReasons,
  deviceHeight,
  deviceWidth,
  GOOGLE_API_KEY,
} from '../constants/contants';
import {
  moderateScale,
  moderateScaleVertical,
  scale,
  textScale,
  verticalScale,
} from '../utils/responsiveSize';
import Icons from '../assets/Icons';
import {
  Box,
  ChevronDownIcon,
  CloseIcon,
  Pressable,
  Text,
  Toast,
  ToastTitle,
  useToast,
} from '@gluestack-ui/themed';
import {
  LocationMakerRedIcon,
  LocationTargetIcon,
  ReviewStarIcon,
} from '../components/Icons';
import PrimaryButton from '../components/Button/PrimaryButton';
import {NavigationString} from '../navigation/navigationStrings';
import {useTheme} from '../constants/ThemeContext';
import {ParamListBase, useNavigation, useRoute} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {loadUserFromStorage} from '../store/slice/UserSlice';
import {getCurrentLocationOnce} from '../utils/locationHelper';
import socketServices from '../utils/socketServices';
import MapViewDirections from 'react-native-maps-directions';
import LottieView from 'lottie-react-native';
import Modal from 'react-native-modal';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {Dropdown} from 'react-native-element-dropdown';
import {Icon} from '@gluestack-ui/themed';
import {
  responsiveHeight,
  responsiveWidth,
} from 'react-native-responsive-dimensions';
import {BASE_URL} from '../api/Instance.ts';
import {UPDATE_RIDE_STATUS} from '../api/ApiEndpoints';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const screen = Dimensions.get('window');
const ASPECT_RATIO = screen.width / screen.height;
const LATITUDE_DELTA = 0.008;
const LONGITUDE_DELTA = 0.008;

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

const RideWaiting = () => {
  const navigation = useNavigation<NativeStackNavigationProp<ParamListBase>>();
  const {isDarkMode} = useTheme();
  const toast = useToast();
  const route = useRoute();
  const {bookingData}: any = route.params;
  console.log(
    'booking Data at ride waitin -----------------------> ',
    bookingData,
  );

  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const [curLoc, setCurLoc] = useState({
    latitude: 26.263882,
    longitude: 78.130791,
    address: '',
  });
  const [destinationCords, setDestinationCords] = useState({
    latitude: 0,
    longitude: 0,
  });
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
  });
  const [showLocationRoute, setShowLocationRoute] = useState(false);
  const [coordinate, setCoordinate] = useState(
    new AnimatedRegion({
      latitude: curLoc.latitude,
      longitude: curLoc.longitude,
      latitudeDelta: LATITUDE_DELTA,
      longitudeDelta: LONGITUDE_DELTA,
    }),
  );
  const [modalVisible, setModalVisible] = useState(true);
  const [userLocalData, setUserLocalData] = useState<any>(null);
  const [pickupData, setPickupData] = useState<any>(null);
  const [socketInitialized, setSocketInitialized] = useState<boolean>(false);
  const [nearbyDrivers, setNearbyDrivers] = useState<any[]>([]);
  const [bookingResponseData, setBookingResponseData] = useState<any>(null);
  const [userToken, setUserToken] = useState<any>(null);

  const [timeLeft, setTimeLeft] = useState(120); //2 minutes in seconds
  const [timerActive, setTimerActive] = useState(true);
  const [timeExpired, setTimeExpired] = useState(false);

  const [showCancleAlert, setShowCancleAlert] = useState(false);
  const [selectedCancelReason, setSelectedCancelReason] = useState<any>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lottieRef = useRef<LottieView>(null);

  const onCenter = () => {
    if (mapRef.current) {
      mapRef.current?.animateToRegion({
        latitude: state.curLoc.latitude,
        longitude: state.curLoc.longitude,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      });
    }
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
  const loadUserLocalDatas = async () => {
    const localData = await loadUserFromStorage();
    const userToken: any = await AsyncStorage.getItem('userToken');
    // console.log('localData========>>>>>>>>', localData);
    setUserToken(userToken);
    // console.log('localData========>>>>>>>>', localData);
    setUserLocalData(localData);
  };

  useEffect(() => {
    if (timerActive) {
      lottieRef.current?.play();
      timerRef.current = setInterval(() => {
        setTimeLeft(prevTime => {
          if (prevTime <= 1) {
            clearInterval(timerRef.current as NodeJS.Timeout);
            setTimerActive(false);
            setTimeExpired(true);
            // Stop Lottie animation when timer expires
            lottieRef.current?.pause();
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {clearInterval(timerRef.current);}
    };
  }, [timerActive]);
  useEffect(() => {
    const initializeApp = async () => {
      try {
        await loadUserLocalDatas();
        await getLocationOnce();
        // console.log('checking---------------===========>>>>>>1', userLocalData);
      } catch (error) {
        console.error('Initialization error:', error);
      }
    };

    initializeApp();

    return () => {
      // socketServices.disconnectSocket();
    };
  }, []);
  useEffect(() => {
    console.log(
      'checking---------------===========>>>>>>2',
      userLocalData?.token,
    );
    // if (!userToken) return;
    console.log('checking---------------===========>>>>>>3');
    const initializeSocket = async () => {
      try {
        console.log('checking---------------===========>>>>>>4');
        if (socketServices.isConnected()) {
          setSocketInitialized(true);
        }
        // await socketServices.initializeSocket(userLocalData.token);
      } catch (error) {
        console.error('Socket initialization failed:', error);
      }
    };
    initializeSocket();
    return () => {
      setSocketInitialized(false);
    };
  }, [userLocalData]);
  useEffect(() => {
    // if (!socketInitialized) return;

    // if (socketInitialized) {
    console.log(
      'bookingData passed in socketttttttttttttt at ride waiting',
      bookingData,
    );
    socketServices.emit('booking', bookingData);
    socketServices.on('booking-response', (bookingResponse: any) => {
      console.log(
        'bookingResponse =================>>>>',
        JSON.stringify(bookingResponse),
      );
      setBookingResponseData(bookingResponse);
    });

    socketServices.emit('onGoing_booking', {});
    socketServices.on('driver_booking_response', (response: any) => {
      const firstRide = response?.data;
      // console.log('Booking response received at ride waiting--------------------->>>>>:', response);
      console.log(
        'Booking response received at ride waiting--------------------->>>>>:',
        firstRide,
      );

      // Driver accepted the ride
      if (firstRide?.bookingStatus === 'ongoing') {
        setBookingResponseData(firstRide);
        setTimerActive(false);
        lottieRef.current?.pause();
        handleCloseModal();

        // Navigate to Home screen with the ongoing ride data
        navigation.navigate(NavigationString.Home, {
          ongoingRide: firstRide,
        });
      }
      // Driver rejected the ride
      else if (firstRide?.bookingStatus === 'cancelled') {
        setBookingResponseData(firstRide);
        setTimerActive(false);
        setTimeExpired(true);
        lottieRef.current?.pause();
        navigation.navigate(NavigationString.Home, {
          ongoingRide: firstRide,
        });
        // Show rejection message
        toast.show({
          placement: 'top',
          render: ({id}) => (
            <Toast nativeID={`toast-${id}`} variant="accent" action="error">
              <ToastTitle>Ride Cancelled</ToastTitle>
            </Toast>
          ),
        });
      }
    });
    return () => {
      socketServices?.removeListener('driver_booking_response', () => {});
    };
  }, [socketInitialized, navigation, toast]);
  useEffect(() => {
    onCenter();
  }, [state.curLoc]);
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
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  const handleCloseModal = () => {
    setModalVisible(false);
  };

  const toggleRideModal = () => {
    setModalVisible(!modalVisible);
  };

  const handleCancelRide = async () => {
    setShowCancleAlert(true);
  };
  const handleRejectRide = async () => {
    try {
      socketServices.emit('update_booking_status', {
        bookingId: bookingResponseData?.data?._id,
        bookingType: 'cancelled',
        rejectMessage: selectedCancelReason,
        cancelledBy: 'customer',
      });
setSelectedCancelReason(null);
       navigation?.reset({
         index: 0,
         routes: [{ name: NavigationString.Home }],
       });
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        'Network error. Please check your connection.';
      console.error(
        'Error updating status for cancel in Waiting:',
        JSON.stringify(error),
      );
      toast.show({
        placement: 'top',
        render: ({id}: any) => {
          const toastId = 'toast-' + id;
          return (
            <Toast nativeID={toastId} variant="accent" action="error">
              <ToastTitle>{errorMessage}</ToastTitle>
            </Toast>
          );
        },
      });
    }
  };

  const cancelRide = async () => {
    // console.log(
    //   'URL going ->',
    //   `${BASE_URL}${UPDATE_RIDE_STATUS.url}${bookingResponseData?._id}`,
    // );
    // console.log('Booking response', bookingResponseData?.data?._id);
    try {
      const response = await axios({
        url: `${BASE_URL}${UPDATE_RIDE_STATUS.url}${bookingResponseData?.data?._id}`,
        method: UPDATE_RIDE_STATUS.method,
        headers: {
          Authorization: userLocalData?.token,
        },
        data: {
          status: 'cancelled',
          rejectMessage: selectedCancelReason,
          cancelledBy: 'customer',
        },
      });

      // console.log('response for cancelled api -----', response);

      if (response.status === 200 && response.data) {
        console.log('response for cancelled api -----', response.data);
        toast.show({
          placement: 'top',
          render: ({id}: any) => {
            const toastId = 'toast-' + id;
            return (
              <Toast nativeID={toastId} variant="accent" action="success">
                <ToastTitle>Booking Cancelled Successfully.</ToastTitle>
              </Toast>
            );
          },
        });
        navigation?.reset({
           index: 0,
           routes: [{ name: NavigationString.Home }],
         });
      } else {
        toast.show({
          placement: 'top',
          render: ({id}: any) => {
            const toastId = 'toast-' + id;
            return (
              <Toast nativeID={toastId} variant="accent" action="error">
                <ToastTitle>Oops! Something went wrong.</ToastTitle>
              </Toast>
            );
          },
        });
      }
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        'Network error. Please check your connection.';
      console.error('Error updating status:', JSON.stringify(error));
      toast.show({
        placement: 'top',
        render: ({id}: any) => {
          const toastId = 'toast-' + id;
          return (
            <Toast nativeID={toastId} variant="accent" action="error">
              <ToastTitle>{errorMessage}</ToastTitle>
            </Toast>
          );
        },
      });
    }
  };

  const handleRetryBooking = async () => {
    toggleRideModal();
    navigation.goBack();
  };

  const handleCallDriver = () => {
    Linking.openURL(`tel:${bookingResponseData?.driverInfo?.contact}`);
  };
  const handleChatDriver = () => {
    navigation.navigate(NavigationString.ChatScreen, {
      bookingId: bookingResponseData?.data?._id,
    });
  };

  return (
    <Container
      statusBarStyle={isDarkMode ? 'light-content' : 'dark-content'}
      statusBarBackgroundColor={isDarkMode ? '#000000' : '#ffffff'}
      backgroundColor={isDarkMode ? '#000000' : '#ffffff'}>
      <MapView
        style={{flex: 1}}
        ref={mapRef}
        provider={
          Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT
        }
        initialRegion={{
          ...curLoc,
          latitudeDelta: LATITUDE_DELTA,
          longitudeDelta: LONGITUDE_DELTA,
        }}
        showsUserLocation={false}
        showsMyLocationButton={false}>
        <Marker.Animated
          ref={markerRef}
          coordinate={state?.coordinate as any}
          image={Icons.locationYellowMarker}
        />
        {userLocalData?.dropDetails?.latitude &&
        userLocalData?.dropDetails?.longitude ? (
          <Marker
            coordinate={{
              latitude: Number(userLocalData.dropDetails.latitude),
              longitude: Number(userLocalData.dropDetails.longitude),
            }}
            image={Icons.locationGreenMarker}
          />
        ) : null}

        {bookingResponseData?.driverInfo?.lat &&
        bookingResponseData?.driverInfo?.long ? (
          <Marker.Animated
            key={`driver-${bookingResponseData?.driverInfo?._id}`}
            coordinate={
              {
                latitude: bookingResponseData?.driverInfo?.lat,
                longitude: bookingResponseData?.driverInfo?.long,
                // latitude: 22.9621805,
                // longitude: 74.588718,
              } as any
            }
            anchor={{x: 0.5, y: 0.5}}
            rotation={bookingResponseData?.driverInfo?.heading || 0}>
            <Image
              source={
                bookingResponseData?.data?.rideCategory === 'bike' ||
                bookingResponseData?.data?.rideCategory === 'cycle'
                  ? Icons.BikeTop1
                  : Icons.CarTop1
              }
              style={{
                width: moderateScale(40),
                height: moderateScale(40),
                resizeMode: 'contain',
                transform: [{rotate: '180deg'}],
              }}
            />
          </Marker.Animated>
        ) : null}

        {userLocalData?.dropDetails?.latitude &&
        userLocalData?.dropDetails?.longitude ? (
          <MapViewDirections
            origin={state?.curLoc}
            destination={{
              latitude: Number(userLocalData.dropDetails.latitude),
              longitude: Number(userLocalData.dropDetails.longitude),
            }}
            apikey={GOOGLE_API_KEY}
            strokeWidth={3}
            strokeColor={colors.routeRed}
            optimizeWaypoints={true}
            onReady={async (result: any) => {
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
        ) : null}
      </MapView>

      <Modal
        isVisible={modalVisible}
        onBackdropPress={handleCloseModal}
        onBackButtonPress={handleCloseModal}
        style={styles.modal}
        backdropOpacity={0.1}
        swipeDirection={['down']}
        onSwipeComplete={handleCloseModal}
        animationIn="slideInUp"
        animationOut="slideOutDown"
        backdropTransitionInTiming={500}
        backdropTransitionOutTiming={500}
        // statusBarTranslucent
        hideModalContentWhileAnimating={true}>
        <Box
          style={[
            styles.modalContent,
            {backgroundColor: isDarkMode ? colors.black : colors.white},
          ]}>
          <Box borderBottomWidth={0.5}>
            <Box
              flexDirection="row"
              alignItems="center"
              justifyContent="space-between"
              padding={scale(16)}>
              <Box>
                {timeExpired ? (
                  <Box alignItems="center" mb={moderateScale(10)}>
                    <Text
                      fontFamily={'$poppinsMedium'}
                      fontSize={16}
                      color="#FF3B30"
                      textAlign="center">
                      Oops, Driver not responding. Please retry.
                    </Text>
                  </Box>
                ) : (
                  <Text
                    fontFamily={'$poppinsMedium'}
                    fontSize={15}
                    lineHeight={20}
                    color={isDarkMode ? colors.white : colors.charcoalGray}
                    numberOfLines={1}>
                    Request sent to driver, Waiting for accept.
                  </Text>
                )}
              </Box>
              <Pressable onPress={handleCloseModal}>
                <CloseIcon />
              </Pressable>
            </Box>
          </Box>
          <Box borderBottomWidth={1} paddingBottom={verticalScale(15)}>
            <Box
              flexDirection="row"
              alignItems="center"
              justifyContent="space-between"
              marginHorizontal={scale(15)}
              mt={moderateScale(10)}>
              <Image
                source={{
                  uri: bookingResponseData?.driverInfo?.profileImgUrl,
                }}
                style={{
                  height: scale(80),
                  width: scale(80),
                  borderRadius: moderateScale(8),
                  marginRight: moderateScale(10),
                }}
              />
              <Box flex={1}>
                <Text
                  fontFamily={'$poppinsSemiBold'}
                  fontSize={15}
                  lineHeight={20}
                  color={isDarkMode ? colors.white : colors.charcoalGray}>
                  {bookingResponseData?.driverInfo?.name}
                </Text>
                <Box
                  flexDirection="row"
                  alignItems="center"
                  marginTop={moderateScale(5)}>
                  <LocationMakerRedIcon />
                  <Text
                    marginLeft={moderateScale(5)}
                    color={isDarkMode ? colors.white : colors.charcoalGray}>
                    {bookingResponseData?.data?.distance?.toFixed(2)} km
                  </Text>
                </Box>
                <Box
                  flexDirection="row"
                  alignItems="center"
                  marginTop={moderateScale(5)}>
                  <Box marginLeft={moderateScale(3)}>
                    <ReviewStarIcon />
                  </Box>
                  <Text
                    marginLeft={moderateScale(8)}
                    color={isDarkMode ? colors.white : colors.charcoalGray}>
                    4.9 (Review)
                  </Text>
                </Box>
              </Box>
              <Box alignItems="center">
                <LottieView
                  ref={lottieRef}
                  source={require('../assets/lotties/loading2.json')}
                  // autoPlay
                  // loop
                  style={{
                    width: scale(80),
                    height: scale(80),
                  }}
                  resizeMode="contain"
                />
                <Text
                  fontFamily={'$poppinsMedium'}
                  fontSize={18}
                  color={isDarkMode ? colors.white : colors.charcoalGray}>
                  {formatTime(timeLeft)}
                </Text>
              </Box>
            </Box>
            <Box
              alignItems="flex-end"
              mb={moderateScale(10)}
              marginRight={moderateScale(10)} />
          </Box>
          <Box
            mt={scale(10)}
            flexDirection="row"
            justifyContent="space-between"
            marginHorizontal={scale(15)}>
            <Text
              fontFamily={'$poppinsRegular'}
              fontSize={18}
              lineHeight={30}
              color={isDarkMode ? colors.white : colors.charcoalGray}>
              Payment Method
            </Text>
            <Text
              fontFamily={'$poppinsMedium'}
              fontSize={25}
              lineHeight={30}
              color={isDarkMode ? colors.white : colors.charcoalGray}>
              {'\u20B9'}2000
            </Text>
          </Box>
          <Box
            flexDirection="row"
            marginHorizontal={scale(15)}
            mt={moderateScale(20)}>
            <TouchableOpacity
              // onPress={() => navigation.navigate(NavigationString.CallScreen)}
              onPress={handleCallDriver}>
              <Box
                borderRadius={moderateScale(100)}
                padding={scale(10)}
                justifyContent="center"
                alignItems="center"
                borderWidth={scale(1)}
                borderColor={colors.yellow}>
                <Image
                  source={Icons.Call}
                  style={{
                    tintColor: colors.yellow,
                    height: scale(25),
                    width: scale(25),
                  }}
                />
              </Box>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleChatDriver}>
              <Box
                borderRadius={moderateScale(100)}
                padding={scale(10)}
                justifyContent="center"
                alignItems="center"
                marginLeft={moderateScale(10)}
                borderWidth={scale(1)}
                borderColor={colors.yellow}>
                <Image
                  source={Icons.Message}
                  style={{
                    tintColor: colors.yellow,
                    height: scale(25),
                    width: scale(25),
                  }}
                />
              </Box>
            </TouchableOpacity>
            <Box
              flex={1}
              paddingLeft={scale(20)}
              alignItems="center"
              justifyContent="flex-end"
              flexDirection="row">
              {timeExpired && (
                <TouchableOpacity onPress={handleRetryBooking}>
                  <Box
                    borderRadius={moderateScale(5)}
                    padding={scale(10)}
                    justifyContent="flex-end"
                    alignItems="center"
                    backgroundColor={colors.yellow}
                    mr={moderateScale(10)}>
                    <Text style={{color: colors.white, fontSize: scale(15)}}>
                      Retry Booking
                    </Text>
                  </Box>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={handleCancelRide}>
                <Box
                  borderRadius={moderateScale(5)}
                  padding={scale(10)}
                  justifyContent="flex-end"
                  alignItems="center"
                  // marginLeft={moderateScale(10)}
                  backgroundColor={colors.yellow}
                  // ml={moderateScale(10)}
                >
                  <Text style={{color: colors.white, fontSize: scale(15)}}>
                    Cancel Ride
                  </Text>
                </Box>
              </TouchableOpacity>
            </Box>
          </Box>

          {showCancleAlert && (
            <Box padding={scale(16)}>
              <Dropdown
                style={[
                  styles.dropdown,
                  // genderError ? { borderColor: colors.error } : null
                ]}
                placeholderStyle={styles.placeholderStyle}
                selectedTextStyle={styles.selectedTextStyle}
                data={customerCancelRideReasons}
                labelField="label"
                valueField="value"
                placeholder={'Select Reason for Cancel Ride'}
                onChange={item => {
                  setSelectedCancelReason(item?.value);
                  Alert.alert(
                    'Confirm Cancellation',
                    `Are you sure you want to cancel the ride? Reason: ${item?.value}`,
                    [
                      {
                        text: 'Cancel',
                        onPress: () => setShowCancleAlert(false),
                        style: 'cancel',
                      },
                      {
                        text: 'OK',
                        onPress: () => handleRejectRide(),
                      },
                    ],
                  );
                }}
                renderRightIcon={() => (
                  <Icon as={ChevronDownIcon} size="lg" mr="$2" />
                )}
                selectedTextProps={{numberOfLines: 1}}
                renderItem={item => (
                  <Text
                    fontFamily="$poppinsMedium"
                    fontSize={14}
                    lineHeight={16}
                    color={colors.black}
                    numberOfLines={1}
                    style={{
                      paddingHorizontal: responsiveWidth(2.5),
                      paddingVertical: responsiveHeight(1.5),
                    }}>
                    {item?.label}
                  </Text>
                )}
                itemTextStyle={styles.selectedTextStyle}
                itemContainerStyle={styles.itemContainerStyle}
              />
            </Box>
          )}
        </Box>
      </Modal>
      <Pressable
        onPress={() => {
          toggleRideModal();
        }}
        position="absolute"
        bottom={50}
        // mb={moderateScaleVertical(175)}
        right={10}
        height={scale(60)}
        width={scale(60)}
        bgColor={colors.white}
        justifyContent="center"
        alignItems="center"
        borderRadius={scale(10)}>
        <MaterialIcons name="info" size={25} color={colors.borderColor} />
        <Text>Ride</Text>
      </Pressable>
      <Pressable
        onPress={() => {
          onCenter();
        }}
        position="absolute"
        height={scale(60)}
        width={scale(60)}
        bottom={50}
        // mb={moderateScaleVertical(175)}
        left={10}
        justifyContent="center"
        alignItems="center"
        borderRadius={scale(10)}
        bgColor={colors.white}
        mr={moderateScale(15)}>
        {/* <LocationTargetIcon /> */}
        <MaterialIcons
          name="my-location"
          size={25}
          color={colors.borderColor}
        />
        <Text>Center</Text>
      </Pressable>
    </Container>
  );
};

const styles = StyleSheet.create({
  modal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  modalContent: {
    width: '100%',
    paddingBottom: scale(20),
    borderTopLeftRadius: moderateScale(20),
    borderTopRightRadius: moderateScale(20),
  },
  lottie: {
    height: scale(80),
    width: scale(80),
    alignSelf: 'center',
  },
  dropdown: {
    borderRadius: moderateScale(6),
    height: moderateScale(50),
    paddingLeft: moderateScale(10),
    borderWidth: 1,
    borderColor: colors.silverGray,
  },
  placeholderStyle: {
    fontSize: textScale(14),
    fontFamily: 'Poppins-Medium',
    color: '#D0D0D0',
  },
  selectedTextStyle: {
    fontSize: textScale(14),
    lineHeight: textScale(16),
    fontFamily: 'Poppins-Medium',
    color: colors.black,
  },
  itemContainerStyle: {
    // borderBottomWidth: 1,
  },
});

export default RideWaiting;
