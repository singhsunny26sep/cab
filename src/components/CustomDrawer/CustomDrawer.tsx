import React, { useState, useEffect } from 'react';
import { TouchableHighlight, Dimensions } from 'react-native';
import {
  DrawerContentScrollView,
  DrawerItemList,
} from '@react-navigation/drawer';
import {
  Avatar,
  AvatarFallbackText,
  Box,
  Image,
  Text,
  Pressable,
} from '@gluestack-ui/themed';
import { ParamListBase, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../../constants/colors';
import { moderateScale, moderateScaleVertical } from '../../utils/responsiveSize';
import {
  AboutUsdrawerIcon,
  ComplainDrawerIcon,
  EditProfileIcon,
  HistoryDrawerIcon,
  LocationDrawerIcon,
  LogoutDrawerIcon,
  RefferDrawerIcon,
  SettingDrawerIcon,
  SupportDrawerIcon,
} from '../Icons';
import { NavigationString } from '../../navigation/navigationStrings';
import images from '../../assets/images';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../constants/ThemeContext';
import { loadUserFromStorage } from '../../store/slice/UserSlice';

const { width } = Dimensions.get('window');

const CustomDrawer = (props: any) => {
  const navigation = useNavigation<NativeStackNavigationProp<ParamListBase>>();
  const { isDarkMode } = useTheme();
  const [userLocalData, setUserLocalData] = useState<any>(null);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const localData = await loadUserFromStorage();
        setUserLocalData(localData);
      } catch (error) {
        console.error('Error fetching profile data:', error);
      }
    };
    fetchProfileData();
  }, []);

  const handleLogout = async () => {
    try {
      await AsyncStorage.clear();
      navigation.reset({
        index: 0,
        routes: [{ name: NavigationString.SignIn }],
      });
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  // Determine background colors based on theme
  const drawerBgColor = isDarkMode ? '#1A1A1A' : '#FFFFFF';
  const cardBgColor = isDarkMode ? '#2C2C2C' : '#F7F7FC';
  const textColor = isDarkMode ? '#FFFFFF' : '#1C1C1E';
  const subtitleColor = isDarkMode ? '#A0A0A0' : '#8E8E93';
  const activeHighlight = isDarkMode ? '#3A3A3A' : '#E8E8ED';

  return (
    <Box flex={1} bg={drawerBgColor}>
      {/* Header Section with Gradient Background */}
      <Box
        bg={isDarkMode ? '#2C2C2E' : '#6C5CE7'}
        pt={moderateScaleVertical(60)}
        pb={moderateScaleVertical(30)}
        px={moderateScale(20)}
        borderBottomLeftRadius={moderateScale(30)}
        borderBottomRightRadius={moderateScale(30)}>
        <Box alignItems="center">
          {/* Profile Image */}
          <Box
            w={moderateScale(80)}
            h={moderateScale(80)}
            borderRadius={moderateScale(40)}
            overflow="hidden"
            borderWidth={3}
            borderColor="white"
            mb={moderateScaleVertical(12)}>
            <Image
              alt="profile"
              source={
                userLocalData?.profileData?.imgUrl
                  ? { uri: userLocalData.profileData.imgUrl }
                  : images.user
              }
              resizeMode="cover"
              w="100%"
              h="100%"
            />
          </Box>

          {/* User Info */}
          <Text
            fontFamily="$poppinsSemiBold"
            fontSize={18}
            lineHeight={24}
            color="#FFFFFF"
            numberOfLines={1}>
            {userLocalData?.profileData?.name || 'Guest User'}
          </Text>
          <Text
            fontFamily="$poppinsRegular"
            fontSize={12}
            lineHeight={16}
            color="rgba(255,255,255,0.8)"
            numberOfLines={1}>
            {userLocalData?.profileData?.email || 'guest@example.com'}
          </Text>
        </Box>
      </Box>

      {/* Drawer Items List */}
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={{
          paddingTop: moderateScaleVertical(20),
          paddingBottom: moderateScaleVertical(20),
        }}>
        <Box px={moderateScale(16)}>
          {/* Menu Items */}
          <MenuItem
            icon={<EditProfileIcon color={isDarkMode ? '#FFFFFF' : '#6C5CE7'} />}
            label="Edit Profile"
            onPress={() => navigation.navigate(NavigationString.Profile)}
            highlightColor={activeHighlight}
            textColor={textColor}
          />
          <MenuItem
            icon={<LocationDrawerIcon color={isDarkMode ? '#FFFFFF' : '#6C5CE7'} />}
            label="Address"
            onPress={() => navigation.navigate(NavigationString.Favourite)}
            highlightColor={activeHighlight}
            textColor={textColor}
          />
          <MenuItem
            icon={<HistoryDrawerIcon color={isDarkMode ? '#FFFFFF' : '#6C5CE7'} />}
            label="History"
            onPress={() => navigation.navigate(NavigationString.History)}
            highlightColor={activeHighlight}
            textColor={textColor}
          />
          <MenuItem
            icon={<ComplainDrawerIcon color={isDarkMode ? '#FFFFFF' : '#6C5CE7'} />}
            label="Complain"
            onPress={() => navigation.navigate(NavigationString.Complain)}
            highlightColor={activeHighlight}
            textColor={textColor}
          />
          <MenuItem
            icon={<RefferDrawerIcon color={isDarkMode ? '#FFFFFF' : '#6C5CE7'} />}
            label="Referral"
            onPress={() => navigation.navigate(NavigationString.Referral)}
            highlightColor={activeHighlight}
            textColor={textColor}
          />
          <MenuItem
            icon={<AboutUsdrawerIcon color={isDarkMode ? '#FFFFFF' : '#6C5CE7'} />}
            label="About Us"
            onPress={() => navigation.navigate(NavigationString.AboutUs)}
            highlightColor={activeHighlight}
            textColor={textColor}
          />
          <MenuItem
            icon={<SettingDrawerIcon color={isDarkMode ? '#FFFFFF' : '#6C5CE7'} />}
            label="Settings"
            onPress={() => navigation.navigate(NavigationString.Settings)}
            highlightColor={activeHighlight}
            textColor={textColor}
          />
          <MenuItem
            icon={<SupportDrawerIcon color={isDarkMode ? '#FFFFFF' : '#6C5CE7'} />}
            label="Help & Support"
            onPress={() => navigation.navigate(NavigationString.HelpSupport)}
            highlightColor={activeHighlight}
            textColor={textColor}
          />

          {/* Logout Item with Red Accent */}
          <Box mt={moderateScaleVertical(20)}>
            <MenuItem
              icon={<LogoutDrawerIcon color="#FF3B30" />}
              label="Logout"
              onPress={handleLogout}
              highlightColor={activeHighlight}
              textColor="#FF3B30"
              isLogout
            />
          </Box>
        </Box>
      </DrawerContentScrollView>
    </Box>
  );
};

// Reusable Menu Item Component
const MenuItem = ({ icon, label, onPress, highlightColor, textColor, isLogout = false }: any) => {
  return (
    <TouchableHighlight
      onPress={onPress}
      underlayColor={highlightColor}
      style={{
        borderRadius: moderateScale(12),
        marginBottom: moderateScaleVertical(4),
      }}>
      <Box
        flexDirection="row"
        alignItems="center"
        gap={moderateScale(14)}
        px={moderateScale(14)}
        py={moderateScaleVertical(14)}
        borderRadius={moderateScale(12)}>
        <Box width={moderateScale(24)} height={moderateScale(24)}>
          {icon}
        </Box>
        <Text
          fontFamily={isLogout ? '$poppinsMedium' : '$poppinsMedium'}
          fontSize={14}
          lineHeight={20}
          color={textColor}
          fontWeight={isLogout ? '500' : '400'}>
          {label}
        </Text>
      </Box>
    </TouchableHighlight>
  );
};

export default CustomDrawer;
