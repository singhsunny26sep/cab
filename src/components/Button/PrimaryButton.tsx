import {Box, Button, ButtonText, Spinner} from '@gluestack-ui/themed';
import {ViewStyle} from 'react-native';
import {forwardRef} from 'react';
import {colors} from '../../constants/colors';

export type ButtonProps = {
  onPress?: () => void;
  buttonText: string;
  disabled?: boolean;
  loading?: boolean;
  fontSize?: number;
  textColor?: string;
  loaderColor?: string;
} & ViewStyle & {style?: ViewStyle};

const PrimaryButton = forwardRef((props: ButtonProps, ref) => {
  const {
    onPress,
    buttonText,
    disabled = false,
    loaderColor = 'white',
    loading = false,
    fontSize = 16,
    textColor = 'white',
    ...styleProps
  } = props;

  return (
    <Button
      borderRadius={6}
      backgroundColor={disabled ? 'orange' : colors.themeSecondary}
      height={56}
      gap={16}
      onPress={onPress}
      style={[styleProps]}>
      <ButtonText
        fontSize={fontSize}
        color={textColor}
        fontFamily="$robotoMedium"
        numberOfLines={1}>
        {buttonText}{' '}
      </ButtonText>
      {loading && <Spinner color={loaderColor} size={20} />}
    </Button>
  );
});

export default PrimaryButton;
