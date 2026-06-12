import React, {useEffect, useState, useRef} from 'react';
import {
  FlatList,
  RefreshControl,
  View,
  Animated,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import {Box, Image, Text, Pressable} from '@gluestack-ui/themed';
import {ParamListBase, useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import LinearGradient from 'react-native-linear-gradient';
import LottieView from 'lottie-react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';

import {Container} from '../components/Container';
import {AppBar} from '../components/AppBar';
import {colors as themeColors} from '../constants/colors';
import {moderateScale, moderateScaleVertical} from '../utils/responsiveSize';
import PrimaryButton from '../components/Button/PrimaryButton';
import {NavigationString} from '../navigation/navigationStrings';
import {BASE_URL, Instance} from '../api/Instance.ts';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useTheme} from '../constants/ThemeContext';
import {GET_BIKES, GET_CARS, GET_CYCLES, GET_TAXIS} from '../api/ApiEndpoints';
import Icons from '../assets/Icons';

const {width, height} = Dimensions.get('window');

// ==============================================
// 🌈 Modern Color Palette (Dark/Light)
// ==============================================
const lightPalette = {
  background: '#F5F7FB',
  card: '#FFFFFF',
  cardAlt: '#FAFCFE',
  text: '#1A202C',
  textSecondary: '#4A5568',
  textMuted: '#A0AEC0',
  primary: '#6366F1',
  primaryLight: '#818CF8',
  primaryDark: '#4F46E5',
  border: '#E2E8F0',
  success: '#10B981',
  warning: '#F59E0B',
  gradientStart: '#6366F1',
  gradientEnd: '#8B5CF6',
  glassBg: 'rgba(255,255,255,0.7)',
  shadow: '#00000015',
};

const darkPalette = {
  background: '#0B1120',
  card: '#1E293B',
  cardAlt: '#1A2332',
  text: '#F1F5F9',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  primary: '#818CF8',
  primaryLight: '#A5B4FC',
  primaryDark: '#6366F1',
  border: '#334155',
  success: '#34D399',
  warning: '#FBBF24',
  gradientStart: '#818CF8',
  gradientEnd: '#A78BFA',
  glassBg: 'rgba(30,41,59,0.8)',
  shadow: '#00000040',
};

const transportTypes = [
  {id: 'car', label: 'Cars', icon: Icons.Car, activeIcon: 'car-sports'},
  {id: 'bike', label: 'Bikes', icon: Icons.Bike, activeIcon: 'motorbike'},
  {id: 'parcel', label: 'Cycles', icon: Icons.Cycle, activeIcon: 'bicycle'},
  {id: 'taxi', label: 'Taxis', icon: Icons.Taxi, activeIcon: 'taxi'},
];

// ==============================================
// 🌟 Shimmer Loading Card
// ==============================================
const ShimmerCard = () => (
  <Box
    bgColor="transparent"
    borderRadius={moderateScale(24)}
    marginBottom={moderateScaleVertical(16)}
    padding={moderateScale(16)}
    style={{
      overflow: 'hidden',
      backgroundColor: '#E2E8F0',
    }}>
    <Animated.View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#CBD5E1',
        opacity: 0.3,
      }}
    />
  </Box>
);

