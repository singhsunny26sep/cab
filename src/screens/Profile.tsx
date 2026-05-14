import React, {useEffect, useState} from 'react';
import {Box, Image, Pressable, Text, ScrollView} from '@gluestack-ui/themed';
import {DrawerNavigationProp} from '@react-navigation/drawer';
import {ParamListBase, useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import ImagePicker from 'react-native-image-crop-picker';
import {ActivityIndicator, Alert} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {colors} from '../constants/colors';
import {Container} from '../components/Container';
import {
  HamburgerIcon,
  WalletIcon,
  HistoryDrawerIcon,
  LocationDrawerIcon,
  OfferIcon,
  SettingDrawerIcon,
  SupportDrawerIcon,
  AboutUsdrawerIcon,
  LogoutDrawerIcon,
  LeftAngleIcon,
  EditProfileIcon,
} from '../components/Icons';
import {moderateScale, moderateScaleVertical} from '../utils/responsiveSize';
import {BASE_URL, Instance} from '../api/Instance.ts';
import {GET_PROFILE, GET_ALL_FAVORITE_ADDRESSES} from '../api/ApiEndpoints';
import {useTheme} from '../constants/ThemeContext';
import {
  loadUserFromStorage,
  saveUserToStorage,
  setProfileData,
  setFavoriteAddresses,
} from '../store/slice/UserSlice';
import {useDispatch} from 'react-redux';
import {NavigationString} from '../navigation/navigationStrings';

interface MenuItemProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onPress: () => void;
  showBadge?: boolean;
}

const MenuItem: React.FC<MenuItemProps> = ({
  icon,
  title,
  subtitle,
  onPress,
  showBadge,
}) => {
  const {isDarkMode} = useTheme();
  return (
    <Pressable
      onPress={onPress}
      flexDirection="row"
      alignItems="center"
      py={moderateScaleVertical(15)}
      px={moderateScale(20)}
      borderBottomWidth={1}
      borderBottomColor={isDarkMode ? colors.charcoalGray : colors.gray3}>
      <Box
        w={moderateScale(40)}
        h={moderateScale(40)}
        borderRadius={moderateScale(8)}
        bgColor={colors.themePrimary}
        alignItems="center"
        justifyContent="center"
        mr={moderateScale(15)}>
        {icon}
      </Box>
      <Box flex={1}>
        <Text
          fontFamily={'$poppinsMedium'}
          fontSize={16}
          color={isDarkMode ? colors.white : colors.charcoalGray}>
          {title}
        </Text>
        {subtitle && (
          <Text
            fontFamily={'$poppinsRegular'}
            fontSize={13}
            color={colors.gray2}
            mt={moderateScaleVertical(2)}>
            {subtitle}
          </Text>
        )}
      </Box>
      {showBadge && (
        <Box
          w={moderateScale(22)}
          h={moderateScale(22)}
          borderRadius={moderateScale(11)}
          bgColor={colors.alertColor}
          alignItems="center"
          justifyContent="center">
          <Text color={colors.white} fontSize={12} fontFamily={'$poppinsBold'}>
            2
          </Text>
        </Box>
      )}
      <LeftAngleIcon
        width={moderateScale(20)}
        height={moderateScale(20)}
        fill={colors.gray4}
      />
    </Pressable>
  );
};

type RootStackParamList = {
  Wallet: undefined;
  History: undefined;
  Favourite: undefined;
  Offers: undefined;
  Settings: undefined;
  HelpSupport: undefined;
  AboutUs: undefined;
  [key: string]: undefined;
};

