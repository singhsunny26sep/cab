import { Box, Image } from '@gluestack-ui/themed';
import { ParamListBase, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';

import { Container } from '../components/Container';
import { colors } from '../constants/colors';
import images from '../assets/images';
import { deviceHeight, deviceWidth } from '../constants/contants';
import { moderateScaleVertical, textScale, moderateScale } from '../utils/responsiveSize';
import PrimaryButton from '../components/Button/PrimaryButton';
import { NavigationString } from '../navigation/navigationStrings';
import { Text, View } from 'react-native';

const Welcome = () => {
  // init
  const navigation = useNavigation<NativeStackNavigationProp<ParamListBase>>();

  return (
    <Container statusBarStyle="dark-content" statusBarBackgroundColor={colors.white}>

      {/* <Box gap={moderateScaleVertical(20)} mt={moderateScaleVertical(110)} flex={1}>
        <Image alt='icon' source={images.welcome} resizeMode='contain' w={deviceWidth} h={moderateScale(190)} />

        <Box alignItems='center' gap={moderateScaleVertical(5)}>
          <Animated.Text entering={FadeInRight.delay(500).duration(500)} style={{ fontFamily: 'Poppins-Medium', fontSize: textScale(24), lineHeight: textScale(26), color: colors.charcoalGray }} numberOfLines={1}>Welcome</Animated.Text>
          <Animated.Text entering={FadeInRight.delay(700).duration(500)} style={{ fontFamily: 'Poppins-Regular', fontSize: textScale(14), lineHeight: textScale(16), color: colors.mediumLightGray }} numberOfLines={1} >Have a better sharing experience</Animated.Text>
        </Box>

      </Box>

      <Animated.View entering={FadeInDown.delay(1200).duration(500)} style={{ marginTop: moderateScaleVertical(290), gap: moderateScaleVertical(20), flex: 1 }} >
        <PrimaryButton buttonText='Create an account' onPress={() => navigation.navigate(NavigationString.SignUp)} marginHorizontal={moderateScale(15)} />
        <PrimaryButton buttonText='Log In' onPress={() => navigation.navigate(NavigationString.SignIn)} textColor={colors.themeSecondary} borderWidth={1} borderColor={colors.themeSecondary} backgroundColor={'transparent'} marginHorizontal={moderateScale(15)} />
      </Animated.View> */}

      <Box gap={moderateScaleVertical(20)} mt={moderateScaleVertical(110)} flex={1}>
        <Image alt="icon" source={images.welcome} resizeMode="contain" w={deviceWidth} h={moderateScale(190)} />

        <Box alignItems="center" gap={moderateScaleVertical(5)}>
          <Text style={{ fontFamily: 'Poppins-Medium', fontSize: textScale(24), lineHeight: textScale(26), color: colors.charcoalGray }} numberOfLines={1}>Welcome</Text>
          <Text style={{ fontFamily: 'Poppins-Regular', fontSize: textScale(14), lineHeight: textScale(16), color: colors.mediumLightGray }} numberOfLines={1} >Have a better sharing experience</Text>
        </Box>
      </Box>

      <View style={{ marginTop: moderateScaleVertical(290), gap: moderateScaleVertical(20), flex: 1 }} >
        <PrimaryButton buttonText="Create an account" onPress={() => navigation.navigate(NavigationString.SignUp)} marginHorizontal={moderateScale(15)} />
        <PrimaryButton buttonText="Log In" onPress={() => navigation.navigate(NavigationString.SignIn)} textColor={colors.themeSecondary} borderWidth={1} borderColor={colors.themeSecondary} backgroundColor={'transparent'} marginHorizontal={moderateScale(15)} />
      </View>
      {/* <Animated.View entering={FadeInDown.delay(1200).duration(500)} style={{ marginTop: moderateScaleVertical(290), gap: moderateScaleVertical(20), flex: 1 }} >
        <PrimaryButton buttonText='Create an account' onPress={() => navigation.navigate(NavigationString.SignUp)} marginHorizontal={moderateScale(15)} />
        <PrimaryButton buttonText='Log In' onPress={() => navigation.navigate(NavigationString.SignIn)} textColor={colors.themeSecondary} borderWidth={1} borderColor={colors.themeSecondary} backgroundColor={'transparent'} marginHorizontal={moderateScale(15)} />
      </Animated.View>  */}

    </Container>

  );
};

export default Welcome;
