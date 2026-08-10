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
  console.log('booking Data at ride waitin -----------------------> ', bookingData);

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

  const [timeLeft, setTimeLeft] = useState(120);
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
    setUserToken(userToken);
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
    if (!userLocalData?.token) {
      return;
    }
    const initializeSocket = async () => {
      try {
        if (socketServices.isConnected()) {
          setSocketInitialized(true);
          return;
        }
        await socketServices.initializeSocket(userLocalData.token);
        setSocketInitialized(true);
      } catch (error) {
        console.error('Socket initialization failed:', error);
      }
    };
    initializeSocket();
    return () => {
      setSocketInitialized(false);
    };
  }, [userLocalData?.token]);

  useEffect(() => {
    if (!socketInitialized) {return;}

    console.log('bookingData passed in socketttttttttttttt at ride waiting', bookingData);
    socketServices.emit('booking', bookingData);

    const bookingResponseHandler = (bookingResponse: any) => {
      console.log('bookingResponse =================>>>>', JSON.stringify(bookingResponse));
      setBookingResponseData(bookingResponse);
    };

    const driverBookingResponseHandler = (response: any) => {
      const firstRide = response?.data;
      console.log('Booking response received at ride waiting--------------------->>>>>:', firstRide);

      if (firstRide?.bookingStatus === 'ongoing') {
        setBookingResponseData(firstRide);
        setTimerActive(false);
        lottieRef.current?.pause();
        handleCloseModal();

        navigation.navigate(NavigationString.Home, {
          ongoingRide: firstRide,
        });
      }
      else if (firstRide?.bookingStatus === 'cancelled') {
        setBookingResponseData(firstRide);
        setTimerActive(false);
        setTimeExpired(true);
        lottieRef.current?.pause();
        navigation.navigate(NavigationString.Home, {
          ongoingRide: firstRide,
        });
        toast.show({
          placement: 'top',
          render: ({id}) => (
            <Toast nativeID={`toast-${id}`} variant="accent" action="error">
              <ToastTitle>Ride Cancelled</ToastTitle>
            </Toast>
          ),
        });
      }
    };

    socketServices.on('booking-response', bookingResponseHandler);
    socketServices.emit('onGoing_booking', {});
    socketServices.on('driver_booking_response', driverBookingResponseHandler);

    return () => {
      socketServices?.removeListener('booking-response', bookingResponseHandler);
      socketServices?.removeListener('driver_booking_response', driverBookingResponseHandler);
    };
  }, [socketInitialized, navigation, toast, bookingData]);

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

  const handleCancelRide = () => {
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
      console.error('Error updating status for cancel in Waiting:', JSON.stringify(error));
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

      if (response.status === 200 && response.data) {
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

  // ============================================================
  //  ✨ 渲染 UI（已升级 + 距离修复 + 头像安全）
  // ============================================================
  return (
    <Container
      statusBarStyle={isDarkMode ? 'light-content' : 'dark-content'}
      statusBarBackgroundColor={isDarkMode ? '#000000' : '#ffffff'}
      backgroundColor={isDarkMode ? '#000000' : '#ffffff'}>

      {/* 地图 */}
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

      {/* 地图控制按钮（中心定位） */}
      <Pressable
        onPress={onCenter}
        position="absolute"
        bottom={50}
        left={10}
        height={scale(60)}
        width={scale(60)}
        justifyContent="center"
        alignItems="center"
        borderRadius={scale(10)}
        bgColor={isDarkMode ? '#1E293B' : '#FFFFFF'}
        style={{
          shadowColor: '#000',
          shadowOffset: {width: 0, height: 2},
          shadowOpacity: 0.2,
          shadowRadius: 4,
          elevation: 4,
        }}>
        <MaterialIcons
          name="my-location"
          size={25}
          color={isDarkMode ? '#94A3B8' : colors.borderColor}
        />
        <Text fontSize={10} color={isDarkMode ? '#94A3B8' : '#666'}>Center</Text>
      </Pressable>

      {/* 右侧 Ride info 按钮 */}
      <Pressable
        onPress={toggleRideModal}
        position="absolute"
        bottom={50}
        right={10}
        height={scale(60)}
        width={scale(60)}
        justifyContent="center"
        alignItems="center"
        borderRadius={scale(10)}
        bgColor={isDarkMode ? '#1E293B' : '#FFFFFF'}
        style={{
          shadowColor: '#000',
          shadowOffset: {width: 0, height: 2},
          shadowOpacity: 0.2,
          shadowRadius: 4,
          elevation: 4,
        }}>
        <MaterialIcons name="info" size={25} color={isDarkMode ? '#94A3B8' : colors.borderColor} />
        <Text fontSize={10} color={isDarkMode ? '#94A3B8' : '#666'}>Ride</Text>
      </Pressable>

      {/* ========== 模态框 ========== */}
      <Modal
        isVisible={modalVisible}
        onBackdropPress={handleCloseModal}
        onBackButtonPress={handleCloseModal}
        style={styles.modal}
        backdropOpacity={0.3}
        swipeDirection={['down']}
        onSwipeComplete={handleCloseModal}
        animationIn="slideInUp"
        animationOut="slideOutDown"
        backdropTransitionInTiming={500}
        backdropTransitionOutTiming={500}
        hideModalContentWhileAnimating={true}>
        <Box
          style={[
            styles.modalContent,
            {
              backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
              borderTopLeftRadius: moderateScale(24),
              borderTopRightRadius: moderateScale(24),
            },
          ]}>

          {/* 顶栏 – 状态 + 关闭 */}
          <Box
            flexDirection="row"
            justifyContent="space-between"
            alignItems="center"
            px={scale(16)}
            pt={scale(16)}
            pb={scale(8)}>
            <Text
              fontFamily="$poppinsMedium"
              fontSize={16}
              color={timeExpired ? '#FF3B30' : (isDarkMode ? '#E2E8F0' : '#1E293B')}>
              {timeExpired ? 'Driver not responding' : 'Waiting for driver...'}
            </Text>
            <Pressable onPress={handleCloseModal}>
              <CloseIcon color={isDarkMode ? '#94A3B8' : '#1E293B'} />
            </Pressable>
          </Box>

          {/* 司机信息 + 计时器 */}
          <Box
            flexDirection="row"
            alignItems="center"
            px={scale(16)}
            py={scale(12)}
            borderBottomWidth={1}
            borderBottomColor={isDarkMode ? '#334155' : '#E2E8F0'}>
            <View style={{
              width: scale(48),
              height: scale(48),
              borderRadius: moderateScale(24),
              overflow: 'hidden',
              marginRight: moderateScale(12),
              borderWidth: 1,
              borderColor: isDarkMode ? '#334155' : '#E2E8F0',
            }}>
              <Image
                source={{
                  uri: (bookingResponseData?.driverInfo?.profileImgUrl || '')
                    .replace(/^http:/, 'https:') ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(bookingResponseData?.driverInfo?.name?.[0] || 'U')}&background=5B6BF0&color=fff&size=80&bold=true`,
                }}
                style={{
                  width: scale(48),
                  height: scale(48),
                  borderRadius: moderateScale(24),
                }}
                onError={(e) => {
                  e.target.source = { uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(bookingResponseData?.driverInfo?.name?.[0] || 'U')}&background=94A3B8&color=fff&size=80` };
                }}
              />
            </View>
            <Box flex={1}>
              <Text
                fontFamily="$poppinsSemiBold"
                fontSize={18}
                color={isDarkMode ? '#F1F5F9' : '#1E293B'}>
                {bookingResponseData?.driverInfo?.name || 'Driver'}
              </Text>
              <Box flexDirection="row" alignItems="center" mt={2}>
                <LocationMakerRedIcon />
                <Text
                  ml={4}
                  fontFamily="$poppinsRegular"
                  fontSize={14}
                  color={isDarkMode ? '#94A3B8' : '#475569'}>
                  {/* ✅ 修复：优先使用 bookingData 中的距离 */}
                  {bookingData?.destination?.distance
                    ? `${parseFloat(bookingData.destination.distance).toFixed(2)} km`
                    : bookingResponseData?.data?.distance?.toFixed(2) || '0 km'}
                </Text>
                <Box ml={12} flexDirection="row" alignItems="center">
                  <ReviewStarIcon />
                  <Text
                    ml={4}
                    fontFamily="$poppinsRegular"
                    fontSize={14}
                    color={isDarkMode ? '#94A3B8' : '#475569'}>
                    4.9
                  </Text>
                </Box>
              </Box>
            </Box>
            <Box alignItems="center">
              <LottieView
                ref={lottieRef}
                source={require('../assets/lotties/loading2.json')}
                style={{ width: scale(44), height: scale(44) }}
                resizeMode="contain"
              />
              <Text
                fontFamily="$poppinsBold"
                fontSize={18}
                color={isDarkMode ? '#F1F5F9' : '#1E293B'}>
                {formatTime(timeLeft)}
              </Text>
            </Box>
          </Box>

          {/* 支付方式 */}
          <Box
            flexDirection="row"
            justifyContent="space-between"
            px={scale(16)}
            py={scale(8)}
            borderBottomWidth={1}
            borderBottomColor={isDarkMode ? '#334155' : '#E2E8F0'}>
            <Text
              fontFamily="$poppinsRegular"
              fontSize={14}
              color={isDarkMode ? '#94A3B8' : '#475569'}>
              Payment
            </Text>
            <Text
              fontFamily="$poppinsMedium"
              fontSize={16}
              color={isDarkMode ? '#F1F5F9' : '#1E293B'}>
              ₹{bookingData?.priceDetails?.payableAmount || 0}
            </Text>
          </Box>

          {/* 操作按钮 */}
          <Box
            flexDirection="row"
            justifyContent="space-around"
            alignItems="center"
            px={scale(16)}
            py={scale(12)}>
            <TouchableOpacity onPress={handleCallDriver} style={styles.actionButton}>
              <Image
                source={Icons.Call}
                style={{ tintColor: colors.yellow, height: scale(24), width: scale(24) }}
              />
              <Text fontSize={12} color={isDarkMode ? '#94A3B8' : '#475569'} ml={4}>Call</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleChatDriver} style={styles.actionButton}>
              <Image
                source={Icons.Message}
                style={{ tintColor: colors.yellow, height: scale(24), width: scale(24) }}
              />
              <Text fontSize={12} color={isDarkMode ? '#94A3B8' : '#475569'} ml={4}>Chat</Text>
            </TouchableOpacity>

            {timeExpired ? (
              <TouchableOpacity onPress={handleRetryBooking} style={[styles.actionButton, { backgroundColor: colors.yellow, paddingHorizontal: 16, borderRadius: 20 }]}>
                <Text fontFamily="$poppinsSemiBold" fontSize={14} color="#FFFFFF">Retry</Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity onPress={handleCancelRide} style={[styles.actionButton, { backgroundColor: '#FF3B30', paddingHorizontal: 16, borderRadius: 20 }]}>
              <Text fontFamily="$poppinsSemiBold" fontSize={14} color="#FFFFFF">Cancel</Text>
            </TouchableOpacity>
          </Box>

          {/* 取消原因下拉（条件显示） */}
          {showCancleAlert && (
            <Box px={scale(16)} pb={scale(12)}>
              <Dropdown
                style={[styles.dropdown, { borderColor: isDarkMode ? '#334155' : '#E2E8F0' }]}
                placeholderStyle={styles.placeholderStyle}
                selectedTextStyle={[
                  styles.selectedTextStyle,
                  { color: isDarkMode ? '#F1F5F9' : '#1E293B' },
                ]}
                data={customerCancelRideReasons}
                labelField="label"
                valueField="value"
                placeholder="Select reason for cancellation"
                onChange={item => {
                  setSelectedCancelReason(item?.value);
                  Alert.alert(
                    'Confirm Cancellation',
                    `Are you sure you want to cancel the ride? Reason: ${item?.value}`,
                    [
                      { text: 'Cancel', onPress: () => setShowCancleAlert(false), style: 'cancel' },
                      { text: 'OK', onPress: () => handleRejectRide() },
                    ],
                  );
                }}
                renderRightIcon={() => (
                  <Icon as={ChevronDownIcon} size="lg" mr="$2" />
                )}
                selectedTextProps={{ numberOfLines: 1 }}
                renderItem={item => (
                  <Text
                    fontFamily="$poppinsMedium"
                    fontSize={14}
                    lineHeight={16}
                    color={isDarkMode ? '#F1F5F9' : '#1E293B'}
                    style={{
                      paddingHorizontal: responsiveWidth(2.5),
                      paddingVertical: responsiveHeight(1.5),
                    }}>
                    {item?.label}
                  </Text>
                )}
                itemTextStyle={[styles.selectedTextStyle, { color: isDarkMode ? '#F1F5F9' : '#1E293B' }]}
                itemContainerStyle={styles.itemContainerStyle}
              />
            </Box>
          )}
        </Box>
      </Modal>
    </Container>
  );
};

// ============================================================
// 📐 样式
// ============================================================
const styles = StyleSheet.create({
  modal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  modalContent: {
    width: '100%',
    paddingBottom: scale(20),
    borderTopLeftRadius: moderateScale(24),
    borderTopRightRadius: moderateScale(24),
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -4},
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: moderateScale(8),
    paddingHorizontal: moderateScale(12),
    borderRadius: moderateScale(20),
    backgroundColor: 'transparent',
  },
  dropdown: {
    borderRadius: moderateScale(8),
    height: moderateScale(48),
    paddingLeft: moderateScale(12),
    borderWidth: 1,
  },
  placeholderStyle: {
    fontSize: textScale(14),
    fontFamily: 'Poppins-Medium',
    color: '#94A3B8',
  },
  selectedTextStyle: {
    fontSize: textScale(14),
    lineHeight: textScale(16),
    fontFamily: 'Poppins-Medium',
  },
  itemContainerStyle: {
    borderBottomWidth: 0,
  },
});

export default RideWaiting;
