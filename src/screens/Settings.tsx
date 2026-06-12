import { Box, ChevronRightIcon, Icon, Pressable, Text, Switch, VStack, HStack } from '@gluestack-ui/themed';
import { LockIcon, DocumentTextIcon, PhoneIcon, DeleteIcon, MoonIcon, ExternalLinkIcon } from '@gluestack-ui/themed'; // Add missing imports
import { ParamListBase, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScrollView } from 'react-native';

import { Container } from '../components/Container';
import { AppBar } from '../components/AppBar';
import { colors } from '../constants/colors';
import { moderateScale, moderateScaleVertical } from '../utils/responsiveSize';
import { NavigationString } from '../navigation/navigationStrings';
import { useTheme } from '../constants/ThemeContext';

const Settings = () => {
  const navigation = useNavigation<NativeStackNavigationProp<ParamListBase>>();
  const { isDarkMode, toggleDarkMode } = useTheme();

  // Define section items
  const preferenceItems = [
    {
      id: 'darkMode',
      title: 'Dark Mode',
      icon: MoonIcon,
      isToggle: true,
      onPress: () => toggleDarkMode(),
      value: isDarkMode,
    },
  ];

  const accountItems = [
    {
      id: 'changePassword',
      title: 'Change Password',
      icon: LockIcon,
      screen: NavigationString.ChangePassword,
    },
    {
      id: 'privacyPolicy',
      title: 'Privacy Policy',
      icon: DocumentTextIcon,
      screen: NavigationString.PrivacyPolicy,
    },
    {
      id: 'deleteAccount',
      title: 'Delete Account',
      icon: DeleteIcon,
      screen: NavigationString.DeleteAccount,
      isDestructive: true,
    },
  ];

  const supportItems = [
    {
      id: 'contactUs',
      title: 'Contact Us',
      icon: PhoneIcon,
      screen: NavigationString.ContactUs,
    },
  ];

  const renderItem = (item: any) => {
    const isDestructive = item.isDestructive;
    const textColor = isDestructive
      ? '#FF3B30'
      : isDarkMode
      ? colors.white
      : colors.charcoalGray;

    return (
      <Pressable
        key={item.id}
        onPress={item.onPress ? item.onPress : () => navigation.navigate(item.screen)}
        flexDirection="row"
        alignItems="center"
        justifyContent="space-between"
        bg={isDarkMode ? '#1C1C1E' : '#FFFFFF'}
        px={moderateScale(16)}
        py={moderateScaleVertical(16)}
        borderRadius={moderateScale(16)}
        mb={moderateScaleVertical(8)}
        borderWidth={1}
        borderColor={isDarkMode ? '#2C2C2E' : '#F0F0F5'}
        shadowColor={isDarkMode ? '#000' : '#000'}
        shadowOffset={{ width: 0, height: 1 }}
        shadowOpacity={isDarkMode ? 0.3 : 0.05}
        shadowRadius={2}
        elevation={isDarkMode ? 1 : 2}>
        <HStack space="md" alignItems="center">
          <Icon
            as={item.icon}
            size="sm"
            color={isDestructive ? '#FF3B30' : colors.themePrimary}
          />
          <Text
            fontFamily="$poppinsMedium"
            fontSize={14}
            lineHeight={20}
            color={textColor}>
            {item.title}
          </Text>
        </HStack>
        {item.isToggle ? (
          <Switch
            size="sm"
            value={item.value}
            onToggle={item.onPress}
            trackColor={{ true: colors.themePrimary, false: '#C4C4C4' }}
          />
        ) : (
          <Icon as={ChevronRightIcon} size="sm" color={isDarkMode ? '#8E8E93' : '#C4C4C4'} />
        )}
      </Pressable>
    );
  };

  const renderSection = (title: string, items: any[]) => (
    <Box mb={moderateScaleVertical(24)}>
      <Text
        fontFamily="$poppinsSemiBold"
        fontSize={14}
        lineHeight={20}
        color={isDarkMode ? '#8E8E93' : '#6C6C70'}
        mb={moderateScaleVertical(12)}
        ml={moderateScale(4)}>
        {title}
      </Text>
      {items.map(renderItem)}
    </Box>
  );

  return (
    <Container
      statusBarStyle={isDarkMode ? 'light-content' : 'dark-content'}
      statusBarBackgroundColor={isDarkMode ? '#000000' : '#FFFFFF'}
      backgroundColor={isDarkMode ? '#000000' : '#F9F9FB'}
      isDarkMode={isDarkMode}>
      <AppBar back title="Settings" isDarkMode={isDarkMode} />

      <ScrollView showsVerticalScrollIndicator={false}>
        <Box mx={moderateScale(16)} mt={moderateScaleVertical(16)} mb={moderateScaleVertical(40)}>
          {renderSection('Preferences', preferenceItems)}
          {renderSection('Account', accountItems)}
          {renderSection('Support', supportItems)}
        </Box>
      </ScrollView>
    </Container>
  );
};

export default Settings;
