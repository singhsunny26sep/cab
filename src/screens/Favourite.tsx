import React, { useState, useEffect } from 'react';
import { FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import {
  Box,
  Image,
  Pressable,
  Text,
  Toast,
  ToastTitle,
  useToast,
  HStack,
  VStack,
  Divider,
} from '@gluestack-ui/themed';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { ParamListBase, useNavigation } from '@react-navigation/native';
import axios from 'axios';

import { Container } from '../components/Container';
import { colors } from '../constants/colors';
import { moderateScale, moderateScaleVertical } from '../utils/responsiveSize';
import { NavigationString } from '../navigation/navigationStrings';
import {
  DeleteAddressIcon,
  HamburgerIcon,
  HeartIcon,
  MapMarkerBlack24Icon,
  PlusIcon,
  LocationMakerRedIcon,
  NavigationIcon,
} from '../components/Icons';
import { useTheme } from '../constants/ThemeContext';
import {
  GET_ALL_FAVORITE_ADDRESSES,
  DELETE_FAVORITE_ADDRESS,
} from '../api/ApiEndpoints';
import { BASE_URL } from '../api/Instance.ts';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch } from 'react-redux';
import { setFavoriteAddresses } from '../store/slice/UserSlice';
import { getCurrentLocationOnce } from '../utils/locationHelper';

interface FavoriteAddress {
  _id: string;
  label: string;
  pickup: {
    address: string;
    coordinates: { lat: number; lng: number };
  };
  destination: {
    address: string;
    coordinates: { lat: number; lng: number };
  };
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

// Reusable Favorite Card Component with modern design
const FavouriteCard = ({
  item,
  onDelete,
  onSelect,
  isLoading,
}: {
  item: FavoriteAddress;
  onDelete: (id: string) => void;
  onSelect: (item: FavoriteAddress) => void;
  isLoading: boolean;
}) => {
  const { isDarkMode } = useTheme();

  return (
    <Pressable onPress={() => onSelect(item)}>
      <Box
        bg={isDarkMode ? '#1C1C1E' : '#FFFFFF'}
        borderRadius={moderateScale(20)}
        p={moderateScale(16)}
        mb={moderateScaleVertical(12)}
        shadowColor={isDarkMode ? '#000' : '#000'}
        shadowOffset={{ width: 0, height: 2 }}
        shadowOpacity={0.06}
        shadowRadius={6}
        elevation={3}
        borderWidth={1}
        borderColor={isDarkMode ? '#2C2C2E' : '#F0F0F5'}>
        <HStack space="md" alignItems="flex-start">
          {/* Icon */}
          <Box
            bg={isDarkMode ? '#2C2C2E' : '#F3F4F6'}
            borderRadius={moderateScale(40)}
            p={moderateScale(8)}>
            <NavigationIcon width={20} height={20} color={colors.themePrimary} />
          </Box>

          {/* Content */}
          <VStack flex={1} space="xs">
            <Text
              fontFamily="$poppinsSemiBold"
              fontSize={16}
              lineHeight={20}
              color={isDarkMode ? '#FFFFFF' : '#1C1C1E'}>
              {item.label}
            </Text>
            <HStack space="sm" alignItems="center">
              <MapMarkerBlack24Icon width={12} height={12} />
              <Text
                fontFamily="$poppinsRegular"
                fontSize={12}
                lineHeight={16}
                color={isDarkMode ? '#A0A0A0' : '#6B7280'}
                numberOfLines={1}>
                {item.pickup.address}
              </Text>
            </HStack>
            <HStack space="sm" alignItems="center" mt={moderateScaleVertical(2)}>
              <LocationMakerRedIcon width={12} height={12} />
              <Text
                fontFamily="$poppinsRegular"
                fontSize={12}
                lineHeight={16}
                color={isDarkMode ? '#A0A0A0' : '#6B7280'}
                numberOfLines={1}>
                {item.destination.address}
              </Text>
            </HStack>
          </VStack>

          {/* Delete Button */}
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              onDelete(item._id);
            }}
            disabled={isLoading}
            p={moderateScale(6)}>
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.themePrimary} />
            ) : (
              <DeleteAddressIcon />
            )}
          </Pressable>
        </HStack>
      </Box>
    </Pressable>
  );
};

