import { useNavigation } from '@react-navigation/core';
import { Box, Text, Pressable } from '@gluestack-ui/themed';
import { colors } from '../../constants/colors';
import { LeftAngleIcon } from '../Icons';
import { moderateScale } from '../../utils/responsiveSize';

type AppBarProps = {
  left?: any;
  back?: boolean;
  right?: any;
  title?: string;
  elevation?: number;
  onCustomBackPress?: () => void;
  whiteBack?: boolean;
  fontFamily?: any;
  backgroundColor?: string;
  textColor?: string;
  isDarkMode?: boolean; 
};

export function AppBar(props: AppBarProps) {
  const { 
    left, 
    right, 
    back, 
    title, 
    elevation = 5, 
    onCustomBackPress = undefined, 
    fontFamily, 
    backgroundColor = '#fff', 
    textColor = '#2A2A2A', 
    isDarkMode = false 
  } = props;

  const navigation = useNavigation();

  const headerBackgroundColor = isDarkMode ? '#000000' : backgroundColor;
  const headerTextColor = isDarkMode ? '#ffffff' : textColor; 

  return (
    <Box flexDirection={'row'} backgroundColor={headerBackgroundColor} height={50}>
      {back ? (
        <Box marginLeft={1} alignItems={'center'} justifyContent={'center'} flex={2} bgColor={headerBackgroundColor}>
          <Pressable hitSlop={22} onPress={onCustomBackPress ?? navigation.goBack} flexDirection='row' alignItems='center' gap={moderateScale(2)}>
            <LeftAngleIcon />
            <Text fontFamily='$poppinsRegular' color={isDarkMode ? '#ffffff' : '#414141'} lineHeight={24} fontSize={16}>
              {'Back'}
            </Text>
          </Pressable>
        </Box>
      ) : (
        left
      )}
      <Box flex={8} justifyContent='center' alignItems='center' marginLeft={!back ? 25 : 0}>
        <Text fontFamily='$poppinsMedium' color={headerTextColor} lineHeight={20} fontSize={18}>
          {title}
        </Text>
      </Box>
      <Box alignItems={'center'} justifyContent={'center'} flex={2}>
        {right}
      </Box>
    </Box>
  );
}