// ==============================================
// 🚗 Premium Vehicle Card
// ==============================================
const VehicleCard = ({item, type, index}: {item: any; type: string; index: number}) => {
  const {isDarkMode} = useTheme();
  const colors = isDarkMode ? darkPalette : lightPalette;
  const navigation = useNavigation<NativeStackNavigationProp<ParamListBase>>();
  const fadeAnim = useRef(new Animated.Value(0)).current;

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
    if (item.transmissionType) {parts.push(item.transmissionType);}
    const fuelOrType = getFuelOrType();
    if (fuelOrType) {parts.push(fuelOrType);}
    if (item.vehicleNo) {parts.push(item.vehicleNo.slice(-4));}
    return parts.join(' • ');
  };

  // Mock pricing & rating (if your API doesn't provide, generate sensible defaults)
  const pricePerKm = item.pricePerKm || (type === 'car' ? 18 : type === 'bike' ? 8 : 12);
  const rating = item.rating || (4 + Math.random() * 0.8).toFixed(1);

  return (
    <Animated.View style={{opacity: fadeAnim, transform: [{translateY: fadeAnim.interpolate({inputRange: [0,1], outputRange: [20,0]})}]}}>
      <LinearGradient
        colors={[colors.card, colors.cardAlt]}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={{
          borderRadius: moderateScale(28),
          marginBottom: moderateScaleVertical(16),
          padding: moderateScale(16),
          borderWidth: 1,
          borderColor: colors.border,
          shadowColor: colors.shadow,
          shadowOffset: {width: 0, height: 8},
          shadowOpacity: isDarkMode ? 0.3 : 0.08,
          shadowRadius: 16,
          elevation: 6,
        }}>

        {/* Header: Vehicle info + rating */}
        <Box flexDirection="row" justifyContent="space-between" alignItems="center" mb={moderateScaleVertical(8)}>
          <Box flex={1}>
            <Text fontFamily="$poppinsSemiBold" fontSize={18} color={colors.text} numberOfLines={1}>
              {getManufacturer()} {item.model}
            </Text>
            <Text fontFamily="$poppinsRegular" fontSize={12} color={colors.textSecondary} numberOfLines={1}>
              {getSpecs()}
            </Text>
          </Box>
          <Box flexDirection="row" alignItems="center" bgColor={colors.glassBg} px={moderateScale(8)} py={moderateScaleVertical(4)} borderRadius={moderateScale(20)}>
            <Icon name="star" size={14} color="#FBBF24" />
            <Text fontFamily="$poppinsMedium" fontSize={12} color={colors.text} ml={moderateScale(4)}>{rating}</Text>
          </Box>
        </Box>

        {/* Middle: Image + Distance + Price */}
        <Box flexDirection="row" alignItems="center" my={moderateScaleVertical(8)}>
          <Box flex={1.2} alignItems="center" justifyContent="center">
            <Image
              alt="vehicle"
              source={{uri: item.imgUrl}}
              w={moderateScale(110)}
              h={moderateScale(80)}
              resizeMode="contain"
            />
          </Box>
          <Box flex={1} alignItems="flex-end" gap={moderateScaleVertical(6)}>
            <Box flexDirection="row" alignItems="center" gap={moderateScale(4)}>
              <MaterialIcon name="map-marker-distance" size={14} color={colors.primary} />
              <Text fontFamily="$poppinsMedium" fontSize={13} color={colors.textSecondary}>
                {item?.calculatedDistance} km away
              </Text>
            </Box>
            <Box flexDirection="row" alignItems="baseline" gap={moderateScale(2)}>
              <Text fontFamily="$poppinsBold" fontSize={22} color={colors.primary}>
                ₹{pricePerKm}
              </Text>
              <Text fontFamily="$poppinsRegular" fontSize={12} color={colors.textMuted}>/km</Text>
            </Box>
            <Box flexDirection="row" alignItems="center" gap={moderateScale(4)}>
              <Icon name="time-outline" size={12} color={colors.textMuted} />
              <Text fontFamily="$poppinsRegular" fontSize={11} color={colors.textMuted}>~5 min</Text>
            </Box>
          </Box>
        </Box>

        {/* Action Buttons */}
        <Box flexDirection="row" alignItems="center" gap={moderateScale(12)} mt={moderateScaleVertical(12)}>

          <PrimaryButton
            buttonText="Ride now"
            onPress={() => navigation.navigate(NavigationString.VehicleDetail, {vehicle: item})}
            flex={1}
            style={{borderRadius: moderateScale(30)}}
          />
        </Box>
      </LinearGradient>
    </Animated.View>
  );
};

