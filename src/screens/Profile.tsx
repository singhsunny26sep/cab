import React, {useEffect, useState} from 'react';
import {Box, Image, Pressable, Text, ScrollView} from '@gluestack-ui/themed';
import {DrawerNavigationProp} from '@react-navigation/drawer';
import {ParamListBase, useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import ImagePicker from 'react-native-image-crop-picker';
import {ActivityIndicator, Alert, Dimensions} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

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

const {width} = Dimensions.get('window');
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface MenuItemProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onPress: () => void;
  showBadge?: boolean;
}

// ----------------------------------------------------------------------
// Clean Menu Item with subtle animations and minimal color
// ----------------------------------------------------------------------
const MenuItem: React.FC<MenuItemProps> = ({
  icon,
  title,
  subtitle,
  onPress,
  showBadge,
}) => {
  const {isDarkMode} = useTheme();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{scale: scale.value}],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, {damping: 10, stiffness: 150});
  };
  const handlePressOut = () => {
    scale.value = withSpring(1, {damping: 10, stiffness: 150});
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={animatedStyle}>
      <Box
        flexDirection="row"
        alignItems="center"
        py={moderateScaleVertical(14)}
        px={moderateScale(20)}
        bgColor={isDarkMode ? '#1C1C24' : '#FFFFFF'}
        mx={moderateScale(16)}
        my={moderateScaleVertical(4)}
        borderRadius={moderateScale(16)}
        style={{
          shadowColor: '#000',
          shadowOffset: {width: 0, height: 2},
          shadowOpacity: isDarkMode ? 0.2 : 0.04,
          shadowRadius: 8,
          elevation: 2,
        }}>
        {/* Icon Container - subtle solid or minimal gradient using themePrimary */}
        <Box
          w={moderateScale(48)}
          h={moderateScale(48)}
          borderRadius={moderateScale(14)}
          bgColor={colors.themePrimary + '15'} // 15% opacity
          alignItems="center"
          justifyContent="center"
          mr={moderateScale(16)}>
          {icon}
        </Box>

        <Box flex={1}>
          <Text
            fontFamily={'$poppinsSemiBold'}
            fontSize={16}
            color={isDarkMode ? colors.white : colors.charcoalGray}>
            {title}
          </Text>
          {subtitle && (
            <Text
              fontFamily={'$poppinsRegular'}
              fontSize={12}
              color={colors.gray4}
              mt={moderateScaleVertical(2)}>
              {subtitle}
            </Text>
          )}
        </Box>

        {showBadge && (
          <Box
            w={moderateScale(24)}
            h={moderateScale(24)}
            borderRadius={moderateScale(12)}
            bgColor={colors.alertColor}
            alignItems="center"
            justifyContent="center"
            mr={moderateScale(8)}>
            <Text color={colors.white} fontSize={12} fontFamily={'$poppinsBold'}>
              2
            </Text>
          </Box>
        )}
        <LeftAngleIcon
          width={moderateScale(18)}
          height={moderateScale(18)}
          fill={isDarkMode ? colors.gray4 : colors.gray3}
        />
      </Box>
    </AnimatedPressable>
  );
};

