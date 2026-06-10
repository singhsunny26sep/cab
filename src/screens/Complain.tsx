import { StyleSheet, Modal } from 'react-native'
import { } from 'react-native';
import { Box, ChevronDownIcon, Icon, Pressable, Text, Textarea, TextareaInput, Image, CloseIcon } from '@gluestack-ui/themed'
import React, { useState } from 'react'
import { ParamListBase, useNavigation, } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Dropdown } from 'react-native-element-dropdown'
import { responsiveHeight, responsiveWidth } from 'react-native-responsive-dimensions'

import { Container } from '../components/Container'
import { AppBar } from '../components/AppBar'
import { colors } from '../constants/colors'
import { moderateScale, moderateScaleVertical, textScale } from '../utils/responsiveSize'
import { ComplainType } from '../constants/contants'
import InputText from '../components/TextInput/InputText'
import PrimaryButton from '../components/Button/PrimaryButton'
import Icons from '../assets/Icons'
import { NavigationString } from '../navigation/navigationStrings';
import { useTheme } from '../constants/ThemeContext';

const Complain = () => {
  // init
  const navigation = useNavigation<NativeStackNavigationProp<ParamListBase>>();
  const { isDarkMode } = useTheme();

  // states
  const [selectedComplainType, setSelectedComplainType] = useState('')
  const [showModal, setShowModal] = useState(false)

  return (
    <Container statusBarStyle={isDarkMode ? 'light-content' : 'dark-content'} statusBarBackgroundColor={isDarkMode ? '#000000' : '#ffffff'} backgroundColor={isDarkMode ? colors.black :colors.white}>
      <AppBar back title='Complain' isDarkMode={isDarkMode}/>

      <Box mx={moderateScale(15)} mt={moderateScaleVertical(25)} gap={moderateScaleVertical(20)}>
        <Dropdown
          style={localStyles.dropdown}
          placeholderStyle={localStyles.placeholderStyle}
          selectedTextStyle={localStyles.selectedTextStyle}
          data={ComplainType}
          labelField="label"
          valueField="value"
          placeholder={'Select Complain Type'}
          // value={formik.values.bookingfor}
          onChange={(item) => { setSelectedComplainType(item?.value) }}
          renderRightIcon={() => <Icon as={ChevronDownIcon} size="lg" mr='$2' />}
          selectedTextProps={{ numberOfLines: 1 }}
          renderItem={(item) => { return (<Text fontFamily='$poppinsMedium' fontSize={14} lineHeight={16} color={colors.black} numberOfLines={1} style={{ paddingHorizontal: responsiveWidth(2.5), paddingVertical: responsiveHeight(1.5) }} >{item?.label}</Text>) }}
          itemTextStyle={localStyles.selectedTextStyle}
          itemContainerStyle={localStyles.itemContainerStyle}
        />

        <Textarea
          size="md"
          isReadOnly={false}
          isInvalid={false}
          isDisabled={false}
          w={'100%'}
          borderColor={colors.silverGray}
          $focus-borderColor={colors.silverGray}
        >
          <TextareaInput fontFamily='$poppinsMedium' fontSize={14} lineHeight={16} placeholderTextColor={isDarkMode ? colors.white :colors.silverGray} numberOfLines={5} placeholder="Write your complain here (minimum 10 characters)" />
        </Textarea>


        <PrimaryButton onPress={() => setShowModal(true)} buttonText='Submit' />

      </Box>

      <Modal
        animationType="slide"
        transparent={true}
        visible={showModal}
      >
        <Box flex={1} justifyContent='center' alignItems='center' backgroundColor='rgba(0, 0, 0, 0.5)' >
          <Box backgroundColor={isDarkMode ? colors.black : colors.white} w={'92%'} h={'42%'} borderRadius={moderateScale(10)}>


            <Box alignItems='center' justifyContent='center' gap={moderateScaleVertical(20)}>
              <Pressable hitSlop={20} onPress={() => setShowModal(false)} alignSelf='flex-end' mr={moderateScale(20)} mt={moderateScaleVertical(20)}>
                <Icon as={CloseIcon} w="$4" h="$4" />
              </Pressable>
              <Image alt='icon' source={Icons.RightTick} resizeMode='contain' w={moderateScale(124)} h={moderateScale(124)} />

              <Box alignItems='center' justifyContent='center' gap={moderateScaleVertical(10)}>
                <Text fontFamily={'$poppinsMedium'} fontSize={20} lineHeight={22} color={isDarkMode ? colors.white : colors.charcoalGray} numberOfLines={1}>Send successful</Text>
                <Text fontFamily={'$poppinsMedium'} fontSize={12} lineHeight={14} color={isDarkMode ? colors.white : colors.charcoalGray} numberOfLines={2} textAlign='center'>Your complain has been send successful</Text>
              </Box>

            </Box>

            <PrimaryButton buttonText='Back To Home' onPress={() => navigation?.reset({ index: 0, routes: [{ name: NavigationString.Home }] })} marginHorizontal={moderateScale(15)} marginVertical={moderateScaleVertical(20)} />


          </Box>
        </Box>
      </Modal>


    </Container>
  )
}

export default Complain

const localStyles = StyleSheet.create({

  dropdown: {
    borderRadius: moderateScale(6),
    height: moderateScale(56),
    paddingLeft: moderateScale(10),
    borderWidth: 1,
    borderColor: colors.silverGray,
  },
  labelStyle: {
    // ...styles.mt15,
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