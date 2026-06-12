
import React from 'react';
import {  NavigationContainer } from '@react-navigation/native';
import MainNavigation from './type/MainStack';

const AppNavigator = () => {

  return (
    <NavigationContainer>
      <MainNavigation />
    </NavigationContainer>
  );
};

export default AppNavigator;
