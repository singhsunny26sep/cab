import React, {useEffect, useState} from 'react';
import {FlatList, RefreshControl, View} from 'react-native';
import {Box, Image, Text, Pressable} from '@gluestack-ui/themed';
import {ParamListBase, useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import LottieView from 'lottie-react-native';

import {Container} from '../components/Container';
import {AppBar} from '../components/AppBar';
import {colors} from '../constants/colors';
import {moderateScale, moderateScaleVertical} from '../utils/responsiveSize';
import {MapMarkerBlackIcon} from '../components/Icons';
import PrimaryButton from '../components/Button/PrimaryButton';
import {NavigationString} from '../navigation/navigationStrings';
import {BASE_URL, Instance} from '../api/Instance.ts';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useTheme} from '../constants/ThemeContext';
import {GET_BIKES, GET_CARS, GET_CYCLES, GET_TAXIS} from '../api/ApiEndpoints';
import Icons from '../assets/Icons';

const transportTypes = [
  {id: 'car', label: 'Car', icon: Icons.Car},
  {id: 'bike', label: 'Bike', icon: Icons.Bike},
  {id: 'parcel', label: 'Parcel', icon: Icons.Cycle},
  {id: 'taxi', label: 'Taxi', icon: Icons.Taxi},
];

const CarCardDetail = ({item}: {item: any}) => {
  const {isDarkMode} = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<ParamListBase>>();

  return (
    <Box
      h={moderateScale(160)}
      bgColor={isDarkMode ? colors.black : colors.ivoryYellow}
      borderWidth={1}
      borderColor={colors.themePrimary}
      borderRadius={moderateScale(10)}
      px={moderateScale(10)}
      py={moderateScaleVertical(10)}
      gap={moderateScaleVertical(15)}>
      <Box flexDirection="row" alignItems="center">
        <Box flex={2} gap={moderateScale(3)}>
          <Text
            fontFamily={'$poppinsMedium'}
            fontSize={16}
            lineHeight={18}
            color={isDarkMode ? colors.white : colors.charcoalGray}
            numberOfLines={1}>
            {item.manufacturer} {item.model}
          </Text>
          <Text
            fontFamily={'$poppinsMedium'}
            fontSize={12}
            lineHeight={23}
            color={isDarkMode ? colors.white : colors.silverGray}
            numberOfLines={1}>
            {item.transmissionType} | {item.fuelType} | {item.vehicleNo}
          </Text>

          <Box flexDirection="row" alignItems="center">
            <MapMarkerBlackIcon />
            <Text
              fontFamily={'$poppinsMedium'}
              fontSize={12}
              lineHeight={14}
              color={isDarkMode ? colors.white : colors.charcoalGray}
              numberOfLines={1}>
              {item?.calculatedDistance || '800m'} (5mins away)
            </Text>
          </Box>
        </Box>

        <Box flex={1} alignItems="center" justifyContent="center">
          <Image
            alt="car"
            source={{uri: item.imagesList[0]}}
            w={moderateScale(100)}
            h={moderateScale(59)}
            resizeMode="contain"
            borderRadius={moderateScaleVertical(8)}
          />
        </Box>
      </Box>

      <Box flexDirection="row" alignItems="center" gap={moderateScale(10)}>
        <PrimaryButton
          buttonText="Book later"
          flex={1}
          borderWidth={1}
          textColor={colors.themePrimary}
          borderColor={colors.themePrimary}
          backgroundColor={'transparent'}
          onPress={() => {}}
        />
        <PrimaryButton
          buttonText="Ride now"
          onPress={() =>
            navigation.navigate(NavigationString.VehicleDetail, {vehicle: item})
          }
          flex={1}
        />
      </Box>
    </Box>
  );
};

