import {
  ScrollView,
  Text,
} from '@gluestack-ui/themed';

import {Container} from '../components/Container';
import {AppBar} from '../components/AppBar';
import {colors} from '../constants/colors';
import {moderateScale, moderateScaleVertical} from '../utils/responsiveSize';
import {useTheme} from '../constants/ThemeContext';

const HelpSupport = () => {
  const {isDarkMode} = useTheme();

  const helpAndSupportData = [
    {
      question: 'How do I book a cab?',
      answer:
        'You can book a cab by opening the app and entering your pickup and drop-off locations. Select your preferred vehicle type and confirm your booking.',
    },
    {
      question: 'How can I cancel my booking?',
      answer:
        'You can cancel your booking from the active bookings section. Please note that cancellation charges may apply depending on the time of cancellation.',
    },
    {
      question: 'What payment methods are accepted?',
      answer:
        'We accept various payment methods including credit/debit cards, UPI, digital wallets, and cash. You can also save your preferred payment method for future bookings.',
    },
    {
      question: 'How do I track my ride?',
      answer:
        'Once your booking is confirmed, you can track your driver\'s real-time location on the map in the app. You will also receive updates about your driver\'s arrival.',
    },
    {
      question: 'What if I lost something in the cab?',
      answer:
        'If you have left something in the cab, please contact our customer support immediately. We will try to help you recover your lost item.',
    },
    {
      question: 'How do I rate my driver?',
      answer:
        'After completing your trip, you will be prompted to rate your driver and provide feedback. Your feedback helps us improve our service.',
    },
  ];

  return (
    <Container
      statusBarStyle={isDarkMode ? 'light-content' : 'dark-content'}
      statusBarBackgroundColor={isDarkMode ? '#000000' : '#ffffff'}
      backgroundColor={isDarkMode ? colors.black : colors.white}>
      <AppBar back title="Help and Support" isDarkMode={isDarkMode} />

      <ScrollView mb={moderateScale(10)} showsVerticalScrollIndicator={false}>
        {helpAndSupportData?.map((item: any, index: number) => {
          return (
            <>
              <Text
                key={`question-${index}`}
                fontFamily={'$poppinsSemiBold'}
                fontSize={16}
                lineHeight={20}
                color={isDarkMode ? colors.white : colors.charcoalGray}
                mx={moderateScale(15)}
                mt={moderateScaleVertical(25)}>
                {item?.question}
              </Text>
              <Text
                key={`answer-${index}`}
                fontFamily={'$poppinsRegular'}
                fontSize={14}
                lineHeight={18}
                color={isDarkMode ? colors.gray3 : colors.gray2}
                textAlign="justify"
                mx={moderateScale(15)}
                mt={moderateScaleVertical(10)}>
                {item?.answer}
              </Text>
            </>
          );
        })}
      </ScrollView>
    </Container>
  );
};

export default HelpSupport;
