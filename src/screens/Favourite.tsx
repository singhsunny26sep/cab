import React, {useState, useEffect} from 'react';
import {FlatList, ActivityIndicator} from 'react-native';
import {
  Box,
  Image,
  Pressable,
  Text,
  Toast,
  ToastTitle,
  useToast,
} from '@gluestack-ui/themed';
import {DrawerNavigationProp} from '@react-navigation/drawer';
import {ParamListBase, useNavigation} from '@react-navigation/native';
import axios from 'axios';

import {Container} from '../components/Container';
import {AppBar} from '../components/AppBar';
import {colors} from '../constants/colors';
import {moderateScale, moderateScaleVertical} from '../utils/responsiveSize';
import {NavigationString} from '../navigation/navigationStrings';
import {
  DeleteAddressIcon,
  HamburgerIcon,
  HeartIcon,
  MapMarkerBlack24Icon,
  PlusIcon,
  LocationMakerRedIcon,
} from '../components/Icons';
import {useTheme} from '../constants/ThemeContext';
import {
  GET_ALL_FAVORITE_ADDRESSES,
  DELETE_FAVORITE_ADDRESS,
} from '../api/ApiEndpoints';
import {BASE_URL} from '../api/Instance.ts';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useDispatch} from 'react-redux';
import {setFavoriteAddresses} from '../store/slice/UserSlice';
import {getCurrentLocationOnce} from '../utils/locationHelper';

interface FavoriteAddress {
  _id: string;
  label: string;
  pickup: {
    address: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  destination: {
    address: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

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
  const {isDarkMode} = useTheme();

  return (
    <Pressable onPress={() => onSelect(item)}>
      <Box
        flexDirection="row"
        alignItems="center"
        h={moderateScale(77)}
        bgColor={isDarkMode ? colors.black : colors.white}
        px={moderateScale(10)}
        borderRadius={moderateScale(10)}
        gap={moderateScale(10)}
        borderWidth={1}
        borderColor={colors.paleYellow}>
        <MapMarkerBlack24Icon />

        <Box flex={1} gap={moderateScaleVertical(3)}>
          <Text
            fontFamily={'$poppinsSemiBold'}
            fontSize={16}
            lineHeight={18}
            color={isDarkMode ? colors.white : colors.black}
            numberOfLines={1}>
            {item.label}
          </Text>
          <Text
            fontFamily={'$poppinsRegular'}
            fontSize={12}
            lineHeight={14}
            color={isDarkMode ? colors.white : '#898989'}
            numberOfLines={2}>
            From: {item.pickup.address}
          </Text>
          <Text
            fontFamily={'$poppinsRegular'}
            fontSize={12}
            lineHeight={14}
            color={isDarkMode ? colors.white : '#898989'}
            numberOfLines={2}>
            To: {item.destination.address}
          </Text>
        </Box>

        <Pressable
          onPress={e => {
            e.stopPropagation();
            onDelete(item._id);
          }}
          disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.themePrimary} />
          ) : (
            <DeleteAddressIcon />
          )}
        </Pressable>
      </Box>
    </Pressable>
  );
};

