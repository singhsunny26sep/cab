import {Container} from '../components/Container';
import {AppBar} from '../components/AppBar';
import {colors} from '../constants/colors';
import {Box, Text, Center, Spinner} from '@gluestack-ui/themed';
import {CopyIcon} from '../components/Icons';
import {moderateScale, moderateScaleVertical} from '../utils/responsiveSize';
import PrimaryButton from '../components/Button/PrimaryButton';
import {useTheme} from '../constants/ThemeContext';
import {useEffect, useState} from 'react';
import { loadUserFromStorage } from '../store/slice/UserSlice';
import { BASE_URL, Instance } from '../api/Instance.ts';
import { GET_PROFILE } from '../api/ApiEndpoints';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Share } from 'react-native';

const Referral = () => {
  const {isDarkMode} = useTheme();

  const [loading, setLoading] = useState<boolean>(false);
  const [referralCode, setReferralCode] = useState<any>('');
  const [isFetching, setIsFetching] = useState<boolean>(true);

  const getProfile = async () => {
    try {
      setIsFetching(true);
      const token = await AsyncStorage.getItem('userToken');
      console.log('user token in profile ....', token);
      if (!token) {
        setIsFetching(false);
        return;
      }
      const url = `${BASE_URL}${GET_PROFILE.url}`;
      const response = await Instance.get(url, {
        headers: {
          Authorization: token,
        },
      });
      setIsFetching(false);
      if (response.data.success) {
        const profileData = response.data.data;
        console.warn('response for get profile api at referal...', profileData);
        setReferralCode(profileData?.referralCode);
      }
    } catch (error) {
      setIsFetching(false);
      console.log('error for fetching profile...', error);
    }
  };

  const handleInvitePress = async () => {
    try {
      if (!referralCode) return;
      
      const shareOptions = {
        message: `Join me on Cabs using my referral code ${referralCode} and let's both earn ₹50! Download the app now and use my code when signing up.\n\n\ncode: ${referralCode}`,
        title: 'Earn ₹50 with my referral',
      };

      await Share.share(shareOptions);
    } catch (error) {
      console.log('Error sharing referral code:', error);
    }
  };

  useEffect(() => {
    loadUserLocalDatas();
  }, []);

  const loadUserLocalDatas = async () => {
    await getProfile();
  };

  if (isFetching) {
    return (
      <Container
        statusBarStyle={isDarkMode ? 'light-content' : 'dark-content'}
        statusBarBackgroundColor={isDarkMode ? '#000000' : '#ffffff'}
        backgroundColor={isDarkMode ? colors.black : colors.white}>
        <AppBar back title="Referral" isDarkMode={isDarkMode} />
        <Center flex={1}>
          <Spinner size="large" color={colors.themePrimary} />
        </Center>
      </Container>
    );
  }

  return (
    <Container
      statusBarStyle={isDarkMode ? 'light-content' : 'dark-content'}
      statusBarBackgroundColor={isDarkMode ? '#000000' : '#ffffff'}
      backgroundColor={isDarkMode ? colors.black : colors.white}>
      <AppBar back title="Referral" isDarkMode={isDarkMode} />

      <Box
        mx={moderateScale(15)}
        gap={moderateScaleVertical(10)}
        mt={moderateScaleVertical(30)}>
        <Text
          fontFamily={'$poppinsMedium'}
          fontSize={16}
          lineHeight={18}
          color={isDarkMode ? colors.white : colors.dimGray}
          numberOfLines={1}>
          Refer a friend and Earn.
        </Text>

        <Box
          flexDirection="row"
          alignItems="center"
          justifyContent="space-between"
          h={moderateScale(56)}
          px={moderateScale(15)}
          borderRadius={moderateScale(8)}
          borderColor={colors.silverGray}
          borderWidth={1}>
          <Text
            fontFamily={'$poppinsMedium'}
            fontSize={16}
            lineHeight={18}
            color={isDarkMode ? colors.white : colors.black}
            numberOfLines={1}>
            {referralCode}
          </Text>
          {/* <CopyIcon /> */}
        </Box>
      </Box>

      <PrimaryButton
        buttonText="Invite"
        marginHorizontal={moderateScale(15)}
        marginTop={moderateScaleVertical(30)}
        onPress={handleInvitePress}
      />
    </Container>
  );
};

export default Referral;