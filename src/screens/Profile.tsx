import React, {useEffect, useState} from 'react';
import {
  Box,
  Image,
  Pressable,
  Text,
  Toast,
  ToastTitle,
  useToast,
} from '@gluestack-ui/themed';
import CountryPicker, {CountryCode} from 'react-native-country-picker-modal';
import {DrawerNavigationProp} from '@react-navigation/drawer';
import {ParamListBase, useNavigation} from '@react-navigation/native';
import ImagePicker from 'react-native-image-crop-picker';
import {ActivityIndicator, Alert} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {colors} from '../constants/colors';
import {Container} from '../components/Container';
import {CameraIcon, HamburgerIcon} from '../components/Icons';
import {moderateScale, moderateScaleVertical} from '../utils/responsiveSize';
import Body from '../components/Body/Body';
import InputText from '../components/TextInput/InputText';
import PrimaryButton from '../components/Button/PrimaryButton';
import {BASE_URL, Instance} from '../api/Instance';
import {GET_PROFILE, UPDATE_PROFILE} from '../api/ApiEndpoints';
import {useTheme} from '../constants/ThemeContext';
import {
  loadUserFromStorage,
  saveUserToStorage,
  setProfileData,
} from '../store/slice/UserSlice';
import {useDispatch, useSelector} from 'react-redux';
import {RootState} from '../store/reduxStore/store';

