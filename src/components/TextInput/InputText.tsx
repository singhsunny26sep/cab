// import { Box, Input, Text } from "@gluestack-ui/themed";
// // import { ControllerRenderProps, FieldValues } from "react-hook-form";

// import { TextInput, TextInputProps } from 'react-native'
// import { colors } from "../../constants/colors";
// import { moderateScale, textScale } from "../../utils/responsiveSize";

// export interface InputTextProps {
//   label?: string;
//   // field: ControllerRenderProps<FieldValues, string>;
//   textInputProps?: TextInputProps;
//   height?: number;
//   left?: any;
//   right?: any;
//   handleKeyPress?: () => void;
//   borderWith?: number;
//   secureTextEntry?: boolean;
// }

// function InputText(props: InputTextProps) {
//   const { right, left, handleKeyPress, borderWith = 1, textInputProps, label, secureTextEntry = false, height = moderateScale(56) } = props;
//   // const { onChange, value, onBlur } = field;

//   return (

//     <Input h={height} borderRadius={9} borderWidth={borderWith} borderColor="#B8B8B8" alignItems="center">
//       {left}
//       <TextInput
//         placeholder={textInputProps?.placeholder ?? ""}
//         // value={value}
//         // onChangeText={textInputProps?.keyboardType === "numeric" ? (val) => onChange(Number(val)) : onChange}
//         // onBlur={onBlur}
//         onSubmitEditing={handleKeyPress}
//         returnKeyType="done"
//         placeholderTextColor={'#D0D0D0'}
//         secureTextEntry={secureTextEntry}
//         style={[{ fontSize: textScale(14), color: colors.black, fontFamily: 'Poppins-Medium', paddingLeft: moderateScale(15), flex: 1, lineHeight: textScale(25), paddingVertical:moderateScale(5) }]}
//         {...textInputProps}
//       />
//       {right}
//     </Input>
//   );
// }

// export default InputText;
import { Box, Input, Text } from '@gluestack-ui/themed';
import { TextInput, TextInputProps } from 'react-native';
import { colors } from '../../constants/colors';
import { moderateScale, textScale } from '../../utils/responsiveSize';

export interface InputTextProps {
  label?: string;
  textInputProps?: TextInputProps;
  height?: number;
  left?: any;
  right?: any;
  handleKeyPress?: () => void;
  borderWith?: number;
  secureTextEntry?: boolean;
  isDarkMode?: boolean;
}

function InputText(props: InputTextProps) {
  const { right, left, handleKeyPress, borderWith = 1, textInputProps, label, secureTextEntry = false, height = moderateScale(56), isDarkMode } = props;

  return (
    <Input h={height} borderRadius={9} borderWidth={borderWith} borderColor="#B8B8B8" alignItems="center">
      {left}
      <TextInput
        placeholder={textInputProps?.placeholder ?? ''}
        onSubmitEditing={handleKeyPress}
        returnKeyType="done"
        placeholderTextColor={isDarkMode ? colors.white : '#D0D0D0'}
        secureTextEntry={secureTextEntry}
        style={[
          {
            fontSize: textScale(14),
            color: isDarkMode ? colors.white : colors.black,
            fontFamily: 'Poppins-Medium',
            paddingLeft: moderateScale(15),
            flex: 1,
            lineHeight: textScale(25),
            paddingVertical: moderateScale(5),
          },
        ]}
        {...textInputProps}
      />
      {right}
    </Input>
  );
}

export default InputText;
