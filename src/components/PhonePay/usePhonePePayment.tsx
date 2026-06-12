import React, { useState } from 'react';
import { Alert } from 'react-native';
import PhonePe from 'react-native-phonepe-pg';
import Base64 from 'react-native-base64';
import sha256 from 'sha256';

interface PhonePeResponse {
  status: 'SUCCESS' | 'FAILURE';
  paymentMethod?: string;
  errorMessage?: string;
}

interface PaymentRequestBody {
  merchantId: string;
  merchantTransactionId: string;
  merchantUserId: string;
  amount: number;
  mobileNumber: string;
  callbackUrl: string;
  paymentInstrument: {
    type: string;
  };
}

const usePhonePePayment = (totalPrice: number) => {
  const [environment, setEnvironment] = useState<string>('SANDBOX');
  const [merchantId, setMerchantId] = useState<string>('PGTESTPAYUAT86');
  const [appId, setAppId] = useState<string>('');
  const [enableLogging, setEnableLogging] = useState<boolean>(true);
  const SALT_KEY = '96434309-7796-489d-8924-ab56988a6076';
  const SALT_INDEX = 1;

  const generateTransactionId = (): string => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000000);
    return `TXN_${timestamp}_${random}`;
  };

  const submitHandler = async (): Promise<PhonePeResponse> => {
    try {
      console.log('Initializing PhonePe SDK...');

      if (!PhonePe) {
        console.error('PhonePe SDK is not available');
        return { status: 'FAILURE', errorMessage: 'SDK not available' };
      }

      await PhonePe.init(environment, merchantId, appId, enableLogging);
      console.log('PhonePe SDK initialized successfully');

      const requestBody: PaymentRequestBody = {
        merchantId: merchantId,
        merchantTransactionId: generateTransactionId(),
        merchantUserId: '',
        amount: totalPrice * 100,
        mobileNumber: '999999999999',
        callbackUrl: '',
        paymentInstrument: {
          type: 'PAY_PAGE',
        },
      };

      const payload = JSON.stringify(requestBody);
      const payload_main = Base64.encode(payload);
      const string = payload_main + '/pg/v1/pay' + SALT_KEY;
      const checksum = sha256(string) + '###' + SALT_INDEX;

      const response = await PhonePe.startTransaction(
        payload_main,
        checksum,
        null,
        null
      );

      console.log('PhonePe SDK Response:', response);

      if (response.status === 'SUCCESS') {
        return {
          status: 'SUCCESS',
          paymentMethod: response.paymentMethod || 'UPI',
        };
      } else {
        console.error('Payment failed:', response.errorMessage);
        Alert.alert('Payment Failed', 'Please try again.');
        return { status: 'FAILURE' };
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      return { status: 'FAILURE', errorMessage: error.message };
    }
  };

  return { submitHandler };
};

export { usePhonePePayment };
export default usePhonePePayment;
