import React, { useRef, useState } from 'react'
import { FlatList, Modal, View } from 'react-native'
import { Box, CircleIcon, CloseIcon, Icon, Image, Pressable, Text } from '@gluestack-ui/themed'
import RBSheet from 'react-native-raw-bottom-sheet'
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { ParamListBase, useNavigation } from '@react-navigation/native';

import { Container } from '../components/Container'
import { AppBar } from '../components/AppBar'
import { colors } from '../constants/colors'
import { moderateScale, moderateScaleVertical } from '../utils/responsiveSize'
import Icons from '../assets/Icons'
import { CopyIcon, HamburgerIcon, OfferInfoIcon, ShopingBagIcon } from '../components/Icons'
import { shadowStyle } from '../constants/contants'
import PrimaryButton from '../components/Button/PrimaryButton'
import { Line, Svg } from 'react-native-svg';
import { useTheme } from '../constants/ThemeContext';

const OfferCard = ({ item, index, open }: { item: string, index: number, open: () => void }) => {
  const { isDarkMode } = useTheme();
  return (
    <Pressable onPress={open} flexDirection='row' alignItems='center' h={moderateScale(77)}  bgColor={isDarkMode ? colors.charcoalGray : colors.white}  borderWidth={1} borderColor={colors.themePrimary} px={moderateScale(10)} borderRadius={moderateScale(10)} gap={moderateScale(10)}>
      <Box w={moderateScale(50)} h={moderateScale(50)} borderRadius={moderateScale(25)} bgColor={colors.ivoryYellow} alignItems='center' justifyContent='center'>
        {/* <Image alt='icon' source={Icons.creditcard} resizeMode='contain' w={moderateScale(24)} h={moderateScale(24)} /> */}
        <ShopingBagIcon />
      </Box>

      <Box flex={1} gap={moderateScaleVertical(3)}>
        <Text fontFamily={'$poppinsBold'} fontSize={16} lineHeight={18} color={isDarkMode ? colors.white : colors.charcoalGray} numberOfLines={1}>Discount 15% off</Text>
        <Text fontFamily={'$poppinsRegular'} fontSize={12} lineHeight={14} color={isDarkMode ? colors.white : "#898989"} numberOfLines={1}>Special Promo valid for Black Friday</Text>

      </Box>
    </Pressable>
  )
}

