import {useEffect, useState} from 'react';
import {Alert, StyleSheet, Switch, TouchableOpacity} from 'react-native';
import {Box, Text, Toast, ToastTitle, useToast} from '@gluestack-ui/themed';
import {ParamListBase, useNavigation, useRoute} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {Container} from '../components/Container';
import {AppBar} from '../components/AppBar';
import {colors} from '../constants/colors';
import Body from '../components/Body/Body';
import {
  BetweenLineIcon,
  LocationMakerRedIcon,
  LocationMakerYellowIcon,
} from '../components/Icons';
import {
  moderateScale,
  moderateScaleVertical,
  scale,
} from '../utils/responsiveSize';
import InputText from '../components/TextInput/InputText';
import PrimaryButton from '../components/Button/PrimaryButton';
import {NavigationString} from '../navigation/navigationStrings';
import {BASE_URL, Instance} from '../api/Instance.ts';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useTheme} from '../constants/ThemeContext';
import {useSelector} from 'react-redux';
import {RootState} from '../store/reduxStore/store';
import {loadUserFromStorage} from '../store/slice/UserSlice';
import {
  CONFIRM_BOOKING,
  CREATE_FAVORITE_ADDRESS,
  BOOKING_CHARGES,
} from '../api/ApiEndpoints';
import moment from 'moment';
import {getCurrentLocationOnce} from '../utils/locationHelper';