const Favourite = () => {
  // init
  const navigation = useNavigation<DrawerNavigationProp<ParamListBase>>();
  const {isDarkMode} = useTheme();
  const toast = useToast();
  const dispatch = useDispatch();

   // states
   const [favorites, setFavorites] = useState<FavoriteAddress[]>([]);
   const [loading, setLoading] = useState(true);
   const [deletingId, setDeletingId] = useState<string | null>(null);
   const [currentLocation, setCurrentLocation] = useState<{
     lat: number;
     lng: number;
     address: string;
   } | null>(null);
   const [locationLoading, setLocationLoading] = useState(false);

  const showErrorToast = (message: string) => {
    toast.show({
      placement: 'top',
      render: ({id}: any) => {
        return (
          <Toast nativeID={'toast-' + id} action="error" variant="accent">
            <ToastTitle>{message}</ToastTitle>
          </Toast>
        );
      },
    });
  };

  const showSuccessToast = (message: string) => {
    toast.show({
      placement: 'top',
      render: ({id}: any) => {
        return (
          <Toast nativeID={'toast-' + id} action="success" variant="accent">
            <ToastTitle>{message}</ToastTitle>
          </Toast>
        );
      },
    });
  };

  const fetchFavoriteAddresses = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      const response = await axios.get(
        `${BASE_URL}${GET_ALL_FAVORITE_ADDRESSES.url}`,
        {
          headers: {
            Authorization: token,
          },
        },
      );
      const favoriteData = response.data;
      setFavorites(favoriteData);
      dispatch(setFavoriteAddresses(favoriteData));
      await AsyncStorage.setItem(
        'favoriteAddresses',
        JSON.stringify(favoriteData),
      );

      // If no favorites, fetch current location
      if (favoriteData.length === 0) {
        fetchCurrentLocation();
      }
    } catch (error: any) {
      console.error('Error fetching favorite addresses:', error?.response);
      showErrorToast('Failed to load favorite addresses');
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentLocation = async () => {
    try {
      setLocationLoading(true);
      const location = await getCurrentLocationOnce();
      if (location && location.address) {
        setCurrentLocation({
          lat: location.coordinates.latitude,
          lng: location.coordinates.longitude,
          address: location.address.formatted || 'Current Location',
        });
      }
    } catch (error) {
      console.error('Error getting current location:', error);
    } finally {
      setLocationLoading(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    try {
      setDeletingId(id);
      const token = await AsyncStorage.getItem('userToken');

      await axios.delete(`${BASE_URL}${DELETE_FAVORITE_ADDRESS.url}/${id}`, {
        headers: {
          Authorization: token,
        },
      });
      showSuccessToast('Address deleted successfully');
      fetchFavoriteAddresses(); // Refresh the list after deletion
    } catch (error) {
      console.error('Error deleting favorite address:', error);
      showErrorToast('Failed to delete address');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSelectAddress = (item: FavoriteAddress | null, isCurrentLocation: boolean = false) => {
    if (isCurrentLocation && currentLocation) {
      // Navigate with current location data
      navigation.navigate(NavigationString.Home, {
        favoriteData: {
          _id: 'current-location',
          label: 'Current Location',
          pickup: {
            address: currentLocation.address,
            coordinates: {
              lat: currentLocation.lat,
              lng: currentLocation.lng,
            },
          },
          destination: {
            address: '',
            coordinates: {
              lat: currentLocation.lat,
              lng: currentLocation.lng,
            },
          },
          isDefault: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });
    } else if (item) {
      navigation.navigate(NavigationString.Home, {favoriteData: item});
    }
  };

  useEffect(() => {
    const loadCachedFavorites = async () => {
      try {
        const cachedFavorites = await AsyncStorage.getItem('favoriteAddresses');
        if (cachedFavorites) {
          setFavorites(JSON.parse(cachedFavorites));
          dispatch(setFavoriteAddresses(JSON.parse(cachedFavorites)));
        }
      } catch (error) {
        console.error('Error loading cached favorites:', error);
      }
    };

    loadCachedFavorites();
    fetchFavoriteAddresses();
  }, []);

  if (loading && favorites.length === 0) {
    return (
      <Container
        statusBarStyle={isDarkMode ? 'light-content' : 'dark-content'}
        statusBarBackgroundColor={isDarkMode ? '#000000' : '#f5f5f5'}
        backgroundColor={isDarkMode ? '#000000' : '#f5f5f5'}>
        <Box flex={1} justifyContent="center" alignItems="center">
          <ActivityIndicator size="large" color={colors.themePrimary} />
        </Box>
      </Container>
    );
  }

  return (
    <Container
      statusBarStyle={isDarkMode ? 'light-content' : 'dark-content'}
      statusBarBackgroundColor={isDarkMode ? '#000000' : '#f5f5f5'}
      backgroundColor={isDarkMode ? '#000000' : '#f5f5f5'}>
      <Box
        flexDirection="row"
        alignItems="center"
        px={moderateScale(15)}
        pt={moderateScale(10)}>
        <Box w={moderateScale(32)} h={moderateScale(32)}>
          <Pressable
            onPress={() => {
              navigation.openDrawer();
            }}
            bgColor={colors.themePrimary}
            w={moderateScale(32)}
            h={moderateScale(32)}
            borderRadius={moderateScale(5)}
            alignItems="center"
            justifyContent="center">
            <HamburgerIcon />
          </Pressable>
        </Box>
        <Text
          flex={1}
          fontFamily={'$poppinsMedium'}
          fontSize={18}
          lineHeight={20}
          color={isDarkMode ? colors.white : colors.charcoalGray}
          numberOfLines={1}
          textAlign="center">
          Favourite
        </Text>
        <Pressable
          px={moderateScale(10)}
          h={moderateScale(32)}
          flexDirection="row"
          alignItems="center"
          onPress={() => {
            navigation.openDrawer();
          }}
          // bgColor={colors.paleYellow}
          borderRadius={moderateScale(5)}
          justifyContent="space-around">
          {/* <PlusIcon /> */}
        </Pressable>
      </Box>

      {favorites.length === 0 ? (
        <Box flex={1}>
          {locationLoading ? (
            <Box flex={1} justifyContent="center" alignItems="center">
              <ActivityIndicator size="large" color={colors.themePrimary} />
            </Box>
          ) : currentLocation ? (
            <Box flex={1} px={moderateScale(15)} pt={moderateScaleVertical(20)}>
              <Text
                fontFamily={'$poppinsMedium'}
                fontSize={16}
                color={isDarkMode ? colors.white : colors.charcoalGray}
                mb={moderateScaleVertical(10)}
                px={moderateScale(5)}>
                Suggested
              </Text>
              <Pressable
                onPress={() => handleSelectAddress(null, true)}
                bgColor={isDarkMode ? colors.black : colors.white}
                borderWidth={1}
                borderColor={colors.paleYellow}
                borderRadius={moderateScale(10)}
                p={moderateScale(12)}>
                <Box flexDirection="row" alignItems="center" gap={moderateScale(10)}>
                  <Box
                    w={moderateScale(40)}
                    h={moderateScale(40)}
                    borderRadius={moderateScale(20)}
                    bgColor={colors.paleYellow}
                    alignItems="center"
                    justifyContent="center">
                    <LocationMakerRedIcon width={moderateScale(20)} height={moderateScale(20)} />
                  </Box>
                  <Box flex={1}>
                    <Text
                      fontFamily={'$poppinsSemiBold'}
                      fontSize={16}
                      lineHeight={18}
                      color={isDarkMode ? colors.white : colors.black}
                      numberOfLines={1}>
                      Current Location
                    </Text>
                    <Text
                      fontFamily={'$poppinsRegular'}
                      fontSize={12}
                      lineHeight={14}
                      color={isDarkMode ? '#9CA3AF' : '#6B7280'}
                      numberOfLines={2}
                      mt={moderateScaleVertical(2)}>
                      {currentLocation.address}
                    </Text>
                  </Box>
                </Box>
              </Pressable>
            </Box>
          ) : (
            <Box
              flex={1}
              justifyContent="center"
              alignItems="center"
              gap={moderateScaleVertical(15)}>
              <Box opacity={0.4}>
                <HeartIcon width={moderateScale(64)} height={moderateScale(64)} />
              </Box>
              <Text
                fontFamily={'$poppinsMedium'}
                fontSize={16}
                color={isDarkMode ? colors.white : colors.black}>
                No favorite addresses yet
              </Text>
              <Text
                fontFamily={'$poppinsRegular'}
                fontSize={12}
                color={isDarkMode ? '#9CA3AF' : '#6B7280'}
                textAlign="center"
                px={moderateScale(40)}>
                Save your frequent routes for{'\n'}faster booking experience
              </Text>
            </Box>
          )}
        </Box>
      ) : (
        <FlatList
          data={favorites}
          renderItem={({item}: {item: FavoriteAddress}) => (
            <FavouriteCard
              item={item}
              onDelete={handleDeleteAddress}
              onSelect={handleSelectAddress}
              isLoading={deletingId === item._id}
            />
          )}
          keyExtractor={item => item._id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            marginHorizontal: moderateScale(15),
            gap: moderateScaleVertical(15),
            paddingBottom: moderateScaleVertical(90),
            marginTop: moderateScaleVertical(20),
          }}
        />
      )}
    </Container>
  );
};

export default Favourite;
