import React, {useEffect, useState, useRef} from 'react';
import {
  RefreshControl,
  View,
  Animated,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import {Box, Image, Text, Pressable} from '@gluestack-ui/themed';
import {ParamListBase, useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import LottieView from 'lottie-react-native';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';

import {Container} from '../components/Container';
import {moderateScale, moderateScaleVertical} from '../utils/responsiveSize';
import {NavigationString} from '../navigation/navigationStrings';
import {BASE_URL, Instance} from '../api/Instance.ts';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useTheme} from '../constants/ThemeContext';
import {GET_BIKES, GET_CARS, GET_CYCLES, GET_TAXIS} from '../api/ApiEndpoints';
import Icons from '../assets/Icons';

const {width, height} = Dimensions.get('window');

// ==============================================
// 🎨 配色（简洁干净）
// ==============================================
const lightPalette = {
  background: '#F2F4F8',
  card: '#FFFFFF',
  text: '#1E293B',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  primary: '#2563EB',
  primaryLight: '#DBEAFE',
  border: '#E2E8F0',
  shadow: 'rgba(0,0,0,0.04)',
};

const darkPalette = {
  background: '#0F172A',
  card: '#1E293B',
  text: '#F1F5F9',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  primary: '#3B82F6',
  primaryLight: '#1E293B',
  border: '#334155',
  shadow: 'rgba(0,0,0,0.3)',
};

const transportTypes = [
  {id: 'car', label: 'Cars', icon: Icons.Car},
  {id: 'bike', label: 'Bikes', icon: Icons.Bike},
  {id: 'parcel', label: 'Cycles', icon: Icons.Cycle},
  {id: 'taxi', label: 'Taxis', icon: Icons.Taxi},
];

// ==============================================
// 🚗 车辆卡片（含图片）
// ==============================================
const VehicleCard = ({item, type, index}: {item: any; type: string; index: number}) => {
  const {isDarkMode} = useTheme();
  const colors = isDarkMode ? darkPalette : lightPalette;
  const navigation = useNavigation<NativeStackNavigationProp<ParamListBase>>();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      delay: index * 80,
      useNativeDriver: true,
    }).start();
  }, []);

  const getManufacturer = () => (type === 'parcel' ? item.brand || item.manufacturer : item.manufacturer);
  const getFuelOrType = () => (type === 'parcel' ? item.type : item.fuelType);
  const getSpecs = () => {
    const parts = [];
    if (item.transmissionType) parts.push(item.transmissionType);
    const fuelOrType = getFuelOrType();
    if (fuelOrType) parts.push(fuelOrType);
    if (item.vehicleNo) parts.push(item.vehicleNo.slice(-4));
    return parts.join(' • ');
  };

  const pricePerKm = item.pricePerKm || (type === 'car' ? 18 : type === 'bike' ? 8 : 12);
  const rating = item.rating || (4 + Math.random() * 0.8).toFixed(1);
  const distance = item?.calculatedDistance || (2 + Math.random() * 8).toFixed(1);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {toValue: 0.96, useNativeDriver: true}).start();
  };
  const handlePressOut = () => {
    Animated.spring(scaleAnim, {toValue: 1, useNativeDriver: true}).start();
  };

  const imageUrl = item.imgUrl || 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=400&h=300&fit=crop&auto=format';

  return (
    <Animated.View style={{opacity: fadeAnim, transform: [{translateY: fadeAnim.interpolate({inputRange: [0,1], outputRange: [20,0]})}]}}>
      <Box
        bgColor={colors.card}
        borderRadius={moderateScale(16)}
        padding={moderateScale(16)}
        marginBottom={moderateScaleVertical(14)}
        style={{
          shadowColor: colors.shadow,
          shadowOffset: {width: 0, height: 2},
          shadowOpacity: 1,
          shadowRadius: 8,
          elevation: 3,
          borderWidth: 1,
          borderColor: colors.border,
        }}>
        
        {/* 第一行：名称 + 星级 */}
        <Box flexDirection="row" justifyContent="space-between" alignItems="center">
          <Text fontFamily="$poppinsSemiBold" fontSize={17} color={colors.text} numberOfLines={1}>
            {getManufacturer()} {item.model}
          </Text>
          <Box flexDirection="row" alignItems="center">
            <MaterialIcon name="star" size={16} color="#FBBF24" />
            <Text fontFamily="$poppinsMedium" fontSize={14} color={colors.text} ml={4}>
              {rating}
            </Text>
          </Box>
        </Box>

        {/* 图片 */}
        <Box mt={moderateScaleVertical(6)}>
          <Image
            source={{uri: imageUrl}}
            alt="vehicle"
            style={{
              width: '100%',
              height: moderateScale(120),
              borderRadius: moderateScale(8),
              backgroundColor: colors.border,
            }}
            resizeMode="cover"
          />
        </Box>

        {/* 规格 */}
        <Text fontFamily="$poppinsRegular" fontSize={12} color={colors.textSecondary} mt={moderateScaleVertical(8)} numberOfLines={1}>
          {getSpecs()}
        </Text>

        {/* 距离 + 时间 */}
        <Box flexDirection="row" alignItems="center" mt={moderateScaleVertical(8)}>
          <Box flexDirection="row" alignItems="center" mr={moderateScale(16)}>
            <MaterialIcon name="map-marker" size={16} color={colors.textMuted} />
            <Text fontFamily="$poppinsMedium" fontSize={13} color={colors.textSecondary} ml={4}>
              {distance} km away
            </Text>
          </Box>
          <Box flexDirection="row" alignItems="center">
            <MaterialIcon name="clock-outline" size={16} color={colors.textMuted} />
            <Text fontFamily="$poppinsRegular" fontSize={13} color={colors.textSecondary} ml={4}>
              5 min
            </Text>
          </Box>
        </Box>

        {/* 价格 + Ride now 按钮 */}
        <Box flexDirection="row" alignItems="center" justifyContent="space-between" mt={moderateScaleVertical(12)}>
          <Text fontFamily="$poppinsBold" fontSize={20} color={colors.primary}>
            ₹{pricePerKm}
            <Text fontFamily="$poppinsRegular" fontSize={13} color={colors.textMuted}>/km</Text>
          </Text>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate(NavigationString.VehicleDetail, {vehicle: item})}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
          >
            <Animated.View style={{transform: [{scale: scaleAnim}]}}>
              <Box
                bgColor={colors.primary}
                borderRadius={moderateScale(30)}
                px={moderateScale(20)}
                py={moderateScaleVertical(8)}
                alignItems="center"
                justifyContent="center"
              >
                <Text fontFamily="$poppinsSemiBold" fontSize={14} color="#FFFFFF">
                  Ride now
                </Text>
              </Box>
            </Animated.View>
          </TouchableOpacity>
        </Box>
      </Box>
    </Animated.View>
  );
};