const ConfirmBooking = () => {
  const {isDarkMode} = useTheme();
  const toast = useToast();
  const userData = useSelector((state: RootState) => state.user);
  const currentTime = moment().format('hh:mm A');
  const route = useRoute();
  const {vehicle}: any = route.params;
  const [priceDetails, setPriceDetails] = useState({
    baseAmount: 0,
    payablePrice: 0,
    discountValue: 0,
    discountType: '',
    promoApplied: false,
    message: '',
    promoCode: '',
  });
  const navigation = useNavigation<NativeStackNavigationProp<ParamListBase>>();
  const [userLocalData, setUserLocalData] = useState<any>(null);
  const [promoCode, setPromoCode] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [bookingData, setBookingData] = useState<any>(null);
  const [showFavoriteForm, setShowFavoriteForm] = useState(false);
  const [label, setLabel] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);
  const [favoriteAdded, setFavoriteAdded] = useState(false);
  const [calculatingPrice, setCalculatingPrice] = useState(false);
  // Calculate price whenever distance changes
  useEffect(() => {
    if (
      userData?.dropDetails?.distance ||
      userLocalData?.dropDetails?.distance
    ) {
      calculateBookingPrice();
    }
  }, [userData, userLocalData]);
  const calculateBookingPrice = async (promo: string = '') => {
    try {
      setCalculatingPrice(true);
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        showErrorToast('User not authenticated');
        return;
      }
      const payload = {
        rideType: vehicle?.type.toLowerCase(),
        promoCode: promo || '',
        distance:
          userData?.dropDistance ||
          userData?.dropDetails?.distance ||
          userLocalData?.dropDetails?.distance,
      };
      const response = await Instance.post(
        `${BASE_URL}${BOOKING_CHARGES.url}`,
        payload,
        {
          headers: {
            Authorization: token,
          },
        },
      );
      if (response.data.success) {
        setPriceDetails({
          baseAmount: response.data.baseAmount,
          payablePrice: response.data.payablePrice,
          discountValue: response.data.discountValue,
          discountType: response.data.discountType,
          promoApplied: response.data.promoApplied,
          message: response.data.message,
          promoCode: response.data.promoApplied ? promo : '',
        });

        if (response.data.promoApplied) {
          showSuccessToast(response.data.message);
        } else if (promo) {
          showErrorToast(response.data.message);
        }
      } else {
        setPriceDetails({
          baseAmount: response.data.baseAmount || 0,
          payablePrice: response.data.payablePrice || 0,
          discountValue: response.data.discountValue || 0,
          discountType: response.data.discountType || '',
          promoApplied: false,
          message: response.data.message,
          promoCode: '',
        });

        if (promo) {
          showErrorToast(response.data.message);
        }
      }
    } catch (error: any) {
      console.error(
        'Error calculating booking price:',
        error?.response?.data?.message || error.message,
      );
      showErrorToast(
        error?.response?.data?.message ||
          error.message ||
          'Failed to calculate booking price',
      );
      setPriceDetails({
        baseAmount: 0,
        payablePrice: 0,
        discountValue: 0,
        discountType: '',
        promoApplied: false,
        message: 'Failed to calculate booking price',
        promoCode: '',
      });
    } finally {
      setCalculatingPrice(false);
    }
  };

  const handleApplyPromoCode = async () => {
    if (!promoCode.trim()) {
      showErrorToast('Please enter a promo code');
      return;
    }
    await calculateBookingPrice(promoCode);
  };

  const handleRemovePromoCode = async () => {
    setPromoCode('');
    await calculateBookingPrice('');
  };
  const handleConfirmRide = async () => {
    try {
      const localData = await loadUserFromStorage();
      setUserLocalData(localData);
      setLoading(true);
      const locationData: any = await getCurrentLocationOnce();

      let latitude: number, longitude: number;

      // Debug: log what we received
      console.log('Location data:', locationData);
      console.log('userData pickupDetails:', userData?.pickupDetails);
      console.log('localData pickupDetails:', localData?.pickupDetails);

      if (locationData?.coordinates) {
        latitude = locationData.coordinates.latitude;
        longitude = locationData.coordinates.longitude;
      } else if (
        userData?.pickupDetails?.latitude &&
        userData?.pickupDetails?.longitude
      ) {
        latitude = userData.pickupDetails.latitude;
        longitude = userData.pickupDetails.longitude;
      } else if (
        localData?.pickupDetails?.latitude &&
        localData?.pickupDetails?.longitude
      ) {
        latitude = localData.pickupDetails.latitude;
        longitude = localData.pickupDetails.longitude;
      } else {
        showErrorToast(
          'Unable to get location. Please enable GPS and try again.',
        );
        return;
      }

      const bookingDatas = {
        currentLocation: {
          address: userData?.pickupDetails?.address,
          city: userData?.pickupDetails?.city,
          latitude: latitude,
          longitude: longitude,
        },
        lat: latitude,
        lng: longitude,
        destination: userData?.dropDetails?.address,
        rideType: vehicle?.type.toLowerCase(),
        vehicleId: vehicle._id,
        bookingDate: new Date().toISOString(),
        bookingTime: currentTime,
        promoCode: priceDetails.promoCode,
        distance:
          userData?.dropDistance ||
          userData?.dropDetails?.distance ||
          localData?.dropDetails?.distance,
        duration:
          localData?.dropDetails?.routeDurationinMinutes ||
          (() => {
            const dist = parseFloat(
              String(
                userData?.dropDistance ||
                  userData?.dropDetails?.distance ||
                  localData?.dropDetails?.distance ||
                  '0',
              ),
            );
            return dist > 0 ? Math.ceil((dist / 30) * 60) : undefined;
          })(),
        type: 'general',
        priceDetails: {
          baseAmount: priceDetails.baseAmount,
          discount: priceDetails.discountValue,
          payableAmount: priceDetails.payablePrice,
        },
      };
      setBookingData(bookingDatas);
      // Check if price is valid before proceeding
      if (priceDetails.baseAmount === 0 || priceDetails.payablePrice === 0) {
        showErrorToast('Invalid booking price. Please check your details.');
        return;
      }
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        showErrorToast('User not authenticated');
        return;
      }
      const response = await Instance.post(
        `${BASE_URL}${CONFIRM_BOOKING.url}`,
        bookingDatas,
        {
          headers: {
            Authorization: token,
          },
        },
      );
      if (response.data.success) {
        navigation.navigate(NavigationString.RideWaiting, {
          bookingData: response.data.data,
        });
      } else {
        showErrorToast(response.data.message || 'Booking failed');
      }
    } catch (error: any) {
      console.error(
        'Booking failed:',
        error?.response?.data?.message || error.message,
      );
      Alert.alert(
        'Error',
        error?.response?.data?.message ||
          'Something went wrong during booking. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };
  const loadUserLocalDatas = async () => {
    const localData = await loadUserFromStorage();
    setUserLocalData(localData);
  };
  const showErrorToast = (message: string) => {
    toast.show({
      placement: 'top',
      render: ({id}: any) => {
        return (
          <Toast nativeID={'toast-' + id} action="error" variant="accent">
            <ToastTitle>{message}</ToastTitle>
          </Toast>
        );
      },
    });
  };

  const showSuccessToast = (message: string) => {
    toast.show({
      placement: 'top',
      render: ({id}: any) => {
        return (
          <Toast nativeID={'toast-' + id} action="success" variant="accent">
            <ToastTitle>{message}</ToastTitle>
          </Toast>
        );
      },
    });
  };

  const handleAddFavorite = async () => {
    if (!label) {
      showErrorToast('Please enter a label for your favorite address');
      return;
    }

    try {
      setIsFavoriteLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        showErrorToast('User not authenticated');
        return;
      }

      if (!userData?.pickupDetails || !userData?.dropDetails) {
        showErrorToast('Location data is missing');
        return;
      }

      const favoriteData = {
        userId: userLocalData?._id,
        label: label,
        pickup: {
          address: userData.pickupDetails.address,
          coordinates: {
            lat: userData.pickupDetails.latitude,
            lng: userData.pickupDetails.longitude,
          },
        },
        destination: {
          address: userData.dropDetails.address,
          coordinates: {
            lat: userData.dropDetails.latitude,
            lng: userData.dropDetails.longitude,
          },
        },
        isDefault: isDefault,
      };

      const response = await Instance.post(
        `${BASE_URL}${CREATE_FAVORITE_ADDRESS.url}`,
        favoriteData,
        {
          headers: {
            Authorization: token,
          },
        },
      );

      if (response.status === 201) {
        showSuccessToast('Favorite location added successfully');
        setFavoriteAdded(true);
        setShowFavoriteForm(false);
      } else {
        showErrorToast('Failed to add favorite location');
      }
    } catch (error: any) {
      console.error('Error adding favorite:', error?.response?.data);
      showErrorToast(
        error.response?.data?.message || 'Failed to add favorite location',
      );
    } finally {
      setIsFavoriteLoading(false);
    }
  };

  useEffect(() => {
    loadUserLocalDatas();
  }, []);

  useEffect(() => {
    if (bookingData) {
      navigation.navigate(NavigationString.RideWaiting, {bookingData});
    }
  }, [bookingData]);

  return (
    <Container
      statusBarStyle={isDarkMode ? 'light-content' : 'dark-content'}
      statusBarBackgroundColor={isDarkMode ? '#000000' : '#ffffff'}
      backgroundColor={isDarkMode ? '#000000' : '#ffffff'}>
      <AppBar back title="Request for ride" isDarkMode={isDarkMode} />
      <Body>
        <Box
          mx={moderateScale(10)}
          mt={moderateScaleVertical(30)}
          mb={moderateScaleVertical(20)}>
          <Box flexDirection="row" alignItems="center" gap={moderateScale(5)}>
            <LocationMakerRedIcon style={{alignSelf: 'flex-start'}} />
            <Box flex={1} gap={moderateScaleVertical(5)}>
              <Box
                flexDirection="row"
                alignItems="center"
                justifyContent="space-between">
                <Text
                  fontFamily={'$poppinsMedium'}
                  fontSize={16}
                  lineHeight={18}
                  color={isDarkMode ? colors.white : colors.charcoalGray}
                  numberOfLines={1}>
                  Current Location
                </Text>
              </Box>
              <Text
                fontFamily={'$poppinsMedium'}
                fontSize={16}
                lineHeight={18}
                color={isDarkMode ? colors.white : colors.black}
                numberOfLines={1}>
                {userLocalData?.pickupDetails?.address}
              </Text>
            </Box>
          </Box>
          <BetweenLineIcon style={{marginLeft: moderateScale(11)}} />
          <Box flexDirection="row" alignItems="center" gap={moderateScale(5)}>
            <LocationMakerYellowIcon style={{alignSelf: 'flex-start'}} />
            <Box flex={1} gap={moderateScaleVertical(5)}>
              <Box
                flexDirection="row"
                alignItems="center"
                justifyContent="space-between">
                <Text
                  fontFamily={'$poppinsMedium'}
                  fontSize={16}
                  lineHeight={18}
                  color={isDarkMode ? colors.white : colors.charcoalGray}
                  numberOfLines={1}>
                  Destination Location
                </Text>
                <Text
                  fontFamily={'$poppinsMedium'}
                  fontSize={14}
                  lineHeight={16}
                  color={isDarkMode ? colors.white : colors.black}
                  numberOfLines={1}>
                  {userLocalData?.dropDetails?.distance}
                </Text>
              </Box>
              <Text
                fontFamily={'$poppinsRegular'}
                fontSize={12}
                lineHeight={14}
                color={isDarkMode ? colors.white : colors.black}
                numberOfLines={1}>
                {userData?.dropDetails?.address}
              </Text>
            </Box>
          </Box>
        </Box>

        <Box
          mx={moderateScale(15)}
          gap={moderateScaleVertical(15)}
          my={moderateScaleVertical(20)}>
          <Box flexDirection="row" alignItems="center" gap={moderateScale(10)}>
            <Box flex={1}>
              <InputText
                textInputProps={{
                  placeholder: 'Enter Promo Code',
                  value: promoCode,
                  onChangeText: text => setPromoCode(text.toUpperCase()),
                  editable: !priceDetails.promoApplied,
                }}
              />
            </Box>

            {priceDetails.promoApplied ? (
              <PrimaryButton
                buttonText="Remove"
                onPress={handleRemovePromoCode}
                backgroundColor={colors.error}
              />
            ) : (
              <PrimaryButton
                buttonText="Apply"
                onPress={handleApplyPromoCode}
                loading={calculatingPrice}
              />
            )}
          </Box>

          {/* Applied promo code display */}
          {priceDetails.promoApplied && (
            <Box
              flexDirection="row"
              alignItems="center"
              justifyContent="space-between"
              // backgroundColor={colors.Amber}
              padding={moderateScale(10)}
              borderRadius={moderateScale(5)}
              borderWidth={scale(1)}
              borderColor={colors.success}
              borderStyle="dashed">
              <Text fontSize={14} color={colors.success}>
                Promo code {priceDetails.promoCode} applied successfully!
              </Text>
              <TouchableOpacity onPress={handleRemovePromoCode}>
                <Text color={colors.error} fontWeight="bold">
                  X
                </Text>
              </TouchableOpacity>
            </Box>
          )}

          {/* Price calculation message */}
          {priceDetails.message && !priceDetails.promoApplied && promoCode && (
            <Text fontSize={14} color={colors.error}>
              {priceDetails.message}
            </Text>
          )}
        </Box>

        <Box mx={moderateScale(15)} gap={moderateScaleVertical(10)}>
          <Text
            fontFamily={'$poppinsMedium'}
            fontSize={16}
            lineHeight={18}
            color={colors.charcoalGray}
            numberOfLines={1}>
            Charge
          </Text>

          <Box
            flexDirection="row"
            alignItems="center"
            justifyContent="space-between">
            <Text
              fontFamily={'$poppinsRegular'}
              fontSize={14}
              lineHeight={16}
              color={isDarkMode ? colors.white : colors.dimGray}
              numberOfLines={1}>
              Base Fare
            </Text>
            <Text
              fontFamily={'$poppinsRegular'}
              fontSize={14}
              lineHeight={16}
              color={isDarkMode ? colors.white : colors.dimGray}
              numberOfLines={1}>
              {'\u20B9'}
              {priceDetails?.baseAmount?.toFixed(2)}
            </Text>
          </Box>

          {priceDetails.discountValue > 0 && (
            <Box
              flexDirection="row"
              alignItems="center"
              justifyContent="space-between">
              <Text
                fontFamily={'$poppinsRegular'}
                fontSize={14}
                lineHeight={16}
                color={isDarkMode ? colors.white : colors.dimGray}
                numberOfLines={1}>
                Discount
                {priceDetails.discountType === 'percentage' && (
                  <Text
                    fontFamily={'$poppinsRegular'}
                    fontSize={10}
                    lineHeight={16}
                    color={colors.dimGray}
                    numberOfLines={1}>
                    ({priceDetails.discountValue?.toFixed(2)}%)
                  </Text>
                )}
              </Text>
              <Text
                fontFamily={'$poppinsRegular'}
                fontSize={14}
                lineHeight={16}
                color={isDarkMode ? colors.white : colors.dimGray}
                numberOfLines={1}>
                -{'\u20B9'}
                {priceDetails.discountValue}
              </Text>
            </Box>
          )}

          <Box height={1} marginVertical={4}>
            <Box
              borderBottomWidth={1}
              borderBottomColor={isDarkMode ? colors.white : colors.dimGray}
              borderStyle="dashed"
            />
          </Box>
          <Box
            flexDirection="row"
            alignItems="center"
            justifyContent="space-between">
            <Text
              fontFamily={'$poppinsRegular'}
              fontSize={14}
              lineHeight={16}
              color={isDarkMode ? colors.white : colors.dimGray}
              numberOfLines={1}>
              Grand Total
            </Text>
            <Text
              fontFamily={'$poppinsRegular'}
              fontSize={14}
              lineHeight={16}
              color={isDarkMode ? colors.white : colors.dimGray}
              numberOfLines={1}>
              {'\u20B9'}
              {priceDetails?.payablePrice?.toFixed(2)}
            </Text>
          </Box>
        </Box>

        {/* Favorite Address Form */}
        {showFavoriteForm && (
          <Box
            mx={moderateScale(15)}
            mt={moderateScaleVertical(20)}
            gap={moderateScaleVertical(15)}>
            <InputText
              textInputProps={{
                placeholder: 'Enter label (e.g., Home, Work)',
                value: label,
                onChangeText: setLabel,
              }}
            />
            <Box
              flexDirection="row"
              alignItems="center"
              justifyContent="space-between">
              <Text
                fontFamily={'$poppinsMedium'}
                fontSize={14}
                color={isDarkMode ? colors.white : colors.charcoalGray}>
                Set as default address
              </Text>
              <Switch
                value={isDefault}
                onValueChange={setIsDefault}
                trackColor={{true: colors.primary, false: colors.gray5}}
              />
            </Box>
            <PrimaryButton
              buttonText={isFavoriteLoading ? 'Saving...' : 'Save Favorite'}
              onPress={handleAddFavorite}
              loading={isFavoriteLoading}
            />
          </Box>
        )}
      </Body>

      {!userData?.destinationByFavorite &&
        !favoriteAdded &&
        !showFavoriteForm && (
          <PrimaryButton
            buttonText="Add to favorite address"
            onPress={() => setShowFavoriteForm(true)}
            marginHorizontal={moderateScale(15)}
            marginBottom={moderateScaleVertical(10)}
          />
        )}
      <PrimaryButton
        buttonText={loading ? 'Processing...' : 'Confirm Ride'}
        onPress={handleConfirmRide}
        loading={loading}
        marginHorizontal={moderateScale(15)}
        marginVertical={moderateScaleVertical(20)}
        disabled={priceDetails.baseAmount === 0 || calculatingPrice}
      />
    </Container>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    width: '80%',
  },
  successIcon: {
    width: 60,
    height: 60,
    marginBottom: 15,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  successMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
});

export default ConfirmBooking;
