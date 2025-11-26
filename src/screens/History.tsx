import {Container} from '../components/Container';
import {AppBar} from '../components/AppBar';
import {colors} from '../constants/colors';
import {Box, Pressable, Text} from '@gluestack-ui/themed';
import {moderateScale, moderateScaleVertical} from '../utils/responsiveSize';
import {useState, useEffect} from 'react';
import {FlatList, ActivityIndicator} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment';
import React from 'react';
import {useTheme} from '../constants/ThemeContext';
import socketServices from '../utils/socketServices';

const HistoryCard = ({
  item,
  index,
  selectedOption,
}: {
  item: any;
  index: number;
  selectedOption: string;
}) => {
  const {isDarkMode} = useTheme();

  const bookingDateTime = moment(
    `${item.bookingDate} ${item.bookingTime}`,
    'YYYY-MM-DD hh:mm A',
  ).format('MMM DD, YYYY - hh:mm A');

  const statusText = () => {
    switch (selectedOption) {
      case 'active':
        return 'Waiting for pickup';
      case 'ongoing':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return '';
    }
  };

  const statusColor = () => {
    switch (selectedOption) {
      case 'active':
        return colors.orange;
      case 'ongoing':
        return colors.themeBlue;
      case 'completed':
        return colors.emeraldGreen;
      case 'cancelled':
        return colors.firebrickRed;
      default:
        return colors.dimGray;
    }
  };

  return (
    <Box
      key={item._id}
      borderWidth={1}
      borderColor={colors.themePrimary}
      py={moderateScaleVertical(15)}
      px={moderateScale(10)}
      borderRadius={moderateScale(6)}
      mb={moderateScaleVertical(10)}>
      <Box
        flexDirection="row"
        alignItems="center"
        justifyContent="space-between"
        mb={moderateScaleVertical(8)}>
        <Text
          fontFamily={'$poppinsMedium'}
          fontSize={14}
          lineHeight={16}
          color={isDarkMode ? colors.white : colors.black}>
          {item.rideCategory.toUpperCase()} RIDE
        </Text>
        <Text
          fontFamily={'$poppinsMedium'}
          fontSize={12}
          lineHeight={14}
          color={statusColor()}>
          {statusText()}
        </Text>
      </Box>

      <Box mb={moderateScaleVertical(8)}>
        <Text
          fontFamily={'$poppinsMedium'}
          fontSize={12}
          lineHeight={14}
          color={isDarkMode ? colors.white : colors.dimGray}>
          From:
        </Text>
        <Text
          fontFamily={'$poppinsRegular'}
          fontSize={12}
          lineHeight={14}
          color={isDarkMode ? colors.white : colors.black}
          numberOfLines={2}>
          {item.pickupLocation.address}
        </Text>
      </Box>

      <Box mb={moderateScaleVertical(8)}>
        <Text
          fontFamily={'$poppinsMedium'}
          fontSize={12}
          lineHeight={14}
          color={isDarkMode ? colors.white : colors.dimGray}>
          To:
        </Text>
        <Text
          fontFamily={'$poppinsRegular'}
          fontSize={12}
          lineHeight={14}
          color={isDarkMode ? colors.white : colors.black}
          numberOfLines={2}>
          {item.destinationLocation.address}
        </Text>
      </Box>

      <Box
        flexDirection="row"
        justifyContent="space-between"
        alignItems="center"
        mt={moderateScaleVertical(8)}>
        <Box>
          <Text
            fontFamily={'$poppinsMedium'}
            fontSize={10}
            lineHeight={12}
            color={isDarkMode ? colors.white : colors.dimGray}>
            Distance
          </Text>
          <Text
            fontFamily={'$poppinsRegular'}
            fontSize={12}
            lineHeight={14}
            color={isDarkMode ? colors.white : colors.black}>
            {item.distance.toFixed(2)} km
          </Text>
        </Box>

        <Box>
          <Text
            fontFamily={'$poppinsMedium'}
            fontSize={10}
            lineHeight={12}
            color={isDarkMode ? colors.white : colors.dimGray}>
            Duration
          </Text>
          <Text
            fontFamily={'$poppinsRegular'}
            fontSize={12}
            lineHeight={14}
            color={isDarkMode ? colors.white : colors.black}>
            {item.duration.toFixed(2)} mins
          </Text>
        </Box>

        <Box>
          <Text
            fontFamily={'$poppinsMedium'}
            fontSize={10}
            lineHeight={12}
            color={isDarkMode ? colors.white : colors.dimGray}>
            Amount
          </Text>
          <Text
            fontFamily={'$poppinsRegular'}
            fontSize={12}
            lineHeight={14}
            color={isDarkMode ? colors.white : colors.black}>
            ₹{item.payableAmount.toFixed(2)}
          </Text>
        </Box>
      </Box>

      <Box mt={moderateScaleVertical(8)}>
        <Text
          fontFamily={'$poppinsMedium'}
          fontSize={10}
          lineHeight={12}
          color={isDarkMode ? colors.white : colors.dimGray}>
          Booked on
        </Text>
        <Text
          fontFamily={'$poppinsRegular'}
          fontSize={12}
          lineHeight={14}
          color={isDarkMode ? colors.white : colors.black}>
          {bookingDateTime}
        </Text>
      </Box>
    </Box>
  );
};