// ==============================================
// 🔥 主组件
// ==============================================
const AvailableTransport = () => {
  const {isDarkMode} = useTheme();
  const colors = isDarkMode ? darkPalette : lightPalette;
  const navigation = useNavigation<NativeStackNavigationProp<ParamListBase>>();
  const [activeTab, setActiveTab] = useState('car');
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const scrollY = useRef(new Animated.Value(0)).current;

  // 获取车辆（完全保留原始逻辑）
  const fetchVehicles = async (transportType: string) => {
    setLoading(true);
    setError('');
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        setError('Session expired. Please login again.');
        return;
      }

      let url = '';
      switch (transportType) {
        case 'car': url = `${BASE_URL}${GET_CARS.url}`; break;
        case 'bike': url = `${BASE_URL}${GET_BIKES.url}`; break;
        case 'parcel': url = `${BASE_URL}${GET_CYCLES.url}`; break;
        case 'taxi': url = `${BASE_URL}${GET_TAXIS.url}`; break;
        default: setError('Invalid transport type'); return;
      }

      const response = await Instance.get(url, {headers: {Authorization: token}});
      if (response.data.success) {
        const available = response.data.data.filter(
          (item: any) => item.availability === 'Available' && item.status === 'InActive',
        );
        setVehicles(available);
      } else {
        setError('Unable to load vehicles.');
      }
    } catch (err: any) {
      setError('Network error. Please try again.');
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

  const handleTabPress = (id: string) => {
    setActiveTab(id);
  };

  const renderEmpty = () => (
    <Box flex={1} justifyContent="center" alignItems="center" py={moderateScaleVertical(60)}>
      <LottieView
        source={require('../assets/lotties/loading.json')}
        autoPlay
        loop
        style={{width: moderateScale(160), height: moderateScale(160)}}
      />
      <Text fontFamily="$poppinsMedium" fontSize={16} color={colors.textSecondary} mt={16}>
        No {activeTab}s available nearby
      </Text>
      <Text fontFamily="$poppinsRegular" fontSize={13} color={colors.textMuted} mt={4}>
        Try changing the vehicle type or check back later
      </Text>
    </Box>
  );

  const renderLoading = () => (
    <Box flex={1} justifyContent="center" alignItems="center">
      <LottieView
        source={require('../assets/lotties/vehicleLoading.json')}
        autoPlay
        loop
        style={{width: moderateScale(200), height: moderateScale(200)}}
      />
      <Text fontFamily="$poppinsMedium" fontSize={14} color={colors.textSecondary}>
        Finding the best rides...
      </Text>
    </Box>
  );

  return (
    <Container
      statusBarStyle={isDarkMode ? 'light-content' : 'dark-content'}
      statusBarBackgroundColor={colors.background}
      backgroundColor={colors.background}>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event([{nativeEvent: {contentOffset: {y: scrollY}}}], {useNativeDriver: false})}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        contentContainerStyle={{paddingBottom: moderateScaleVertical(80)}}>

        {/* 头部 */}
        <Box  px={moderateScale(20)}>
          <Text fontFamily="$poppinsBold" fontSize={32} color={colors.text}>
            Ride Now
          </Text>
          <Text fontFamily="$poppinsRegular" fontSize={16} color={colors.textSecondary} mt={2}>
            Choose your perfect ride
          </Text>
          <Box
            bgColor={isDarkMode ? darkPalette.card : '#F0F2F5'}
            borderRadius={moderateScale(30)}
            mt={moderateScaleVertical(14)}
            px={moderateScale(16)}
            py={moderateScaleVertical(10)}
            flexDirection="row"
            alignItems="center"
            borderWidth={1}
            borderColor={colors.border}
          >
            <MaterialIcon name="magnify" size={20} color={colors.textMuted} />
            <Text fontFamily="$poppinsRegular" fontSize={14} color={colors.textMuted} ml={8}>
              Where to?
            </Text>
          </Box>
        </Box>

        {/* 分类切换 */}
        <Box px={moderateScale(16)} mt={moderateScaleVertical(20)}>
          <View
            style={{
              flexDirection: 'row',
              backgroundColor: isDarkMode ? darkPalette.card : '#F0F2F5',
              borderRadius: moderateScale(40),
              padding: moderateScale(4),
            }}>
            {transportTypes.map((type) => {
              const isActive = activeTab === type.id;
              return (
                <Pressable
                  key={type.id}
                  onPress={() => handleTabPress(type.id)}
                  flex={1}
                  borderRadius={moderateScale(30)}
                  overflow="hidden"
                  bgColor={isActive ? colors.primary : 'transparent'}
                  py={moderateScaleVertical(8)}
                  alignItems="center"
                  flexDirection="row"
                  justifyContent="center"
                  style={{gap: moderateScale(6)}}>
                  <Image
                    source={type.icon}
                    alt={type.label}
                    w={moderateScale(16)}
                    h={moderateScale(16)}
                    resizeMode="contain"
                    style={{tintColor: isActive ? '#FFF' : colors.textSecondary}}
                  />
                  <Text
                    fontFamily={isActive ? '$poppinsSemiBold' : '$poppinsMedium'}
                    fontSize={13}
                    color={isActive ? '#FFF' : colors.textSecondary}>
                    {type.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Box>

        {/* 错误信息 */}
        {error ? (
          <Box bgColor={isDarkMode ? '#450a0a' : '#FEF2F2'} p={moderateScale(12)} mx={16} borderRadius={12} mt={16}>
            <Text fontFamily="$poppinsMedium" fontSize={13} color="#EF4444">{error}</Text>
          </Box>
        ) : null}

        {/* 车辆列表 */}
        {loading && !refreshing ? (
          renderLoading()
        ) : vehicles.length === 0 ? (
          renderEmpty()
        ) : (
          <Box px={moderateScale(16)} mt={moderateScaleVertical(8)}>
            {vehicles.map((item, idx) => (
              <VehicleCard key={item._id} item={item} type={activeTab} index={idx} />
            ))}
          </Box>
        )}
      </Animated.ScrollView>
    </Container>
  );
};

export default AvailableTransport;