const BikeCardDetails = ({item}: {item: any}) => {
  const navigation = useNavigation<NativeStackNavigationProp<ParamListBase>>();
  const {isDarkMode} = useTheme();

  return (
    <Box
      h={moderateScale(160)}
      bgColor={isDarkMode ? colors.black : colors.ivoryYellow}
      borderWidth={1}
      borderColor={colors.themePrimary}
      borderRadius={moderateScale(10)}
      px={moderateScale(10)}
      py={moderateScaleVertical(10)}
      gap={moderateScaleVertical(15)}>
      <Box flexDirection="row" alignItems="center">
        <Box flex={2} gap={moderateScale(3)}>
          <Text
            fontFamily={'$poppinsMedium'}
            fontSize={16}
            lineHeight={18}
            color={isDarkMode ? colors.white : colors.charcoalGray}
            numberOfLines={1}>
            {item.manufacturer} {item.model}
          </Text>
          <Text
            fontFamily={'$poppinsMedium'}
            fontSize={15}
            lineHeight={23}
            color={isDarkMode ? colors.white : colors.silverGray}
            numberOfLines={1}>
            {item.transmissionType} | {item.fuelType} | {item.vehicleNo}
          </Text>

          <Box flexDirection="row" alignItems="center">
            <MapMarkerBlackIcon />
            <Text
              fontFamily={'$poppinsMedium'}
              fontSize={12}
              lineHeight={14}
              color={isDarkMode ? colors.white : colors.charcoalGray}
              numberOfLines={1}>
              {item?.calculatedDistance || '800m'} (5mins away)
            </Text>
          </Box>
        </Box>

        <Box flex={1} alignItems="center" justifyContent="center">
          <Image
            alt="car"
            source={{uri: item.imgUrl}}
            w={moderateScale(100)}
            h={moderateScale(59)}
            resizeMode="contain"
            borderRadius={moderateScaleVertical(8)}
          />
        </Box>
      </Box>

      <Box flexDirection="row" alignItems="center" gap={moderateScale(10)}>
        <PrimaryButton
          buttonText="Book later"
          flex={1}
          borderWidth={1}
          textColor={colors.themePrimary}
          borderColor={colors.themePrimary}
          backgroundColor={'transparent'}
        />
        <PrimaryButton
          buttonText="Ride now"
          onPress={() =>
            navigation.navigate(NavigationString.VehicleDetail, {vehicle: item})
          }
          flex={1}
        />
      </Box>
    </Box>
  );
};

const CycleCardDetails = ({item}: {item: any}) => {
  const navigation = useNavigation<NativeStackNavigationProp<ParamListBase>>();
  const {isDarkMode} = useTheme();

  return (
    <Box
      h={moderateScale(160)}
      bgColor={isDarkMode ? colors.black : colors.ivoryYellow}
      borderWidth={1}
      borderColor={colors.themePrimary}
      borderRadius={moderateScale(10)}
      px={moderateScale(10)}
      py={moderateScaleVertical(10)}
      gap={moderateScaleVertical(15)}>
      <Box flexDirection="row" alignItems="center">
        <Box flex={2} gap={moderateScale(3)}>
          <Text
            fontFamily={'$poppinsMedium'}
            fontSize={16}
            lineHeight={18}
            color={isDarkMode ? colors.white : colors.charcoalGray}
            numberOfLines={1}>
            {item.brand} {item.model}
          </Text>
          <Text
            fontFamily={'$poppinsMedium'}
            fontSize={15}
            lineHeight={23}
            color={isDarkMode ? colors.white : colors.silverGray}
            numberOfLines={1}>
            {item.transmissionType} | {item?.type} | {item?.vehicleNo}
          </Text>

          <Box flexDirection="row" alignItems="center">
            <MapMarkerBlackIcon />
            <Text
              fontFamily={'$poppinsMedium'}
              fontSize={12}
              lineHeight={14}
              color={isDarkMode ? colors.white : colors.charcoalGray}
              numberOfLines={1}>
              {item?.calculatedDistance || '800m'} (5mins away)
            </Text>
          </Box>
        </Box>

        <Box flex={1} alignItems="center" justifyContent="center">
          <Image
            alt="car"
            source={{uri: item.imgUrl}}
            w={moderateScale(100)}
            h={moderateScale(59)}
            resizeMode="contain"
            borderRadius={moderateScaleVertical(8)}
          />
        </Box>
      </Box>

      <Box flexDirection="row" alignItems="center" gap={moderateScale(10)}>
        <PrimaryButton
          buttonText="Book later"
          flex={1}
          borderWidth={1}
          textColor={colors.themePrimary}
          borderColor={colors.themePrimary}
          backgroundColor={'transparent'}
        />
        <PrimaryButton
          buttonText="Ride now"
          onPress={() =>
            navigation.navigate(NavigationString.VehicleDetail, {vehicle: item})
          }
          flex={1}
        />
      </Box>
    </Box>
  );
};

