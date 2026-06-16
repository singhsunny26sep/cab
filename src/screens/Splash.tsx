import { useEffect } from 'react';
import { Box, Image,Text} from '@gluestack-ui/themed';
import { ParamListBase, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Container } from '../components/Container';
import { colors } from '../constants/colors';
import Icons from '../assets/Icons';
import { moderateScale } from '../utils/responsiveSize';
import { NavigationString } from '../navigation/navigationStrings';

const Splash = () => {
  const navigation = useNavigation<NativeStackNavigationProp<ParamListBase>>();

  useEffect(() => {
    const checkUserAuth = async () => {
      try {
        const userToken = await AsyncStorage.getItem('userToken');
        console.log('Splash Screen Token:', userToken);

        setTimeout(() => {
          if (userToken) {
            navigation.replace(NavigationString.DrawerStacks);
          } else {
            console.log('No token found, navigating to OnBoarding');
            navigation.replace(NavigationString.OnBoarding);
          }
        }, 500);

      } catch (error) {
        console.error('Failed to check auth status:', error);
        navigation.replace(NavigationString.OnBoarding);
      }
    };

    checkUserAuth();
  }, [navigation]);

  return (
    <Container statusBarBackgroundColor={colors.themePrimary} backgroundColor="black">
      <Box flex={1} alignItems="center" justifyContent="center">
        <Image alt="logo" source={require('../assets/images/logo.png')} w={moderateScale(120)} h={moderateScale(120)} resizeMode="contain" />
        <Text color="$amber100" fontFamily="$poppinsBold" fontSize={25}>Dharam cab Drive</Text>
      </Box>
    </Container>
  );
};

export default Splash;
