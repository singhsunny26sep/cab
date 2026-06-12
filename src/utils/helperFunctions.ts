import axios from 'axios';
import { PermissionsAndroid, Platform } from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import GetLocation from 'react-native-get-location';
import { GEOAPIFY_API_KEY } from '../constants/contants';

export const locationPermission = () => new Promise(async (resolve, reject) => {
    if (Platform.OS === 'ios') {
        try {
            const permissionStatus = await Geolocation.requestAuthorization('whenInUse');
            if (permissionStatus === 'granted') {
                return resolve('granted');
            }
            reject('Permission not granted');
        } catch (error) {
            return reject(error);
        }
    }
    return PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    ).then((granted) => {
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
            resolve('granted');
        }
        return reject('Location Permission denied');
    }).catch((error) => {
        console.log('Ask Location permission error: ', error);
        return reject(error);
    });
});

export const getCurrentLocation = () =>
    new Promise((resolve, reject) => {
        Geolocation.getCurrentPosition(
            async (position) => {
                const cords = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    heading: position?.coords?.heading,
                };
                // Then fetch the address
                const address = await fetchAddress(cords.latitude, cords.longitude);
                resolve({...cords, address});
            },
            error => {
                reject(error.message);
            },
            { enableHighAccuracy: true, timeout: 30000, maximumAge: 10000 },
        );
    });

   export const fetchAddress = async (latitude: number, longitude: number) => {
        try {
          const url = `https://api.geoapify.com/v1/geocode/reverse?lat=${latitude}&lon=${longitude}&apiKey=${GEOAPIFY_API_KEY}`;
          const response = await axios.get(url);

          const addressData = response.data?.features?.[0]?.properties;
          if (addressData) {
            console.log('✅ Address Found:', addressData);
            return addressData;
          }

          console.log('Address not found');
        } catch (error) {
          console.log('❌ Address Fetch Error:', error);
          return error;
        }
      };
