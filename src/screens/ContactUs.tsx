import { useState } from 'react';
import { Box, Text, Textarea, TextareaInput, VStack, HStack, Divider, Pressable } from '@gluestack-ui/themed';
import CountryPicker, { Country, CountryCode } from 'react-native-country-picker-modal';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';

import { Container } from '../components/Container';
import { AppBar } from '../components/AppBar';
import { colors } from '../constants/colors';
import { moderateScale, moderateScaleVertical } from '../utils/responsiveSize';
import InputText from '../components/TextInput/InputText';
import PrimaryButton from '../components/Button/PrimaryButton';
import { useTheme } from '../constants/ThemeContext';

// Simple icon placeholders (replace with your actual icon components)
const MapPinIcon = () => <Text fontSize={20}>📍</Text>;
const PhoneIcon = () => <Text fontSize={20}>📞</Text>;
const EmailIcon = () => <Text fontSize={20}>✉️</Text>;
const ChatIcon = () => <Text fontSize={20}>💬</Text>;

const ContactUs = () => {
  const { isDarkMode } = useTheme();

  const [countryCode, setCountryCode] = useState<CountryCode>('IN');
  const [country, setCountry] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [message, setMessage] = useState('');

  const handleCountrySelect = (country: any) => {
    setCountryCode(country?.cca2);
    setCountry(country?.callingCode?.[0]);
  };

  const handleSend = () => {
    // Handle send logic
    console.log({ name, email, mobile, message });
  };

  // Suppress specific console error (keep as needed)
  const error = console.error;
  console.error = (...args: any) => {
    if (/defaultProps/.test(args[0])) {return;}
    error(...args);
  };

  return (
    <Container
      statusBarStyle={isDarkMode ? 'light-content' : 'dark-content'}
      statusBarBackgroundColor={isDarkMode ? '#000000' : '#F8F9FF'}
      backgroundColor={isDarkMode ? '#000000' : '#F8F9FF'}>
      <AppBar back title="Contact Us" isDarkMode={isDarkMode} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <Box alignItems="center" mt={moderateScaleVertical(16)} mb={moderateScaleVertical(8)}>
            <Box
              bg={isDarkMode ? '#1C1C1E' : colors.themePrimary + '15'}
              w={moderateScale(70)}
              h={moderateScale(70)}
              borderRadius={moderateScale(35)}
              alignItems="center"
              justifyContent="center">
              <ChatIcon />
            </Box>
            <Text
              fontFamily="$poppinsSemiBold"
              fontSize={20}
              lineHeight={28}
              color={isDarkMode ? '#FFFFFF' : '#1C1C1E'}
              mt={moderateScaleVertical(12)}>
              Get in Touch
            </Text>
            <Text
              fontFamily="$poppinsRegular"
              fontSize={14}
              color={isDarkMode ? '#8E8E93' : '#6C6C70'}
              textAlign="center"
              px={moderateScale(30)}>
              We'd love to hear from you. Send us a message and we'll respond as soon as possible.
            </Text>
          </Box>

          {/* Contact Info Cards */}
          <Box
            flexDirection="row"
            justifyContent="space-between"
            gap={moderateScale(12)}
            mx={moderateScale(16)}
            my={moderateScaleVertical(20)}>
            {/* Address Card */}
            <Box
              flex={1}
              bg={isDarkMode ? '#1C1C1E' : '#FFFFFF'}
              borderRadius={moderateScale(16)}
              p={moderateScale(12)}
              alignItems="center"
              shadowColor="#000"
              shadowOffset={{ width: 0, height: 2 }}
              shadowOpacity={0.05}
              shadowRadius={4}
              elevation={2}>
              <MapPinIcon />
              <Text
                fontFamily="$poppinsMedium"
                fontSize={12}
                color={isDarkMode ? '#FFFFFF' : '#1C1C1E'}
                mt={moderateScaleVertical(6)}>
                Address
              </Text>
              <Text
                fontFamily="$poppinsRegular"
                fontSize={10}
                color={isDarkMode ? '#8E8E93' : '#6C6C70'}
                textAlign="center"
                mt={moderateScaleVertical(2)}>
                House#72, Rd#21, Banani
              </Text>
            </Box>

            {/* Phone Card */}
            <Box
              flex={1}
              bg={isDarkMode ? '#1C1C1E' : '#FFFFFF'}
              borderRadius={moderateScale(16)}
              p={moderateScale(12)}
              alignItems="center"
              shadowColor="#000"
              shadowOffset={{ width: 0, height: 2 }}
              shadowOpacity={0.05}
              shadowRadius={4}
              elevation={2}>
              <PhoneIcon />
              <Text
                fontFamily="$poppinsMedium"
                fontSize={12}
                color={isDarkMode ? '#FFFFFF' : '#1C1C1E'}
                mt={moderateScaleVertical(6)}>
                Phone
              </Text>
              <Text
                fontFamily="$poppinsRegular"
                fontSize={10}
                color={isDarkMode ? '#8E8E93' : '#6C6C70'}
                textAlign="center">
                13301 (24/7)
              </Text>
            </Box>

            {/* Email Card */}
            <Box
              flex={1}
              bg={isDarkMode ? '#1C1C1E' : '#FFFFFF'}
              borderRadius={moderateScale(16)}
              p={moderateScale(12)}
              alignItems="center"
              shadowColor="#000"
              shadowOffset={{ width: 0, height: 2 }}
              shadowOpacity={0.05}
              shadowRadius={4}
              elevation={2}>
              <EmailIcon />
              <Text
                fontFamily="$poppinsMedium"
                fontSize={12}
                color={isDarkMode ? '#FFFFFF' : '#1C1C1E'}
                mt={moderateScaleVertical(6)}>
                Email
              </Text>
              <Text
                fontFamily="$poppinsRegular"
                fontSize={10}
                color={isDarkMode ? '#8E8E93' : '#6C6C70'}
                textAlign="center">
                support@dharamcab.com
              </Text>
            </Box>
          </Box>

          {/* Form Card */}
          <Box
            bg={isDarkMode ? '#1C1C1E' : '#FFFFFF'}
            borderRadius={moderateScale(24)}
            mx={moderateScale(16)}
            p={moderateScale(20)}
            shadowColor="#000"
            shadowOffset={{ width: 0, height: 4 }}
            shadowOpacity={0.08}
            shadowRadius={12}
            elevation={4}
            mb={moderateScaleVertical(20)}>
            <Text
              fontFamily="$poppinsSemiBold"
              fontSize={16}
              color={isDarkMode ? '#FFFFFF' : '#1C1C1E'}
              mb={moderateScaleVertical(16)}
              textAlign="center">
              Send a Message
            </Text>

            <VStack space="md">
              <InputText
                textInputProps={{
                  placeholder: 'Your Name',
                  value: name,
                  onChangeText: setName,
                }}
                isDarkMode={isDarkMode}
                style={{
                  backgroundColor: isDarkMode ? '#2C2C2E' : '#F9F9FB',
                  borderRadius: moderateScale(14),
                  borderWidth: 1,
                  borderColor: isDarkMode ? '#3A3A3C' : '#E9E9EF',
                }}
              />

              <InputText
                textInputProps={{
                  placeholder: 'Email Address',
                  value: email,
                  onChangeText: setEmail,
                  keyboardType: 'email-address',
                  autoCapitalize: 'none',
                }}
                isDarkMode={isDarkMode}
                style={{
                  backgroundColor: isDarkMode ? '#2C2C2E' : '#F9F9FB',
                  borderRadius: moderateScale(14),
                  borderWidth: 1,
                  borderColor: isDarkMode ? '#3A3A3C' : '#E9E9EF',
                }}
              />

              {/* Country Picker + Mobile */}
              <Box
                flexDirection="row"
                alignItems="center"
                bg={isDarkMode ? '#2C2C2E' : '#F9F9FB'}
                borderRadius={moderateScale(14)}
                borderWidth={1}
                borderColor={isDarkMode ? '#3A3A3C' : '#E9E9EF'}
                px={moderateScale(12)}>
                <CountryPicker
                  countryCode={countryCode}
                  onSelect={handleCountrySelect}
                  withAlphaFilter
                  withCallingCode
                  withFilter
                  withFlag
                />
                <Box
                  flex={1}
                  borderLeftWidth={1}
                  borderLeftColor={isDarkMode ? '#3A3A3C' : '#E9E9EF'}
                  ml={moderateScale(10)}
                  pl={moderateScale(10)}>
                  <InputText
                    borderWidth={0}
                    textInputProps={{
                      placeholder: 'Mobile Number',
                      value: mobile,
                      onChangeText: setMobile,
                      keyboardType: 'phone-pad',
                    }}
                    isDarkMode={isDarkMode}
                    style={{
                      backgroundColor: 'transparent',
                      paddingHorizontal: 0,
                    }}
                  />
                </Box>
              </Box>

              <Textarea
                size="md"
                isReadOnly={false}
                isInvalid={false}
                isDisabled={false}
                w="100%"
                borderRadius={moderateScale(14)}
                borderWidth={1}
                borderColor={isDarkMode ? '#3A3A3C' : '#E9E9EF'}
                bg={isDarkMode ? '#2C2C2E' : '#F9F9FB'}>
                <TextareaInput
                  fontFamily="$poppinsRegular"
                  fontSize={14}
                  placeholder="Your message..."
                  value={message}
                  onChangeText={setMessage}
                  numberOfLines={4}
                  textAlignVertical="top"
                  placeholderTextColor={isDarkMode ? '#8E8E93' : '#C4C4C4'}
                />
              </Textarea>
            </VStack>
          </Box>

          <PrimaryButton
            buttonText="Send Message"
            onPress={handleSend}
            marginHorizontal={moderateScale(16)}
            marginVertical={moderateScaleVertical(16)}
            bgColor={colors.themePrimary}
            textColor="#FFFFFF"
            height={moderateScale(52)}
            borderRadius={moderateScale(14)}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Container>
  );
};

export default ContactUs;