const History = () => {
  const {isDarkMode} = useTheme();
  const [selectedOption, setSelectedOption] = useState<'active' | 'ongoing' | 'completed' | 'cancelled'>('active');
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noDataMessage, setNoDataMessage] = useState<string | null>(null);

  const fetchBookings = async () => {
    setLoading(true);
    setError(null);
    setNoDataMessage(null);

    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        return;
      }

      // Emit socket event based on selected tab
      const statusMap = {
        active: 'waiting for pickup',
        ongoing: 'ongoing',
        completed: 'completed',
        cancelled: 'cancelled'
      };

      socketServices.emit('client_booking', {
        bookingStatus: statusMap[selectedOption]
      });

      // Clear previous listeners to avoid duplicates
      // socketServices.off('client_booking_error');
      // socketServices.off('client_booking_list');

      socketServices.on('client_booking_error', (errorData: any) => {
        console.log('Error data:', JSON.stringify(errorData));
        setError('Failed to fetch data. Please try again.');
        setLoading(false);
      });

      socketServices.on('client_booking_list', (response: any) => {
        console.log('Booking data:', JSON.stringify(response));
        if (response.data && response.data.length > 0) {
          setBookings(response.data);
          setNoDataMessage(null);
        } else {
          setBookings([]);
          setNoDataMessage(`No ${selectedOption} rides found.`);
        }
        setLoading(false);
      });

    } catch (err) {
      console.log('Error:', err);
      setError('Failed to fetch data. Please try again.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();

    // Clean up socket listeners when component unmounts
    return () => {
      // socketServices.off('client_booking_error');
      // socketServices.off('client_booking_list');
    };
  }, [selectedOption]);

  return (
    <Container
      statusBarStyle={isDarkMode ? 'light-content' : 'dark-content'}
      statusBarBackgroundColor={isDarkMode ? '#000000' : '#ffffff'}
      backgroundColor={isDarkMode ? colors.black : colors.white}>
      <AppBar back title="History" isDarkMode={isDarkMode} />

      <Box
        flexDirection="row"
        alignItems="center"
        bgColor={colors.ivoryYellow}
        mx={moderateScale(15)}
        borderRadius={moderateScale(5)}
        borderWidth={1}
        borderColor={colors.themePrimary}
        overflow="hidden"
        my={moderateScaleVertical(15)}>
        <Pressable
          onPress={() => setSelectedOption('active')}
          bgColor={
            selectedOption === 'active' ? colors.themePrimary : 'transparent'
          }
          py={moderateScaleVertical(12)}
          flex={1}
          borderRadius={moderateScale(5)}>
          <Text
            fontFamily={'$poppinsMedium'}
            fontSize={12}
            lineHeight={14}
            color={
              selectedOption === 'active' ? colors.white : colors.dimGray
            }
            numberOfLines={1}
            alignSelf="center">
            Active
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setSelectedOption('ongoing')}
          bgColor={
            selectedOption === 'ongoing' ? colors.themePrimary : 'transparent'
          }
          py={moderateScaleVertical(12)}
          flex={1}
          borderRadius={moderateScale(5)}>
          <Text
            fontFamily={'$poppinsMedium'}
            fontSize={12}
            lineHeight={14}
            color={
              selectedOption === 'ongoing' ? colors.white : colors.dimGray
            }
            numberOfLines={1}
            alignSelf="center">
            Ongoing
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setSelectedOption('completed')}
          bgColor={
            selectedOption === 'completed' ? colors.themePrimary : 'transparent'
          }
          py={moderateScaleVertical(12)}
          flex={1}
          borderRadius={moderateScale(5)}>
          <Text
            fontFamily={'$poppinsMedium'}
            fontSize={12}
            lineHeight={14}
            color={
              selectedOption === 'completed' ? colors.white : colors.dimGray
            }
            numberOfLines={1}
            alignSelf="center">
            Completed
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setSelectedOption('cancelled')}
          bgColor={
            selectedOption === 'cancelled' ? colors.themePrimary : 'transparent'
          }
          py={moderateScaleVertical(12)}
          flex={1}
          borderRadius={moderateScale(5)}>
          <Text
            fontFamily={'$poppinsMedium'}
            fontSize={12}
            lineHeight={14}
            color={
              selectedOption === 'cancelled' ? colors.white : colors.dimGray
            }
            numberOfLines={1}
            alignSelf="center">
            Cancelled
          </Text>
        </Pressable>
      </Box>

      {loading ? (
        <Box
          flex={1}
          justifyContent="center"
          alignItems="center"
          mt={moderateScale(20)}>
          <ActivityIndicator size="large" color={colors.themePrimary} />
        </Box>
      ) : error ? (
        <Box
          flex={1}
          justifyContent="center"
          alignItems="center"
          mt={moderateScale(20)}>
          <Text
            fontFamily={'$poppinsMedium'}
            fontSize={14}
            lineHeight={16}
            color={colors.firebrickRed}>
            {error}
          </Text>
        </Box>
      ) : (
        <>
          {noDataMessage ? (
            <Box
              flex={1}
              justifyContent="center"
              alignItems="center"
              mt={moderateScale(20)}>
              <Text
                fontFamily={'$poppinsMedium'}
                fontSize={14}
                lineHeight={16}
                color={isDarkMode ? colors.white : colors.dimGray}>
                {noDataMessage}
              </Text>
            </Box>
          ) : (
            <FlatList
              data={bookings}
              renderItem={({item, index}) => (
                <HistoryCard
                  item={item}
                  index={index}
                  selectedOption={selectedOption}
                />
              )}
              keyExtractor={item => item._id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: moderateScale(15),
                paddingBottom: moderateScaleVertical(20),
              }}
            />
          )}
        </>
      )}
    </Container>
  );
};

export default History;