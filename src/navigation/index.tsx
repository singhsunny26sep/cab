import { View, Text } from 'react-native'
import React,{useEffect} from 'react'
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import MainNavigation from './type/MainStack';

const AppNavigator = () => {


  return (
    <NavigationContainer>
      <MainNavigation />
    </NavigationContainer>
  )
}

export default AppNavigator