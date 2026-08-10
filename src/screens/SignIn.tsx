import React, { useEffect, useState } from 'react';
import { Box, Pressable, Text } from '@gluestack-ui/themed';
import { ParamListBase, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Container } from '../components/Container';
import { colors } from '../constants/colors';
import { moderateScale, moderateScaleVertical } from '../utils/responsiveSize';
import InputText from '../components/TextInput/InputText';
import { GmailIcon, AppleLogoIcon } from '../components/Icons';
import PrimaryButton from '../components/Button/PrimaryButton';
import { NavigationString } from '../navigation/navigationStrings';
import axios from 'axios';
import { BASE_URL2, Instance2 } from '../api/Instance.ts';
import { SEND_OTP_CONTACT, VALIDATE_REFERRAL } from '../api/ApiEndpoints';
import { getFCMToken } from '../utils/notifications';
import CountryPicker, { CountryCode } from 'react-native-country-picker-modal';

const SignIn = () => {
  // init
  const navigation = useNavigation<NativeStackNavigationProp<ParamListBase>>();

  // state
   const [countryCode, setCountryCode] = useState<CountryCode>('IN');
   const [callingCode, setCallingCode] = useState<string>('+91');
   const [mobileNumber, setMobileNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [fcmToken, setFcmToken] = useState<any>('');
  const [error, setError] = useState({
    general: '',
  });
  const [referralCode, setReferralCode] = useState('');
  const [referralCodeError, setReferralCodeError] = useState('');
  const [isReferralValid, setIsReferralValid] = useState(false);
  const [referralLoading, setReferralLoading] = useState(false);

  useEffect(() => {
    askFCMToken();
  }, []);

  const askFCMToken = async () => {
    const token = await getFCMToken();
    console.log('FCM TOKEN at Login --- ', token);
    setFcmToken(token);
  };

  const validateReferralCode = async (code: string) => {
    if (!code.trim()) {
      setReferralCodeError('');
      setIsReferralValid(false);
      return;
    }

    setReferralLoading(true);
     try {
       const response = await Instance2.post(VALIDATE_REFERRAL.url, {
         referralCode: code,
       });

      if (response.data.success) {
        setReferralCodeError('');
        setIsReferralValid(true);
      } else {
        setReferralCodeError(response.data.message || 'Invalid referral code');
        setIsReferralValid(false);
      }
    } catch (error: any) {
      console.error('Error validating referral code:', error?.response);
      setReferralCodeError('Error validating referral code');
      setIsReferralValid(false);
    } finally {
      setReferralLoading(false);
    }
  };

  const validateForm = () => {
    let isValid = true;
    const newError = {
      general: '',
    };

    // Mobile number validation
    if (!mobileNumber.trim()) {
      newError.general = 'Mobile number is required';
      isValid = false;
    } else if (!/^\d{10}$/.test(mobileNumber)) {
      newError.general = 'Please enter a valid 10-digit mobile number';
      isValid = false;
    }

    // Check referral code only if it's not empty
    if (referralCode.trim() && !isReferralValid) {
      newError.general = 'Please enter a valid referral code or leave it empty';
      isValid = false;
    }

    setError(newError);
    return isValid;
  };

   const handleSignIn = async () => {
     try {
       if (!validateForm()) {return;}

        setError({ general: '' });
        setLoading(true);

        // Send the full contact number including country code (e.g., +91xxxxxxxxxx)
        const fullContactNumber =  mobileNumber;
        console.log('Full contact number to send OTP:', fullContactNumber);
         const response = await Instance2.post(SEND_OTP_CONTACT.url, {
            contact: fullContactNumber,
            fcmToken,
            // referralCode: referralCode.trim() || undefined, // Only send if not empty
          });

          const sessionId = response.data?.sessionId;

        setLoading(false);

        if (response.status === 200) {
          navigation.navigate(NavigationString.OtpVerify, {
            contact: fullContactNumber,
            sessionId: sessionId,
          });
        } else {
         setError(prev => ({ ...prev, general: 'Failed to send OTP. Please try again.' }));
       }
     } catch (error: any) {
       console.error('Error sending OTP:', error);
       setLoading(false);
       setError(prev => ({
         ...prev,
         general: error?.response?.data?.message || 'Something went wrong. Please try again.',
       }));
     }
   };

   const handleCountrySelect = (country: any) => {
     setCountryCode(country?.cca2);
     setCallingCode(country?.callingCode || '+91');
   };

  return (
    <Container statusBarStyle="dark-content" statusBarBackgroundColor={colors.white}>
      <Box mx={moderateScale(15)} gap={moderateScaleVertical(20)} mt={moderateScaleVertical(30)}>
        <Text fontFamily={'$poppinsMedium'} fontSize={24} lineHeight={26} color={colors.charcoalGray} numberOfLines={1}>
          Sign In
        </Text>

        {/* Mobile Number Field with Country Picker */}
        <Box flexDirection="row" alignItems="center" borderWidth={1} borderColor={colors.silverGray} borderRadius={9} pl={moderateScale(10)} h={moderateScale(56)}>
          <CountryPicker
            countryCode={countryCode}
            onSelect={handleCountrySelect}
            withAlphaFilter
            withCallingCode
            withCallingCodeButton
            withFilter
            withFlag
          />

          <Box flex={1} borderLeftWidth={1} borderLeftColor="#DDDDDD" ml={moderateScale(10)}>
            <InputText
              borderWith={0}
              textInputProps={{
                placeholder: 'Your mobile number',
                keyboardType: 'number-pad',
                onChangeText: (text) => {
                  setMobileNumber(text);
                  setError(prev => ({ ...prev, general: '' }));
                },
                value: mobileNumber,
              }}
            />
          </Box>
        </Box>
        {error.general ? (
          <Text color={colors.error} fontSize={12} fontFamily="$poppinsRegular">
            {error.general}
          </Text>
        ) : null}

        {/* Referral Code Field (Optional) */}
        <InputText
          textInputProps={{
            placeholder: 'Referral Code (Optional)',
            onChangeText: (text) => {
              setReferralCode(text);
              // Only validate if text is not empty
              if (text.trim()) {
                validateReferralCode(text);
              } else {
                setReferralCodeError('');
                setIsReferralValid(false);
              }
            },
            value: referralCode,
          }}
        />
        {referralLoading ? (
          <Text color={colors.themePrimary} fontSize={12} fontFamily="$poppinsRegular">
            Validating referral code...
          </Text>
        ) : referralCodeError ? (
          <Text color={colors.error} fontSize={12} fontFamily="$poppinsRegular">
            {referralCodeError}
          </Text>
        ) : isReferralValid ? (
          <Text color={colors.green} fontSize={12} fontFamily="$poppinsRegular">
            Referral code is valid
          </Text>
        ) : null}

        <PrimaryButton buttonText="Sign In" onPress={handleSignIn} loading={loading} />

        <Box flexDirection="row" alignItems="center" gap={moderateScale(4)} mx={moderateScale(15)}>
          <Box borderBottomWidth={1} borderBottomColor={colors.silverGray} flex={1} />
          <Text fontFamily={'$poppinsMedium'} fontSize={16} lineHeight={18} color={colors.silverGray} numberOfLines={1}>
            or
          </Text>
          <Box borderBottomWidth={1} borderBottomColor={colors.silverGray} flex={1} />
        </Box>

        <Box flexDirection="row" alignItems="center" alignSelf="center" gap={moderateScale(15)}>
          <Pressable borderWidth={1} w={moderateScale(40)} h={moderateScale(40)} borderRadius={moderateScale(8)} borderColor="#D0D0D0" alignItems="center" justifyContent="center">
            <GmailIcon />
          </Pressable>

          <Pressable borderWidth={1} w={moderateScale(40)} h={moderateScale(40)} borderRadius={moderateScale(8)} borderColor="#D0D0D0" alignItems="center" justifyContent="center">
            <AppleLogoIcon />
          </Pressable>
        </Box>
      </Box>

      <Box flexDirection="row" alignItems="center" alignSelf="center" mt={moderateScaleVertical(60)}>
        <Text fontFamily={'$poppinsMedium'} fontSize={16} lineHeight={18} color={colors.charcoalGray} numberOfLines={2} alignSelf="center">
          Already have an account ?
        </Text>

      </Box>
    </Container>
  );
};

export default SignIn;
