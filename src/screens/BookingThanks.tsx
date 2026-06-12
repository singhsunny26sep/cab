import { Box, Image, Text } from '@gluestack-ui/themed';
import { ParamListBase, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Container } from '../components/Container';
import { AppBar } from '../components/AppBar';
import { colors } from '../constants/colors';
import { moderateScale, moderateScaleVertical } from '../utils/responsiveSize';
import Icons from '../assets/Icons';
import PrimaryButton from '../components/Button/PrimaryButton';
import { NavigationString } from '../navigation/navigationStrings';
import { useTheme } from '../constants/ThemeContext';

const BookingThanks = () => {
  // init
  const navigation = useNavigation<NativeStackNavigationProp<ParamListBase>>();
  const { isDarkMode } = useTheme();

  return (
    <Container statusBarStyle={isDarkMode ? 'light-content' : 'dark-content'} statusBarBackgroundColor={isDarkMode ? '#000000' : '#ffffff'} backgroundColor={isDarkMode ? '#000000' : '#ffffff'}>
      <AppBar back isDarkMode={isDarkMode}/>

      <Box flex={1} alignItems="center" justifyContent="center" gap={moderateScaleVertical(20)}>
        <Image alt="icon" source={Icons.RightTick} resizeMode="contain" w={moderateScale(124)} h={moderateScale(124)} />

        <Box alignItems="center" justifyContent="center" gap={moderateScaleVertical(3)}>
          <Text fontFamily={'$poppinsMedium'} fontSize={20} lineHeight={22} color={isDarkMode ? colors.white : colors.charcoalGray} numberOfLines={1}>Thank you</Text>
          <Text fontFamily={'$poppinsMedium'} fontSize={12} lineHeight={14} color={isDarkMode ? colors.white : colors.charcoalGray} numberOfLines={2} marginHorizontal={moderateScale(80)} textAlign="center">Your booking has been placed sent to Md. Sharif Ahmed</Text>
        </Box>
      </Box>

      <PrimaryButton  buttonText="Confirm Ride"  onPress={() => navigation.navigate(NavigationString.ConfrimRide)} marginHorizontal={moderateScale(15)} marginVertical={moderateScaleVertical(20)} />

    </Container>
  );
};

export default BookingThanks;
