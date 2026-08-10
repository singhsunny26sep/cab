import {PermissionsAndroid, Platform, Linking, Alert} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import {check, request, PERMISSIONS, RESULTS} from 'react-native-permissions';
import axios, {AxiosResponse} from 'axios';
import {GOOGLE_API_KEY} from '../constants/contants';

let locationAlertsShown = { unavailable: false, permission: false };

const showLocationUnavailableAlert = () => {
  if (!locationAlertsShown.unavailable) {
    locationAlertsShown.unavailable = true;
   
  }
};

const showLocationPermissionAlert = () => {
  if (!locationAlertsShown.permission) {
    locationAlertsShown.permission = true;
    Alert.alert(
      'Location Permission Required',
      'Please enable location permissions in settings',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => Linking.openSettings() },
      ],
    );
  }
};

// Common location permission types for Android and iOS
const LOCATION_PERMISSIONS = {
  android: {
    foreground: PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
    background: PERMISSIONS.ANDROID.ACCESS_BACKGROUND_LOCATION,
  },
  ios: PERMISSIONS.IOS.LOCATION_WHEN_IN_USE, // iOS will request always permission after when-in-use
};

const fetchAddress = async (latitude: number, longitude: number) => {
  try {
    // Using Google Geocoding API instead of Geoapify
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_API_KEY}`;
    const response: AxiosResponse = await axios.get(url, { timeout: 10000 });

    if (response.data?.status === 'OK' && response.data?.results?.[0]) {
      const addressData = response.data.results[0];
      const addressComponents = addressData.address_components;

      const getComponent = (types: string[]) => {
        const component = addressComponents.find((c: any) =>
          c.types.some((t: string) => types.includes(t)),
        );
        return component?.long_name || '';
      };

      return {
        formatted: addressData.formatted_address,
        street: getComponent(['street_number', 'route']),
        houseNumber: getComponent(['street_number']),
        postalCode: getComponent(['postal_code']),
        city: getComponent(['locality', 'administrative_area_level_2']),
        state: getComponent(['administrative_area_level_1']),
        country: getComponent(['country']),
      };
    }

    console.log('Address not found, status:', response.data?.status);
    return null;
  } catch (error) {
    console.log('❌ Address Fetch Error:', error);
    throw error;
  }
};
// Get location once with enhanced error handling and address information
export const getCurrentLocationOnce = async () => {
  try {
    const hasPermission = await requestLocationPermissions();
    if (!hasPermission) {
      console.warn('Location permission not granted');
      return null;
    }

    const position: any = await new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        position => resolve(position),
        error => {
          console.warn('Location error:', error);
          if (error.code === 1) {
            showLocationPermissionAlert();
          } else if (error.code === 2 || error.code === 3) {
            showLocationUnavailableAlert();
          }
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 60000,
        },
      );
    });

    const coords = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      heading: position.coords.heading || 0,
      accuracy: position.coords.accuracy,
      altitude: position.coords.altitude,
      speed: position.coords.speed,
    };

    // Fetch address information
    const address = await fetchAddress(coords.latitude, coords.longitude);

    return {
      coordinates: coords,
      address: address,
    };
  } catch (error) {
    console.warn('Error in getCurrentLocationOnce:', error);
    return null;
  }
};

// Check if location services are enabled on the device
export const checkDeviceLocationServices = async () => {
  return new Promise(resolve => {
    Geolocation.getCurrentPosition(
      () => resolve(true),
      (error: any) => {
        if (error.code === 2 || error.code === 3) {
          resolve(false);
        } else {
          resolve(true);
        }
      },
      {enableHighAccuracy: false, timeout: 5000, maximumAge: 10000},
    );
  });
};

// Open device location settings
export const openLocationSettings = () => {
  if (Platform.OS === 'android') {
    Linking.sendIntent('android.settings.LOCATION_SOURCE_SETTINGS').catch(
      () => {
        Linking.openSettings();
      },
    );
  } else {
    Linking.openURL('App-Prefs:Privacy&path=LOCATION');
  }
};

// Request appropriate location permissions
export const requestLocationPermissions = async () => {
  try {
    // Handle permissions based on platform
    if (Platform.OS === 'android') {
      // First check if permission is already granted
      const foregroundCheck = await check(LOCATION_PERMISSIONS.android.foreground);
      
      if (foregroundCheck === RESULTS.GRANTED) {
        return true;
      }

      // Request foreground permission first - this is essential for getting location
      const foregroundStatus = await request(
        LOCATION_PERMISSIONS.android.foreground,
      );

      if (foregroundStatus !== RESULTS.GRANTED) {
        console.log('Foreground location permission denied');
        if (foregroundStatus === RESULTS.BLOCKED) {
          Alert.alert(
            'Location Permission Required',
            'Please enable location permissions in settings to use this feature',
            [
              {text: 'Cancel', style: 'cancel'},
              {text: 'Open Settings', onPress: () => Linking.openSettings()},
            ],
          );
        } else {
          Alert.alert(
            'Location Permission Denied',
            'Location permission is required to track your position. Please grant permission to continue.',
            [
              {text: 'Cancel', style: 'cancel'},
              {text: 'Try Again', onPress: () => requestLocationPermissions()},
            ],
          );
        }
        return false;
      }

      // Background permission is optional and only needed for Android 10+
      // Skip background permission for now - foreground is sufficient for current location
      return true;
    } else {
      // iOS - request when-in-use first
      const whenInUseStatus = await request(LOCATION_PERMISSIONS.ios);

      if (whenInUseStatus === RESULTS.GRANTED) {
        // Then request always permission
        const alwaysStatus = await request(PERMISSIONS.IOS.LOCATION_ALWAYS);

        if (alwaysStatus !== RESULTS.GRANTED) {
          console.log(
            'Always location permission denied - app will work with when-in-use only',
          );
        }
        return true;
      } else if (whenInUseStatus === RESULTS.DENIED) {
        console.log('Location permission denied');
        Alert.alert(
          'Location Permission Denied',
          'Location permission is required to track your position. Please grant permission to continue.',
          [
            {text: 'Cancel', style: 'cancel'},
            {text: 'Try Again', onPress: () => requestLocationPermissions()},
          ],
        );
        return false;
      } else if (whenInUseStatus === RESULTS.BLOCKED) {
        Alert.alert(
          'Location Permission Required',
          'Please enable location permissions in settings to use this feature',
          [
            {text: 'Cancel', style: 'cancel'},
            {text: 'Open Settings', onPress: () => Linking.openSettings()},
          ],
        );
        return false;
      }
    }
  } catch (error) {
    console.warn('Error requesting location permissions:', error);
    return false;
  }
};

let watchId: any = null;
// Watch location continuously with comprehensive error handling
export const watchLocationContinuously = (
  onLocationChange: any,
  onError: any,
) => {
  return new Promise(resolve => {
    // Clear any previous watcher
    if (watchId !== null) {
      Geolocation.clearWatch(watchId);
    }

    // Start watching with more frequent updates
watchId = Geolocation.watchPosition(
      position => {
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          heading: position.coords.heading || 0,
          speed: position.coords.speed || 0,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          timestamp: position.timestamp,
        };
        onLocationChange(coords);
      },
      error => {
        console.warn('Watch position error:', error);
        if (onError) {
          onError(error);
        }

        // Automatically stop watching on permission errors
        if (error.code === 1) {
          stopWatchingLocation();
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
        distanceFilter: 5,
      },
    );

    //   console.log("Location watching started with ID:", watchId);
    resolve(true);
  });
};

export const stopWatchingLocation = () => {
  if (watchId !== null) {
    console.log('Stopping location watch with ID:', watchId);
    Geolocation.clearWatch(watchId);
    watchId = null;
  }
};

// Check current permission status
export const checkLocationPermissionStatus = async () => {
  try {
    if (Platform.OS === 'android') {
      const foregroundStatus = await check(
        LOCATION_PERMISSIONS.android.foreground,
      );
      const backgroundStatus = await check(
        LOCATION_PERMISSIONS.android.background,
      );

      return {
        foreground: foregroundStatus,
        background: backgroundStatus,
      };
    } else {
      const status = await check(LOCATION_PERMISSIONS.ios);
      const alwaysStatus = await check(PERMISSIONS.IOS.LOCATION_ALWAYS);

      return {
        whenInUse: status,
        always: alwaysStatus,
      };
    }
  } catch (error) {
    console.warn('Error checking permission status:', error);
    return null;
  }
};

export const resetLocationAlertFlags = () => {
  locationAlertsShown = { unavailable: false, permission: false };
};
