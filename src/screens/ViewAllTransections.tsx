import React, {useState, useEffect} from 'react';
import {FlatList, ActivityIndicator, RefreshControl} from 'react-native';
import {Container} from '../components/Container';
import {AppBar} from '../components/AppBar';
import {moderateScale, moderateScaleVertical} from '../utils/responsiveSize';
import {Box, Text} from '@gluestack-ui/themed';
import {TransectionsCreditIcon, TransectionsDebitIcon} from '../components/Icons';
import {colors} from '../constants/colors';
import {useNavigation} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {BASE_URL, Instance} from '../api/Instance';
import {GET_TRANSACTIONS_HISTORIES} from '../api/ApiEndpoints';
import moment from 'moment';

interface Transaction {
  _id: string;
  amount: number;
  createdAt: string;
  purpose: string;
  type: 'credit' | 'debit';
}

const TransactionCard = ({item}: {item: Transaction}) => {
  const formatDate = (dateString: string) => {
    return moment(dateString).format('MMM DD, YYYY hh:mm A');
  };

  return (
    <Box
      flexDirection="row"
      alignItems="center"
      justifyContent="space-between"
      borderWidth={1}
      borderColor={colors.themePrimary}
      py={moderateScaleVertical(10)}
      px={moderateScale(10)}
      borderRadius={moderateScale(6)}>
      <Box flexDirection="row" alignItems="center" gap={moderateScale(15)}>
        {item.type === 'debit' ? (
          <TransectionsDebitIcon />
        ) : (
          <TransectionsCreditIcon />
        )}
        <Box gap={moderateScaleVertical(3)}>
          <Text
            fontFamily={'$poppinsMedium'}
            fontSize={14}
            lineHeight={16}
            color={colors.black}
            numberOfLines={1}>
            {item.purpose}
          </Text>
          <Text
            fontFamily={'$poppinsRegular'}
            fontSize={12}
            lineHeight={14}
            color={colors.dimGray}
            numberOfLines={1}>
            {formatDate(item.createdAt)}
          </Text>
        </Box>
      </Box>
      <Text
        fontFamily={'$poppinsMedium'}
        fontSize={14}
        lineHeight={16}
        color={item.type === 'credit' ? colors.green : colors.black}
        numberOfLines={1}>
        {item.type === 'credit' ? '+' : '-'}
        {'\u20B9'}
        {item.amount}
      </Text>
    </Box>
  );
};

const ViewAllTransactions = () => {
  const navigation = useNavigation();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchTransactions = async (isRefreshing = false) => {
    try {
      // If refreshing, reset page to 1 and clear existing transactions
      if (isRefreshing) {
        setPage(1);
        setHasMore(true);
        setRefreshing(true);
      } else {
        if (!hasMore) return;
        setLoading(true);
      }
      
      setError(null);
      
      const token = await AsyncStorage.getItem('userToken');
      const url = `${BASE_URL}${GET_TRANSACTIONS_HISTORIES.url}?page=${isRefreshing ? 1 : page}`;
      
      const response = await Instance.get(url, {
        headers: {
          Authorization: token,
        },
      });

      if (response.status === 200) {
        const newTransactions = response.data.data;
        
        if (isRefreshing) {
          setTransactions(newTransactions);
        } else {
          // Filter out any duplicates before adding new transactions
          const existingIds = new Set(transactions.map(t => t._id));
          const uniqueNewTransactions = newTransactions.filter(
            (t: Transaction) => !existingIds.has(t._id)
          );
          setTransactions(prev => [...prev, ...uniqueNewTransactions]);
        }
        
        // Check if there are more pages
        if (page >= response.data.totalPages) {
          setHasMore(false);
        } else if (!isRefreshing) {
          setPage(prev => prev + 1);
        }
      }
    } catch (error: any) {
      console.log('Error fetching transactions:', error);
      setError('Failed to load transactions. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleLoadMore = () => {
    if (!loading && hasMore && !refreshing) {
      fetchTransactions();
    }
  };

  const handleRefresh = () => {
    fetchTransactions(true);
  };

  const renderFooter = () => {
    if (!loading || refreshing) return null;
    
    return (
      <Box py={moderateScaleVertical(20)}>
        <ActivityIndicator size="small" color={colors.themePrimary} />
      </Box>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    
    return (
      <Box flex={1} justifyContent="center" alignItems="center" py={moderateScaleVertical(20)}>
        <Text
          fontFamily={'$poppinsMedium'}
          fontSize={14}
          color={colors.dimGray}>
          {error || 'No transactions found'}
        </Text>
      </Box>
    );
  };

  return (
    <Container
      statusBarStyle="dark-content"
      statusBarBackgroundColor={'#f5f5f5'}
      backgroundColor="#f5f5f5">
      <AppBar back title="Transactions" backgroundColor="#f5f5f5" />

      {error && !loading && (
        <Box px={moderateScale(15)} py={moderateScaleVertical(10)}>
          <Text color={colors.red}>{error}</Text>
        </Box>
      )}

      <FlatList
        data={transactions}
        renderItem={({item}) => <TransactionCard item={item} />}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          marginHorizontal: moderateScale(15),
          gap: moderateScaleVertical(15),
          paddingBottom: moderateScaleVertical(15),
          flexGrow: 1,
        }}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.themePrimary]}
            tintColor={colors.themePrimary}
          />
        }
      />
    </Container>
  );
};

export default ViewAllTransactions;