const Profile = () => {
  const navigation = useNavigation<DrawerNavigationProp<ParamListBase>>();
  const stackNavigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const {isDarkMode} = useTheme();
  const dispatch = useDispatch();

  const [selectedImage, setSelectedImage] = useState(
    'https://i2.pngimg.me/thumb/f/720/m2H7K9A0b1d3b1m2.jpg',
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [userLocalData, setUserLocalData] = useState<any>(null);

  const error = console.error;
  console.error = (...args: any) => {
    if (/defaultProps/.test(args[0])) return;
    error(...args);
  };

  const onHandleSelectImg = () => {
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

  const getProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
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
        setSelectedImage(profileData?.imgUrl);
        dispatch(setProfileData({profileData}));
        const currentUserData: any = (await loadUserFromStorage()) || {};
        await saveUserToStorage({
          ...currentUserData,
          profileData,
        });
      }

      // Also sync favorite addresses
      try {
        const favoritesResponse = await Instance.get(
          GET_ALL_FAVORITE_ADDRESSES.url,
          {
            headers: {
              Authorization: token,
            },
          },
        );
        const favoriteData = favoritesResponse.data;
        dispatch(setFavoriteAddresses(favoriteData));
        await AsyncStorage.setItem(
          'favoriteAddresses',
          JSON.stringify(favoriteData),
        );
      } catch (favError) {
        console.log('Error fetching favorites:', favError);
      }
    } catch (error) {
      setLoading(false);
      console.log('error for fetching profile...', error);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.clear();
            // Navigate to login or splash
            navigation.reset({
              index: 0,
              routes: [{name: 'Login'}],
            });
          },
        },
      ],
      {cancelable: false},
    );
  };

  useEffect(() => {
    loadUserLocalDatas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadUserLocalDatas = async () => {
    setLoading(true);
    const localData = await loadUserFromStorage();
    console.log('local data....', localData);
    setUserLocalData(localData);
    await getProfile();
  };

  // Menu items for Uber-style profile with navigation
  const menuItems: MenuItemProps[] = [
    {
      icon: <WalletIcon width={20} height={20} />,
      title: 'Payment Methods',
      subtitle: 'Add debit card, credit card, UPI',
      onPress: () => stackNavigation.navigate(NavigationString.Wallet),
    },
    {
      icon: <HistoryDrawerIcon width={20} height={20} />,
      title: 'Ride History',
      subtitle: 'Your past trips',
      onPress: () => stackNavigation.navigate(NavigationString.History),
    },
    {
      icon: <LocationDrawerIcon width={20} height={20} />,
      title: 'Saved Places',
      subtitle: 'Home, Work, and other places',
      onPress: () => stackNavigation.navigate(NavigationString.Favourite),
    },
    {
      icon: <OfferIcon width={20} height={20} />,
      title: 'Promotions',
      subtitle: 'Apply coupon codes',
      onPress: () => stackNavigation.navigate(NavigationString.Offers),
      showBadge: true,
    },
  ];

  const settingsItems: MenuItemProps[] = [
    {
      icon: <SettingDrawerIcon width={20} height={20} />,
      title: 'Settings',
      onPress: () => stackNavigation.navigate(NavigationString.Settings),
    },
    {
      icon: <SupportDrawerIcon width={20} height={20} />,
      title: 'Help & Support',
      onPress: () => stackNavigation.navigate(NavigationString.HelpSupport),
    },
    {
      icon: <AboutUsdrawerIcon width={20} height={20} />,
      title: 'About Us',
      onPress: () => stackNavigation.navigate(NavigationString.AboutUs),
    },
  ];

  return (
    <Container
      statusBarStyle={isDarkMode ? 'light-content' : 'dark-content'}
      statusBarBackgroundColor={isDarkMode ? '#000000' : '#ffffff'}
      backgroundColor={isDarkMode ? '#000000' : '#ffffff'}>
      {/* Header */}
      <Box
        flexDirection="row"
        alignItems="center"
        justifyContent="space-between"
        py={moderateScaleVertical(15)}
        px={moderateScale(15)}
        borderBottomWidth={1}
        borderBottomColor={isDarkMode ? colors.charcoalGray : colors.gray3}>
        <Box flex={1}>
          <Pressable
            onPress={() => {
              navigation.openDrawer();
            }}
            bgColor={colors.themePrimary}
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
            Account
          </Text>
        </Box>

        <Box flex={1}></Box>
      </Box>

      {loading ? (
        <Box flex={1} justifyContent="center" alignItems="center">
          <ActivityIndicator size="large" color={colors.themePrimary} />
        </Box>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{paddingBottom: moderateScaleVertical(100)}}>
          {/* Profile Section - Uber Style */}
          <Box
            bgColor={isDarkMode ? colors.charcoalGray : colors.white}
            pb={moderateScaleVertical(20)}
            borderBottomWidth={1}
            borderBottomColor={isDarkMode ? colors.dimGray : colors.gray3}>
            {/* Profile Image */}
            <Box alignItems="center" mt={moderateScaleVertical(25)}>
              <Box
                w={moderateScale(90)}
                h={moderateScale(90)}
                borderRadius={moderateScale(45)}
                overflow="hidden"
                borderWidth={3}
                borderColor={colors.themePrimary}>
                <Image
                  alt="profile"
                  source={{uri: selectedImage}}
                  w={'100%'}
                  h={'100%'}
                  resizeMode="cover"
                />
              </Box>

              {/* Edit Button */}
              <Pressable
                onPress={() => {
                  onHandleSelectImg();
                }}
                position="absolute"
                right={moderateScale(110)}
                top={moderateScaleVertical(55)}
                w={moderateScale(32)}
                h={moderateScale(32)}
                borderRadius={moderateScale(16)}
                bg={colors.themePrimary}
                alignItems="center"
                justifyContent="center"
                borderWidth={2}
                borderColor={colors.white}>
                <EditProfileIcon width={16} height={16} />
              </Pressable>
            </Box>

            {/* User Info */}
            <Box alignItems="center" mt={moderateScaleVertical(15)}>
              <Text
                fontFamily={'$poppinsSemiBold'}
                fontSize={20}
                color={isDarkMode ? colors.white : colors.charcoalGray}>
                {userLocalData?.profileData?.name || 'User Name'}
              </Text>
              <Text
                fontFamily={'$poppinsRegular'}
                fontSize={14}
                color={colors.gray4}
                mt={moderateScaleVertical(2)}>
                {userLocalData?.profileData?.email || 'user@email.com'}
              </Text>
            </Box>

            {/* Rating Section */}
            <Box
              flexDirection="row"
              alignItems="center"
              justifyContent="center"
              mt={moderateScaleVertical(12)}>
              <Box
                bgColor={colors.themePrimary}
                px={moderateScale(10)}
                py={moderateScaleVertical(4)}
                borderRadius={moderateScale(15)}
                flexDirection="row"
                alignItems="center">
                <Text
                  fontFamily={'$poppinsBold'}
                  fontSize={14}
                  color={colors.black}>
                  4.8
                </Text>
                <Text
                  fontFamily={'$poppinsRegular'}
                  fontSize={12}
                  color={colors.black}
                  ml={moderateScale(2)}>
                  Rating
                </Text>
              </Box>
              <Box
                w={1}
                h={moderateScaleVertical(15)}
                bgColor={colors.gray4}
                mx={moderateScale(15)}
              />
              <Text
                fontFamily={'$poppinsMedium'}
                fontSize={14}
                color={isDarkMode ? colors.white : colors.charcoalGray}>
                {userLocalData?.profileData?.totalRides || 0} trips
              </Text>
            </Box>
          </Box>

          {/* Menu Items Section */}
          <Box mt={moderateScaleVertical(10)}>
            {menuItems.map((item, index) => (
              <MenuItem
                key={index}
                icon={item.icon}
                title={item.title}
                subtitle={item.subtitle}
                onPress={item.onPress}
                showBadge={item.showBadge}
              />
            ))}
          </Box>

          {/* Settings Section */}
          <Box mt={moderateScaleVertical(20)}>
            <Text
              fontFamily={'$poppinsMedium'}
              fontSize={14}
              color={colors.gray4}
              px={moderateScale(20)}
              mb={moderateScaleVertical(5)}>
              PREFERENCES
            </Text>
            <Box
              bgColor={isDarkMode ? colors.charcoalGray : colors.white}
              borderTopWidth={1}
              borderBottomWidth={1}
              borderColor={isDarkMode ? colors.dimGray : colors.gray3}>
              {settingsItems.map((item, index) => (
                <MenuItem
                  key={index}
                  icon={item.icon}
                  title={item.title}
                  onPress={item.onPress}
                />
              ))}
            </Box>
          </Box>

          {/* Logout Section */}
          <Box mt={moderateScaleVertical(20)} mb={moderateScaleVertical(30)}>
            <Box
              bgColor={isDarkMode ? colors.charcoalGray : colors.white}
              borderTopWidth={1}
              borderBottomWidth={1}
              borderColor={isDarkMode ? colors.dimGray : colors.gray3}>
              <Pressable
                onPress={handleLogout}
                flexDirection="row"
                alignItems="center"
                py={moderateScaleVertical(15)}
                px={moderateScale(20)}>
                <Box
                  w={moderateScale(40)}
                  h={moderateScale(40)}
                  borderRadius={moderateScale(8)}
                  bgColor={colors.lightPink}
                  alignItems="center"
                  justifyContent="center"
                  mr={moderateScale(15)}>
                  <LogoutDrawerIcon width={20} height={20} />
                </Box>
                <Text
                  fontFamily={'$poppinsMedium'}
                  fontSize={16}
                  color={colors.alertColor}>
                  Log Out
                </Text>
              </Pressable>
            </Box>
          </Box>

          {/* App Version */}
          <Box alignItems="center" mb={moderateScaleVertical(20)}>
            <Text
              fontFamily={'$poppinsRegular'}
              fontSize={12}
              color={colors.gray4}>
              Version 1.0.0
            </Text>
          </Box>
        </ScrollView>
      )}
    </Container>
  );
};

export default Profile;
