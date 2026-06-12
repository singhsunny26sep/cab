import { Button, ButtonText, Spinner } from '@gluestack-ui/themed';
import { ViewStyle } from 'react-native';
import { forwardRef } from 'react';

import { colors } from '../../constants/colors';

export type ButtonProps = {
  onPress?: () => void;
  buttonText: string;
  disabled?: boolean;
  loading?: boolean;
} & ViewStyle & { style?: ViewStyle };

export const DangerButton = forwardRef((props: ButtonProps, ref) => {
  const { onPress, buttonText, disabled = false, loading = false, ...styleProps } = props;

  return (
    <Button justifyContent="flex-start" borderRadius={6} backgroundColor={disabled ? 'gray' : colors.red} height={56} gap={16} onPress={onPress} style={[styleProps]}>
      <ButtonText fontSize={17} fontFamily="$outfitSemiBold" color={colors.white}>{buttonText} </ButtonText>
      {loading && <Spinner color={colors.white} size={20} />}
    </Button>
  );
});

