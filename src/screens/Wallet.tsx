import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ParamListBase,
  useFocusEffect,
  useNavigation,
} from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import {
  Box,
  Text,
  Pressable,
  ScrollView,
  RefreshControl,
} from '@gluestack-ui/themed';
import moment from 'moment';
import { Animated } from 'react-native';

import { Container } from '../components/Container';
import { colors } from '../constants/colors';
import { moderateScale, moderateScaleVertical } from '../utils/responsiveSize';
import {
  HamburgerIcon,
  Notification,
  TransectionsCreditIcon,
  TransectionsDebitIcon,
} from '../components/Icons';
import { NavigationString } from '../navigation/navigationStrings';
import Body from '../components/Body/Body';
import PrimaryButton from '../components/Button/PrimaryButton';
import { loadUserFromStorage } from '../store/slice/UserSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL, Instance } from '../api/Instance.ts';
import {
  GET_TRANSACTIONS_HISTORIES,
  GET_WALLET_HISTORY,
} from '../api/ApiEndpoints';

interface Transaction {
  _id: string;
  amount: number;
  createdAt: string;
  purpose: string;
  type: 'credit' | 'debit';
}

interface WalletData {
  balance: number;
  debitAmount: number;
  creditAmount: number;
}

const Wallet = () => {
  const [userLocalData, setUserLocalData] = useState<any>(null);
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState({
    wallet: false,
    transactions: false,
  });

  const navigation = useNavigation<DrawerNavigationProp<ParamListBase>>();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const loadData = useCallback(async () => {
    await loadUserLocalDatas();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (userLocalData) {
      handleFetchWalletBalance();
      handleFetchTransactionsHistories();
    }
  }, [userLocalData]);

  const loadUserLocalDatas = async () => {
    try {
      const localData = await loadUserFromStorage();
      setUserLocalData(localData);
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  };

  const handleFetchWalletBalance = async () => {
    try {
      setLoading(prev => ({ ...prev, wallet: true }));
      const token = await AsyncStorage.getItem('userToken');
      const url = `${BASE_URL}${GET_WALLET_HISTORY.url}`;
      const response = await Instance.get(url, {
        headers: { Authorization: token },
      });
      if (response.status === 200) {
        setWalletData(response.data.wallet);
      }
    } catch (error: any) {
      console.log('error for Wallet Balance - ', error?.response?.data);
    } finally {
      setLoading(prev => ({ ...prev, wallet: false }));
    }
  };

  const handleFetchTransactionsHistories = async () => {
    try {
      setLoading(prev => ({ ...prev, transactions: true }));
      const token = await AsyncStorage.getItem('userToken');
      const url = `${BASE_URL}${GET_TRANSACTIONS_HISTORIES.url}`;
      const response = await Instance.get(url, {
        headers: { Authorization: token },
      });
      if (response.status === 200) {
        setTransactions(response.data.data);
      }
    } catch (error: any) {
      console.log('error for transaction histories => ', error?.response?.data);
    } finally {
      setLoading(prev => ({ ...prev, transactions: false }));
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      handleFetchWalletBalance(),
      handleFetchTransactionsHistories(),
    ]);
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    return moment(dateString).format('MMM DD, YYYY • hh:mm A');
  };

  const getTransactionIcon = (type: string) => {
    return type === 'credit' ? (
      <Box
        bg="rgba(52, 199, 89, 0.12)"
        p={moderateScale(10)}
        borderRadius={moderateScale(30)}>
        <TransectionsCreditIcon />
      </Box>
    ) : (
      <Box
        bg="rgba(255, 59, 48, 0.12)"
        p={moderateScale(10)}
        borderRadius={moderateScale(30)}>
        <TransectionsDebitIcon />
      </Box>
    );
  };

  return (
    <Container
      statusBarStyle="dark-content"
      statusBarBackgroundColor={colors.white}>
      <Box flex={1} bg="#F8F9FF">
        {/* Modern Header */}
        <Box
          flexDirection="row"
          alignItems="center"
          justifyContent="space-between"
          pt={moderateScaleVertical(12)}
          pb={moderateScaleVertical(8)}
          px={moderateScale(20)}
          bg="white"
          borderBottomWidth={1}
          borderBottomColor="#F0F0F5">
          <Pressable
            onPress={() => navigation.openDrawer()}
            bg="#F5F6FA"
            w={moderateScale(40)}
            h={moderateScale(40)}
            borderRadius={moderateScale(12)}
            alignItems="center"
            justifyContent="center"
            shadowColor="#000"
            shadowOffset={{ width: 0, height: 2 }}
            shadowOpacity={0.05}
            shadowRadius={4}
            elevation={2}>
            <HamburgerIcon />
          </Pressable>
          <Text
            fontFamily="$poppinsSemiBold"
            fontSize={20}
            lineHeight={28}
            color="#1C1C1E"
            letterSpacing={0.5}>
            My Wallet
          </Text>
          <Pressable
            onPress={() => navigation.navigate(NavigationString.Notifications)}
            bg="#F5F6FA"
            w={moderateScale(40)}
            h={moderateScale(40)}
            borderRadius={moderateScale(12)}
            alignItems="center"
            justifyContent="center"
            shadowColor="#000"
            shadowOffset={{ width: 0, height: 2 }}
            shadowOpacity={0.05}
            shadowRadius={4}
            elevation={2}>
            <Notification />
          </Pressable>
        </Box>

        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }>
          <Box px={moderateScale(20)} pt={moderateScaleVertical(8)}>
            {/* Add Money Button - Modern Solid Button */}
            <Animated.View
              style={{
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              }}>
              <Pressable
                onPress={() => navigation.navigate(NavigationString.AddMoney)}
                bg="#6C5CE7"
                py={moderateScaleVertical(14)}
                px={moderateScale(24)}
                borderRadius={moderateScale(30)}
                alignItems="center"
                justifyContent="center"
                flexDirection="row"
                gap={moderateScale(12)}
                mb={moderateScaleVertical(16)}
                shadowColor="#6C5CE7"
                shadowOffset={{ width: 0, height: 4 }}
                shadowOpacity={0.3}
                shadowRadius={8}
                elevation={5}>
                <Text
                  fontFamily="$poppinsSemiBold"
                  fontSize={16}
                  color="#FFFFFF"
                  letterSpacing={0.8}>
                  + Add Money
                </Text>
              </Pressable>
            </Animated.View>

            {/* Stats Cards Row */}
            <Box
              flexDirection="row"
              alignItems="center"
              gap={moderateScale(16)}
              mb={moderateScaleVertical(24)}>
              {/* Balance Card */}
              <Animated.View
                style={{
                  flex: 1,
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                }}>
                <Box
                  bg="white"
                  borderRadius={moderateScale(24)}
                  p={moderateScale(20)}
                  shadowColor="#000"
                  shadowOffset={{ width: 0, height: 6 }}
                  shadowOpacity={0.08}
                  shadowRadius={12}
                  elevation={5}>
                  <Box
                    flexDirection="row"
                    alignItems="center"
                    justifyContent="space-between"
                    mb={moderateScaleVertical(12)}>
                    <Text
                      fontFamily="$poppinsRegular"
                      fontSize={13}
                      color="#8E8E93"
                      letterSpacing={0.3}>
                      Available Balance
                    </Text>
                    
                  </Box>
                  <Text
                    fontFamily="$poppinsBold"
                    fontSize={32}
                    color="#1C1C1E"
                    letterSpacing={-0.5}>
                    ₹ {walletData?.balance?.toLocaleString() || 0}
                  </Text>
                </Box>
              </Animated.View>

              {/* Expend Card */}
              <Animated.View
                style={{
                  flex: 1,
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                }}>
                <Box
                  bg="white"
                  borderRadius={moderateScale(24)}
                  p={moderateScale(20)}
                  shadowColor="#000"
                  shadowOffset={{ width: 0, height: 6 }}
                  shadowOpacity={0.08}
                  shadowRadius={12}
                  elevation={5}>
                  <Text
                    fontFamily="$poppinsRegular"
                    fontSize={13}
                    color="#8E8E93"
                    mb={moderateScaleVertical(12)}
                    letterSpacing={0.3}>
                    Total Expend
                  </Text>
                  <Text
                    fontFamily="$poppinsBold"
                    fontSize={32}
                    color="#FF3B30"
                    letterSpacing={-0.5}>
                    ₹ {walletData?.debitAmount?.toLocaleString() || 0}
                  </Text>
                </Box>
              </Animated.View>
            </Box>

            {/* Transactions Header */}
            <Box
              flexDirection="row"
              alignItems="baseline"
              justifyContent="space-between"
              mb={moderateScaleVertical(16)}>
              <Text
                fontFamily="$poppinsSemiBold"
                fontSize={18}
                color="#1C1C1E"
                letterSpacing={0.2}>
                Recent Transactions
              </Text>
              <Pressable
                onPress={() =>
                  navigation.navigate(NavigationString.ViewAllTransections, {
                    transactions,
                  })
                }
                flexDirection="row"
                alignItems="center"
                gap={moderateScale(4)}>
                <Text
                  fontFamily="$poppinsMedium"
                  fontSize={13}
                  color="#6C5CE7">
                  See All
                </Text>
                <Text color="#6C5CE7" fontSize={14}>
                  →
                </Text>
              </Pressable>
            </Box>

            {/* Transaction List */}
            <Box gap={moderateScaleVertical(12)} pb={moderateScaleVertical(30)}>
              {loading.transactions ? (
                // Skeleton Loading
                [...Array(3)].map((_, idx) => (
                  <Box
                    key={`skeleton-${idx}`}
                    bg="white"
                    borderRadius={moderateScale(20)}
                    p={moderateScale(16)}
                    flexDirection="row"
                    alignItems="center"
                    justifyContent="space-between">
                    <Box flexDirection="row" alignItems="center" gap={12}>
                      <Box
                        bg="#E9E9EF"
                        width={48}
                        height={48}
                        borderRadius={28}
                      />
                      <Box gap={6}>
                        <Box bg="#E9E9EF" width={120} height={14} borderRadius={6} />
                        <Box bg="#E9E9EF" width={80} height={12} borderRadius={6} />
                      </Box>
                    </Box>
                    <Box bg="#E9E9EF" width={70} height={18} borderRadius={6} />
                  </Box>
                ))
              ) : transactions.length === 0 ? (
                <Box
                  bg="white"
                  borderRadius={moderateScale(24)}
                  p={moderateScale(40)}
                  alignItems="center"
                  justifyContent="center">
                  <Text
                    fontFamily="$poppinsMedium"
                    fontSize={15}
                    color="#8E8E93"
                    textAlign="center">
                    No transactions yet
                  </Text>
                  <Text
                    fontFamily="$poppinsRegular"
                    fontSize={13}
                    color="#B0B0B6"
                    mt={moderateScaleVertical(8)}>
                    Your financial journey starts here
                  </Text>
                </Box>
              ) : (
                transactions.slice(0, 5).map((transaction, index) => (
                  <Animated.View
                    key={transaction._id}
                    style={{
                      opacity: fadeAnim,
                      transform: [{ translateX: slideAnim }],
                    }}>
                    <Box
                      bg="white"
                      borderRadius={moderateScale(20)}
                      p={moderateScale(16)}
                      flexDirection="row"
                      alignItems="center"
                      justifyContent="space-between"
                      shadowColor="#000"
                      shadowOffset={{ width: 0, height: 2 }}
                      shadowOpacity={0.04}
                      shadowRadius={6}
                      elevation={2}>
                      <Box flexDirection="row" alignItems="center" gap={14}>
                        {getTransactionIcon(transaction.type)}
                        <Box gap={moderateScaleVertical(4)}>
                          <Text
                            fontFamily="$poppinsSemiBold"
                            fontSize={15}
                            color="#1C1C1E"
                            numberOfLines={1}>
                            {transaction.purpose}
                          </Text>
                          <Text
                            fontFamily="$poppinsRegular"
                            fontSize={11}
                            color="#8E8E93">
                            {formatDate(transaction.createdAt)}
                          </Text>
                        </Box>
                      </Box>
                      <Text
                        fontFamily="$poppinsBold"
                        fontSize={16}
                        color={transaction.type === 'credit' ? '#34C759' : '#FF3B30'}>
                        {transaction.type === 'credit' ? '+' : '-'}₹
                        {transaction.amount.toLocaleString()}
                      </Text>
                    </Box>
                  </Animated.View>
                ))
              )}
            </Box>
          </Box>
        </ScrollView>
      </Box>
    </Container>
  );
};

export default Wallet;