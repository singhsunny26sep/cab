import {
  ScrollView,
  Text,
} from '@gluestack-ui/themed';

import {Container} from '../components/Container';
import {AppBar} from '../components/AppBar';
import {colors} from '../constants/colors';
import {moderateScale, moderateScaleVertical} from '../utils/responsiveSize';
import {useTheme} from '../constants/ThemeContext';

const AboutUs = () => {
  const {isDarkMode} = useTheme();

  // Static data
  const aboutUsData = [
    {
      title: 'Welcome to Dharam cab',
      description:
        'We are dedicated to providing you with the best cab booking experience. Our mission is to make your travel comfortable, safe, and affordable. With a fleet of well-maintained vehicles and professional drivers, we ensure you reach your destination on time, every time.',
    },
    {
      title: 'Our Services',
      description:
        'We offer a wide range of cab services including airport transfers, city rides, outstation trips, and hourly rentals. Our app makes it easy to book a cab with just a few taps. Track your ride in real-time and enjoy a seamless booking experience.',
    },
    {
      title: 'Why Choose Us',
      description:
        'We prioritize customer satisfaction with transparent pricing, 24/7 customer support, and safety features. Our drivers are verified and trained to provide you with a safe journey. Book with us and experience the difference.',
    },
    {
      title: 'Contact Us',
      description:
        'Have questions or need assistance? Our support team is available round the clock to help you. Reach out to us through the app or email us at support@dharamcab.com. We value your feedback and continuously work to improve our services.',
    },
  ];

  return (
    <Container
      statusBarStyle={isDarkMode ? 'light-content' : 'dark-content'}
      statusBarBackgroundColor={isDarkMode ? '#000000' : '#ffffff'}
      backgroundColor={isDarkMode ? colors.black : colors.white}>
      <AppBar back title="AboutUs" isDarkMode={isDarkMode} />

      <ScrollView mb={moderateScale(10)} showsVerticalScrollIndicator={false}>
        {aboutUsData?.map((item: any, index: number) => {
          return (
            <>
              <Text
                key={`title-${index}`}
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
                key={`desc-${index}`}
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
    </Container>
  );
};

export default AboutUs;