const Profile = () => {
  const navigation = useNavigation<DrawerNavigationProp<ParamListBase>>();
  const toast = useToast();
  const {isDarkMode} = useTheme();
  const dispatch = useDispatch();
  const userData = useSelector((state: RootState) => state.user);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    emergencyContactNumber: '',
    trackingNumber: '',
  });

  const [countryCode, setCountryCode] = useState<CountryCode>('IN');
  const [_country, setCountry] = useState(null);
  const [selectedImage, setSelectedImage] = useState(
    'https://i2.pngimg.me/thumb/f/720/m2H7K9A0b1d3b1m2.jpg',
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [userLocalData, setUserLocalData] = useState<any>(null);

  const handleCountrySelect = (country: any) => {
    // console.log(country);
    setCountryCode(country?.cca2);
    setCountry(country?.callingCode[0]);
  };

  const error = console.error;
  console.error = (...args: any) => {
    if (/defaultProps/.test(args[0])) return;
    error(...args);
  };

  const onHandleSelectImg = () => {
    // console.log('jjj');

    ImagePicker.openPicker({
      width: 300,
      height: 400,
      cropping: true,
      mediaType: 'photo',
      includeBase64: false,
    }).then(image => {
      console.log(image);
      setSelectedImage(image.path);
    });
  };

  const handleUpdateProfile = async () => {
    try {
      if (
        !formData.name ||
        !formData.email ||
        !formData.emergencyContactNumber
      ) {
        // Alert.alert('Error', 'Please fill all required fields');
        toast.show({
          placement: 'top',
          render: ({id}: any) => {
            const toastId = 'toast-' + id;
            return (
              <Toast nativeID={toastId} variant="accent" action="error">
                <ToastTitle>{'Please fill all required fields.'}</ToastTitle>
              </Toast>
            );
          },
        });
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        // Alert.alert('Error', 'Please enter a valid email address');
        toast.show({
          placement: 'top',
          render: ({id}: any) => {
            const toastId = 'toast-' + id;
            return (
              <Toast nativeID={toastId} variant="accent" action="error">
                <ToastTitle>{'Please enter a valid email address.'}</ToastTitle>
              </Toast>
            );
          },
        });
        return;
      }

      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        // Alert.alert('Error', 'Please login again');
        toast.show({
          placement: 'top',
          render: ({id}: any) => {
            const toastId = 'toast-' + id;
            return (
              <Toast nativeID={toastId} variant="accent" action="error">
                <ToastTitle>{'Please login again.'}</ToastTitle>
              </Toast>
            );
          },
        });
        return;
      }
      setLoading(true);
      const data = {
        name: formData.name,
        email: formData.email,
        imgUrl: selectedImage,
        contact: formData.emergencyContactNumber,
        emergencyContactNumber: formData.emergencyContactNumber,
        mobileNumber: formData.emergencyContactNumber,
        trackingNumber: formData.trackingNumber,
        city: userLocalData?.pickupDetails?.city,
        state: userLocalData?.pickupDetails?.state,
      };
      const response = await Instance.put(UPDATE_PROFILE.url, data, {
        headers: {
          Authorization: token,
        },
      });
      console.log('response after profile updated', response.data);
      if (response?.data?.success) {
        // Alert.alert('Success', 'Profile updated successfully');
        toast.show({
          placement: 'top',
          render: ({id}: any) => {
            const toastId = 'toast-' + id;
            return (
              <Toast nativeID={toastId} variant="accent" action="success">
                <ToastTitle>Profile updated successfully.</ToastTitle>
              </Toast>
            );
          },
        });
        if (response.data.data) {
          await getProfile();
          // await AsyncStorage.setItem(
          //   'userData',
          //   JSON.stringify(response.data.data),
          // );
        }
      } else {
        if (response?.data?.msg?.includes('token expired')) {
          await AsyncStorage.removeItem('userToken');
          toast.show({
            placement: 'top',
            render: ({id}: any) => {
              const toastId = 'toast-' + id;
              return (
                <Toast nativeID={toastId} variant="accent" action="error">
                  <ToastTitle>Session Expired, Please login again.</ToastTitle>
                </Toast>
              );
            },
          });
          // Alert.alert('Session Expired', 'Please login again');
          return;
        }
        const errorMessage = response?.data?.msg || 'Something went wrong';
        toast.show({
          placement: 'top',
          render: ({id}: any) => {
            const toastId = 'toast-' + id;
            return (
              <Toast nativeID={toastId} variant="accent" action="error">
                <ToastTitle>{errorMessage}</ToastTitle>
              </Toast>
            );
          },
        });
        // Alert.alert('Error', response?.data?.msg || 'Something went wrong');
      }
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.msg ||
        'Something went wrong while updating profile';
      toast.show({
        placement: 'top',
        render: ({id}: any) => {
          const toastId = 'toast-' + id;
          return (
            <Toast nativeID={toastId} variant="accent" action="error">
              <ToastTitle>{errorMessage}</ToastTitle>
            </Toast>
          );
        },
      });
      // Alert.alert(
      //   'Error',
      //   error?.response?.data?.msg ||
      //     'Something went wrong while updating profile',
      // );
      console.log('Profile update error:', error?.response || error);
    } finally {
      setLoading(false);
    }
  };

  const getProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      console.log('user token in profile ....', token);
      if (!token) {
        return;
      }
      const url = `${BASE_URL}${GET_PROFILE.url}`;
      const response = await Instance.get(url, {
        headers: {
          Authorization: token,
        },
      });
      setLoading(false);
      if (response.data.success) {
        const profileData = response.data.data;
        console.warn('response for get profile api...', profileData);
        setFormData(prev => ({
          ...prev,
          name: profileData?.name,
          email: profileData?.email,
          emergencyContactNumber: profileData?.mobileNumber?.toString(),
          trackingNumber: profileData?.trackingNumber?.toString(),
        }));
        setSelectedImage(profileData?.imgUrl);

        // Update Redux state
        dispatch(setProfileData({profileData}));
        const currentUserData: any = (await loadUserFromStorage()) || {};
        await saveUserToStorage({
          ...currentUserData,
          profileData,
        });
      }
    } catch (error) {
      setLoading(false);
      console.log('error for fetching profile...', error);
    }
  };

  useEffect(() => {
    loadUserLocalDatas();
  }, []);

  const loadUserLocalDatas = async () => {
    setLoading(true);
    const localData = await loadUserFromStorage();
    console.log('local data....', localData);
    setUserLocalData(localData);
    await getProfile();
  };

  // console.log('user local state data...', userLocalData);
  // console.log('form  data after fetch...', formData);

  return (
    <Container
      statusBarStyle={isDarkMode ? 'light-content' : 'dark-content'}
      statusBarBackgroundColor={isDarkMode ? '#000000' : '#ffffff'}
      backgroundColor={isDarkMode ? '#000000' : '#ffffff'}>
      <Box
        flexDirection="row"
        alignItems="center"
        justifyContent="space-between"
        py={moderateScaleVertical(15)}
        px={moderateScale(15)}>
        <Box flex={1}>
          <Pressable
            onPress={() => {
              navigation.openDrawer();
            }}
            bgColor={colors.paleYellow}
            w={moderateScale(32)}
            h={moderateScale(32)}
            borderRadius={moderateScale(5)}
            alignItems="center"
            justifyContent="center">
            <HamburgerIcon />
          </Pressable>
        </Box>

        <Box alignItems="center" flex={1}>
          <Text
            fontFamily={'$poppinsMedium'}
            fontSize={18}
            lineHeight={20}
            color={isDarkMode ? colors.white : colors.charcoalGray}
            numberOfLines={1}>
            Edit Profile
          </Text>
        </Box>

        <Box flex={1}></Box>
      </Box>
      {loading ? (
        <Box flex={1} justifyContent="center" alignItems="center">
          <ActivityIndicator size="large" color="#00ff00" />
        </Box>
      ) : (
        <Body>
          <Box
            alignSelf="center"
            mt={moderateScaleVertical(20)}
            mb={moderateScaleVertical(20)}>
            {/* <Avatar bgColor="$amber600" w={moderateScale(75)} h={moderateScale(75)} borderRadius="$full">
  <AvatarFallbackText>Danish Qureshi</AvatarFallbackText>
</Avatar> */}

            <Box
              w={moderateScale(85)}
              h={moderateScale(85)}
              borderRadius={moderateScale(50)}
              overflow="hidden">
              <Image
                alt="icon"
                // source={{ uri: !!selectedImage ? selectedImage : 'https://i2.pngimg.me/thumb/f/720/m2H7K9A0b1d3b1m2.jpg' }}
                source={{uri: selectedImage}}
                w={'100%'}
                h={'100%'}
                resizeMode="cover"
              />
            </Box>

            <Pressable
              onPress={() => {
                onHandleSelectImg();
              }}
              alignItems="center"
              justifyContent="center"
              position="absolute"
              w={moderateScale(25)}
              h={moderateScale(25)}
              borderRadius={moderateScale(20)}
              bg={colors.themePrimary}
              right={0}
              bottom={0}>
              <CameraIcon />
            </Pressable>
          </Box>

          <Box gap={moderateScaleVertical(20)} mx={moderateScaleVertical(15)}>
            <InputText
              textInputProps={{
                placeholder: 'Full Name',
                value: formData.name,
                onChangeText: text =>
                  setFormData(prev => ({...prev, name: text})),
              }}
            />

            <InputText
              textInputProps={{
                placeholder: 'Email',
                value: formData.email,
                onChangeText: text =>
                  setFormData(prev => ({...prev, email: text})),
              }}
            />

            <Box
              flexDirection="row"
              alignItems="center"
              borderWidth={1}
              borderColor={colors.silverGray}
              borderRadius={9}
              pl={moderateScale(10)}
              h={moderateScale(56)}>
              <CountryPicker
                countryCode={countryCode}
                onSelect={handleCountrySelect}
                withAlphaFilter
                withCallingCode
                withCallingCodeButton
                withFilter
                withFlag
              />

              <Box
                flex={1}
                borderLeftWidth={1}
                borderLeftColor="#DDDDDD"
                ml={moderateScale(10)}>
                <InputText
                  borderWith={0}
                  textInputProps={{
                    placeholder: 'Emergency Contact Number',
                    keyboardType: 'number-pad',
                    value: formData.emergencyContactNumber,
                    onChangeText: text =>
                      setFormData(prev => ({
                        ...prev,
                        emergencyContactNumber: text,
                      })),
                  }}
                />
              </Box>
            </Box>

            <InputText
              textInputProps={{
                placeholder: 'Tracking No.',
                value: formData.trackingNumber,
                onChangeText: text =>
                  setFormData(prev => ({...prev, trackingNumber: text})),
              }}
            />
          </Box>

          <PrimaryButton
            buttonText="Update"
            marginHorizontal={moderateScale(15)}
            marginVertical={moderateScaleVertical(20)}
            onPress={handleUpdateProfile}
          />
        </Body>
      )}
    </Container>
  );
};

export default Profile;
