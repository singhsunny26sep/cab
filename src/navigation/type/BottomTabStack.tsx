import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { colors } from '../../constants/colors';
import { Box, Text } from '@gluestack-ui/themed';
import { HeartColorIcon, HeartIcon, HomeColorIcon, HomeIcon, OfferColorIcon, OfferIcon, ProfileColorIcon, ProfileIcon, WalletIcon, WalletLineIcon } from '../../components/Icons';
import { moderateScale, moderateScaleVertical } from '../../utils/responsiveSize';
import { NavigationString } from '../navigationStrings';
import { StackRoute } from '../navigationRoutes';
import { useTheme } from '../../constants/ThemeContext';


const BottomTabStack = () => {
  // init
  const Tab = createBottomTabNavigator();
  const { isDarkMode } = useTheme();

  return (
    <Tab.Navigator screenOptions={{
      headerShown: false,
      tabBarShowLabel: false,
      tabBarStyle: {
        backgroundColor: isDarkMode ? colors.black : colors.white,
        borderTopLeftRadius: moderateScale(20),
        borderTopRightRadius: moderateScale(20),
        position: 'absolute',
      }
    }}>
      <Tab.Screen name={NavigationString.Home} component={StackRoute.Home}
        options={{
          tabBarIcon: ({ focused }) => (
            <Box alignItems='center' justifyContent='center' gap={moderateScaleVertical(3)}>
              {focused ? <HomeColorIcon /> : <HomeIcon color={isDarkMode ? '#fff' : '#414141'} />}
              <Text fontFamily={focused ? '$poppinsSemiBold' : '$poppinsMedium'} fontSize={12} lineHeight={14} color={focused ? colors.themePrimary : (isDarkMode ? '#fff' : '#414141')} >
                Home
              </Text>
            </Box>
          )
        }}
      />
      <Tab.Screen name={NavigationString.Favourite} component={StackRoute.Favourite}
        options={{
          tabBarIcon: ({ focused }) => (
            <Box alignItems='center' justifyContent='center' gap={moderateScaleVertical(3)}>
              {focused ? <HeartColorIcon /> : <HeartIcon color={isDarkMode ? '#fff' : '#414141'} />}
              <Text fontFamily={focused ? '$poppinsSemiBold' : '$poppinsMedium'} fontSize={12} lineHeight={14} color={focused ? colors.themePrimary : (isDarkMode ? '#fff' : '#414141')} >
                Favourite
              </Text>
            </Box>
          )
        }} />
      <Tab.Screen name={NavigationString.Wallet} component={StackRoute.Wallet}
        options={{
          tabBarIcon: ({ focused }) => (
            <Box alignItems='center' justifyContent='center' gap={moderateScaleVertical(3)}>
              <Box mt={moderateScaleVertical(-50)} bg={colors.themePrimary} alignItems='center' justifyContent='center' w={moderateScale(50)} h={moderateScale(50)} borderRadius={moderateScale(30)}>
                {focused ? <WalletIcon /> : <WalletLineIcon color={isDarkMode ? '#fff' : '#414141'} />}
              </Box>
              <Text fontFamily={focused ? '$poppinsSemiBold' : '$poppinsMedium'} fontSize={12} lineHeight={14} color={focused ? colors.themePrimary : (isDarkMode ? '#fff' : '#414141')} bottom={0} position='absolute' mb={moderateScaleVertical(-20)}>
                Wallet
              </Text>
            </Box>
          )
        }} />
      <Tab.Screen name={NavigationString.Offers} component={StackRoute.Offers}
        options={{
          tabBarIcon: ({ focused }) => (
            <Box alignItems='center' justifyContent='center' gap={moderateScaleVertical(3)}>
              {focused ? <OfferColorIcon /> : <OfferIcon color={isDarkMode ? '#fff' : '#414141'} />}
              <Text fontFamily={focused ? '$poppinsSemiBold' : '$poppinsMedium'} fontSize={12} lineHeight={14} color={focused ? colors.themePrimary : (isDarkMode ? '#fff' : '#414141')} >
                Offers
              </Text>
            </Box>
          )
        }} />
      <Tab.Screen name={NavigationString.Profile} component={StackRoute.Profile}
        options={{
          tabBarIcon: ({ focused }) => (
            <Box alignItems='center' justifyContent='center' gap={moderateScaleVertical(3)}>
              {focused ? <ProfileColorIcon /> : <ProfileIcon color={isDarkMode ? '#fff' : '#414141'} />}
              <Text fontFamily={focused ? '$poppinsSemiBold' : '$poppinsMedium'} fontSize={12} lineHeight={14} color={focused ? colors.themePrimary : (isDarkMode ? '#fff' : '#414141')} >
                Profile
              </Text>
            </Box>
          )
        }} />
    </Tab.Navigator>
  );
}

export default BottomTabStack;
