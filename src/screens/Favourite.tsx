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
import {
  DeleteAddressIcon,
  HamburgerIcon,
  MapMarkerBlack24Icon,
  PlusIcon,
} from '../components/Icons';
import {useTheme} from '../constants/ThemeContext';
import {
  GET_ALL_FAVORITE_ADDRESSES,
  DELETE_FAVORITE_ADDRESS,
} from '../api/ApiEndpoints';
import {BASE_URL} from '../api/Instance';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  isLoading,
}: {
  item: FavoriteAddress;
  onDelete: (id: string) => void;
  isLoading: boolean;
}) => {
  const {isDarkMode} = useTheme();

  return (
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

      <Pressable onPress={() => onDelete(item._id)} disabled={isLoading}>
        {isLoading ? (
          <ActivityIndicator
            size="small"
            color={colors.themePrimary}
          />
        ) : (
          <DeleteAddressIcon />
        )}
      </Pressable>
    </Box>
  );
};

const Favourite = () => {
  // init
  const navigation = useNavigation<DrawerNavigationProp<ParamListBase>>();
  const {isDarkMode} = useTheme();
  const toast = useToast();

  // states
  const [favorites, setFavorites] = useState<FavoriteAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
      setFavorites(response.data);
    } catch (error: any) {
      console.error('Error fetching favorite addresses:', error?.response);
      showErrorToast('Failed to load favorite addresses');
    } finally {
      setLoading(false);
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

  useEffect(() => {
    fetchFavoriteAddresses();
  }, []);

  if (loading && favorites.length === 0) {
    return (
      <Container
        statusBarStyle={isDarkMode ? 'light-content' : 'dark-content'}
        statusBarBackgroundColor={isDarkMode ? '#000000' : '#f5f5f5'}
        backgroundColor={isDarkMode ? '#000000' : '#f5f5f5'}>
        <Box flex={1} justifyContent="center" alignItems="center">
          <ActivityIndicator
            size="large"
            color={colors.themePrimary}
          />
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
            bgColor={colors.paleYellow}
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
          justifyContent="space-around"
          >
          {/* <PlusIcon /> */}
        </Pressable>
      </Box>

      {favorites.length === 0 ? (
        <Box flex={1} justifyContent="center" alignItems="center">
          <Text
            fontFamily={'$poppinsMedium'}
            color={isDarkMode ? colors.white : colors.black}>
            No favorite addresses found
          </Text>
        </Box>
      ) : (
        <FlatList
          data={favorites}
          renderItem={({item}: {item: FavoriteAddress}) => (
            <FavouriteCard
              item={item}
              onDelete={handleDeleteAddress}
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