const Favourite = () => {
  const navigation = useNavigation<DrawerNavigationProp<ParamListBase>>();
  const { isDarkMode } = useTheme();
  const toast = useToast();
  const dispatch = useDispatch();

  const [favorites, setFavorites] = useState<FavoriteAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{
    lat: number;
    lng: number;
    address: string;
  } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);

  const showToast = (message: string, type: 'success' | 'error') => {
    toast.show({
      placement: 'top',
      render: ({ id }: any) => (
        <Toast nativeID={`toast-${id}`} action={type} variant="accent">
          <ToastTitle>{message}</ToastTitle>
        </Toast>
      ),
    });
  };

  const fetchFavoriteAddresses = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      const response = await axios.get(
        `${BASE_URL}${GET_ALL_FAVORITE_ADDRESSES.url}`,
        { headers: { Authorization: token } }
      );
      const favoriteData = response.data;
      setFavorites(favoriteData);
      dispatch(setFavoriteAddresses(favoriteData));
      await AsyncStorage.setItem('favoriteAddresses', JSON.stringify(favoriteData));

      if (favoriteData.length === 0) fetchCurrentLocation();
    } catch (error: any) {
      console.error('Error fetching favorites:', error?.response);
      showToast('Failed to load favorites', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchCurrentLocation = async () => {
    try {
      setLocationLoading(true);
      const location = await getCurrentLocationOnce();
      if (location?.address) {
        setCurrentLocation({
          lat: location.coordinates.latitude,
          lng: location.coordinates.longitude,
          address: location.address.formatted || 'Current Location',
        });
      }
    } catch (error) {
      console.error('Location error:', error);
    } finally {
      setLocationLoading(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    try {
      setDeletingId(id);
      const token = await AsyncStorage.getItem('userToken');
      await axios.delete(`${BASE_URL}${DELETE_FAVORITE_ADDRESS.url}/${id}`, {
        headers: { Authorization: token },
      });
      showToast('Address deleted successfully', 'success');
      fetchFavoriteAddresses();
    } catch (error) {
      showToast('Failed to delete address', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSelectAddress = (
    item: FavoriteAddress | null,
    isCurrentLocation = false
  ) => {
    if (isCurrentLocation && currentLocation) {
      navigation.navigate(NavigationString.Home, {
        favoriteData: {
          _id: 'current-location',
          label: 'Current Location',
          pickup: {
            address: currentLocation.address,
            coordinates: { lat: currentLocation.lat, lng: currentLocation.lng },
          },
          destination: { address: '', coordinates: { lat: 0, lng: 0 } },
          isDefault: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });
    } else if (item) {
      navigation.navigate(NavigationString.Home, { favoriteData: item });
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchFavoriteAddresses();
  };

  useEffect(() => {
    const loadCached = async () => {
      try {
        const cached = await AsyncStorage.getItem('favoriteAddresses');
        if (cached) {
          const parsed = JSON.parse(cached);
          setFavorites(parsed);
          dispatch(setFavoriteAddresses(parsed));
        }
      } catch (error) {
        console.error('Cache error:', error);
      }
    };
    loadCached();
    fetchFavoriteAddresses();
  }, []);

  const EmptyState = () => (
    <Box flex={1} justifyContent="center" alignItems="center" px={moderateScale(30)}>
      <Box
        bg={isDarkMode ? '#1C1C1E' : '#F3F4F6'}
        borderRadius={moderateScale(60)}
        p={moderateScale(20)}
        mb={moderateScaleVertical(20)}>
        <HeartIcon width={48} height={48} opacity={0.5} />
      </Box>
      <Text
        fontFamily="$poppinsSemiBold"
        fontSize={20}
        color={isDarkMode ? '#FFFFFF' : '#1C1C1E'}
        textAlign="center">
        No saved routes yet
      </Text>
      <Text
        fontFamily="$poppinsRegular"
        fontSize={14}
        color={isDarkMode ? '#A0A0A0' : '#6B7280'}
        textAlign="center"
        mt={moderateScaleVertical(8)}>
        Save your frequent trips for one‑tap booking.
      </Text>
    </Box>
  );

  const CurrentLocationCard = () => (
    <Box px={moderateScale(16)} pt={moderateScaleVertical(12)}>
      <Text
        fontFamily="$poppinsSemiBold"
        fontSize={14}
        color={isDarkMode ? '#A0A0A0' : '#6B7280'}
        mb={moderateScaleVertical(8)}>
        SUGGESTED
      </Text>
      <Pressable onPress={() => handleSelectAddress(null, true)}>
        <Box
          bg={isDarkMode ? '#1C1C1E' : '#FFFFFF'}
          borderRadius={moderateScale(20)}
          p={moderateScale(16)}
          borderWidth={1}
          borderColor={colors.themePrimary}
          shadowColor={colors.themePrimary}
          shadowOffset={{ width: 0, height: 2 }}
          shadowOpacity={0.1}
          shadowRadius={4}
          elevation={2}>
          <HStack space="md" alignItems="center">
            <Box
              bg={colors.themePrimary + '20'}
              borderRadius={moderateScale(40)}
              p={moderateScale(10)}>
              <LocationMakerRedIcon width={24} height={24} />
            </Box>
            <VStack flex={1}>
              <Text fontFamily="$poppinsSemiBold" fontSize={16} color={isDarkMode ? '#FFF' : '#1C1C1E'}>
                Current Location
              </Text>
              <Text fontFamily="$poppinsRegular" fontSize={12} color={isDarkMode ? '#A0A0A0' : '#6B7280'} mt={2}>
                {currentLocation?.address}
              </Text>
            </VStack>
          </HStack>
        </Box>
      </Pressable>
    </Box>
  );

  if (loading && favorites.length === 0) {
    return (
      <Container
        statusBarStyle={isDarkMode ? 'light-content' : 'dark-content'}
        statusBarBackgroundColor={isDarkMode ? '#000000' : '#F8F9FF'}
        backgroundColor={isDarkMode ? '#000000' : '#F8F9FF'}>
        <Box flex={1} justifyContent="center" alignItems="center">
          <ActivityIndicator size="large" color={colors.themePrimary} />
        </Box>
      </Container>
    );
  }

  return (
    <Container
      statusBarStyle={isDarkMode ? 'light-content' : 'dark-content'}
      statusBarBackgroundColor={isDarkMode ? '#000000' : '#F8F9FF'}
      backgroundColor={isDarkMode ? '#000000' : '#F8F9FF'}>
      {/* Modern Header */}
      <Box
        flexDirection="row"
        alignItems="center"
        justifyContent="space-between"
        px={moderateScale(20)}
        pt={moderateScaleVertical(12)}
        pb={moderateScaleVertical(8)}>
        <Pressable
          onPress={() => navigation.openDrawer()}
          bg={isDarkMode ? '#1C1C1E' : '#FFFFFF'}
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
          color={isDarkMode ? '#FFFFFF' : '#1C1C1E'}>
          Favourites
        </Text>
        <Pressable
          onPress={() => navigation.navigate(NavigationString.AddFavoriteAddress)}
          bg={isDarkMode ? '#1C1C1E' : '#FFFFFF'}
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
          <PlusIcon />
        </Pressable>
      </Box>

      {favorites.length === 0 ? (
        <Box flex={1}>
          {locationLoading ? (
            <Box flex={1} justifyContent="center" alignItems="center">
              <ActivityIndicator size="large" color={colors.themePrimary} />
            </Box>
          ) : currentLocation ? (
            <CurrentLocationCard />
          ) : (
            <EmptyState />
          )}
        </Box>
      ) : (
        <FlatList
          data={favorites}
          renderItem={({ item }) => (
            <FavouriteCard
              item={item}
              onDelete={handleDeleteAddress}
              onSelect={handleSelectAddress}
              isLoading={deletingId === item._id}
            />
          )}
          keyExtractor={(item) => item._id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: moderateScale(16),
            paddingTop: moderateScaleVertical(16),
            paddingBottom: moderateScaleVertical(80),
          }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListHeaderComponent={
            currentLocation && favorites.length > 0 ? <CurrentLocationCard /> : null
          }
          ListEmptyComponent={<EmptyState />}
        />
      )}
    </Container>
  );
};

export default Favourite;