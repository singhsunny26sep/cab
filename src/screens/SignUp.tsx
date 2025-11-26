import { useEffect, useState } from 'react'
import { StyleSheet } from 'react-native'
import { Box, ChevronDownIcon, Icon, Pressable, Text, CheckCircleIcon } from '@gluestack-ui/themed'
import { Dropdown } from 'react-native-element-dropdown'
import CountryPicker, { Country, CountryCode } from 'react-native-country-picker-modal'
import { ParamListBase, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { responsiveHeight, responsiveWidth } from 'react-native-responsive-dimensions'
import axios from 'axios';  
import { Container } from '../components/Container'
import { colors } from '../constants/colors'
import { AppBar } from '../components/AppBar'
import { GenderType } from '../constants/contants'
import InputText from '../components/TextInput/InputText'
import { moderateScale, moderateScaleVertical, textScale } from '../utils/responsiveSize'
import PrimaryButton from '../components/Button/PrimaryButton'
import { AppleLogoIcon, GmailIcon } from '../components/Icons'
import { NavigationString } from '../navigation/navigationStrings'
import Body from '../components/Body/Body'
import { Instance } from '../api/Instance'
import { SIGNUP, VALIDATE_REFERRAL } from '../api/ApiEndpoints'
import { getFCMToken } from '../utils/notifications'

const SignUp = () => {  
  const navigation = useNavigation<NativeStackNavigationProp<ParamListBase>>();

  const [countryCode, setCountryCode] = useState<CountryCode>('IN')
  const [selectedGender, setSelectedGender] = useState('')
  const [country, setCountry] = useState(null)
  const [email, setEmail] = useState('') 
  const [name, setName] = useState('') 
  const [nameError, setNameError] = useState('')
  const [emailError, setEmailError] = useState('')
  const [otpError, setOtpError] = useState('')
  const [mobileNumber, setMobileNumber] = useState('')
  const [mobileError, setMobileError] = useState('')
  const [genderError, setGenderError] = useState('')
  const [loading, setLoading] = useState(false); 
  const [fcmToken, setFcmToken] = useState<any>('');
  const [referralCode, setReferralCode] = useState('');
  const [referralCodeError, setReferralCodeError] = useState('');
  const [isReferralValid, setIsReferralValid] = useState(false);
  const [referralLoading, setReferralLoading] = useState(false);

  useEffect(()=> {
    askFCMToken();
  },[]);

  const askFCMToken = async () => {
    const token = await getFCMToken();
    console.log('FCM TOKEN at Signup --- ', token );
    setFcmToken(token);
  }

  const handleCountrySelect = (country: any) => {
    console.log(country);
    setCountryCode(country?.cca2)
    setCountry(country?.callingCode)
  }

  const validateReferralCode = async (code: string) => {
    if (!code.trim()) {
      setReferralCodeError('');
      setIsReferralValid(false);
      return;
    }
    
    setReferralLoading(true);
    try {
      const response = await Instance.post(VALIDATE_REFERRAL.url, {
        referralCode: code
      });
      
      if (response.data.success) {
        setReferralCodeError('');
        setIsReferralValid(true);
      } else {
        setReferralCodeError(response.data.message || 'Invalid referral code');
        setIsReferralValid(false);
      }
    } catch (error: any) {
      console.error("Error validating referral code:", error?.response);
      setReferralCodeError('Error validating referral code');
      setIsReferralValid(false);
    } finally {
      setReferralLoading(false);
    }
  };

  const handleSignUp = async () => {
    setNameError('')
    setEmailError('')
    setMobileError('')
    setGenderError('')
    setOtpError('')

    let hasError = false
    if (!name.trim()) {
      setNameError('Please enter your name')
      hasError = true
    }
    
    if (!email.trim()) {
      setEmailError('Please enter your email')
      hasError = true
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Please enter a valid email address')
      hasError = true
    }

    if (!mobileNumber.trim()) {
      setMobileError('Please enter your mobile number')
      hasError = true
    } else if (!/^\d{10}$/.test(mobileNumber)) {
      setMobileError('Please enter a valid 10-digit mobile number')
      hasError = true
    }

    if (!selectedGender) {
      setGenderError('Please select your gender')
      hasError = true
    }

    // Check referral code only if it's not empty
    if (referralCode.trim() && !isReferralValid) {
      setReferralCodeError('Please enter a valid referral code or leave it empty');
      hasError = true;
    }

    if (hasError) return
    setLoading(true); 

    try {
      const payload: any = {
        name: name,     
        email: email,
        fcmToken,
        mobileNumber,
        referralCode
      };

      // Add referral code only if it's valid and not empty
      if (isReferralValid && referralCode.trim()) {
        payload.referralCode = referralCode;
      }

      const response = await Instance.post(SIGNUP.url, payload);
      console.log("signup api response => ", response?.data)
      if (response.status === 200) {
        navigation.navigate(NavigationString.OtpVerify, { email: email }); 
      }
    } catch (error: any) {
      console.error("Error sending OTP:", error?.response?.data);
      setOtpError('Failed to send OTP. Please try again.')
    } finally {
      setLoading(false);
    }
  };

  const error = console.error;
  console.error = (...args: any) => {
    if (/defaultProps/.test(args[0])) return;
    error(...args);
  };

  return (
    <Container statusBarStyle='dark-content' statusBarBackgroundColor={colors.white}>
      <AppBar back />

      <Body>
        <Box mx={moderateScale(15)} gap={moderateScaleVertical(15)} mt={moderateScaleVertical(30)}>
          <Text fontFamily={'$poppinsMedium'} fontSize={24} lineHeight={26} color={colors.charcoalGray} numberOfLines={1}>Sign Up</Text>

          <InputText
            textInputProps={{
              placeholder: 'Name',
              onChangeText: (text) => {
                setName(text)
                setNameError('')
              }
            }}
          />
          {nameError ? (
            <Text color={colors.error} fontSize={12} fontFamily="$poppinsRegular" style={{}}>
              {nameError}
            </Text>
          ) : null}

          <InputText
            textInputProps={{
              placeholder: 'Email',
              onChangeText: (text) => {
                setEmail(text)
                setEmailError('')
              }
            }}
          />
          {emailError ? (
            <Text color={colors.error} fontSize={12} fontFamily="$poppinsRegular">
              {emailError}
            </Text>
          ) : null}

          <Box flexDirection='row' alignItems='center' borderWidth={1} borderColor={colors.silverGray} borderRadius={9} pl={moderateScale(10)} h={moderateScale(56)}>
            <CountryPicker
              countryCode={countryCode}
              onSelect={handleCountrySelect}
              withAlphaFilter
              withCallingCode
              withCallingCodeButton
              withFilter
              withFlag
            />

            <Box flex={1} borderLeftWidth={1} borderLeftColor='#DDDDDD' ml={moderateScale(10)}>
              <InputText
                borderWith={0}
                textInputProps={{
                  placeholder: 'Your mobile number',
                  keyboardType: 'number-pad',
                  onChangeText: (text) => {
                    setMobileNumber(text)
                    setMobileError('')
                  },
                  value: mobileNumber
                }}
              />
            </Box>
          </Box>
          {mobileError ? (
            <Text color={colors.error} fontSize={12} fontFamily="$poppinsRegular">
              {mobileError}
            </Text>
          ) : null}

          <Dropdown
            style={[
              localStyles.dropdown,
              genderError ? { borderColor: colors.error } : null
            ]}
            placeholderStyle={localStyles.placeholderStyle}
            selectedTextStyle={localStyles.selectedTextStyle}
            data={GenderType}
            labelField="label"
            valueField="value"
            placeholder={'Gender'}
            onChange={(item) => { 
              setSelectedGender(item?.value)
              setGenderError('')
            }}
            renderRightIcon={() => <Icon as={ChevronDownIcon} size="lg" mr='$2' />}
            selectedTextProps={{ numberOfLines: 1 }}
            renderItem={(item) => (
              <Text 
                fontFamily='$poppinsMedium'
                fontSize={14} 
                lineHeight={16} 
                color={colors.black} 
                numberOfLines={1} 
                style={{ 
                  paddingHorizontal: responsiveWidth(2.5), 
                  paddingVertical: responsiveHeight(1.5) 
                }}
              >
                {item?.label}
              </Text>
            )}
            itemTextStyle={localStyles.selectedTextStyle}
            itemContainerStyle={localStyles.itemContainerStyle}
          />
          {genderError ? (
            <Text color={colors.error} fontSize={12} fontFamily="$poppinsRegular">
              {genderError}
            </Text>
          ) : null}

          {/* Referral Code Field */}
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
              value: referralCode
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

          <Box flexDirection='row' alignItems='center' mx={moderateScale(15)} gap={moderateScale(8)}>
            <Icon as={CheckCircleIcon} color={colors.green} w={moderateScale(18)} h={moderateScale(18)} alignSelf='flex-start' />
            <Text fontFamily={'$poppinsMedium'} fontSize={12} lineHeight={14} color={colors.charcoalGray} numberOfLines={2} flex={1}>By signing up. you agree to the 
              <Text onPress={()=>{navigation.navigate(NavigationString.TermsAndCondition)}} fontFamily={'$poppinsMedium'} fontSize={12} lineHeight={14} color={colors.themePrimary} numberOfLines={1} style={{textAlignVertical: 'center'}}> Terms of service </Text>
              and <Text onPress={()=>{navigation.navigate(NavigationString.PrivacyPolicy)}} fontFamily={'$poppinsMedium'} fontSize={12} lineHeight={14} color={colors.themePrimary} numberOfLines={1}>Privacy policy.</Text></Text>
          </Box>

          {otpError ? (
            <Text color={colors.error} fontSize={12} fontFamily="$poppinsRegular" textAlign="center">
              {otpError}
            </Text>
          ) : null}
          <PrimaryButton buttonText='Sign Up' onPress={handleSignUp} loading={loading} /> 

        </Box>

        <Box flexDirection='row' alignItems='center' gap={moderateScale(4)} mx={moderateScale(15)} my={moderateScaleVertical(10)}>
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

        <Box flexDirection='row' alignItems='center' alignSelf='center' mt={moderateScaleVertical(110)} >
          <Text fontFamily={'$poppinsMedium'} fontSize={16} lineHeight={18} color={colors.charcoalGray} numberOfLines={2} alignSelf='center'>Already have an account ?</Text>
          <Pressable onPress={() => navigation.navigate(NavigationString.SignIn)} >
            <Text fontFamily={'$poppinsMedium'} fontSize={16} lineHeight={18} color={colors.themePrimary} numberOfLines={1}> Sign in</Text>
          </Pressable>
        </Box>
      </Body>

    </Container>
  )
}

export default SignUp

const localStyles = StyleSheet.create({
  dropdown: {
    borderRadius: moderateScale(6),
    height: moderateScale(56),
    paddingLeft: moderateScale(10),
    borderWidth: 1,
    borderColor: colors.silverGray,
  },
  placeholderStyle: {
    fontSize: textScale(14),
    fontFamily: 'Poppins-Medium',
    color: '#D0D0D0',
  },
  selectedTextStyle: {
    fontSize: textScale(14),
    lineHeight: textScale(16),
    fontFamily: 'Poppins-Medium',
    color: colors.black,
  },
  itemContainerStyle: {
    // borderBottomWidth: 1,
  },
})