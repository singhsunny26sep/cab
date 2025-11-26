import {Box, ScrollView, Text, Toast, ToastTitle, useToast} from '@gluestack-ui/themed';

import {Container} from '../components/Container';
import {AppBar} from '../components/AppBar';
import {colors} from '../constants/colors';
import {moderateScale, moderateScaleVertical} from '../utils/responsiveSize';
import {useTheme} from '../constants/ThemeContext';
import {useEffect, useState} from 'react';
import {BASE_URL, Instance} from '../api/Instance';
import {GET_PRIVACY_POLICIES} from '../api/ApiEndpoints';
import { ActivityIndicator } from 'react-native';

const PrivacyPolicy = () => {
  const {isDarkMode} = useTheme();
  const toast = useToast();
  const [loading, setLoading] = useState<boolean>(false);
  const [privacyData, setPrivacyData] = useState<any>(null);

  useEffect(() => {
    fetchPrivacyPolicies();
  }, []);

  const fetchPrivacyPolicies = async () => {
    setLoading(true);
    try {
      // const token = await AsyncStorage.getItem('userToken');

      const url = `${BASE_URL}${GET_PRIVACY_POLICIES.url}`;
      const response = await Instance.get(url, {
        // headers: {
        //   Authorization: token,
        // },
      });
      console.log('--- Terms & Conditions --- API response ---', response.data);
      setLoading(false);
      if (response.data.success) {
        setPrivacyData(response.data.data.privacyPolicies);
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
                {error?.response?.message || 'Unable to fetch data.'}
              </ToastTitle>
            </Toast>
          );
        },
      });
    }
  };

  return (
    <Container
      statusBarStyle={isDarkMode ? 'light-content' : 'dark-content'}
      statusBarBackgroundColor={isDarkMode ? '#000000' : '#ffffff'}
      backgroundColor={isDarkMode ? '#000000' : '#ffffff'}>
      <AppBar back title="Privacy Policies" isDarkMode={isDarkMode} />
      {loading ? (
        <Box flex={1} justifyContent="center" alignItems="center">
          <ActivityIndicator size="large" color="#00ff00" />
        </Box>
      ) : (
        <ScrollView mb={moderateScale(10)} showsVerticalScrollIndicator={false}>
          {privacyData?.map((item: any) => {
            return (
              <>
                <Text
                  fontFamily={'$poppinsRegular'}
                  fontSize={14}
                  lineHeight={16}
                  color={isDarkMode ? colors.white : colors.charcoalGray}
                  numberOfLines={22}
                  textAlign="justify"
                  mx={moderateScale(15)}
                  mt={moderateScaleVertical(25)}>
                  {item?.title}
                </Text>
                <Text
                  fontFamily={'$poppinsRegular'}
                  fontSize={14}
                  lineHeight={16}
                  color={isDarkMode ? colors.white : colors.charcoalGray}
                  numberOfLines={22}
                  textAlign="justify"
                  mx={moderateScale(15)}
                  mt={moderateScaleVertical(25)}>
                  {item?.description}
                </Text>
              </>
            );
          })}
        </ScrollView>
      )}
    </Container>
  );
};

export default PrivacyPolicy;
