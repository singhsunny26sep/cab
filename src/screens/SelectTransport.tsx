import { useState } from 'react'
import { Box, Image, Pressable, Text } from '@gluestack-ui/themed'
import { ParamListBase, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Container } from '../components/Container'
import { AppBar } from '../components/AppBar'
import { colors } from '../constants/colors'
import { moderateScale, moderateScaleVertical } from '../utils/responsiveSize'
import Icons from '../assets/Icons'
import Body from '../components/Body/Body'
import PrimaryButton from '../components/Button/PrimaryButton'
import { NavigationString } from '../navigation/navigationStrings';
import { useTheme } from '../constants/ThemeContext';

const SelectTransport = () => {
  const { isDarkMode } = useTheme();    

  // init 
  const navigation = useNavigation<NativeStackNavigationProp<ParamListBase>>();

  // state
  const [selectedTransport, setSelectedTransport] = useState('')

  const onHandleSelect = (type: string) => {
    setSelectedTransport(type)
  }

  return (
    <Container statusBarStyle={isDarkMode ? 'light-content' : 'dark-content'} statusBarBackgroundColor={isDarkMode ? '#000000' : '#ffffff'} backgroundColor={isDarkMode ? '#000000' : '#ffffff'}>
      <AppBar back title='Select Transport' isDarkMode={isDarkMode}/>

      <Body>
        <Text fontFamily={'$poppinsSemiBold'} fontSize={24} lineHeight={26} color={isDarkMode ? "white" : colors.charcoalGray} numberOfLines={1} alignSelf='center' my={moderateScaleVertical(25)}>Select your transport</Text>

        <Box flexDirection='row' alignItems='center' mx={moderateScale(15)} gap={moderateScale(15)}>
          <Pressable onPress={() => { onHandleSelect('car') }} borderWidth={1} borderColor={colors.themePrimary} bgColor={selectedTransport === 'car' ? colors.paleYellow : colors.ivoryYellow} flex={1} h={moderateScale(160)} borderRadius={moderateScale(10)} alignItems='center' justifyContent='center'>
            <Box gap={moderateScaleVertical(15)}>
              <Image alt='icon' source={Icons.Car} resizeMode='contain' w={moderateScale(74)} h={moderateScale(74)} />
              <Text fontFamily={'$poppinsMedium'} fontSize={16} lineHeight={18} color={colors.charcoalGray} numberOfLines={1} textAlign='center'>Car</Text>
            </Box>
          </Pressable>

          <Pressable onPress={() => { onHandleSelect('bike') }} borderWidth={1} borderColor={colors.themePrimary} bgColor={selectedTransport === 'bike' ? colors.paleYellow : colors.ivoryYellow} flex={1} h={moderateScale(160)} borderRadius={moderateScale(10)} alignItems='center' justifyContent='center'>
            <Box gap={moderateScaleVertical(15)}>
              <Image alt='icon' source={Icons.Bike} resizeMode='contain' w={moderateScale(74)} h={moderateScale(74)} />
              <Text fontFamily={'$poppinsMedium'} fontSize={16} lineHeight={18} color={colors.charcoalGray} numberOfLines={1} textAlign='center'>Bike</Text>
            </Box>
          </Pressable>
        </Box>

        <Box flexDirection='row' alignItems='center' mx={moderateScale(15)} gap={moderateScale(15)} mt={moderateScaleVertical(15)}>
          <Pressable onPress={() => { onHandleSelect('parcel') }} borderWidth={1} borderColor={colors.themePrimary} bgColor={selectedTransport === 'parcel' ? colors.paleYellow : colors.ivoryYellow} flex={1} h={moderateScale(160)} borderRadius={moderateScale(10)} alignItems='center' justifyContent='center'>
            <Box gap={moderateScaleVertical(15)}>
              <Image alt='icon' source={Icons.Cycle} resizeMode='contain' w={moderateScale(74)} h={moderateScale(74)} />
              <Text fontFamily={'$poppinsMedium'} fontSize={16} lineHeight={18} color={colors.charcoalGray} numberOfLines={1} textAlign='center'>Parcel</Text>
            </Box>
          </Pressable>

          <Pressable onPress={() => { onHandleSelect('taxi') }} borderWidth={1} borderColor={colors.themePrimary} bgColor={selectedTransport === 'taxi' ? colors.paleYellow : colors.ivoryYellow} flex={1} h={moderateScale(160)} borderRadius={moderateScale(10)} alignItems='center' justifyContent='center'>
            <Box gap={moderateScaleVertical(15)}>
              <Image alt='icon' source={Icons.Taxi} resizeMode='contain' w={moderateScale(74)} h={moderateScale(74)} />
              <Text fontFamily={'$poppinsMedium'} fontSize={16} lineHeight={18} color={colors.charcoalGray} numberOfLines={1} textAlign='center'>Taxi</Text>

            </Box>
          </Pressable>
        </Box>
        
      </Body>

      <PrimaryButton onPress={() => { navigation.navigate(NavigationString.AvailableTransport, { transportType: selectedTransport }) }}  buttonText='Continue' marginHorizontal={moderateScale(15)} display={!!selectedTransport ? 'flex' : 'none'} marginVertical={moderateScaleVertical(25)} />
    </Container>
  )
}

export default SelectTransport