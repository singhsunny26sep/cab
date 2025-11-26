import messaging from '@react-native-firebase/messaging';
import {Platform, Alert, Linking} from 'react-native';
import {check, request, PERMISSIONS, RESULTS, Permission, PermissionStatus} from 'react-native-permissions';
import {NavigationProp} from '@react-navigation/native';

// Define notification permission type
type NotificationPermission = Permission | null;

// Get the correct permission constant based on platform
const getNotificationPermission = (): NotificationPermission => {
  if (Platform.OS === 'ios') {
    // For iOS, we use NOTIFICATIONS (iOS 12+) or APP_TRACKING_TRANSPARENCY (iOS 14+)
    // Note: You might need both depending on your needs
    return PERMISSIONS.IOS.APP_TRACKING_TRANSPARENCY;
  } else if (Platform.OS === 'android') {
    if (Platform.Version >= 33) {
      // Android 13+ requires POST_NOTIFICATIONS
      return (PERMISSIONS.ANDROID as any).POST_NOTIFICATIONS;
    }
    // For Android 12 and below, notifications are enabled by default
    return null;
  }
  return null;
};

// Request notification permission
export const requestNotificationPermission = async (): Promise<boolean> => {
  try {
    const permission = getNotificationPermission();
    
    // For Android <13, notifications are enabled by default
    if (permission === null) {
      return true;
    }

    const status = await request(permission);
    console.log('Permission request status:', status);
    return status === RESULTS.GRANTED;
  } catch (error) {
    console.log('Permission request error:', error);
    return false;
  }
};

// Check current permission status
export const checkNotificationPermission = async (): Promise<boolean> => {
  try {
    const permission = getNotificationPermission();
    
    // For Android <13, notifications are enabled by default
    if (permission === null) {
      return true;
    }

    const status = await check(permission);
    console.log('Permission check status:', status);
    
    if (status === RESULTS.UNAVAILABLE) {
      console.log('This feature is not available on this device');
      return false;
    }
    
    if (status === RESULTS.BLOCKED) {
      console.log('Permission is blocked - need to open settings');
      return false;
    }
    
    return status === RESULTS.GRANTED;
  } catch (error) {
    console.log('Permission check error:', error);
    return false;
  }
};

// Get FCM token (with permission check)
export const getFCMToken = async (): Promise<string | null> => {
  try {
    const hasPermission = await checkNotificationPermission();
    // console.log('FCM Token hasPermission:', hasPermission);

    if (!hasPermission) {
      const granted = await requestNotificationPermission();
      // console.log('FCM Token granted:', granted);
      if (!granted) return null;
    }

    const token = await messaging().getToken();
    // console.log('FCM Token:', token);
    return token;
  } catch (error) {
    console.log('FCM Token error:', error);
    return null;
  }
};

// Setup notification handlers
export const setupNotificationHandlers = (navigation: NavigationProp<any>) => {
  // Foreground handler
  const unsubscribeOnMessage = messaging().onMessage(async (remoteMessage: any) => {
    Alert.alert(
      remoteMessage.notification?.title || 'New message',
      remoteMessage.notification?.body,
      [
        {
          text: 'View',
          onPress: () => {
            if (remoteMessage.data?.screen) {
              navigation.navigate(remoteMessage.data.screen);
            }
          },
        },
        {text: 'Dismiss'},
      ]
    );
  });

  // Background/Quit state handler
  messaging().setBackgroundMessageHandler(async (remoteMessage: any) => {
    console.log('Background message:', remoteMessage);
  });

  // Notification opened handler
  const unsubscribeOnNotificationOpened = messaging()
    .onNotificationOpenedApp((remoteMessage: any) => {
      console.log('App opened from notification:', remoteMessage);
      if (remoteMessage.data?.screen) {
        navigation.navigate(remoteMessage.data.screen);
      }
    });

  // Check if app was opened from notification
  messaging()
    .getInitialNotification()
    .then((remoteMessage: any) => {
      if (remoteMessage) {
        console.log('App launched from notification:', remoteMessage);
        if (remoteMessage.data?.screen) {
          setTimeout(() => {
            navigation.navigate(remoteMessage.data.screen);
          }, 500);
        }
      }
    });

  return () => {
    unsubscribeOnMessage();
    unsubscribeOnNotificationOpened();
  };
};

// Create notification channel (Android only)
export const createNotificationChannels = async (): Promise<string | null> => {
  if (Platform.OS === 'android') {
    try {
      const channelId = 'default_channel_id';
      const channel = await (messaging() as any).createNotificationChannel({
        channelId,
        name: 'Default Channel',
        importance: 4, // IMPORTANCE_HIGH
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
      console.log('Notification channel created:', channel);
      return channelId;
    } catch (error) {
      console.log('Error creating notification channel:', error);
      return null;
    }
  }
  return null;
};

// Open app settings for permission management
export const openAppSettings = (): void => {
  Linking.openSettings().catch(() => {
    Alert.alert('Unable to open settings');
  });
};

// Show rationale for notification permission
export const showPermissionRationale = (): void => {
  Alert.alert(
    'Notifications Permission',
    'RioDriver need notification permission to send important updates and alerts.\n Please enable notifications in settings.',
    [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Open Settings', onPress: openAppSettings},
    ]
  );
};