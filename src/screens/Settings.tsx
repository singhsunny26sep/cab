import { Box, ChevronRightIcon, Icon, Pressable, Text, Switch } from '@gluestack-ui/themed'
import { ParamListBase, useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useState, useEffect } from 'react'
import { Appearance } from 'react-native'

import { Container } from '../components/Container'
import { AppBar } from '../components/AppBar'
import { colors } from '../constants/colors'
import { moderateScale, moderateScaleVertical } from '../utils/responsiveSize'
import { NavigationString } from '../navigation/navigationStrings'
import { useTheme } from '../constants/ThemeContext';

const Settings = () => {
  const navigation = useNavigation<NativeStackNavigationProp<ParamListBase>>();
  
  const { isDarkMode, toggleDarkMode } = useTheme();    

  useEffect(() => {
  
  }, [])

  return (
    <Container
      statusBarStyle={isDarkMode ? 'light-content' : 'dark-content'}
      statusBarBackgroundColor={isDarkMode ? '#000000' : '#ffffff'}
      backgroundColor={isDarkMode ? '#000000' : '#ffffff'}
      isDarkMode={isDarkMode} 
    >
      <AppBar back title='Settings'  isDarkMode={isDarkMode}/>

      <Box mx={moderateScale(15)} gap={moderateScaleVertical(10)} mt={moderateScaleVertical(25)}>
   
        <Pressable
          onPress={() => navigation.navigate(NavigationString.ChangePassword)}
          flexDirection='row'
          alignItems='center'
          justifyContent='space-between'
          borderWidth={1}
          borderColor={colors.themePrimary}
          h={moderateScale(50)}
          px={moderateScale(10)}
          borderRadius={moderateScale(6)}
        >
          <Text fontFamily={'$poppinsMedium'} fontSize={14} lineHeight={16} color={isDarkMode ? colors.white : colors.charcoalGray} numberOfLines={1}>
            Change Password
          </Text>
          <Icon as={ChevronRightIcon} color={isDarkMode ? colors.white : colors.charcoalGray} w="$5" h="$5" />
        </Pressable>

        <Pressable
          onPress={() => navigation.navigate(NavigationString.PrivacyPolicy)}
          flexDirection='row'
          alignItems='center'
          justifyContent='space-between'
          borderWidth={1}
          borderColor={colors.themePrimary}
          h={moderateScale(50)}
          px={moderateScale(10)}
          borderRadius={moderateScale(6)}
        >
          <Text fontFamily={'$poppinsMedium'} fontSize={14} lineHeight={16} color={isDarkMode ? colors.white : colors.charcoalGray} numberOfLines={1}>
            Privacy Policy
          </Text>
          <Icon as={ChevronRightIcon} color={isDarkMode ? colors.white : colors.charcoalGray} w="$5" h="$5" />
        </Pressable>

        <Pressable
          onPress={() => navigation.navigate(NavigationString.ContactUs)}
          flexDirection='row'
          alignItems='center'
          justifyContent='space-between'
          borderWidth={1}
          borderColor={colors.themePrimary}
          h={moderateScale(50)}
          px={moderateScale(10)}
          borderRadius={moderateScale(6)}
        >
          <Text fontFamily={'$poppinsMedium'} fontSize={14} lineHeight={16} color={isDarkMode ? colors.white : colors.charcoalGray} numberOfLines={1}>
            Contact Us
          </Text>
          <Icon as={ChevronRightIcon} color={isDarkMode ? colors.white : colors.charcoalGray} w="$5" h="$5" />
        </Pressable>

        <Pressable
          onPress={() => navigation.navigate(NavigationString.DeleteAccount)}
          flexDirection='row'
          alignItems='center'
          justifyContent='space-between'
          borderWidth={1}
          borderColor={colors.themePrimary}
          h={moderateScale(50)}
          px={moderateScale(10)}
          borderRadius={moderateScale(6)}
        >
          <Text fontFamily={'$poppinsMedium'} fontSize={14} lineHeight={16} color={isDarkMode ? colors.white : colors.charcoalGray} numberOfLines={1}>
            Delete Account
          </Text>
          <Icon as={ChevronRightIcon} color={isDarkMode ? colors.white : colors.charcoalGray} w="$5" h="$5" />
        </Pressable>

        <Pressable
        flexDirection="row"
        alignItems="center"
        justifyContent="space-between"
        borderWidth={1}
        borderColor={colors.themePrimary}
        h={moderateScale(50)}
        px={moderateScale(10)}
        borderRadius={moderateScale(6)}
      >
        <Text fontFamily={'$poppinsMedium'} fontSize={14} lineHeight={16} color={isDarkMode ? colors.white : colors.charcoalGray} numberOfLines={1}>
          Dark Mode
        </Text>
        <Switch
          size="sm"
          value={isDarkMode}
          onToggle={toggleDarkMode} 
          trackColor={{
            true: colors.themePrimary,
            false: colors.charcoalGray,
          }}
        />
      </Pressable>

      </Box>
    </Container>
  )
}
  
export default Settings;
