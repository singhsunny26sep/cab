import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { StackRoute } from '../navigationRoutes';
import { NavigationString } from '../navigationStrings';

import DrawerStack from './DrawerStack';



const MainNavigation = () => {
  // init
  const Stack = createNativeStackNavigator();

  

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
      initialRouteName={NavigationString.Splash}>
      <Stack.Screen name={NavigationString.Splash} component={StackRoute.Splash} />
      <Stack.Screen name={NavigationString.OnBoarding} component={StackRoute.OnBoarding} />
      <Stack.Screen name={NavigationString.Welcome} component={StackRoute.Welcome} />
      <Stack.Screen name={NavigationString.SignUp} component={StackRoute.SignUp} />
      <Stack.Screen name={NavigationString.SignIn} component={StackRoute.SignIn} />
      <Stack.Screen name={NavigationString.OtpVerify} component={StackRoute.OtpVerify} />
      <Stack.Screen name={NavigationString.SetPassword} component={StackRoute.SetPassword} />
      <Stack.Screen name={NavigationString.CompleteProfile} component={StackRoute.CompleteProfile} />
      <Stack.Screen name={NavigationString.Login} component={StackRoute.Login} />
      <Stack.Screen name={NavigationString.DrawerStacks} component={DrawerStack} />
      <Stack.Screen name={NavigationString.SelectPath} component={StackRoute.SelectPath} />
      <Stack.Screen name={NavigationString.SelectTransport} component={StackRoute.SelectTransport} />
      <Stack.Screen name={NavigationString.AvailableTransport} component={StackRoute.AvailableTransport} />
      <Stack.Screen name={NavigationString.VehicleDetail} component={StackRoute.VehicleDetail} />
      <Stack.Screen name={NavigationString.ConfirmBooking} component={StackRoute.ConfirmBooking} />
      <Stack.Screen name={NavigationString.RideWaiting} component={StackRoute.RideWaiting} />
      <Stack.Screen name={NavigationString.BookingThanks} component={StackRoute.BookingThanks} />
      <Stack.Screen name={NavigationString.Notifications} component={StackRoute.Notifications} />
      <Stack.Screen name={NavigationString.ViewAllTransections} component={StackRoute.ViewAllTransections} />
      <Stack.Screen name={NavigationString.AddMoney} component={StackRoute.AddMoney} />
      <Stack.Screen name={NavigationString.History} component={StackRoute.History} />
      <Stack.Screen name={NavigationString.Complain} component={StackRoute.Complain} />
      <Stack.Screen name={NavigationString.Referral} component={StackRoute.Referral} />
      <Stack.Screen name={NavigationString.AboutUs} component={StackRoute.AboutUs} />
      <Stack.Screen name={NavigationString.HelpSupport} component={StackRoute.HelpSupport} />
      <Stack.Screen name={NavigationString.Settings} component={StackRoute.Settings} />
      <Stack.Screen name={NavigationString.PrivacyPolicy} component={StackRoute.PrivacyPolicy} />
      <Stack.Screen name={NavigationString.TermsAndCondition} component={StackRoute.TermsAndCondition} />
      <Stack.Screen name={NavigationString.ChangePassword} component={StackRoute.ChangePassword} />
      <Stack.Screen name={NavigationString.ContactUs} component={StackRoute.ContactUs} />
      <Stack.Screen name={NavigationString.DeleteAccount} component={StackRoute.DeleteAccount} />
      <Stack.Screen name={NavigationString.ForgotPassword} component={StackRoute.ForgetPassword}/>
      <Stack.Screen name={NavigationString.ConfrimRide} component={StackRoute.ConfrimRide}/>
      <Stack.Screen name={NavigationString.ChatScreen} component={StackRoute.ChatScreen}/>
      <Stack.Screen name={NavigationString.CallScreen} component={StackRoute.CallScreen}/>
    </Stack.Navigator>
  )
}

export default MainNavigation