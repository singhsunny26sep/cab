import { useState } from 'react';
import { Box, Text, Pressable } from '@gluestack-ui/themed';
import { ParamListBase, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { responsiveHeight, responsiveWidth } from 'react-native-responsive-dimensions';

import { Container } from '../components/Container';
import { AppBar } from '../components/AppBar';
import { colors } from '../constants/colors';
import { moderateScale, moderateScaleVertical } from '../utils/responsiveSize';
import { NavigationString } from '../navigation/navigationStrings';
import PrimaryButton from '../components/Button/PrimaryButton';
import InputText from '../components/TextInput/InputText';
import { CloseEyeIcon, OpenEyeIcon } from '../components/Icons';

const SetPassword = () => {

  // states
  const [secureText, setSecureText] = useState(false);
  const [secureCText, setSecureCText] = useState(false);

  const EyeIcon = () => {
    return (
      <Pressable onPress={() => { setSecureText(!secureText); }} pr={moderateScale(10)}>
        <>
          {secureText ? <CloseEyeIcon /> : <OpenEyeIcon />}
        </>
      </Pressable>
    );
  };

  const EyeCIcon = () => {
    return (
      <Pressable onPress={() => { setSecureCText(!secureCText); }} pr={moderateScale(10)}>
        <>
          {secureText ? <CloseEyeIcon /> : <OpenEyeIcon />}
        </>
      </Pressable>
    );
  };

  return (
    <Container statusBarStyle="dark-content" statusBarBackgroundColor={colors.white}>
      <AppBar back />

      <Box flex={1} mt={moderateScaleVertical(30)} mx={moderateScale(20)} >

        <Box alignItems="center" gap={moderateScaleVertical(15)}>
          <Text fontFamily={'$poppinsMedium'} fontSize={24} lineHeight={26} color={colors.charcoalGray} numberOfLines={1}>Set password</Text>
          <Text fontFamily={'$poppinsRegular'} fontSize={16} lineHeight={18} color={colors.mediumLightGray} numberOfLines={1}>Set your password</Text>
        </Box>

        <Box gap={moderateScaleVertical(20)} mt={moderateScaleVertical(60)}>
          <InputText
            textInputProps={{
              placeholder: 'Enter Your Password',

            }}
            secureTextEntry={secureText}
            right={<EyeIcon />}
          />

          <InputText
            textInputProps={{
              placeholder: 'Confirm Password',

            }}
            secureTextEntry={secureText}
            right={<EyeCIcon />}
          />
        </Box>

        <Text fontFamily={'$poppinsMedium'} fontSize={14} lineHeight={16} color={'#A6A6A6'} numberOfLines={1} mt={moderateScaleVertical(8)}>Atleast 1 number or a special character</Text>


        <PrimaryButton buttonText="Register" marginTop={moderateScaleVertical(50)} />
      </Box>
    </Container>
  );
};

export default SetPassword;
