import {Box, Text, Toast, ToastTitle, useToast} from '@gluestack-ui/themed';

import {Container} from '../components/Container';
import {AppBar} from '../components/AppBar';
import {colors} from '../constants/colors';
import {moderateScale, moderateScaleVertical} from '../utils/responsiveSize';
import PrimaryButton from '../components/Button/PrimaryButton';
import {useTheme} from '../constants/ThemeContext';
import {useEffect, useState} from 'react';
import {loadUserFromStorage} from '../store/slice/UserSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {ParamListBase, useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {NavigationString} from '../navigation/navigationStrings';
import {BASE_URL, Instance} from '../api/Instance.ts';
import {DELETE_PROFILE} from '../api/ApiEndpoints';
import {ActivityIndicator} from 'react-native';

const DeleteAccount = () => {
  const navigation = useNavigation<NativeStackNavigationProp<ParamListBase>>();
  const toast = useToast();
  const {isDarkMode} = useTheme();

  // const [userLocalData, setUserLocalData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // useEffect(() => {
  //   loadUserLocalDatas();
  // }, []);

  // const loadUserLocalDatas = async () => {
  //   // setLoading(true);
  //   const localData = await loadUserFromStorage();
  //   console.log('--- DELETE ACCOUNT --- local data ---', localData);
  //   setUserLocalData(localData);
  // };

  const handleDeleteAccount = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      
      const url = `${BASE_URL}${DELETE_PROFILE.url}`;
      const response = await Instance.delete(url, {
        headers: {
          Authorization: token,
        },
      });
      console.log('--- DELETE ACCOUNT --- API response ---', response.data);
      setLoading(false);
      if (response.data.success) {
        await deleteLocalData();
        toast.show({
          placement: 'top',
          render: ({id}: any) => {
            const toastId = 'toast-' + id;
            return (
              <Toast nativeID={toastId} variant="accent" action="success">
                <ToastTitle>Account Deleted successfully.</ToastTitle>
              </Toast>
            );
          },
        });
      }
    } catch (error: any) {
      setLoading(false);
      toast.show({
        placement: 'top',
        render: ({id}: any) => {
          const toastId = 'toast-' + id;
          return (
            <Toast nativeID={toastId} variant="accent" action="error">
              <ToastTitle>Error during deleting account:</ToastTitle>
              <ToastTitle>
                {error?.response?.message || 'Unable to delete account.'}
              </ToastTitle>
            </Toast>
          );
        },
      });
    }
  };

  const deleteLocalData = async () => {
    try {
      await AsyncStorage.clear();
      navigation.reset({
        index: 0,
        routes: [{name: NavigationString.SignIn}],
      });
    } catch (error: any) {
      toast.show({
        placement: 'top',
        render: ({id}: any) => {
          const toastId = 'toast-' + id;
          return (
            <Toast nativeID={toastId} variant="accent" action="error">
              <ToastTitle>Error during deleting account:</ToastTitle>
              <ToastTitle>
                {error?.response?.message || 'Unable to delete account.'}
              </ToastTitle>
            </Toast>
          );
        },
      });
      console.error('Error during deleting account:', error);
    }
  };

  return (
    <Container
      statusBarStyle={isDarkMode ? 'light-content' : 'dark-content'}
      statusBarBackgroundColor={isDarkMode ? '#000000' : '#ffffff'}
      backgroundColor={isDarkMode ? '#000000' : '#ffffff'}>
      <AppBar back title="Delete Account" isDarkMode={isDarkMode} />
      {loading ? (
        <Box flex={1} justifyContent="center" alignItems="center">
          <ActivityIndicator size="large" color="#00ff00" />
        </Box>
      ) : (
        <Box
          flex={1}
          mx={moderateScale(15)}
          // mt={moderateScaleVertical(5)}
          py={moderateScaleVertical(15)}
          gap={moderateScaleVertical(10)}>
          <Text
            flex={1}
            // height={'100%'}
            fontFamily={'$poppinsRegular'}
            fontSize={14}
            lineHeight={18}
            color={isDarkMode ? colors.white : colors.charcoalGray}
            numberOfLines={22}
            textAlign="center">
            Are you sure you want to delete your account? {'\n'} Please read how
            account deletion will affect. {'\n'} {'\n'}Deleting your account
            removes personal information our database.{'\n'} {'\n'} Tour email
            becomes permanently reserved and same email cannot be re-use to
            register a new account.
          </Text>

          <PrimaryButton
            buttonText="Delete"
            backgroundColor={colors.vividRed}
            marginTop={moderateScaleVertical(20)}
            onPress={handleDeleteAccount}
          />
        </Box>
      )}
    </Container>
  );
};

export default DeleteAccount;