// ==============================================
// 🔥 Main Component
// ==============================================
const AvailableTransport = () => {
  const {isDarkMode} = useTheme();
  const colors = isDarkMode ? darkPalette : lightPalette;
  const [activeTab, setActiveTab] = useState('car');
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const scrollY = useRef(new Animated.Value(0)).current;
  const tabIndicatorAnim = useRef(new Animated.Value(0)).current;

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


      console.log(response.data,'this is card response');
      if (response.data.success) {
        const availableVehicles = response.data.data.filter(
          (item: any) => item.availability === 'Available' && item.status === 'InActive',
        );
        setVehicles(availableVehicles);
      } else {
        setError('Unable to load vehicles.');
      }
    } catch (err: any) {
      console.log(err);
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
    Animated.spring(tabIndicatorAnim, {
      toValue: transportTypes.findIndex(t => t.id === id),
      useNativeDriver: true,
    }).start();
  };

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const renderEmpty = () => (
    <Box flex={1} justifyContent="center" alignItems="center" py={moderateScaleVertical(80)}>

      <Text fontFamily="$poppinsMedium" fontSize={16} color={colors.textSecondary} mt={moderateScaleVertical(16)}>
        No {activeTab}s available nearby
      </Text>
      <Text fontFamily="$poppinsRegular" fontSize={13} color={colors.textMuted} mt={moderateScaleVertical(4)}>
        Try changing the vehicle type or check back later
      </Text>
    </Box>
  );

  const renderLoadingState = () => (
    <Box flex={1} justifyContent="center" alignItems="center">
      <LottieView
        source={require('../assets/lotties/vehicleLoading.json')}
        autoPlay
        loop
        style={{width: moderateScale(220), height: moderateScale(220)}}
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

      {/* Parallax Header Gradient */}
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: height * 0.35,
          borderBottomLeftRadius: moderateScale(40),
          borderBottomRightRadius: moderateScale(40),
        }}
      />

      {/* Sticky Animated Header */}
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          backgroundColor: colors.card,
          opacity: headerOpacity,
          shadowColor: colors.shadow,
          shadowOffset: {width: 0, height: 4},
          shadowOpacity: 0.1,
          elevation: 5,
          paddingTop: moderateScaleVertical(50),
          paddingBottom: moderateScaleVertical(12),
        }}>
        <Box flexDirection="row" alignItems="center" px={moderateScale(16)}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text fontFamily="$poppinsSemiBold" fontSize={18} color={colors.text} ml={moderateScale(12)}>
            Available Transports
          </Text>
        </Box>
      </Animated.View>

      {/* Main Content */}
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
        }>

        {/* Header Title (only visible when scrolled to top) */}
        <Box pt={moderateScaleVertical(80)} px={moderateScale(20)}>
          <Text fontFamily="$poppinsBold" fontSize={34} color="white">
            Ride Now
          </Text>
          <Text fontFamily="$poppinsRegular" fontSize={15} color="white" mt={moderateScaleVertical(4)}>
            Choose your perfect ride
          </Text>
        </Box>

        {/* Glassmorphic Tabs */}
        <Box px={moderateScale(16)} mt={moderateScaleVertical(20)} mb={moderateScaleVertical(16)}>
          <View
            style={{
              backgroundColor: isDarkMode ? 'rgba(30,41,59,0.7)' : 'rgba(255,255,255,0.7)',
              backdropFilter: 'blur(12px)',
              borderRadius: moderateScale(60),
              padding: moderateScale(6),
              flexDirection: 'row',
              shadowColor: colors.shadow,
              shadowOffset: {width: 0, height: 4},
              shadowOpacity: 0.1,
              elevation: 5,
            }}>
            {transportTypes.map((type, idx) => {
              const isActive = activeTab === type.id;
              return (
                <Pressable
                  key={type.id}
                  onPress={() => handleTabPress(type.id)}
                  flex={1}
                  borderRadius={moderateScale(40)}
                  overflow="hidden">
                  <LinearGradient
                    colors={isActive ? [colors.primary, colors.primaryDark] : ['transparent', 'transparent']}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 0}}
                    style={{
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingVertical: moderateScaleVertical(10),
                      flexDirection: 'row',
                      gap: moderateScale(8),
                    }}>
                    <Image
                      source={type.icon}
                      alt={type.label}
                      w={moderateScale(18)}
                      h={moderateScale(18)}
                      resizeMode="contain"
                      style={{tintColor: isActive ? '#FFF' : colors.textSecondary}}
                    />
                    <Text
                      fontFamily={isActive ? '$poppinsSemiBold' : '$poppinsMedium'}
                      fontSize={13}
                      color={isActive ? '#FFF' : colors.textSecondary}>
                      {type.label}
                    </Text>
                  </LinearGradient>
                </Pressable>
              );
            })}
          </View>
        </Box>

        {/* Error Message */}
        {error ? (
          <Box bgColor={isDarkMode ? '#450a0a' : '#FEF2F2'} p={moderateScale(12)} mx={moderateScale(16)} borderRadius={moderateScale(16)} mb={moderateScaleVertical(12)}>
            <Text fontFamily="$poppinsMedium" fontSize={13} color="#EF4444">{error}</Text>
          </Box>
        ) : null}

        {/* Vehicle List */}
        {loading && !refreshing ? (
          renderLoadingState()
        ) : vehicles.length === 0 ? (
          renderEmpty()
        ) : (
          <Box px={moderateScale(16)} pb={moderateScaleVertical(100)}>
            {vehicles.map((item, idx) => (
              <VehicleCard key={item._id} item={item} type={activeTab} index={idx} />
            ))}
          </Box>
        )}
      </Animated.ScrollView>

      {/* Floating Action Button (Optional: for map view) */}
      <TouchableOpacity
        style={{
          position: 'absolute',
          bottom: moderateScaleVertical(20),
          right: moderateScale(20),
          backgroundColor: colors.primary,
          width: moderateScale(56),
          height: moderateScale(56),
          borderRadius: moderateScale(28),
          justifyContent: 'center',
          alignItems: 'center',
          shadowColor: colors.primary,
          shadowOffset: {width: 0, height: 4},
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        }}
        onPress={() => {}}>
        <MaterialIcon name="map-search" size={28} color="#FFF" />
      </TouchableOpacity>
    </Container>
  );
};

export default AvailableTransport;
