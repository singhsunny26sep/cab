import {useEffect, useState} from 'react';
import {Box, CloseIcon, Icon, Pressable, Text} from '@gluestack-ui/themed';
import {ActivityIndicator} from 'react-native';
import {ParamListBase, useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import Modal from 'react-native-modal';
import LottieView from 'lottie-react-native';

import {Container} from '../components/Container';
import {AppBar} from '../components/AppBar';
import {colors} from '../constants/colors';
import InputText from '../components/TextInput/InputText';
import {
  moderateScale,
  moderateScaleVertical,
  scale,
} from '../utils/responsiveSize';
import PrimaryButton from '../components/Button/PrimaryButton';
import {NavigationString} from '../navigation/navigationStrings';
import {useTheme} from '../constants/ThemeContext';
import useRazorpayPayment from '../utils/useRazorpayPayment';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Instance} from '../api/Instance.ts';
import {loadUserFromStorage, saveUserToStorage} from '../store/slice/UserSlice';
import {
  CREATE_PAYMENT_HISTORY,
  VERIFY_PAYMENT_HISTORY,
} from '../api/ApiEndpoints';

const AddMoney = () => {
  // Hooks and navigation
  const navigation = useNavigation<NativeStackNavigationProp<ParamListBase>>();
  const {isDarkMode} = useTheme();
  const {initiatePayment, isProcessing} = useRazorpayPayment();

  // State
  const [amount, setAmount] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [userLocalData, setUserLocalData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [verificationLoading, setVerificationLoading] = useState(false);

  useEffect(() => {
    const loadUserLocalDatas = async () => {
      try {
        setLoading(true);
        const localData = await loadUserFromStorage();
        setUserLocalData(localData);
      } catch (error) {
        console.error('Failed to load user data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserLocalDatas();
  }, []);

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    setAmount(''); // Reset amount only when modal is closed
  };

  const handleCreatePayment = async () => {
    try {
      setPaymentLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        setPaymentLoading(false);
        return;
      }
      const response = await Instance.post(
        CREATE_PAYMENT_HISTORY.url,
        {
          amount: amount,
          status: 'created',
          isForWallet: true,
        },
        {
          headers: {
            Authorization: token,
          },
        },
      );
      console.log('response for create payement -> ', response.data);
      if (response.status === 200) {
        await handleInitiatePayment(response.data.orderId);
      }
    } catch (error: any) {
      console.log('error for create payment - ', error?.response?.data);
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleVerifyPayment = async (razorpay_response: any) => {
    try {
      setVerificationLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        setVerificationLoading(false);
        return;
      }
      const response = await Instance.post(
        VERIFY_PAYMENT_HISTORY.url,
        {
          razorpayOrderId: razorpay_response?.razorpay_order_id,
          razorpayPaymentId: razorpay_response?.razorpay_payment_id,
          razorpaySignature: razorpay_response?.razorpay_signature,
        },
        {
          headers: {
            Authorization: token,
          },
        },
      );
      console.log('response for verify the payement -> ', response.data);
      if (response.status === 200) {
        await saveUserWalletMoneyToLocal();
        setShowSuccessModal(true);
      }
    } catch (error: any) {
      console.log('error for verify payment - ', error?.response?.data);
    } finally {
      setVerificationLoading(false);
    }
  };

  const saveUserWalletMoneyToLocal = async () => {
    const updatedUserData: any = {
      ...userLocalData,
      walletBalance: amount,
    };
    await saveUserToStorage(updatedUserData);
  };

  const handleInitiatePayment = async (orderId: any) => {
    if (!amount) {
      setPaymentLoading(false);
      return;
    }

    const result = await initiatePayment({
      amount,
      orderId,
      description: 'Adding money to wallet',
      prefill: {
        email: userLocalData?.profileData?.email,
        contact: userLocalData?.profileData?.mobileNumber
          ? userLocalData?.profileData?.mobileNumber
          : '9876543210',
        name: userLocalData?.profileData?.name,
      },
    });

    if (result.success) {
      console.log('Payment result at add money:', result);
      console.log('Payment result data at add money:', result.data);
      await handleVerifyPayment(result.data);
    } else {
      console.log('Payment failed:', result.error);
    }
  };

  if (loading) {
    return (
      <Container
        statusBarStyle={isDarkMode ? 'light-content' : 'dark-content'}
        statusBarBackgroundColor={isDarkMode ? colors.black : colors.white}>
        <AppBar back title="Add Money" />
        <Box flex={1} justifyContent="center" alignItems="center">
          <ActivityIndicator size="large" color={colors.themePrimary} />
        </Box>
      </Container>
    );
  }

  return (
    <Container
      statusBarStyle={isDarkMode ? 'light-content' : 'dark-content'}
      statusBarBackgroundColor={isDarkMode ? colors.black : colors.white}>
      <AppBar back title="Add Money" />

      <Box flex={1} mx={moderateScale(15)} mt={moderateScaleVertical(15)}>
        <InputText
          textInputProps={{
            placeholder: 'Enter Amount',
            value: amount,
            onChangeText: setAmount,
            keyboardType: 'numeric',
          }}
        />

        {paymentLoading || verificationLoading ? (
          <Box
            flex={1}
            justifyContent="center"
            mt={moderateScaleVertical(30)}
            alignItems="center">
            <ActivityIndicator size="large" color={colors.themePrimary} />
          </Box>
        ) : (
          <PrimaryButton
            onPress={handleCreatePayment}
            buttonText="Confirm"
            marginTop={moderateScaleVertical(30)}
            loading={isProcessing || paymentLoading || verificationLoading}
            disabled={
              !amount || isProcessing || paymentLoading || verificationLoading
            }
          />
        )}
      </Box>

      {/* Success Modal */}
      <Modal
        isVisible={showSuccessModal}
        onBackdropPress={handleCloseSuccessModal}
        backdropOpacity={0.5}
        animationIn="zoomIn"
        animationOut="zoomOut"
        animationInTiming={300}
        animationOutTiming={300}>
        <Box
          backgroundColor={isDarkMode ? colors.black : colors.white}
          borderRadius={moderateScale(10)}
          justifyContent="center">
          <Box
            alignItems="center"
            justifyContent="center"
            gap={moderateScaleVertical(20)}>
            <Pressable
              onPress={handleCloseSuccessModal}
              alignSelf="flex-end"
              mr={moderateScale(20)}
              mt={moderateScaleVertical(20)}>
              <Icon
                as={CloseIcon}
                w="$4"
                h="$4"
                color={isDarkMode ? colors.black : colors.charcoalGray}
              />
            </Pressable>

            <LottieView
              source={require('../assets/lotties/thankss.json')}
              autoPlay
              loop={true}
              style={{
                width: moderateScale(150),
                height: moderateScale(150),
              }}
            />

            <Box
              alignItems="center"
              justifyContent="center"
              gap={moderateScaleVertical(10)}>
              <Text
                fontFamily={'$poppinsMedium'}
                fontSize={20}
                lineHeight={22}
                color={isDarkMode ? colors.black : colors.charcoalGray}
                numberOfLines={1}>
                Payment Successful
              </Text>
              <Text
                fontFamily={'$poppinsMedium'}
                fontSize={12}
                lineHeight={14}
                color={isDarkMode ? colors.black : colors.charcoalGray}
                numberOfLines={2}
                textAlign="center">
                Your money has been added successfully
              </Text>
            </Box>

            <Box gap={moderateScaleVertical(5)}>
              <Text
                fontFamily={'$poppinsMedium'}
                fontSize={12}
                lineHeight={14}
                color={isDarkMode ? colors.black : colors.dimGray}
                numberOfLines={2}
                textAlign="center">
                Amount
              </Text>
              <Text
                fontFamily={'$poppinsRegular'}
                fontSize={34}
                lineHeight={38}
                color={isDarkMode ? colors.black : colors.charcoalGray}
                numberOfLines={2}
                textAlign="center">
                {'\u20B9'}
                {amount}
              </Text>
            </Box>
          </Box>

          <PrimaryButton
            buttonText="Back To Home"
onPress={() => {
               handleCloseSuccessModal();
               navigation?.popToTop();
             }}
            marginHorizontal={moderateScale(15)}
            marginVertical={moderateScaleVertical(20)}
          />
        </Box>
      </Modal>
    </Container>
  );
};

export default AddMoney;
