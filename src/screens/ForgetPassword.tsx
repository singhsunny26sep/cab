import React, { useState } from 'react';
import { Container } from '../components/Container';
import { colors } from '../constants/colors';
import { AppBar } from '../components/AppBar';
import { Box, MailIcon, Pressable, Text } from '@gluestack-ui/themed';  
import { moderateScale } from '../constants/contants';
import { moderateScaleVertical, scale } from '../utils/responsiveSize';
import PrimaryButton from '../components/Button/PrimaryButton';
import InputText from '../components/TextInput/InputText';
import { OtpInput } from 'react-native-otp-entry';
import { CloseEyeIcon,OpenEyeIcon } from '../components/Icons';
import { responsiveHeight, responsiveWidth } from 'react-native-responsive-dimensions';

export default function ForgetPassword() {
  const [isContinuePressed, setIsContinuePressed] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false); 
  const [otpInput, setOtpInput] = useState<string>('');
  const [email, setEmail] = useState<string>(''); // Add state for email
  const [emailError, setEmailError] = useState<string>(''); // Add state for error message
  const [isVerified, setIsVerified] = useState<boolean>(false); // New state for verification status
  const [secureText, setSecureText] = useState(false);

  const handleContinuePress = () => {
    setIsContinuePressed(true); 
  };

  const handleSendOtp = () => {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError('Email is required.');
      return;
    } else if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address.');
      return;
    }
    setEmailError('');

    setIsOtpSent(true);
  };

  const handleVerifyOtp = () => {
    setIsVerified(true);
  };

  const EyeIcon = () => {
    return (
      <Pressable onPress={() => { setSecureText(!secureText) }} pr={moderateScale(10)}>
        <>
          {secureText ? <OpenEyeIcon/> : <CloseEyeIcon />}
        </>
      </Pressable>
    )
  }
  return (
    <Container statusBarStyle='dark-content' statusBarBackgroundColor={colors.white}>
      <AppBar back />
      { !isContinuePressed ? (
        <>
          <Box mx={moderateScale(15)} gap={moderateScaleVertical(20)} mt={moderateScaleVertical(30)}>
            <Text fontFamily={'$poppinsMedium'} fontSize={24} lineHeight={26} color={colors.charcoalGray} numberOfLines={1} textAlign='center'>
              Forgot Password
            </Text> 
            <Text fontFamily={'$poppinsRegular'} fontSize={15} lineHeight={26} color={colors.gray} textAlign='center'>
              Select which contact details should {'\n'}we use to reset your password
            </Text>
          </Box>
          <Box flexDirection="row" alignItems="center" backgroundColor='$amber100' borderWidth={1} borderColor='$amber600' borderRadius={moderateScale(3)} padding={moderateScale(10)} marginBottom={moderateScale(20)} marginHorizontal={scale(15)} marginTop={moderateScale(30)}>
            <Box backgroundColor="white" width={moderateScale(40)} height={moderateScale(40)} borderRadius={moderateScale(100)} justifyContent="center" alignItems="center" marginRight={moderateScale(15)}>
              <MailIcon color={colors.charcoalGray} />
            </Box>
            <Box>
              <Text fontFamily={'$poppinsMedium'} lineHeight={26} color={colors.gray}>
                via Email
              </Text>
              <Text fontFamily={'$poppinsRegular'} lineHeight={26} color={colors.gray}>
                ********xyz@gmail.com
              </Text>
            </Box>
          </Box>
          <Box marginHorizontal={scale(15)} mb={moderateScale(20)} flex={1} justifyContent='flex-end'>
            <PrimaryButton buttonText={'Continue'} onPress={handleContinuePress} />
          </Box>
        </>
      ) : !isOtpSent ? (
        <>
          <Box mx={moderateScale(15)} gap={moderateScaleVertical(20)} mt={moderateScaleVertical(30)}>
            <Text fontFamily={'$poppinsMedium'} fontSize={24} lineHeight={26} color={colors.charcoalGray} textAlign='center'>
              Verification email
            </Text>
            <Box mt={moderateScaleVertical(25)}>
              <InputText 
                textInputProps={{
                  placeholder: 'Enter your Email',
                  value: email,
                  onChangeText: setEmail, 
                }}
              />
              {emailError ? (
                <Text fontFamily={'$poppinsRegular'} fontSize={15} lineHeight={18} color={colors.red} marginLeft={scale(5)} mt={moderateScale(10)}>
                  {emailError} 
                </Text>
              ) : null}
            </Box>
          </Box>
          <Box marginHorizontal={scale(15)} mb={moderateScale(20)} flex={1} justifyContent='flex-end'>
            <PrimaryButton buttonText={'Send OTP'} onPress={handleSendOtp} />
          </Box>
        </>
      ) : isVerified ? (
        <>
          <Box mx={moderateScale(15)} gap={moderateScaleVertical(20)} mt={moderateScaleVertical(30)}>
            <Text fontFamily={'$poppinsMedium'} fontSize={24} lineHeight={26} color={colors.charcoalGray} textAlign='center'>
              Set New Password
            </Text>
            <Text fontFamily={'$poppinsRegular'} fontSize={15} lineHeight={26} color={colors.gray} textAlign='center'>
              Set your new password
            </Text>
          </Box>
          <Box marginHorizontal={scale(15)} mt={moderateScale(20)}>
                 <InputText   
                   textInputProps={{
                   placeholder: 'Enter your Email'}}  
                   secureTextEntry={secureText}
                   right={<EyeIcon />}/>
          </Box>
          <Box marginHorizontal={scale(15)} mt={moderateScale(20)}>
                 <InputText   
                   textInputProps={{
                   placeholder: 'Confrim Password'}}  
                   secureTextEntry={secureText}
                   right={<EyeIcon />}/>
          </Box>

          <Box marginHorizontal={scale(15)} mb={moderateScale(20)} flex={1} justifyContent='flex-end'>
            <PrimaryButton buttonText={'Save'} onPress={() => console.log('Navigate to login')} />
          </Box>
        </>
      ) : (
        <>
          <Box mx={moderateScale(15)} gap={moderateScaleVertical(20)} mt={moderateScaleVertical(30)}>
            <Text fontFamily={'$poppinsMedium'} fontSize={24} lineHeight={26} color={colors.charcoalGray} textAlign='center'>
              Forgot Password
            </Text>
            <Text fontFamily={'$poppinsRegular'} fontSize={15} lineHeight={26} color={colors.gray} textAlign='center'>
              Code has been sent to xyz@gmail.com
            </Text>
          </Box>
          <Box marginHorizontal={moderateScale(15)}>
            <OtpInput
                 numberOfDigits={6}
                 onTextChange={(text) => setOtpInput(text)}
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
                     color: colors.black
                   }
                 }}
               />
          </Box>
          <Box flexDirection='row' alignItems='center' alignSelf='center' mt={moderateScaleVertical(60)} >
            <Text fontFamily={'$poppinsMedium'} fontSize={16} lineHeight={18} color={colors.charcoalGray} numberOfLines={2} alignSelf='center'>Didn't receive code?</Text>
            <Pressable>
              <Text fontFamily={'$poppinsMedium'} fontSize={16} lineHeight={18} color={colors.themePrimary} numberOfLines={1}>Resend again</Text>
            </Pressable>
          </Box>
          <Box marginHorizontal={scale(15)} mb={moderateScale(20)} flex={1} justifyContent='flex-end'>
            <PrimaryButton buttonText={'Verify'} onPress={handleVerifyOtp} />
          </Box>
        </>
      )}
    </Container>
  );
}
