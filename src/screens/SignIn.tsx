  import { useEffect, useState } from 'react'
import { Box, Pressable, Text } from '@gluestack-ui/themed'
import { ParamListBase, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Container } from '../components/Container'
import { colors } from '../constants/colors'
import { AppBar } from '../components/AppBar'
import { moderateScale, moderateScaleVertical } from '../utils/responsiveSize'
import InputText from '../components/TextInput/InputText'
import { AppleLogoIcon, CloseEyeIcon, GmailIcon, OpenEyeIcon } from '../components/Icons'
import PrimaryButton from '../components/Button/PrimaryButton'
import { NavigationString } from '../navigation/navigationStrings';
import { Instance } from '../api/Instance';
import { SIGNUP } from '../api/ApiEndpoints';
import { getFCMToken } from '../utils/notifications';

const SignIn = () => {
  // init 
  const navigation = useNavigation<NativeStackNavigationProp<ParamListBase>>();

  // state
  const [secureText, setSecureText] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [fcmToken, setFcmToken] = useState<any>('');
  const [error, setError] = useState({
    email: '',
    password: '',
    general: ''
  });
  
  useEffect(()=> {
    askFCMToken();
  },[]);

  const askFCMToken = async () => {
    // const userLData = await loadUserLocalMethod();
    const token = await getFCMToken();
    // console.log("fcm token....",token)
    console.log('FCM TOKEN at Login --- ', token );
    setFcmToken(token);
  }
  console.log('STATE variable FCM TOKEN at Login --- ', fcmToken );

  const EyeIcon = () => {
    return (
      <Pressable onPress={() => { setSecureText(!secureText) }} pr={moderateScale(10)}>
        <>
          {secureText ? <CloseEyeIcon /> : <OpenEyeIcon />}
        </>
      </Pressable>
    )
  }

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = () => {
    let isValid = true;
    const newError = {
      email: '',
      password: '',
      general: ''
    };

    // Email validation
    if (!email.trim()) {
      newError.email = 'Email is required';
      isValid = false;
    } else if (!validateEmail(email.trim())) {
      newError.email = 'Please enter a valid email';
      isValid = false;
    }

    // Password validation
    // if (!password.trim()) {
    //   newError.password = 'Password is required';
    //   isValid = false;
    // } else if (password.length < 6) {
    //   newError.password = 'Password must be at least 6 characters';
    //   isValid = false;
    // }

    setError(newError);
    return isValid;
  };

  const handleSignIn = async () => {
    try {
      if (!validateForm()) return;
  
      setError({ email: '', password: '', general: '' }); 
      setLoading(true); 
      
      const response = await Instance.post(SIGNUP.url, {
        email: email.trim(),
        fcmToken,
        password: password
      });
  
      setLoading(false); 
  
      if (response.status === 200) {
        navigation.navigate(NavigationString.OtpVerify, { email: email.trim() });
      } else {
        setError(prev => ({ ...prev, general: 'Failed to send OTP. Please try again.' }));
      }
    } catch (error: any) {
      console.error('Error sending OTP:', error);
      setLoading(false); 
      setError(prev => ({
        ...prev,
        general: error?.response?.data?.message || 'Something went wrong. Please try again.'
      }));
    }
  }
  

  return (
    <Container statusBarStyle='dark-content' statusBarBackgroundColor={colors.white}>
      {/* <AppBar back /> */}

      <Box mx={moderateScale(15)} gap={moderateScaleVertical(20)} mt={moderateScaleVertical(30)}>
        <Text fontFamily={'$poppinsMedium'} fontSize={24} lineHeight={26} color={colors.charcoalGray} numberOfLines={1}>Sign In</Text> 

        <Box pt={moderateScale(80)}>
          <InputText
            textInputProps={{
              placeholder: 'Enter your email',
              onChangeText: (text) => {
                setEmail(text);
                setError(prev => ({ ...prev, email: '', general: '' }));
              },
              value: email,
            }}
          />
          {error.email ? (
            <Text color={colors.vividRed} fontSize={12} mt={moderateScaleVertical(5)}>
              {error.email}
            </Text>
          ) : null}
        </Box>

        {/* <Box>
          <InputText
            textInputProps={{
              placeholder: 'Enter Your Password',
              onChangeText: (text) => {
                setPassword(text);
                setError(prev => ({ ...prev, password: '', general: '' }));
              },
              value: password,
            }}
            secureTextEntry={secureText}
            right={<EyeIcon />}
          />
          {error.password ? (
            <Text color={colors.vividRed} fontSize={12} mt={moderateScaleVertical(5)}>
              {error.password}
            </Text>
          ) : null}
        </Box> */}

        <Pressable alignSelf='flex-end' onPress={() => navigation.navigate(NavigationString.ForgotPassword)}>
          <Text fontFamily={'$poppinsMedium'} fontSize={14} lineHeight={16} color={colors.vividRed} numberOfLines={1}>Forget password?</Text>
        </Pressable>
      </Box>

      <Box mx={moderateScale(15)} gap={moderateScaleVertical(30)} mt={moderateScaleVertical(30)}>
        {error.general ? (
          <Text color={colors.vividRed} fontSize={12} textAlign="center">
            {error.general}
          </Text>
        ) : null}
        
        <PrimaryButton buttonText='Sign In' onPress={handleSignIn}  loading={loading}/>

        <Box flexDirection='row' alignItems='center' gap={moderateScale(4)} mx={moderateScale(15)} >
          <Box borderBottomWidth={1} borderBottomColor={colors.silverGray} flex={1}></Box>
          <Text fontFamily={'$poppinsMedium'} fontSize={16} lineHeight={18} color={colors.silverGray} numberOfLines={1}>or</Text>
          <Box borderBottomWidth={1} borderBottomColor={colors.silverGray} flex={1}></Box>
        </Box>

        <Box flexDirection='row' alignItems='center' alignSelf='center' gap={moderateScale(15)}>
          <Pressable borderWidth={1} w={moderateScale(40)} h={moderateScale(40)} borderRadius={moderateScale(8)} borderColor='#D0D0D0' alignItems='center' justifyContent='center'>
            <GmailIcon />
          </Pressable>

          <Pressable borderWidth={1} w={moderateScale(40)} h={moderateScale(40)} borderRadius={moderateScale(8)} borderColor='#D0D0D0' alignItems='center' justifyContent='center'>
            <AppleLogoIcon />
          </Pressable>
        </Box>
      </Box>

      <Box flexDirection='row' alignItems='center' alignSelf='center' mt={moderateScaleVertical(60)} >
        <Text fontFamily={'$poppinsMedium'} fontSize={16} lineHeight={18} color={colors.charcoalGray} numberOfLines={2} alignSelf='center'>Already have an account ?</Text>
        <Pressable onPress={() => navigation.navigate(NavigationString.SignUp)} >
          <Text fontFamily={'$poppinsMedium'} fontSize={16} lineHeight={18} color={colors.themePrimary} numberOfLines={1}>Sign Up</Text>
        </Pressable>
      </Box>
    </Container>
  )
}

export default SignIn;
