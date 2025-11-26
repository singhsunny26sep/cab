import React, { useState,useEffect } from 'react'
import { TouchableHighlight } from 'react-native'
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer'
import { Avatar, AvatarFallbackText, Box, Image, Text } from '@gluestack-ui/themed'
import { ParamListBase, useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'

import { colors } from '../../constants/colors'
import { moderateScale, moderateScaleVertical } from '../../utils/responsiveSize'
import { AboutUsdrawerIcon, ComplainDrawerIcon, EditProfileIcon, HistoryDrawerIcon, LocationDrawerIcon, LogoutDrawerIcon, RefferDrawerIcon, SettingDrawerIcon, SupportDrawerIcon, } from '../Icons'
import { NavigationString } from '../../navigation/navigationStrings'
import images from '../../assets/images'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Instance } from '../../api/Instance'
import { GET_PROFILE } from '../../api/ApiEndpoints'
import { useTheme } from '../../constants/ThemeContext'
import { loadUserFromStorage } from '../../store/slice/UserSlice'

const CustomDrawer = (props: any) => {
  // init
  const navigation = useNavigation<NativeStackNavigationProp<ParamListBase>>();
  const { isDarkMode } = useTheme();

  // states
  const [showProfile, setshowProfile] = useState(true);
  const [userLocalData, setUserLocalData] = useState<any>(null);
  

  const [profile, setProfile] = useState({
    name: '',
    email: '',
    imgUrl: ''
  });

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
           const localData = await loadUserFromStorage();
           console.warn('local data at drawer....', localData);
           setUserLocalData(localData);
        // const token = await AsyncStorage.getItem('userToken');  
        // if (!token) {
        //   console.error('No token found');
        //   return;
        // }

        // const response = await Instance.get(GET_PROFILE.url, {
        //   headers: {
        //     Authorization: token, 
        //   },
        // });

        // if (response.data.success) {
        //   const { name, email, imgUrl } = response.data.data;
        //   setProfile({ name, email, imgUrl });
        // } else {
        //   console.error('Failed to fetch profile data');
        // }
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

  return (
    <Box flex={1}>
      <Box ml={moderateScale(15)} gap={moderateScaleVertical(20)} mt={moderateScaleVertical(85)} mb={moderateScaleVertical(25)}>
        {
          showProfile ? (
            <Box w={moderateScale(70)} h={moderateScale(70)} borderRadius={moderateScale(35)} overflow='hidden'>
              <Image alt='icon' source={userLocalData?.profileData?.imgUrl ? { uri: userLocalData?.profileData?.imgUrl } : images.user} resizeMode='contain' w={'100%'} h={'100%'} />
            </Box>
          ) : (
            <Avatar bgColor={colors.themePrimary} w={moderateScale(70)} h={moderateScale(70)} borderRadius={moderateScale(35)}>
              <AvatarFallbackText>Danish Qureshi</AvatarFallbackText>
            </Avatar>
          )
        }

        <Box>
        <Text fontFamily="$poppinsMedium" fontSize={18} lineHeight={20} color={isDarkMode ? colors.white : colors.charcoalGray} numberOfLines={1}>
            {userLocalData?.profileData?.name || 'Guest'}
          </Text>  
        <Text fontFamily={'$poppinsMedium'} fontSize={12} lineHeight={14} color={isDarkMode ? colors.white : colors.charcoalGray} numberOfLines={1}>{userLocalData?.profileData?.email || 'Guest@mail.com'} </Text>

        </Box>

      </Box>

      <DrawerContentScrollView {...props} contentContainerStyle={{ marginLeft: moderateScale(5), paddingTop: 0 }}>
        {/* <DrawerItemList {...props} /> */}
        <TouchableHighlight onPress={() => { navigation.navigate(NavigationString.Profile) }} underlayColor={colors.paleGray}>
          <Box flexDirection='row' alignItems='center' gap={moderateScale(10)} px={moderateScale(10)} py={moderateScaleVertical(18)} borderBottomWidth={1} borderBottomColor='#E8E8E8'>
            <EditProfileIcon />
            <Text fontFamily={'$poppinsMedium'} fontSize={12} lineHeight={14}color={isDarkMode ? colors.white : colors.charcoalGray} >Edit Profile</Text>
          </Box>
        </TouchableHighlight>

        <TouchableHighlight onPress={() => { navigation.navigate(NavigationString.Favourite) }} underlayColor={colors.paleGray}>
          <Box flexDirection='row' alignItems='center' gap={moderateScale(10)} px={moderateScale(10)} py={moderateScaleVertical(18)} borderBottomWidth={1} borderBottomColor='#E8E8E8'>
            <LocationDrawerIcon />
            <Text fontFamily={'$poppinsMedium'} fontSize={12} lineHeight={14} color={isDarkMode ? colors.white : colors.charcoalGray} >Address</Text>
          </Box>
        </TouchableHighlight>

        <TouchableHighlight onPress={() => { navigation.navigate(NavigationString.History) }} underlayColor={colors.paleGray}>
          <Box flexDirection='row' alignItems='center' gap={moderateScale(10)} px={moderateScale(10)} py={moderateScaleVertical(18)} borderBottomWidth={1} borderBottomColor='#E8E8E8'>
            <HistoryDrawerIcon />
            <Text fontFamily={'$poppinsMedium'} fontSize={12} lineHeight={14} color={isDarkMode ? colors.white : colors.charcoalGray} >History</Text>
          </Box>
        </TouchableHighlight>

        <TouchableHighlight onPress={() => { navigation.navigate(NavigationString.Complain) }} underlayColor={colors.paleGray}>
          <Box flexDirection='row' alignItems='center' gap={moderateScale(10)} px={moderateScale(10)} py={moderateScaleVertical(18)} borderBottomWidth={1} borderBottomColor='#E8E8E8'>
            <ComplainDrawerIcon />
            <Text fontFamily={'$poppinsMedium'} fontSize={12} lineHeight={14} color={isDarkMode ? colors.white : colors.charcoalGray} >Complain</Text>
          </Box>
        </TouchableHighlight>

        <TouchableHighlight onPress={() => { navigation.navigate(NavigationString.Referral) }} underlayColor={colors.paleGray}>
          <Box flexDirection='row' alignItems='center' gap={moderateScale(10)} px={moderateScale(10)} py={moderateScaleVertical(18)} borderBottomWidth={1} borderBottomColor='#E8E8E8'>
            <RefferDrawerIcon />
            <Text fontFamily={'$poppinsMedium'} fontSize={12} lineHeight={14} color={isDarkMode ? colors.white : colors.charcoalGray} >Referral</Text>
          </Box>
        </TouchableHighlight>

        <TouchableHighlight onPress={() => { navigation.navigate(NavigationString.AboutUs) }} underlayColor={colors.paleGray}>
          <Box flexDirection='row' alignItems='center' gap={moderateScale(10)} px={moderateScale(10)} py={moderateScaleVertical(18)} borderBottomWidth={1} borderBottomColor='#E8E8E8'>
            <AboutUsdrawerIcon />
            <Text fontFamily={'$poppinsMedium'} fontSize={12} lineHeight={14} color={isDarkMode ? colors.white : colors.charcoalGray} >About Us</Text>
          </Box>
        </TouchableHighlight>

        <TouchableHighlight onPress={() => { navigation.navigate(NavigationString.Settings) }} underlayColor={colors.paleGray}>
          <Box flexDirection='row' alignItems='center' gap={moderateScale(10)} px={moderateScale(10)} py={moderateScaleVertical(18)} borderBottomWidth={1} borderBottomColor='#E8E8E8'>
            <SettingDrawerIcon />
            <Text fontFamily={'$poppinsMedium'} fontSize={12} lineHeight={14} color={isDarkMode ? colors.white : colors.charcoalGray} >Settings</Text>
          </Box>
        </TouchableHighlight>

        <TouchableHighlight onPress={() => { navigation.navigate(NavigationString.HelpSupport) }} underlayColor={colors.paleGray}>
          <Box flexDirection='row' alignItems='center' gap={moderateScale(10)} px={moderateScale(10)} py={moderateScaleVertical(18)} borderBottomWidth={1} borderBottomColor='#E8E8E8'>
            <SupportDrawerIcon />
            <Text fontFamily={'$poppinsMedium'} fontSize={12} lineHeight={14} color={isDarkMode ? colors.white : colors.charcoalGray} >Help and Support</Text>
          </Box>
        </TouchableHighlight>

        <TouchableHighlight onPress={handleLogout} underlayColor={colors.paleGray}>
          <Box flexDirection='row' alignItems='center' gap={moderateScale(10)} px={moderateScale(10)} py={moderateScaleVertical(18)}>
            <LogoutDrawerIcon />
            <Text fontFamily={'$poppinsMedium'} fontSize={12} lineHeight={14} color={isDarkMode ? colors.white : colors.charcoalGray}>Logout</Text>
          </Box>
        </TouchableHighlight>

      </DrawerContentScrollView>
      {/* <TouchableHighlight onPress={() => { console.log('Logout'); }} underlayColor={colors.paleGray}>
        <Box flexDirection='row' alignItems='center' gap={moderateScale(10)} px={moderateScale(10)} py={moderateScaleVertical(10)} borderTopWidth={1} borderTopColor={colors.gray8}>
          <EditProfileIcon />
          <Text fontFamily={'$poppinsMedium'} fontSize={18} lineHeight={20} color={colors.dimGray} >Share</Text>
        </Box>
      </TouchableHighlight> */}
    </Box>
  )
}

export default CustomDrawer