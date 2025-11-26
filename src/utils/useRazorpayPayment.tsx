import { useState } from 'react';
import RazorpayCheckout from 'react-native-razorpay';
import { useToast, Toast, ToastTitle } from '@gluestack-ui/themed';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ParamListBase } from '@react-navigation/native';
import { useTheme } from '../constants/ThemeContext';
import { colors } from '../constants/colors';

type PaymentOptions = {
  amount: string;
  description: string;
  prefill?: {
    email?: string;
    contact?: string;
    name?: string;
  };
  currency?: string;
  image?: string;
  key?: string;
  name?: string;
  orderId?: string;
};

type PaymentResult = {
  success: boolean;
  data?: any;
  error?: any;
};

const useRazorpayPayment = () => {
  const toast = useToast();
  const { isDarkMode } = useTheme();
  const [isProcessing, setIsProcessing] = useState(false);

  const showErrorToast = (message: string) => {
    toast.show({
      placement: 'top',
      render: ({ id }: any) => {
        return (
          <Toast nativeID={'toast-' + id} action="error" variant="accent">
            <ToastTitle>{message}</ToastTitle>
          </Toast>
        );
      },
    });
  };

  const initiatePayment = async (
    options: PaymentOptions,
    onSuccess?: (data: any) => void,
    onFailure?: (error: any) => void
  ): Promise<PaymentResult> => {
    setIsProcessing(true);
    
    const paymentOptions: any = {
      description: options.description,
      image: options.image || 'https://your-logo-url.png',
      currency: options.currency || 'INR',
      key: options.key || 'rzp_test_cEnvzyHa9o3Izi', // Default test key
      amount: String(Number(options.amount) * 100), // Convert to paise
      name: options.name || 'Cab App',
      order_id: options.orderId,
      prefill: {
        email: options.prefill?.email || 'user@example.com',
        contact: options.prefill?.contact || '9876543210',
        name: options.prefill?.name || 'User Name',
      },
      theme: { color: isDarkMode ? colors.themePrimary : colors.themePrimary },
    };

    try {
      const data = await RazorpayCheckout.open(paymentOptions);
      console.log(`Payment Success: ${JSON.stringify(data)}`);
      
      if (onSuccess) {
        onSuccess(data);
      }
      
      setIsProcessing(false);
      return { success: true, data };
    } catch (error: any) {
      console.log('Payment Error:', error);
      let errorMessage = 'Payment failed';

      if (error.code === 0) {
        errorMessage = 'Payment cancelled by user';
      } else if (error.code === 1) {
        errorMessage = 'Network error occurred';
      } else if (error.description) {
        errorMessage = error.description;
      }

      showErrorToast(errorMessage);
      
      if (onFailure) {
        onFailure(error);
      }
      
      setIsProcessing(false);
      return { success: false, error };
    }
  };

  return { initiatePayment, isProcessing };
};

export default useRazorpayPayment;