const TaxiCardDetails = ({item}: {item: any}) => {
  const navigation = useNavigation<NativeStackNavigationProp<ParamListBase>>();
  const {isDarkMode} = useTheme();

  return (
    <Box
      h={moderateScale(160)}
      bgColor={isDarkMode ? colors.black : colors.ivoryYellow}
      borderWidth={1}
      borderColor={colors.themePrimary}
      borderRadius={moderateScale(10)}
      px={moderateScale(10)}
      py={moderateScaleVertical(10)}
      gap={moderateScaleVertical(15)}>
      <Box flexDirection="row" alignItems="center">
        <Box flex={2} gap={moderateScale(3)}>
          <Text
            fontFamily={'$poppinsMedium'}
            fontSize={16}
            lineHeight={18}
            color={isDarkMode ? colors.white : colors.charcoalGray}
            numberOfLines={1}>
            {item.manufacturer} {item.model}
          </Text>
          <Text
            fontFamily={'$poppinsMedium'}
            fontSize={15}
            lineHeight={23}
            color={isDarkMode ? colors.white : colors.silverGray}
            numberOfLines={1}>
            {item.transmissionType} | {item.fuelType} | {item.vehicleNo}
          </Text>
          <Box flexDirection="row" alignItems="center">
            <MapMarkerBlackIcon />
            <Text
              fontFamily={'$poppinsMedium'}
              fontSize={12}
              lineHeight={14}
              color={isDarkMode ? colors.white : colors.charcoalGray}
              numberOfLines={1}>
              {item?.calculatedDistance || '800m'} (5mins away)
            </Text>
          </Box>
        </Box>

        <Box flex={1} alignItems="center" justifyContent="center">
          <Image
            alt="car"
            source={{uri: item.imgUrl}}
            w={moderateScale(100)}
            h={moderateScale(59)}
            resizeMode="contain"
            borderRadius={moderateScaleVertical(8)}
          />
        </Box>
      </Box>

      <Box flexDirection="row" alignItems="center" gap={moderateScale(10)}>
        <PrimaryButton
          buttonText="Book later"
          flex={1}
          borderWidth={1}
          textColor={colors.themePrimary}
          borderColor={colors.themePrimary}
          backgroundColor={'transparent'}
        />
        <PrimaryButton
          buttonText="Ride now"
          onPress={() =>
            navigation.navigate(NavigationString.VehicleDetail, {vehicle: item})
          }
          flex={1}
        />
      </Box>
    </Box>
  );
};

