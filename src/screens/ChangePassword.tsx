import { useState } from 'react'
import { Box, Pressable, Text } from '@gluestack-ui/themed'

import { Container } from '../components/Container'
import { colors } from '../constants/colors'
import { AppBar } from '../components/AppBar'
import { moderateScale, moderateScaleVertical } from '../utils/responsiveSize'
import InputText from '../components/TextInput/InputText'
import { AppleLogoIcon, CloseEyeIcon, GmailIcon, OpenEyeIcon } from '../components/Icons'
import PrimaryButton from '../components/Button/PrimaryButton'
import { useTheme } from '../constants/ThemeContext'

const ChangePassword = () => {
  const { isDarkMode } = useTheme();

  // state
  const [secureText, setSecureText] = useState(false)
  const [secureText1, setSecureText1] = useState(false)
  const [secureText2, setSecureText2] = useState(false)

  const EyeIcon = () => {
    return (
      <Pressable onPress={() => { setSecureText(!secureText) }} pr={moderateScale(10)}>
        <>
          {secureText ? <CloseEyeIcon /> : <OpenEyeIcon />}
        </>
      </Pressable>
    )
  }

  const EyeIcon1 = () => {
    return (
      <Pressable onPress={() => { setSecureText1(!secureText1) }} pr={moderateScale(10)}>
        <>
          {secureText1 ? <CloseEyeIcon /> : <OpenEyeIcon />}
        </>
      </Pressable>
    )
  }

  const EyeIcon2 = () => {
    return (
      <Pressable onPress={() => { setSecureText2(!secureText2) }} pr={moderateScale(10)}>
        <>
          {secureText2 ? <CloseEyeIcon /> : <OpenEyeIcon />}
        </>
      </Pressable>
    )
  }

  return (
    <Container statusBarStyle={isDarkMode ? 'light-content' : 'dark-content'} statusBarBackgroundColor={isDarkMode ? '#000000' : '#f5f5f5'}  backgroundColor={isDarkMode ? '#000000' : '#f5f5f5'}>
      <AppBar back title='Change Password' isDarkMode  />

      <Box mx={moderateScale(15)} mt={moderateScaleVertical(25)} gap={moderateScale(15)}>
        <InputText
          textInputProps={{
            placeholder: 'Old Password'

          }}
          secureTextEntry={secureText}
          right={<EyeIcon />}
        />

        <InputText
          textInputProps={{
            placeholder: 'New Password'

          }}
          secureTextEntry={secureText1}
          right={<EyeIcon1 />}
        />

        <InputText
          textInputProps={{
            placeholder: 'Confirm Password'

          }}
          secureTextEntry={secureText2}
          right={<EyeIcon2 />}
        />

        <PrimaryButton buttonText='Save' />

      </Box>
    </Container>
  )
}

export default ChangePassword