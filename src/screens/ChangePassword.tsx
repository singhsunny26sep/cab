import { useState } from 'react';
import { Box, Pressable, Text, VStack, HStack, Icon } from '@gluestack-ui/themed';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';

import { Container } from '../components/Container';
import { colors } from '../constants/colors';
import { AppBar } from '../components/AppBar';
import { moderateScale, moderateScaleVertical } from '../utils/responsiveSize';
import InputText from '../components/TextInput/InputText';
import { CloseEyeIcon, OpenEyeIcon } from '../components/Icons'; // only these exist
import PrimaryButton from '../components/Button/PrimaryButton';
import { useTheme } from '../constants/ThemeContext';

// Simple inline icons as fallback (or import real ones if available)
const LockIcon = () => (
  <Text fontSize={32}>🔒</Text>
);

const ShieldCheckIcon = () => (
  <Text fontSize={14}>🛡️</Text>
);

const WarningIcon = () => (
  <Text color="#FF3B30" fontSize={12}>⚠️</Text>
);

const ChangePassword = () => {
  const { isDarkMode } = useTheme();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [secureOld, setSecureOld] = useState(true);
  const [secureNew, setSecureNew] = useState(true);
  const [secureConfirm, setSecureConfirm] = useState(true);

  const [strength, setStrength] = useState(0);

  const checkStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 8) {score++;}
    if (/[A-Z]/.test(pwd)) {score++;}
    if (/[0-9]/.test(pwd)) {score++;}
    if (/[^A-Za-z0-9]/.test(pwd)) {score++;}
    if (pwd.length === 0) {return 0;}
    if (score <= 2) {return 1;}
    if (score === 3) {return 2;}
    return 3;
  };

  const handleNewPasswordChange = (text: string) => {
    setNewPassword(text);
    setStrength(checkStrength(text));
  };

  const getStrengthColor = () => {
    if (strength === 1) {return '#FF3B30';}
    if (strength === 2) {return '#FF9500';}
    if (strength === 3) {return '#34C759';}
    return isDarkMode ? '#636366' : '#C4C4C4';
  };

  const getStrengthText = () => {
    if (strength === 1) {return 'Weak';}
    if (strength === 2) {return 'Medium';}
    if (strength === 3) {return 'Strong';}
    return '';
  };

  const isFormValid = () => {
    return oldPassword.length > 0 && newPassword.length >= 6 && newPassword === confirmPassword;
  };

  const handleSave = () => {
    if (!isFormValid()) {return;}
    console.log('Password changed');
  };

  const EyeToggle = ({ isSecure, onToggle }: { isSecure: boolean; onToggle: () => void }) => (
    <Pressable onPress={onToggle} pr={moderateScale(12)}>
      {isSecure ? <CloseEyeIcon /> : <OpenEyeIcon />}
    </Pressable>
  );

  return (
    <Container
      statusBarStyle={isDarkMode ? 'light-content' : 'dark-content'}
      statusBarBackgroundColor={isDarkMode ? '#000000' : '#F8F9FF'}
      backgroundColor={isDarkMode ? '#000000' : '#F8F9FF'}>
      <AppBar back title="Change Password" isDarkMode={isDarkMode} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Box mx={moderateScale(20)} mt={moderateScaleVertical(20)}>
            {/* Header */}
            <Box alignItems="center" mb={moderateScaleVertical(24)}>
              <Box
                bg={isDarkMode ? '#1C1C1E' : colors.themePrimary + '15'}
                w={moderateScale(80)}
                h={moderateScale(80)}
                borderRadius={moderateScale(40)}
                alignItems="center"
                justifyContent="center"
                mb={moderateScaleVertical(12)}>
                <LockIcon />
              </Box>
              <Text
                fontFamily="$poppinsSemiBold"
                fontSize={22}
                color={isDarkMode ? '#FFFFFF' : '#1C1C1E'}
                textAlign="center">
                Change Password
              </Text>
              <Text
                fontFamily="$poppinsRegular"
                fontSize={14}
                color={isDarkMode ? '#8E8E93' : '#6C6C70'}
                textAlign="center"
                mt={moderateScaleVertical(4)}>
                Create a strong password to keep your account secure
              </Text>
            </Box>

            {/* Form Card */}
            <Box
              bg={isDarkMode ? '#1C1C1E' : '#FFFFFF'}
              borderRadius={moderateScale(24)}
              p={moderateScale(20)}
              shadowColor={isDarkMode ? '#000' : '#000'}
              shadowOffset={{ width: 0, height: 4 }}
              shadowOpacity={0.05}
              shadowRadius={12}
              elevation={3}>
              <VStack space="lg">
                <InputText
                  textInputProps={{
                    placeholder: 'Old Password',
                    value: oldPassword,
                    onChangeText: setOldPassword,
                    secureTextEntry: secureOld,
                  }}
                  right={<EyeToggle isSecure={secureOld} onToggle={() => setSecureOld(!secureOld)} />}
                  style={{
                    backgroundColor: isDarkMode ? '#2C2C2E' : '#F9F9FB',
                    borderRadius: moderateScale(14),
                    borderWidth: 1,
                    borderColor: isDarkMode ? '#3A3A3C' : '#E9E9EF',
                  }}
                />

                <InputText
                  textInputProps={{
                    placeholder: 'New Password',
                    value: newPassword,
                    onChangeText: handleNewPasswordChange,
                    secureTextEntry: secureNew,
                  }}
                  right={<EyeToggle isSecure={secureNew} onToggle={() => setSecureNew(!secureNew)} />}
                  style={{
                    backgroundColor: isDarkMode ? '#2C2C2E' : '#F9F9FB',
                    borderRadius: moderateScale(14),
                    borderWidth: 1,
                    borderColor: isDarkMode ? '#3A3A3C' : '#E9E9EF',
                  }}
                />

                {newPassword.length > 0 && (
                  <Box mt={moderateScaleVertical(-8)}>
                    <HStack space="sm" alignItems="center" mb={moderateScaleVertical(4)}>
                      <Box flex={1} height={4} bg={isDarkMode ? '#2C2C2E' : '#E9E9EF'} borderRadius={4}>
                        <Box
                          width={`${(strength / 3) * 100}%`}
                          height={4}
                          bg={getStrengthColor()}
                          borderRadius={4}
                        />
                      </Box>
                      <Text fontSize={12} fontFamily="$poppinsMedium" color={getStrengthColor()}>
                        {getStrengthText()}
                      </Text>
                    </HStack>
                    <Text fontSize={11} color={isDarkMode ? '#8E8E93' : '#8E8E93'}>
                      Use at least 8 characters with uppercase, number & symbol
                    </Text>
                  </Box>
                )}

                <InputText
                  textInputProps={{
                    placeholder: 'Confirm New Password',
                    value: confirmPassword,
                    onChangeText: setConfirmPassword,
                    secureTextEntry: secureConfirm,
                  }}
                  right={<EyeToggle isSecure={secureConfirm} onToggle={() => setSecureConfirm(!secureConfirm)} />}
                  style={{
                    backgroundColor: isDarkMode ? '#2C2C2E' : '#F9F9FB',
                    borderRadius: moderateScale(14),
                    borderWidth: 1,
                    borderColor: isDarkMode ? '#3A3A3C' : '#E9E9EF',
                  }}
                />

                {confirmPassword.length > 0 && newPassword !== confirmPassword && (
                  <HStack space="sm" alignItems="center">
                    <WarningIcon />
                    <Text fontSize={12} color="#FF3B30" fontFamily="$poppinsRegular">
                      Passwords do not match
                    </Text>
                  </HStack>
                )}

                <PrimaryButton
                  buttonText="Save Changes"
                  onPress={handleSave}
                  disabled={!isFormValid()}
                  opacity={isFormValid() ? 1 : 0.6}
                  mt={moderateScaleVertical(10)}
                  bgColor={colors.themePrimary}
                  textColor="#FFFFFF"
                  height={moderateScale(52)}
                  borderRadius={moderateScale(14)}
                />
              </VStack>
            </Box>

            {/* Footer note */}
            <Box alignItems="center" mt={moderateScaleVertical(24)} mb={moderateScaleVertical(30)}>
              <HStack space="sm" alignItems="center">
                <ShieldCheckIcon />
                <Text fontSize={12} color={isDarkMode ? '#8E8E93' : '#6C6C70'} fontFamily="$poppinsRegular">
                  Your password is encrypted and never stored in plain text
                </Text>
              </HStack>
            </Box>
          </Box>
        </ScrollView>
      </KeyboardAvoidingView>
    </Container>
  );
};

export default ChangePassword;
