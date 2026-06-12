import Onboarding from 'react-native-onboarding-swiper';
import { Image, Pressable, Text } from '@gluestack-ui/themed';
import { ParamListBase, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { colors } from '../constants/colors';
import { Container } from '../components/Container';
import { deviceHeight, deviceWidth } from '../constants/contants';
import images from '../assets/images';
import Icons from '../assets/Icons';
import { moderateScaleVertical,moderateScale } from '../utils/responsiveSize';
import { NavigationString } from '../navigation/navigationStrings';

const NextButton = ({ ...props }) => {
  return (
    <Pressable pr={moderateScale(15)} {...props}>
      <Image alt="icon" source={Icons.Arrowleft} resizeMode="contain" w={moderateScale(22)} h={moderateScale(22)} />
    </Pressable>
  );
};

const DoneButton = ({ ...props }) => {
  return (
    <Pressable {...props} bgColor={colors.themePrimary} alignItems="center" justifyContent="center" w={moderateScale(42)} h={moderateScale(42)} borderRadius={moderateScale(25)} mr={moderateScale(15)}>
      <Text fontFamily={'$poppinsMedium'} fontSize={20} lineHeight={22} color={'#5A5A5A'} numberOfLines={1} pt={moderateScaleVertical(6)}>Go</Text>
    </Pressable>
  );
};

const OnBoarding = () => {
  // init
  const navigation = useNavigation<NativeStackNavigationProp<ParamListBase>>();

  return (
    <Container statusBarBackgroundColor={colors.white}>

      <Onboarding
        onDone={() => navigation.navigate(NavigationString.Welcome)}
        onSkip={() => navigation.navigate(NavigationString.Welcome)}
        NextButtonComponent={NextButton}
        DoneButtonComponent={DoneButton}
        bottomBarColor="#fff"
        pages={[
          {
            backgroundColor: '#fff',
            image: <Image alt="icon" source={images.onBoarding1} resizeMode="contain" w={deviceWidth} h={moderateScale(190)} />,
            title: 'Anywhere you are',
            subtitle: 'Book a ride from anywhere, anytime — your ride comes to you, wherever you are.',
          },
          {
            backgroundColor: '#fff',
            image: <Image alt="icon" source={images.onBoarding2} resizeMode="contain" w={deviceWidth} h={moderateScale(190)} />,
            title: 'At anytime',
            subtitle: 'Need a ride now or later? We’ve got you covered, 24/7 at your fingertips.',
          },
          {
            backgroundColor: '#fff',
            image: <Image alt="icon" source={images.onBoarding3} resizeMode="contain" w={deviceWidth} h={moderateScale(190)} />,
            title: 'Book your car',
            subtitle: 'Choose your ride, track your driver, and hit the road with ease — it’s that simple.',
          },

        ]}
      />
    </Container>
  );
};

export default OnBoarding;