// ----------------------------------------------------------------------
// Main Profile Screen - Clean, Modern, Minimal Color
// ----------------------------------------------------------------------
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
    if (/defaultProps/.test(args[0])) {return;}
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
        console.log('Profile Data+++++++++++++++++++', profileData);
        setSelectedImage(profileData?.imgUrl);
        dispatch(setProfileData({profileData}));
        const currentUserData: any = (await loadUserFromStorage()) || {};
        await saveUserToStorage({
          ...currentUserData,
          profileData,
        });
      }

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
            navigation.reset({
              index: 0,
              routes: [{name: 'SignIn'}],
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

  const menuItems: MenuItemProps[] = [
    {
      icon: <WalletIcon width={22} height={22} color={colors.themePrimary} />,
      title: 'Payment Methods',
      subtitle: 'Add debit card, credit card, UPI',
      onPress: () => stackNavigation.navigate(NavigationString.Wallet),
    },
    {
      icon: <HistoryDrawerIcon width={22} height={22} color={colors.themePrimary} />,
      title: 'Ride History',
      subtitle: 'Your past trips',
      onPress: () => stackNavigation.navigate(NavigationString.History),
    },
    {
      icon: <LocationDrawerIcon width={22} height={22} color={colors.themePrimary} />,
      title: 'Saved Places',
      subtitle: 'Home, Work, and other places',
      onPress: () => stackNavigation.navigate(NavigationString.Favourite),
    },
    {
      icon: <OfferIcon width={22} height={22} color={colors.themePrimary} />,
      title: 'Promotions',
      subtitle: 'Apply coupon codes',
      onPress: () => stackNavigation.navigate(NavigationString.Offers),
      showBadge: true,
    },
  ];

  const settingsItems: MenuItemProps[] = [
    {
      icon: <SettingDrawerIcon width={22} height={22} color={colors.themePrimary} />,
      title: 'Settings',
      onPress: () => stackNavigation.navigate(NavigationString.Settings),
    },
    {
      icon: <SupportDrawerIcon width={22} height={22} color={colors.themePrimary} />,
      title: 'Help & Support',
      onPress: () => stackNavigation.navigate(NavigationString.HelpSupport),
    },
    {
      icon: <AboutUsdrawerIcon width={22} height={22} color={colors.themePrimary} />,
      title: 'About Us',
      onPress: () => stackNavigation.navigate(NavigationString.AboutUs),
    },
  ];

  return (
    <Container
      statusBarStyle={isDarkMode ? 'light-content' : 'dark-content'}
      statusBarBackgroundColor={isDarkMode ? '#0A0A0F' : '#F8F9FF'}
      backgroundColor={isDarkMode ? '#0A0A0F' : '#F8F9FF'}>
      {/* Glassmorphic Header - Clean */}
      <Box
        flexDirection="row"
        alignItems="center"
        justifyContent="space-between"
        py={moderateScaleVertical(16)}
        px={moderateScale(20)}
        style={{
          backgroundColor: isDarkMode
            ? 'rgba(26,26,36,0.8)'
            : 'rgba(255,255,255,0.9)',
          backdropFilter: 'blur(20px)',
          borderBottomWidth: 0,
          shadowColor: '#000',
          shadowOffset: {width: 0, height: 2},
          shadowOpacity: 0.05,
          shadowRadius: 10,
          elevation: 4,
        }}>
        <Pressable
          onPress={() => {
            navigation.openDrawer();
          }}
          bgColor={isDarkMode ? '#2C2C38' : '#FFFFFF'}
          w={moderateScale(44)}
          h={moderateScale(44)}
          borderRadius={moderateScale(16)}
          alignItems="center"
          justifyContent="center"
          style={{
            shadowColor: '#000',
            shadowOffset: {width: 0, height: 4},
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 5,
          }}>
          <HamburgerIcon width={22} height={22} />
        </Pressable>

        <Box alignItems="center" flex={1}>
          <Text
            fontFamily={'$poppinsSemiBold'}
            fontSize={20}
            lineHeight={24}
            color={isDarkMode ? colors.white : colors.charcoalGray}
            letterSpacing={-0.3}>
            My Profile
          </Text>
        </Box>
        <Box width={moderateScale(44)} />
      </Box>

      {loading ? (
        <Box flex={1} justifyContent="center" alignItems="center">
          <ActivityIndicator size="large" color={colors.themePrimary} />
        </Box>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{paddingBottom: moderateScaleVertical(80)}}>
          {/* Profile Card - Subtle border, no heavy gradients */}
          <Box
            mx={moderateScale(20)}
            mt={moderateScaleVertical(20)}
            mb={moderateScaleVertical(24)}
            bgColor={isDarkMode ? '#1C1C24' : '#FFFFFF'}
            borderRadius={moderateScale(30)}
            pt={moderateScaleVertical(28)}
            pb={moderateScaleVertical(22)}
            px={moderateScale(20)}
            alignItems="center"
            style={{
              shadowColor: '#000',
              shadowOffset: {width: 0, height: 4},
              shadowOpacity: 0.08,
              shadowRadius: 16,
              elevation: 6,
              borderWidth: 1,
              borderColor: isDarkMode ? '#2C2C38' : '#F0F0F0',
            }}>
            {/* Avatar with subtle accent ring */}
            <Box position="relative">
              <Box
                w={moderateScale(104)}
                h={moderateScale(104)}
                borderRadius={moderateScale(52)}
                borderWidth={3}
                borderColor={colors.themePrimary}
                overflow="hidden"
                bgColor={isDarkMode ? '#2C2C38' : '#F0F0F8'}>
                <Image
                  alt="profile"
                  source={{uri: selectedImage}}
                  w={'100%'}
                  h={'100%'}
                  resizeMode="cover"
                />
              </Box>

              {/* Edit Button - solid themePrimary */}
              <Pressable
                onPress={onHandleSelectImg}
                position="absolute"
                right={moderateScale(0)}
                bottom={moderateScale(0)}>
                <Box
                  w={moderateScale(36)}
                  h={moderateScale(36)}
                  borderRadius={moderateScale(18)}
                  bgColor={colors.themePrimary}
                  alignItems="center"
                  justifyContent="center"
                  borderWidth={2}
                  borderColor={isDarkMode ? '#1C1C24' : '#FFFFFF'}>
                  <EditProfileIcon width={18} height={18} color="#FFF" />
                </Box>
              </Pressable>
            </Box>

            {/* User Info */}
            <Box alignItems="center" mt={moderateScaleVertical(16)}>
              <Text
                fontFamily={'$poppinsBold'}
                fontSize={24}
                color={isDarkMode ? colors.white : colors.charcoalGray}>
                {userLocalData?.profileData?.name || 'User Name'}
              </Text>
            </Box>
            {/* Rating & Trips - clean pills */}
            <Box
              flexDirection="row"
              alignItems="center"
              justifyContent="center"
              mt={moderateScaleVertical(16)}
              gap={moderateScale(12)}>
              <Box
                bgColor={colors.themePrimary + '10'}
                px={moderateScale(16)}
                py={moderateScaleVertical(6)}
                borderRadius={moderateScale(30)}>
                <Text
                  fontFamily={'$poppinsSemiBold'}
                  fontSize={14}
                  color={colors.themePrimary}>
                  4.8 ★ Rating
                </Text>
              </Box>
              <Box
                w={1}
                h={moderateScaleVertical(20)}
                bgColor={isDarkMode ? colors.dimGray : colors.gray3}
              />
              <Text
                fontFamily={'$poppinsSemiBold'}
                fontSize={14}
                color={isDarkMode ? colors.white : colors.charcoalGray}>
                {userLocalData?.profileData?.totalRides || 0} Trips
              </Text>
            </Box>
          </Box>

          {/* Menu Items Section */}
          <Box mt={moderateScaleVertical(8)}>
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
          <Box mt={moderateScaleVertical(16)} px={moderateScale(20)}>
            <Text
              fontFamily={'$poppinsSemiBold'}
              fontSize={13}
              color={colors.gray4}
              letterSpacing={1}>
              PREFERENCES
            </Text>
          </Box>
          <Box mt={moderateScaleVertical(8)}>
            {settingsItems.map((item, index) => (
              <MenuItem
                key={index}
                icon={item.icon}
                title={item.title}
                onPress={item.onPress}
              />
            ))}
          </Box>

          {/* Logout - clean with themePrimary background for icon */}
          <Box mt={moderateScaleVertical(16)} mb={moderateScaleVertical(20)}>
            <AnimatedPressable onPress={handleLogout}>
              <Box
                flexDirection="row"
                alignItems="center"
                py={moderateScaleVertical(14)}
                px={moderateScale(20)}
                bgColor={isDarkMode ? '#1C1C24' : '#FFFFFF'}
                mx={moderateScale(16)}
                borderRadius={moderateScale(16)}
                style={{
                  shadowColor: '#000',
                  shadowOffset: {width: 0, height: 2},
                  shadowOpacity: isDarkMode ? 0.2 : 0.04,
                  shadowRadius: 8,
                  elevation: 2,
                }}>
                <Box
                  w={moderateScale(48)}
                  h={moderateScale(48)}
                  borderRadius={moderateScale(14)}
                  bgColor={colors.alertColor + '15'}
                  alignItems="center"
                  justifyContent="center"
                  mr={moderateScale(16)}>
                  <LogoutDrawerIcon width={22} height={22} color={colors.alertColor} />
                </Box>
                <Text
                  fontFamily={'$poppinsSemiBold'}
                  fontSize={16}
                  color={colors.alertColor}>
                  Log Out
                </Text>
              </Box>
            </AnimatedPressable>
          </Box>

          {/* App Version */}
          <Box alignItems="center" mb={moderateScaleVertical(20)}>
            <Text
              fontFamily={'$poppinsRegular'}
              fontSize={12}
              color={isDarkMode ? colors.gray4 : colors.gray3}>
              Version 1.0.0
            </Text>
          </Box>
        </ScrollView>
      )}
    </Container>
  );
};

export default Profile;
