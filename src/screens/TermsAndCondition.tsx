import { View,  ActivityIndicator } from 'react-native'
import React, { useEffect, useState } from 'react'
import { useTheme } from '@gluestack-style/react';
import { Box, ScrollView, Toast, ToastTitle, useToast,Text, } from '@gluestack-ui/themed';
import { BASE_URL, Instance } from '../api/Instance.ts';
import { GET_TERMS_CONDITIONS } from '../api/ApiEndpoints';
import { Container } from '../components/Container';
import { AppBar } from '../components/AppBar';
import { colors } from '../constants/colors';
import { moderateScale } from '../constants/contants';
import { moderateScaleVertical } from '../utils/responsiveSize';

const TermsAndCondition = () => {
    const {isDarkMode} = useTheme();
      const toast = useToast();
      const [loading, setLoading] = useState<boolean>(false);
      const [termsData, setTermsData] = useState<any>(null);
    
      useEffect(() => {
        fetchTerms();
      }, []);
    
      const fetchTerms = async () => {
        setLoading(true);
        try {
          // const token = await AsyncStorage.getItem('userToken');
    
          const url = `${BASE_URL}${GET_TERMS_CONDITIONS.url}`;
          const response = await Instance.get(url, {
            // headers: {
            //   Authorization: token,
            // },
          });
          console.log('--- Terms & Conditions --- API response ---', response.data);
          setLoading(false);
          if (response.data.success) {
            setTermsData(response.data.data.termsAndCondition);
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
      backgroundColor={isDarkMode ? colors.black : colors.white}>
      <AppBar back title="Terms and Conditions" isDarkMode={isDarkMode} />

      {loading ? (
        <Box flex={1} justifyContent="center" alignItems="center">
          <ActivityIndicator size="large" color="#00ff00" />
        </Box>
      ) : (
        <ScrollView mb={moderateScale(10)} showsVerticalScrollIndicator={false}>
          {termsData?.map((item: any) => {
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
  )
}

export default TermsAndCondition