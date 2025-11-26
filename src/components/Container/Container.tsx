import { Fragment, useCallback } from 'react';
import { Platform, SafeAreaView, StatusBar, StatusBarStyle, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/core';
import { Box } from '@gluestack-ui/themed';
import { colors } from '../../constants/colors';

export interface ContainerProps {
  children?: React.ReactNode;
  backgroundColor?: string;
  statusBarBackgroundColor?: string;
  statusBarStyle?: StatusBarStyle;
  fullScreen?: boolean;
  isDarkMode?: boolean; 
};

export function Container(props: ContainerProps) {
  const {
    children,
    backgroundColor = '#ffffff',
    fullScreen,
    statusBarBackgroundColor,
    statusBarStyle = "light-content",
    isDarkMode = false, 
  } = props;

  const statusBarBackgroundColorIos = statusBarBackgroundColor || (isDarkMode ? '#000000' : '#ffffff');
  const screenBackgroundColor = isDarkMode ? '#000000' : backgroundColor;
  const textColor = isDarkMode ? '#ffffff' : '#000000';

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS === 'android') {
        StatusBar.setTranslucent(fullScreen ?? false);
        StatusBar.setBackgroundColor(statusBarBackgroundColor ?? 'white');
      }
      StatusBar.setBarStyle(statusBarStyle);
    }, [fullScreen, statusBarBackgroundColor, statusBarStyle]),
  );

  return (
    <Box flex={1} backgroundColor={screenBackgroundColor}>
      {fullScreen ? (
        <Fragment>{children}</Fragment>
      ) : (
        <Fragment>
          <SafeAreaView style={{ flex: 0, backgroundColor: statusBarBackgroundColorIos }} />
          <SafeAreaView style={{ flex: 1, backgroundColor: screenBackgroundColor }}>
            <View style={{ flex: 1, color: textColor }}>
              {children}
            </View>
          </SafeAreaView>
        </Fragment>
      )}
    </Box>
  );
}
