import React, { useEffect } from 'react';
import {GluestackUIProvider} from '@gluestack-ui/themed';
import 'react-native-get-random-values';

import {config} from './gluestack-ui.config';
import AppNavigator from './src/navigation';
import {ThemeProvider} from './src/constants/ThemeContext';
import {store} from './src/store/reduxStore/store';
import {Provider} from 'react-redux';
import { checkNotificationPermission, getFCMToken, requestNotificationPermission, showPermissionRationale } from './src/utils/notifications';
import crashlytics from '@react-native-firebase/crashlytics';
import { loadUserFromStorage } from './src/store/slice/UserSlice';
import socketServices from './src/utils/socketServices';
import AsyncStorage from '@react-native-async-storage/async-storage';

const App = () => {
  useEffect(() => {
    crashlytics().log('App started with crash analytics.......');

    let socketInitialized = false;

    const initApp = async () => {
      try {
        // Initialize notifications
        await initNotifications();
        
        // Initialize socket when we have a token
        const userData = await loadUserFromStorage();
        const userToken: any = await AsyncStorage.getItem('userToken');
        console.log("userData in app file>>>>>>>>>>>>>>", userData);
        console.log("userData in app file>>>>>>>>>>>>>>", userToken);
        // console.log("userData?.token && !socketInitialized >>>>>>>>>>>>>>", userToken && !socketInitialized);
        
        if (userToken && !socketInitialized) {
          // console.log("Initializing socket with user token", userData?.token);
          console.log("Initializing socket with user token>>>>>>>>>>>>>>>>>>>>>>>", userToken);
          await socketServices.initializeSocket(userToken);
          console.log(" socketServices.isConnected() at app >>>>>>>>>>>>>>>>>>>>>>>", socketServices.isConnected());
          socketInitialized = true;
        }
      } catch (error) {
        console.error('App initialization error:', error);
      }
    };

    const initNotifications = async () => {
      try {
        // Create notification channel (Android)
        // await createNotificationChannel();
        
        // Check permission
        const hasPermission = await checkNotificationPermission();
        if (!hasPermission) {
          const granted = await requestNotificationPermission();
          if (!granted) {
            // Show explanation if permission was denied
            showPermissionRationale();
          } else {
            // Get FCM token if permission was just granted
            const token = await getFCMToken();
          }
        } else {
          // Permission already granted - get FCM token
          const token = await getFCMToken();
        }
      } catch (error) {
        console.error('Notification initialization error:', error);
      }
    };

    initApp();

    return () => {
      // Clean up when app closes
      if (socketInitialized) {
        socketServices.disconnectSocket();
      }
    };
  }, []);

  return (
    <Provider store={store}>
      <ThemeProvider>
        <GluestackUIProvider config={config}>
          <AppNavigator />
        </GluestackUIProvider>
      </ThemeProvider>
    </Provider>
  );
};

export default App;
