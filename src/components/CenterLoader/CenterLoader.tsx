import { Modal, StyleSheet, Text, View } from 'react-native';
import React from 'react';
import { Box } from '@gluestack-ui/themed';
import { Spinner } from '@gluestack-ui/themed';
import { colors } from '../../constants/colors';



export default function CenterLoader({ isLoading }: { isLoading: boolean }) {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isLoading}
    >
      <Box flex={1} justifyContent="center" alignItems="center" backgroundColor="rgba(0, 0, 0, 0.5)" >
        <Box backgroundColor="#fff" borderRadius={'$full'} alignItems="center" justifyContent="center" elevation={5} p={10}>

          <Spinner size={'large'} color={colors.themePrimary} />
        </Box>
      </Box>
    </Modal>
  );
}

const styles = StyleSheet.create({});
