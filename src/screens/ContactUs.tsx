import { useState } from 'react'
import { Box, Text, Textarea, TextareaInput } from '@gluestack-ui/themed'
import CountryPicker, { Country, CountryCode } from 'react-native-country-picker-modal'

import { Container } from '../components/Container'
import { AppBar } from '../components/AppBar'
import { colors } from '../constants/colors'
import { moderateScale, moderateScaleVertical } from '../utils/responsiveSize'
import Body from '../components/Body/Body'
import InputText from '../components/TextInput/InputText'
import PrimaryButton from '../components/Button/PrimaryButton'
import { useTheme } from '../constants/ThemeContext'

const ContactUs = () => {
  const { isDarkMode } = useTheme();

  // states
  const [countryCode, setCountryCode] = useState<CountryCode>('IN')
  const [selectedGender, setSelectedGender] = useState('')
  const [country, setCountry] = useState(null)

  const handleCountrySelect = (country: any) => {
    console.log(country);
    setCountryCode(country?.cca2)
    setCountry(country?.callingCode)
  }
  const error = console.error;
  console.error = (...args: any) => {
    if (/defaultProps/.test(args[0])) return;
    error(...args);
  };

  return (
    <Container statusBarStyle={isDarkMode ? 'light-content' : 'dark-content'} statusBarBackgroundColor={isDarkMode ? '#000000' : '#f5f5f5'}  backgroundColor={isDarkMode ? '#000000' : '#f5f5f5'}>
      <AppBar back title='Contact Us' isDarkMode/>

      <Body contentContainerStyle={{ marginHorizontal: moderateScale(10) }}>
        <Box alignItems='center' mt={moderateScaleVertical(20)} gap={moderateScaleVertical(20)}>
          <Text fontFamily={'$poppinsMedium'} fontSize={18} lineHeight={20} color={isDarkMode ? colors.white : colors.charcoalGray} numberOfLines={1}>Contact us for Ride share</Text>

          <Box alignItems='center' gap={moderateScaleVertical(10)}>
            <Text fontFamily={'$poppinsMedium'} fontSize={16} lineHeight={18} color={isDarkMode ? colors.white : colors.charcoalGray} numberOfLines={1}>Address</Text>
            <Text fontFamily={'$poppinsMedium'} fontSize={12} lineHeight={20}color={isDarkMode ? colors.white : colors.dimsGray} numberOfLines={3} textAlign='center' mx={moderateScale(15)}>House# 72, Road# 21, Banani, Dhaka-1213 (near Banani Bidyaniketon School &
              College, beside University of South Asia)</Text>

            <Text fontFamily={'$poppinsMedium'} fontSize={12} lineHeight={20} color={isDarkMode ? colors.white : colors.dimsGray} numberOfLines={3} textAlign='center' mx={moderateScale(15)}>Call : 13301 (24/7) {'\n'}
              Email : support@pathao.com</Text>
          </Box>
        </Box>

        <Box gap={moderateScaleVertical(15)} mt={moderateScaleVertical(30)}>
          <Text fontFamily={'$poppinsMedium'} fontSize={16} lineHeight={18} color={isDarkMode ? colors.white : colors.charcoalGray} numberOfLines={1} textAlign='center'>Send Message</Text>

          <InputText
            textInputProps={{
              placeholder: 'Name'
            }}
            isDarkMode={isDarkMode}
          />

          <InputText
            textInputProps={{
              placeholder: 'Email'
            }}
            isDarkMode={isDarkMode}
          />

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
                  keyboardType: 'number-pad'
                }}
                isDarkMode={isDarkMode}
              />
            </Box>
          </Box>

          <Textarea
            size="md"
            isReadOnly={false}
            isInvalid={false}
            isDisabled={false}
            w={'100%'}
            borderColor={colors.silverGray}
            $focus-borderColor={colors.silverGray}
          >
            <TextareaInput fontFamily='$poppinsMedium'  fontSize={14} lineHeight={16} placeholderTextColor={isDarkMode ? colors.white : colors.silverGray} numberOfLines={5} placeholder="Write your text" />
          </Textarea>
        </Box>

      </Body>

      <PrimaryButton buttonText='Send Message' marginHorizontal={moderateScale(10)} marginVertical={moderateScaleVertical(20)} />
    </Container>
  )
}

export default ContactUs