import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import LottieView from 'lottie-react-native';
import Modal from 'react-native-modal';
import {moderateScale, textScale} from '../utils/responsiveSize';
import {colors} from '../constants/colors';
import {useTheme} from '../constants/ThemeContext';
import axios from 'axios';
import {useSelector} from 'react-redux';
import {RootState} from '../store/reduxStore/store';
import {BASE_URL} from '../api/Instance.ts';
import PrimaryButton from '../components/Button/PrimaryButton';
import useRazorpayPayment from '../utils/useRazorpayPayment';
import { loadUserFromStorage, saveUserToStorage } from '../store/slice/UserSlice';

interface PaymentBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  rideData: any;
  onPaymentSuccess: () => void;
}

const CustomPaymentBottomSheet: React.FC<PaymentBottomSheetProps> = ({
  visible,
  onClose,
  rideData,
  onPaymentSuccess,
}) => {
  const {isDarkMode} = useTheme();
  const {initiatePayment, isProcessing} = useRazorpayPayment();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<
    'cash' | 'wallet' | 'external' | null
  >(null);
  const [userLocalData, setUserLocalData] = useState<any>(null);
  const userData = useSelector((state: RootState) => state.user);

  useEffect(() => {
    const initUserData = async () => {
      const userLocalData = await loadUserFromStorage();
      setUserLocalData(userLocalData);
      // console.log("current local data ---------------------", currentUserData);
    };
    initUserData();
  }, []);

  // API 1: Pay through wallet
  const handleWalletPayment = async () => {
    try {
      setLoading(true);
      setPaymentMethod('wallet');
      const response = await axios.post(
        `${BASE_URL}/api/wallet/wallet/pay`,
        {
          amount: rideData?.fareAmount || 0,
          purpose: 'Ride payment',
        },
        {
          headers: {
            Authorization: `Bearer ${userData.token}`,
          },
        },
      );

      if (response.data.success) {
        onPaymentSuccess();
      }
    } catch (error) {
      console.error('Wallet payment error:', error);
    } finally {
      setLoading(false);
    }
  };

  // API 2: Create order for external payment
  const createRazorpayOrder = async () => {
    try {
      setLoading(true);
      setPaymentMethod('external');
      const response = await axios.post(
        `${BASE_URL}/api/wallet/driver/create-order`,
        {
          amount: rideData?.fareAmount || 0,
        },
        {
          headers: {
            Authorization: `Bearer ${userData.token}`,
          },
        },
      );

      if (response.data.orderId) {
        return response.data.orderId;
      }
      return null;
    } catch (error) {
      console.error('Create order error:', error);
      return null;
    }
  };

  // API 3: Verify external payment
  const verifyRazorpayPayment = async (razorpayResponse: any) => {
    try {
      const response = await axios.post(
        `${BASE_URL}/api/wallet/driver/verify-payment`,
        {
          razorpayOrderId: razorpayResponse.razorpay_order_id,
          razorpayPaymentId: razorpayResponse.razorpay_payment_id,
          razorpaySignature: razorpayResponse.razorpay_signature,
        },
        {
          headers: {
            Authorization: `Bearer ${userData.token}`,
          },
        },
      );

      return response.data.success;
    } catch (error) {
      console.error('Verify payment error:', error);
      return false;
    }
  };

  const handleExternalPayment = async () => {
    try {
      const orderId = await createRazorpayOrder();
      if (!orderId) return;

      const result = await initiatePayment({
        amount: rideData?.fareAmount.toString() || '0',
        orderId,
        description: 'Ride payment',
        prefill: {
          email: userData.profileData?.email || '',
          contact: userData.profileData?.mobileNumber || '',
          name: userData.profileData?.name || '',
        },
      });

      if (result.success) {
        const verificationSuccess = await verifyRazorpayPayment(result.data);
        if (verificationSuccess) {
          onPaymentSuccess();
        }
      }
    } catch (error) {
      console.error('External payment error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCashPayment = () => {
    setPaymentMethod('cash');
    onPaymentSuccess();
  };

  const renderContent = () => (
    <View style={styles.content}>
      <LottieView
        source={require('../assets/lotties/thankss.json')}
        autoPlay
        loop={true}
        style={styles.lottie}
      />

      <Text style={[styles.title, isDarkMode && styles.darkText]}>
        Ride Completed!
      </Text>

      <View style={styles.detailsContainer}>
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, isDarkMode && styles.darkText]}>
            Distance:
          </Text>
          <Text style={[styles.detailValue, isDarkMode && styles.darkText]}>
            {rideData?.distance?.toFixed(2) || '0'} km
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, isDarkMode && styles.darkText]}>
            Duration:
          </Text>
          <Text style={[styles.detailValue, isDarkMode && styles.darkText]}>
            {rideData?.duration || '0'} min
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, isDarkMode && styles.darkText]}>
            Fare:
          </Text>
          <Text style={[styles.detailValue, isDarkMode && styles.darkText]}>
            ₹{rideData?.fareAmount || '0'}
          </Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.themePrimary} />
      ) : (
        <>
          <PrimaryButton
            buttonText="Pay with Cash"
            onPress={handleCashPayment}
            marginVertical={moderateScale(5)}
            backgroundColor={colors.green}
          />

          <PrimaryButton
            buttonText="Pay with Wallet"
            onPress={handleWalletPayment}
            marginVertical={moderateScale(5)}
            disabled={userLocalData?.walletBalance < (rideData?.fareAmount || 0)}
          />

          <PrimaryButton
            buttonText="Pay Externally"
            onPress={handleExternalPayment}
            marginVertical={moderateScale(5)}
            backgroundColor={colors.Purple}
            loading={isProcessing}
            disabled={isProcessing}
          />
        </>
      )}
    </View>
  );

  return (
    <Modal
      isVisible={visible}
      onBackdropPress={onClose}
      onBackButtonPress={onClose}
      onSwipeComplete={onClose}
      swipeDirection={['down']}
      style={styles.modal}
      backdropOpacity={0.5}
      backdropTransitionOutTiming={0}
      hideModalContentWhileAnimating={true}
      useNativeDriverForBackdrop={true}
      useNativeDriver={true}
      statusBarTranslucent={true}
      animationIn="slideInUp"
      animationOut="slideOutDown"
      animationInTiming={400}
      animationOutTiming={400}>
      <View
        style={[
          styles.modalContent,
          isDarkMode && {backgroundColor: colors.black},
        ]}>
        {renderContent()}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: moderateScale(20),
    borderTopRightRadius: moderateScale(20),
    padding: moderateScale(20),
    paddingBottom: moderateScale(30),
    maxHeight: '80%',
  },
  content: {
    alignItems: 'center',
  },
  lottie: {
    width: moderateScale(150),
    height: moderateScale(150),
  },
  title: {
    fontSize: textScale(20),
    fontWeight: 'bold',
    marginVertical: moderateScale(10),
    color: colors.black,
  },
  detailsContainer: {
    width: '100%',
    marginVertical: moderateScale(15),
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: moderateScale(8),
  },
  detailLabel: {
    fontSize: textScale(16),
    color: colors.black,
  },
  detailValue: {
    fontSize: textScale(16),
    fontWeight: 'bold',
    color: colors.black,
  },
  darkText: {
    color: colors.white,
  },
});

export default CustomPaymentBottomSheet;