const Offers = () => {

  // init
  const navigation = useNavigation<DrawerNavigationProp<ParamListBase>>();
  const refRBSheet: any = useRef();
  const { isDarkMode } = useTheme();  
  // state
  const [showInfoDetails, setShowInfoDetails] = useState(false)

  const onHandleOpenInfo = () => {
    setShowInfoDetails(true)
  }

  return (
    <Container   statusBarStyle={isDarkMode ? 'light-content' : 'dark-content'}  statusBarBackgroundColor={isDarkMode ? '#000000' : '#f5f5f5'}  backgroundColor={isDarkMode ? '#000000' : '#f5f5f5'}>
      <Box flexDirection='row' alignItems='center' justifyContent='space-between' py={moderateScaleVertical(15)} px={moderateScale(15)}>
        <Box flex={1}>
          <Pressable onPress={() => { navigation.openDrawer() }} bgColor={colors.paleYellow} w={moderateScale(32)} h={moderateScale(32)} borderRadius={moderateScale(5)} alignItems='center' justifyContent='center'>
            <HamburgerIcon />
          </Pressable>
        </Box>

        <Box alignItems='center' flex={1} >
          <Text fontFamily={'$poppinsMedium'} fontSize={18} lineHeight={20} color={isDarkMode ? colors.white : colors.charcoalGray} numberOfLines={1} >Special Offer</Text>
        </Box>

        <Box flex={1}></Box>
      </Box>

      <FlatList
        data={['01', '02', '03', '04', '05', '06', '07', '08', '09', '10']}
        renderItem={({ item, index }: { item: string, index: number }) => <OfferCard item={item} index={index} open={onHandleOpenInfo} />}
        keyExtractor={(item) => item?.toString()}
        showsVerticalScrollIndicator={false}
        style={{}}
        contentContainerStyle={{ marginHorizontal: moderateScale(15), gap: moderateScaleVertical(15), paddingBottom: moderateScaleVertical(15) }}
      />

      <Modal
        animationType="slide"
        transparent={true}
        visible={showInfoDetails}

      >
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0, 0, 0, 0.5)' }} >
          <View style={{ backgroundColor: isDarkMode ? '#1A1A1A' : '#fff', width: '100%', height: '70%', borderTopLeftRadius: moderateScale(25), borderBottomLeftRadius: 0, borderTopRightRadius: moderateScale(25), borderBottomRightRadius: moderateScale(1), paddingTop: moderateScaleVertical(15) }}>
            <Pressable onPress={() => setShowInfoDetails(false)} alignSelf='flex-end' pr={moderateScale(15)} mb={moderateScaleVertical(10)}>
              <Icon as={CloseIcon} color='#5A5A5A' w="$4" h="$4" />
            </Pressable>

            <Text fontFamily={'$poppinsMedium'} fontSize={20} lineHeight={22} color={isDarkMode ? colors.white : colors.charcoalGray}  numberOfLines={1} alignSelf='center'>Select address</Text>
            <Box borderBottomWidth={1} borderBottomColor='#DDDDDD' my={moderateScaleVertical(10)}></Box>

            <OfferInfoIcon style={{ alignSelf: 'center', marginVertical: moderateScaleVertical(25) }} />

            <Box gap={moderateScaleVertical(3)} alignItems='center'>
              <Text fontFamily={'$poppinsBold'} fontSize={26} lineHeight={28} color={isDarkMode ? colors.white : colors.charcoalGray}  numberOfLines={1}>Discount 15% off</Text>
              <Text fontFamily={'$poppinsRegular'} fontSize={12} lineHeight={14} color={'#898989'} numberOfLines={1}>Special Promo valid for Black Friday</Text>
              <Box flexDirection='row' alignItems='center' justifyContent='center' w={moderateScale(130)} h={moderateScale(40)} bgColor={colors.paleYellow} borderRadius={moderateScale(3)} my={moderateScaleVertical(10)} gap={moderateScale(10)}>
                <Text fontFamily={'$poppinsBold'} fontSize={18} lineHeight={20} color={colors.charcoalGray} numberOfLines={1}>DISC35</Text>
                <CopyIcon />
              </Box>
            </Box>

            <Svg height="2" width="100%">
              <Line
                x1="0"
                y1="0"
                x2="100%"
                y2="0"
                stroke={colors.silverGray}
                strokeWidth="2"
                strokeDasharray="4, 2"
              />
            </Svg>
            <Box mx={moderateScale(15)} my={moderateScaleVertical(10)} gap={moderateScaleVertical(10)}>
              <Text fontFamily={'$poppinsMedium'} fontSize={14} lineHeight={16} color={colors.charcoalGray} numberOfLines={1}>Terms and Conditions</Text>

              <Box flexDirection='row' alignItems='center' gap={moderateScale(8)}>
                <Icon as={CircleIcon} color='#A0A0A0' w={moderateScale(7)} h={moderateScale(7)} alignSelf='flex-start' mt={moderateScaleVertical(2)} />
                <Text fontFamily={'$poppinsMedium'} fontSize={12} lineHeight={14} color={isDarkMode ? colors.white : "#A0A0A0"} numberOfLines={2}>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</Text>
              </Box>
              <Box flexDirection='row' alignItems='center' gap={moderateScale(8)}>
                <Icon as={CircleIcon} color='#A0A0A0' w={moderateScale(7)} h={moderateScale(7)} alignSelf='flex-start' mt={moderateScaleVertical(2)} />
                <Text fontFamily={'$poppinsMedium'} fontSize={12} lineHeight={14}  color={isDarkMode ? colors.white : "#A0A0A0"} numberOfLines={2}>Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</Text>
              </Box>
              <Box flexDirection='row' alignItems='center' gap={moderateScale(8)}>
                <Icon as={CircleIcon} color='#A0A0A0' w={moderateScale(7)} h={moderateScale(7)} alignSelf='flex-start' mt={moderateScaleVertical(2)} />
                <Text fontFamily={'$poppinsMedium'} fontSize={12} lineHeight={14}  color={isDarkMode ? colors.white : "#A0A0A0"} numberOfLines={2}>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.</Text>
              </Box>
            </Box>

            <PrimaryButton buttonText='Use Promo' marginHorizontal={moderateScale(15)} />


          </View>
        </View>
      </Modal>

    </Container>
  )
}

export default Offers