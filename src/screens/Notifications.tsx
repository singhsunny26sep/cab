import React from 'react'
import { FlatList } from 'react-native'
import { Box, Image, Text } from '@gluestack-ui/themed'

import { Container } from '../components/Container'
import { AppBar } from '../components/AppBar'
import { colors } from '../constants/colors'
import { moderateScale, moderateScaleVertical } from '../utils/responsiveSize'
import Icons from '../assets/Icons'

const NotificationCard = ({ item, index }: { item: string, index: number }) => {
  return (
    <Box flexDirection='row' alignItems='center' h={moderateScale(77)} bgColor={colors.white} px={moderateScale(10)} borderRadius={moderateScale(10)} gap={moderateScale(10)}>
     <Box w={moderateScale(50)} h={moderateScale(50)} borderRadius={moderateScale(25)} bgColor={colors.black} alignItems='center' justifyContent='center'>
     <Image alt='icon' source={Icons.creditcard} resizeMode='contain' w={moderateScale(24)} h={moderateScale(24)} />
     </Box>
     
     <Box flex={1} gap={moderateScaleVertical(3)}>
     <Text fontFamily={'$poppinsSemiBold'} fontSize={16} lineHeight={18} color={colors.black} numberOfLines={1}>Payment Successfully!</Text>
     <Text fontFamily={'$poppinsRegular'} fontSize={12} lineHeight={14} color={'#898989'} numberOfLines={2}>Lorem ipsum dolor sit amet consectetur. Ultrici es tincidunt eleifend vitae</Text>

     </Box>
    </Box>
  )
}

const Notifications = () => {
  return (
    <Container statusBarStyle='dark-content' statusBarBackgroundColor={'#f5f5f5'} backgroundColor='#f5f5f5'>
      <AppBar back title='Notification' backgroundColor='#f5f5f5' />

      <FlatList
        data={['01', '02', '03', '04', '05', '06', '07','08','09','10']}
        renderItem={({ item, index }: { item: string, index: number }) => <NotificationCard item={item} index={index} />}
        keyExtractor={(item) => item?.toString()}
        showsVerticalScrollIndicator={false}
        style={{}}
        contentContainerStyle={{ marginHorizontal: moderateScale(15), gap: moderateScaleVertical(15), paddingBottom: moderateScaleVertical(15) }}
      />
    </Container>
  )
}

export default Notifications