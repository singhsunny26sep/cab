import { Box, ScrollView, Text, VStack, HStack, Divider } from '@gluestack-ui/themed';
import { Container } from '../components/Container';
import { AppBar } from '../components/AppBar';
import { colors } from '../constants/colors';
import { moderateScale, moderateScaleVertical } from '../utils/responsiveSize';
import { useTheme } from '../constants/ThemeContext';

const PrivacyPolicy = () => {
  const { isDarkMode } = useTheme();

  // Static privacy policy content
  const privacySections = [
    {
      title: 'Information We Collect',
      content:
        'We collect personal information such as your name, email address, phone number, and payment details when you create an account or book a ride. We also collect location data to provide accurate pickup and drop‑off services, as well as device information and usage logs to improve our app performance.',
    },
    {
      title: 'How We Use Your Information',
      content:
        'Your information is used to process ride bookings, calculate fares, communicate with drivers, process payments, and provide customer support. We may also use aggregated data for analytics, service improvements, and safety monitoring.',
    },
    {
      title: 'Data Sharing & Disclosure',
      content:
        'We share your ride details and location with drivers solely to complete your booking. We do not sell your personal data to third parties. We may disclose information if required by law, to protect our rights, or to prevent fraud and safety issues.',
    },
    {
      title: 'Data Security',
      content:
        'We implement industry‑standard encryption, access controls, and secure servers to protect your data. However, no method of transmission over the internet is 100% secure, and you use our services at your own risk.',
    },
    {
      title: 'Your Rights & Choices',
      content:
        'You can access, update, or delete your personal information through the app. You may also opt out of location tracking by changing your device permissions, but this will affect ride booking functionality.',
    },
    {
      title: 'Cookies & Tracking',
      content:
        'We use cookies and similar technologies to remember your preferences, analyze usage, and serve relevant ads. You can manage cookie settings in your browser or device.',
    },
    {
      title: 'Changes to This Policy',
      content:
        'We may update this privacy policy from time to time. Continued use of the app after changes means you accept the revised policy. We will notify you of significant changes via email or in‑app notice.',
    },
    {
      title: 'Contact Us',
      content:
        'If you have any questions about this privacy policy, please contact us at support@dharamcab.com or call +91‑XXXXXXXXXX.',
    },
  ];

  return (
    <Container
      statusBarStyle={isDarkMode ? 'light-content' : 'dark-content'}
      statusBarBackgroundColor={isDarkMode ? '#000000' : '#FFFFFF'}
      backgroundColor={isDarkMode ? '#000000' : '#F9F9FB'}>
      <AppBar back title="Privacy Policy" isDarkMode={isDarkMode} />

      <ScrollView showsVerticalScrollIndicator={false}>
        <Box px={moderateScale(20)} py={moderateScaleVertical(16)}>
          <VStack space="xl">
            {privacySections.map((section, index) => (
              <Box key={index}>
                <Text
                  fontFamily="$poppinsSemiBold"
                  fontSize={18}
                  lineHeight={24}
                  color={isDarkMode ? '#FFFFFF' : '#1C1C1E'}
                  mb={moderateScaleVertical(8)}>
                  {section.title}
                </Text>
                <Text
                  fontFamily="$poppinsRegular"
                  fontSize={14}
                  lineHeight={22}
                  color={isDarkMode ? '#C4C4C4' : '#4A4A4A'}
                  textAlign="justify">
                  {section.content}
                </Text>
                {index < privacySections.length - 1 && (
                  <Divider
                    my={moderateScaleVertical(16)}
                    bg={isDarkMode ? '#2C2C2E' : '#E9E9EF'}
                  />
                )}
              </Box>
            ))}
          </VStack>

          {/* Last updated note */}
          <Box mt={moderateScaleVertical(24)} mb={moderateScaleVertical(30)} alignItems="center">
            <Text
              fontFamily="$poppinsRegular"
              fontSize={12}
              color={isDarkMode ? '#8E8E93' : '#8E8E93'}>
              Last updated: April 10, 2025
            </Text>
          </Box>
        </Box>
      </ScrollView>
    </Container>
  );
};

export default PrivacyPolicy;
