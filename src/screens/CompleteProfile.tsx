import React, { useState } from 'react'
import { Avatar, AvatarFallbackText, Box, Image } from '@gluestack-ui/themed'
import CountryPicker, { Country, CountryCode } from 'react-native-country-picker-modal'

import { colors } from '../constants/colors'
import { Container } from '../components/Container'
import { AppBar } from '../components/AppBar'
import Body from '../components/Body/Body'
import { moderateScale, moderateScaleVertical } from '../utils/responsiveSize'
import { CameraIcon } from '../components/Icons'
import InputText from '../components/TextInput/InputText'
import PrimaryButton from '../components/Button/PrimaryButton'

const CompleteProfile = () => {

  // state
  const [countryCode, setCountryCode] = useState<CountryCode>('US')
  const [country, setCountry] = useState(null)

  const handleCountrySelect = (country: any) => {
    console.log(country);
    setCountryCode(country?.cca2)
    setCountry(country?.callingCode[0])
  }

  const error = console.error;
  console.error = (...args: any) => {
    if (/defaultProps/.test(args[0])) return;
    error(...args);
  };

  return (
    <Container statusBarStyle='dark-content' statusBarBackgroundColor={colors.white}>
      <AppBar back title='Complete Profile' />

      <Body>

        <Box alignSelf='center' mt={moderateScaleVertical(40)} mb={moderateScaleVertical(20)}>
          {/* <Avatar bgColor="$amber600" w={moderateScale(75)} h={moderateScale(75)} borderRadius="$full">
          <AvatarFallbackText>Danish Qureshi</AvatarFallbackText>
        </Avatar> */}

          <Box w={moderateScale(85)} h={moderateScale(85)} borderRadius={moderateScale(50)} overflow='hidden'>
            <Image alt='icon' source={{ uri: 'https://i2.pngimg.me/thumb/f/720/m2H7K9A0b1d3b1m2.jpg' }} w={'100%'} h={'100%'} resizeMode='cover' />
          </Box>

          <Box alignItems='center' justifyContent='center' position='absolute' w={moderateScale(25)} h={moderateScale(25)} borderRadius={moderateScale(20)} bg={colors.themePrimary} right={0} bottom={0}>
            <CameraIcon />
          </Box>
        </Box>

        <Box gap={moderateScaleVertical(20)} mx={moderateScaleVertical(15)}>
          <InputText
            textInputProps={{
              placeholder: 'Full Name'

            }}
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
              />
            </Box>
          </Box>

          <InputText
            textInputProps={{
              placeholder: 'Email'

            }}
          />

          <InputText
            textInputProps={{
              placeholder: 'Street'

            }}
          />
          <InputText
            textInputProps={{
              placeholder: 'City'
            }}
          />
          <InputText
            textInputProps={{
              placeholder: 'District'
            }}
          />
        </Box>

      </Body>
      <Box flexDirection='row' alignItems='center' marginHorizontal={moderateScale(15)} marginVertical={moderateScaleVertical(20)} gap={moderateScale(15)}>
        <PrimaryButton buttonText='Cancel' textColor={colors.black} borderWidth={1} borderColor={colors.themeSecondary} backgroundColor={'transparent'} flex={1} />
        <PrimaryButton buttonText='Save' flex={1} />
      </Box>
    </Container>
  )
}

export default CompleteProfile