const AvailableTransport = () => {
  const {isDarkMode} = useTheme();
  const [activeTab, setActiveTab] = useState('car');
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const fetchVehicles = async (transportType: string) => {
    setLoading(true);
    setError('');
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        setError('User token is missing!');
        return;
      }

      let url = '';
      switch (transportType) {
        case 'car':
          url = `${BASE_URL}${GET_CARS.url}`;
          break;
        case 'bike':
          url = `${BASE_URL}${GET_BIKES.url}`;
          break;
        case 'parcel':
          url = `${BASE_URL}${GET_CYCLES.url}`;
          break;
        case 'taxi':
          url = `${BASE_URL}${GET_TAXIS.url}`;
          break;
        default:
          setError('Invalid transport type');
          return;
      }

      const response = await Instance.get(url, {
        headers: {
          Authorization: token,
        },
      });
      console.log(
        response.data,
        'this is car responsedata +++++++++++++++++++++++++++++++++++++++++++++++++++++++++',
      );
      if (response.data.success) {
        const availableVehicles = response.data.data.filter(
          (item: any) =>
            item.availability === 'Available' && item.status === 'InActive',
        );
        setVehicles(availableVehicles);
      } else {
        setError('Failed to load vehicles.');
      }
    } catch (err: any) {
      console.log('error fetching vehicles -> ', err.response || err);
      setError('An error occurred while fetching the vehicles.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchVehicles(activeTab);
  }, [activeTab]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchVehicles(activeTab);
  };

  const getNoDataMessage = () => {
    switch (activeTab) {
      case 'car':
        return 'No cars available at the moment';
      case 'bike':
        return 'No bikes available at the moment';
      case 'parcel':
        return 'No cycles available at the moment';
      case 'taxi':
        return 'No taxis available at the moment';
      default:
        return 'No transport available';
    }
  };

  const renderTransportUI = () => {
    if (loading && !refreshing) {
      return (
        <Box flex={1} justifyContent="center" alignItems="center">
          <LottieView
            source={require('../assets/lotties/vehicleLoading.json')}
            autoPlay
            loop
            style={{width: moderateScale(200), height: moderateScale(200)}}
          />
        </Box>
      );
    }

    if (vehicles.length === 0 && !loading) {
      return (
        <Box flex={1} justifyContent="center" alignItems="center">
          <Text
            fontFamily="$poppinsMedium"
            fontSize={16}
            color={isDarkMode ? colors.white : colors.charcoalGray}>
            {getNoDataMessage()}
          </Text>
        </Box>
      );
    }

    switch (activeTab) {
      case 'car':
        return (
          <FlatList
            data={vehicles}
            renderItem={({item}) => <CarCardDetail item={item} />}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[colors.themePrimary]}
                tintColor={colors.themePrimary}
              />
            }
            contentContainerStyle={{
              marginHorizontal: moderateScale(15),
              gap: moderateScaleVertical(10),
              paddingBottom: moderateScaleVertical(80),
            }}
          />
        );

      case 'bike':
        return (
          <FlatList
            data={vehicles}
            renderItem={({item}) => <BikeCardDetails item={item} />}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[colors.themePrimary]}
                tintColor={colors.themePrimary}
              />
            }
            contentContainerStyle={{
              marginHorizontal: moderateScale(15),
              gap: moderateScaleVertical(10),
              paddingBottom: moderateScaleVertical(80),
            }}
          />
        );

      case 'parcel':
        return (
          <FlatList
            data={vehicles}
            renderItem={({item}) => <CycleCardDetails item={item} />}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[colors.themePrimary]}
                tintColor={colors.themePrimary}
              />
            }
            contentContainerStyle={{
              marginHorizontal: moderateScale(15),
              gap: moderateScaleVertical(10),
              paddingBottom: moderateScaleVertical(80),
            }}
          />
        );

      case 'taxi':
        return (
          <FlatList
            data={vehicles}
            renderItem={({item}) => <TaxiCardDetails item={item} />}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[colors.themePrimary]}
                tintColor={colors.themePrimary}
              />
            }
            contentContainerStyle={{
              marginHorizontal: moderateScale(15),
              gap: moderateScaleVertical(10),
              paddingBottom: moderateScaleVertical(80),
            }}
          />
        );

      default:
        return (
          <Box mx={moderateScale(15)}>
            <Text color={colors.red}>No transport available</Text>
          </Box>
        );
    }
  };

  return (
    <Container
      statusBarStyle={isDarkMode ? 'light-content' : 'dark-content'}
      statusBarBackgroundColor={isDarkMode ? '#000000' : '#ffffff'}
      backgroundColor={isDarkMode ? '#000000' : '#ffffff'}>
      <AppBar back title="Available Transports" isDarkMode={isDarkMode} />

      {/* Transport Type Tabs - Styled like the image */}
      <Box
        mx={moderateScale(15)}
        mb={moderateScaleVertical(10)}
        bgColor={colors.white}
        borderRadius={moderateScale(25)}
        flexDirection="row"
        justifyContent="space-between"
        alignItems="center"
        py={moderateScaleVertical(10)}
        px={moderateScale(10)}
        shadowColor={colors.black}
        shadowOpacity={0.1}
        shadowOffset={{width: 0, height: 2}}
        shadowRadius={moderateScale(8)}
        elevation={4}>
        {transportTypes.map(type => {
          const isActive = activeTab === type.id;
          return (
            <Pressable
              key={type.id}
              onPress={() => setActiveTab(type.id)}
              borderRadius={moderateScale(30)}
              bgColor={isActive ? colors.themePrimary : 'transparent'}
              px={moderateScale(12)}
              py={moderateScaleVertical(6)}
              flexDirection="row"
              alignItems="center"
              justifyContent="center">
              <Image
                source={type.icon}
                alt={type.label}
                w={moderateScale(20)}
                h={moderateScale(20)}
                resizeMode="contain"
                mr={isActive ? moderateScale(5) : 0}
              />
              {/** Show label always */}
              <Text
                fontFamily="$poppinsMedium"
                fontSize={12}
                color={colors.black}
                ml={isActive ? 0 : moderateScale(5)}>
                {type.label}
              </Text>
            </Pressable>
          );
        })}
      </Box>

      {error && (
        <Box mx={moderateScale(15)} mb={moderateScaleVertical(15)}>
          <Text color={colors.red}>{error}</Text>
        </Box>
      )}

      {renderTransportUI()}
    </Container>
  );
};

export default AvailableTransport;
