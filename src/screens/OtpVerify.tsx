import {useState, useEffect} from 'react';
import {Box, Text, Toast, ToastTitle, useToast} from '@gluestack-ui/themed';
import {ParamListBase, useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {
  responsiveHeight,
  responsiveWidth,
} from 'react-native-responsive-dimensions';
import {OtpInput} from 'react-native-otp-entry';
import axios from 'axios';
import {useRoute} from '@react-navigation/native';
import {Container} from '../components/Container';
import {AppBar} from '../components/AppBar';
import {colors} from '../constants/colors';
import {moderateScaleVertical, moderateScale} from '../utils/responsiveSize';
import {Pressable} from '@gluestack-ui/themed';
import {NavigationString} from '../navigation/navigationStrings';
import PrimaryButton from '../components/Button/PrimaryButton';
import {SIGNUP, VERIFYOTP} from '../api/ApiEndpoints';
import {Instance, Instance2} from '../api/Instance.ts';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {loadUserFromStorage, saveUserToStorage} from '../store/slice/UserSlice';
const OTP_RESEND_TIME = 60;
const OtpVerify = () => {
  // init
  const navigation = useNavigation<NativeStackNavigationProp<ParamListBase>>();
  const route: any = useRoute();
  const toast = useToast();
  // states
  const [otpInput, setOtpInput] = useState<string>('');
  const [email, setEmail] = useState<string>('user@example.com');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userLocalData, setUserLocalData] = useState<any>(null);
  const [resendDisabled, setResendDisabled] = useState(true);
  const [countdown, setCountdown] = useState(OTP_RESEND_TIME);

  useEffect(() => {
    if (route.params?.email) {
      setEmail(route.params.email);
      getLocalUser();
    }
  }, [route.params?.email]);

  // Countdown timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else {
      setResendDisabled(false);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const startCountdown = () => {
    setResendDisabled(true);
    setCountdown(OTP_RESEND_TIME);
  };

  const getLocalUser = async () => {
    const localData = await loadUserFromStorage();
    console.log('localData method at otp ---------------------', localData);
    setUserLocalData(localData);
  };

  const verifyOtp = async () => {
    try {
      setLoading(true);
      setError('');
      const otpNumber = parseInt(otpInput, 10);
      if (isNaN(otpNumber)) {
        setError('Invalid OTP. Please try again.');
        return;
      }
console.log('Verifying OTP with email:', email, 'and sessionId:', route.params?.sessionId);
      const response = await Instance2.post(VERIFYOTP.url, {
        otp: otpNumber,
        email: email,
        sessionId: route.params?.sessionId,
      });

      console.log('OTP Response:', response.data);

      if (response.data.status) {
        const token = response.data.token;

        await AsyncStorage.setItem('userToken', token);
        const currentUserData = (await loadUserFromStorage()) || {};
        // console.log("current local data ---------------------", currentUserData);
        // console.log("user state local data at otp ---------------------", userLocalData);

        const updatedUserData: any = {
          ...currentUserData,
          profileData: response.data.findUser,
          token: token,
        };
        await saveUserToStorage(updatedUserData);
        setUserLocalData(updatedUserData);

        console.log('Token:', token);
        // navigation.navigate(NavigationString?.DrawerStacks);
        navigation.reset({
          index: 0,
          routes: [{name: NavigationString?.DrawerStacks}],
        });
      } else {
        setError(response.data.msg);
      }
    } catch (err) {
      console.error('Error during OTP verification:', err);
      setError('An error occurred. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendDisabled) {return;}
    try {
      // setLoading(true);
      const response = await Instance.post(SIGNUP.url, {
        email: email.trim(),
        password: '',
      });

      setLoading(false);

      if (response.status === 200) {
        startCountdown();
        toast.show({
          placement: 'top',
          render: ({id}: any) => {
            const toastId = 'toast-' + id;
            return (
              <Toast nativeID={toastId} variant="accent" action="success">
                <ToastTitle>OTP resent successfully!</ToastTitle>
              </Toast>
            );
          },
        });
      } else {
        toast.show({
          placement: 'top',
          render: ({id}: any) => {
            const toastId = 'toast-' + id;
            return (
              <Toast nativeID={toastId} variant="accent" action="error">
                <ToastTitle>Failed to send OTP. Please try again.</ToastTitle>
              </Toast>
            );
          },
        });
      }
    } catch (error: any) {
      console.error('Error sending OTP:', error);
      setLoading(false);
      toast.show({
        placement: 'top',
        render: ({id}: any) => {
          const toastId = 'toast-' + id;
          return (
            <Toast nativeID={toastId} variant="accent" action="error">
              <ToastTitle>
                {error?.response?.data?.message ||
                  'Something went wrong. Please try again.'}
              </ToastTitle>
            </Toast>
          );
        },
      });
      // setError(prev => ({
      //   ...prev,
      //   general: error?.response?.data?.message || 'Something went wrong. Please try again.'
      // }));
    }
  };

  return (
    <Container
      statusBarStyle="dark-content"
      statusBarBackgroundColor={colors.white}>
      <AppBar back />

      <Box flex={1} mt={moderateScaleVertical(30)} mx={moderateScale(40)}>
        <Box alignItems="center" gap={moderateScaleVertical(15)}>
          <Text
            fontFamily={'$poppinsMedium'}
            fontSize={24}
            lineHeight={26}
            color={colors.charcoalGray}
            numberOfLines={1}>
            OTP verification
          </Text>
          <Text
            fontFamily={'$poppinsRegular'}
            fontSize={16}
            lineHeight={18}
            color={colors.mediumLightGray}
            numberOfLines={1}>
            Enter your OTP code
          </Text>
        </Box>

        <OtpInput
          numberOfDigits={6}
          onTextChange={text => setOtpInput(text)}
          focusColor={colors.themePrimary}
          focusStickBlinkingDuration={400}
          theme={{
            pinCodeContainerStyle: {
              backgroundColor: colors.white,
              width: responsiveWidth(12),
              height: responsiveHeight(6),
            },
            containerStyle: {
              alignSelf: 'center',
              marginTop: responsiveHeight(8),
            },
            filledPinCodeContainerStyle: {
              backgroundColor: '#FFFDE7',
              borderColor: colors.themePrimary,
            },
            pinCodeTextStyle: {
              color: colors.black,
            },
          }}
        />

        {error && (
          <Text
            fontFamily={'$poppinsRegular'}
            fontSize={14}
            color={colors.error}
            alignSelf="center"
            mt={moderateScaleVertical(15)}>
            {error}
          </Text>
        )}

        <Box
          flexDirection="row"
          alignItems="center"
          alignSelf="center"
          mt={moderateScaleVertical(40)}>
          <Text
            fontFamily={'$poppinsMedium'}
            fontSize={16}
            lineHeight={18}
            color={colors.charcoalGray}
            numberOfLines={1}>
            Didn’t receive code?
          </Text>
          {resendDisabled ? (
            <Text fontFamily={'$poppinsMedium'} fontSize={16} lineHeight={18} color={colors.themePrimary} numberOfLines={1}> Resend in {countdown}s
            </Text>
          ) : (
            <Pressable onPress={handleResendOtp}>
              <Text fontFamily={'$poppinsMedium'} fontSize={16} lineHeight={18} color={colors.themePrimary} numberOfLines={1}> Resend again</Text>
            </Pressable>
          )}
        </Box>
      </Box>

      <PrimaryButton
        onPress={verifyOtp}
        buttonText={loading ? 'Verifying...' : 'Verify'}
        marginHorizontal={moderateScale(15)}
        margin={moderateScaleVertical(30)}
        disabled={loading}
      />
    </Container>
  );
};

export default OtpVerify;
