import {ParamListBase, useNavigation} from '@react-navigation/native';
import {Box, Text} from '@gluestack-ui/themed';
import {DrawerNavigationProp} from '@react-navigation/drawer';
import {useFocusEffect} from '@react-navigation/native';
import moment from 'moment';

import {Container} from '../components/Container';
import {colors} from '../constants/colors';
import {moderateScale, moderateScaleVertical} from '../utils/responsiveSize';
import {Pressable} from '@gluestack-ui/themed';
import {
  HamburgerIcon,
  Notification,
  TransectionsCreditIcon,
  TransectionsDebitIcon,
  // TransactionsCreditIcon,
  // TransactionsDebitIcon,
} from '../components/Icons';
import {NavigationString} from '../navigation/navigationStrings';
import Body from '../components/Body/Body';
import PrimaryButton from '../components/Button/PrimaryButton';
import {useEffect, useState, useCallback} from 'react';
import {loadUserFromStorage} from '../store/slice/UserSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {BASE_URL, Instance} from '../api/Instance';
import {
  GET_PROFILE,
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
  const [loading, setLoading] = useState({
    wallet: false,
    transactions: false,
  });

  const navigation = useNavigation<DrawerNavigationProp<ParamListBase>>();

  const loadData = useCallback(() => {
    loadUserLocalDatas();
  }, []);

  // Use focus effect to refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
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
      setLoading(prev => ({...prev, wallet: true}));
      const token = await AsyncStorage.getItem('userToken');
      const url = `${BASE_URL}${GET_WALLET_HISTORY.url}`;
      const response = await Instance.get(url, {
        headers: {
          Authorization: token,
        },
      });
      if (response.status === 200) {
        setWalletData(response.data.wallet);
      }
    } catch (error: any) {
      console.log('error for Wallet Balance - ', error?.response?.data);
    } finally {
      setLoading(prev => ({...prev, wallet: false}));
    }
  };

  const handleFetchTransactionsHistories = async () => {
    try {
      setLoading(prev => ({...prev, transactions: true}));
      const token = await AsyncStorage.getItem('userToken');
      const url = `${BASE_URL}${GET_TRANSACTIONS_HISTORIES.url}`;
      const response = await Instance.get(url, {
        headers: {
          Authorization: token,
        },
      });
      if (response.status === 200) {
        setTransactions(response.data.data);
      }
    } catch (error: any) {
      console.log('error for transaction histories => ', error?.response?.data);
    } finally {
      setLoading(prev => ({...prev, transactions: false}));
    }
  };

  const formatDate = (dateString: string) => {
    return moment(dateString).format('MMM DD, YYYY hh:mm A');
  };

  return (
    <Container
      statusBarStyle="dark-content"
      statusBarBackgroundColor={colors.white}>
      <Box
        flexDirection="row"
        alignItems="center"
        justifyContent="space-between"
        py={moderateScaleVertical(15)}
        px={moderateScale(15)}>
        <Pressable
          onPress={() => {
            navigation.openDrawer();
          }}
          bgColor={colors.paleYellow}
          w={moderateScale(32)}
          h={moderateScale(32)}
          borderRadius={moderateScale(5)}
          alignItems="center"
          justifyContent="center">
          <HamburgerIcon />
        </Pressable>
        <Text
          fontFamily={'$poppinsMedium'}
          fontSize={20}
          lineHeight={32}
          color={colors.black}
          numberOfLines={1}
          textAlign="center">
          Wallet
        </Text>
        <Pressable
          onPress={() => navigation.navigate(NavigationString?.Notifications)}
          bgColor={colors.paleYellow}
          w={moderateScale(32)}
          h={moderateScale(32)}
          borderRadius={moderateScale(5)}
          alignItems="center"
          justifyContent="center">
          <Notification />
        </Pressable>
      </Box>

      <Body style={{marginHorizontal: moderateScale(7)}}>
        <PrimaryButton
          buttonText="Add Money"
          onPress={() => navigation.navigate(NavigationString.AddMoney)}
          borderWidth={1}
          textColor={colors.themePrimary}
          borderColor={colors.themePrimary}
          backgroundColor={'transparent'}
          width={moderateScale(170)}
          height={moderateScale(54)}
          alignSelf="center"
          marginBottom={moderateScaleVertical(25)}
          marginTop={moderateScaleVertical(10)}
        />

        <Box
          flexDirection="row"
          alignItems="center"
          gap={moderateScale(25)}
          mb={moderateScaleVertical(5)}>
          <Box
            borderWidth={1}
            borderColor={colors.themePrimary}
            bgColor={colors.ivoryYellow}
            flex={1}
            h={moderateScale(145)}
            borderRadius={moderateScale(10)}
            alignItems="center"
            justifyContent="center">
            <Box gap={moderateScaleVertical(15)}>
              <Text
                fontFamily={'$poppinsMedium'}
                fontSize={28}
                lineHeight={32}
                color={colors.charcoalGray}
                numberOfLines={1}
                textAlign="center">
                {'\u20B9'} {walletData?.balance || 0}
              </Text>
              <Text
                fontFamily={'$poppinsMedium'}
                fontSize={14}
                lineHeight={16}
                color={colors.charcoalGray}
                numberOfLines={1}
                textAlign="center">
                Available Balance
              </Text>
            </Box>
          </Box>

          <Box
            borderWidth={1}
            borderColor={colors.themePrimary}
            bgColor={colors.ivoryYellow}
            flex={1}
            h={moderateScale(145)}
            borderRadius={moderateScale(10)}
            alignItems="center"
            justifyContent="center">
            <Box gap={moderateScaleVertical(15)}>
              <Text
                fontFamily={'$poppinsMedium'}
                fontSize={28}
                lineHeight={32}
                color={colors.charcoalGray}
                numberOfLines={1}
                textAlign="center">
                {'\u20B9'} {walletData?.debitAmount || 0}
              </Text>
              <Text
                fontFamily={'$poppinsMedium'}
                fontSize={14}
                lineHeight={16}
                color={colors.charcoalGray}
                numberOfLines={1}
                textAlign="center">
                Total Expend
              </Text>
            </Box>
          </Box>
        </Box>

        <Box
          flexDirection="row"
          alignItems="center"
          justifyContent="space-between"
          my={moderateScaleVertical(20)}>
          <Text
            fontFamily={'$poppinsSemiBold'}
            fontSize={16}
            lineHeight={18}
            color={colors.charcoalGray}
            numberOfLines={1}>
            Transactions
          </Text>
          <Pressable
            onPress={() =>
              navigation.navigate(NavigationString.ViewAllTransections, {
                transactions: transactions,
              })
            }>
            <Text
              fontFamily={'$poppinsMedium'}
              fontSize={12}
              lineHeight={14}
              color={colors.themePrimary}
              numberOfLines={1}>
              See All
            </Text>
          </Pressable>
        </Box>

        <Box gap={moderateScaleVertical(15)} mb={moderateScaleVertical(70)}>
          {loading.transactions ? (
            <Text flex={1} textAlign="center" textAlignVertical="center">
              Loading transactions...
            </Text>
          ) : transactions.length === 0 ? (
            <Text flex={1} textAlign="center" textAlignVertical="center">
              No transactions found
            </Text>
          ) : (
            transactions.slice(0, 5).map(transaction => (
              <Box
                key={transaction._id}
                flexDirection="row"
                alignItems="center"
                justifyContent="space-between"
                borderWidth={1}
                borderColor={colors.themePrimary}
                py={moderateScaleVertical(10)}
                px={moderateScale(10)}
                borderRadius={moderateScale(6)}>
                <Box
                  flexDirection="row"
                  alignItems="center"
                  gap={moderateScale(15)}>
                  {transaction.type === 'debit' ? (
                    // Naming is wronng for icon. it is for debit.
                    <TransectionsCreditIcon />
                  ) : (
                    <TransectionsDebitIcon />
                  )}
                  <Box gap={moderateScaleVertical(3)}>
                    <Text
                      fontFamily={'$poppinsMedium'}
                      fontSize={14}
                      lineHeight={16}
                      color={colors.black}
                      numberOfLines={1}>
                      {transaction.purpose}
                    </Text>
                    <Text
                      fontFamily={'$poppinsRegular'}
                      fontSize={12}
                      lineHeight={14}
                      color={colors.dimGray}
                      numberOfLines={1}>
                      {formatDate(transaction.createdAt)}
                    </Text>
                  </Box>
                </Box>
                <Text
                  fontFamily={'$poppinsMedium'}
                  fontSize={14}
                  lineHeight={16}
                  color={
                    transaction.type === 'credit' ? colors.green : colors.black
                  }
                  numberOfLines={1}>
                  {transaction.type === 'credit' ? '+' : '-'}
                  {'\u20B9'}
                  {transaction.amount}
                </Text>
              </Box>
            ))
          )}
        </Box>
      </Body>
    </Container>
  );
};

export default Wallet;
