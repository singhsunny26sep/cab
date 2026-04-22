import React, {useEffect, useState} from 'react';
import {Box, Toast, ToastTitle, useToast} from '@gluestack-ui/themed';
import {ParamListBase, useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {getDistance} from 'geolib';
import {
  View,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import {Text} from '@gluestack-ui/themed';
import Modal from 'react-native-modal';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {AppBar} from '../components/AppBar';
import {Container} from '../components/Container';
import {colors} from '../constants/colors';
import InputText from '../components/TextInput/InputText';
import {
  LocationMapTagFormIcon,
  LocationTargetFormIcon,
} from '../components/Icons';
import {
  moderateScaleVertical,
  moderateScale,
  scale,
  verticalScale,
} from '../utils/responsiveSize';
import {NavigationString} from '../navigation/navigationStrings';
import {Alert, ScrollView} from 'react-native';
import PrimaryButton from '../components/Button/PrimaryButton';
import {useTheme} from '../constants/ThemeContext';
import useSearchPlace from '../utils/useSearchPlace';
import {useDispatch, useSelector} from 'react-redux';
import {RootState} from '../store/reduxStore/store';
import {
  loadUserFromStorage,
  saveUserToStorage,
  setDestinationByFavorite,
  setDropDetails,
  setFavoriteAddresses,
} from '../store/slice/UserSlice';
import {BASE_URL} from '../api/Instance';
import {GET_ALL_FAVORITE_ADDRESSES} from '../api/ApiEndpoints';

const FormLeft = () => {
  return (
    <Box pl={moderateScale(5)}>
      <LocationTargetFormIcon />
    </Box>
  );
};

const ToLeft = () => {
  return (
    <Box pl={moderateScale(5)}>
      <LocationMapTagFormIcon />
    </Box>
  );
};

const SelectPath = ({route}: any) => {
  const {isDarkMode} = useTheme();
  const dispatch = useDispatch();
  const userData = useSelector((state: RootState) => state.user);
  const {searchPlaceByText, places, loading} = useSearchPlace();

  const toast = useToast();
  const navigation = useNavigation<NativeStackNavigationProp<ParamListBase>>();
  const userLocation = route?.params?.userLocation;
  const fetchCordsValues = route?.params?.fetchCordsValues;

  const [state, setState] = useState<any>({
    toCords: {},
  });
  const {toCords} = state;

  const [searchText, setSearchText] = useState('');
  const [showLocations, setShowLocations] = useState(false);
  const [debounceTimeout, setDebounceTimeout] = useState<NodeJS.Timeout | null>(
    null,
  );
  const [selectedPlace, setSelectedPlace] = useState<any>(null);
  const [userLocalData, setUserLocalData] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showFavoritesModal, setShowFavoritesModal] = useState(false);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loadingFavorites, setLoadingFavorites] = useState(false);

  const handleLocationSelect = (location: any) => {
    const {latitude, longitude, address} = location;
    const distance = getDistance(
      {latitude: userLocation?.latitude, longitude: userLocation.longitude},
      {latitude, longitude},
    );
    const fromMetersToKms = (distance / 1000)?.toFixed(2);

    setState({
      ...state,
      toCords: {
        latitude,
        longitude,
        address,
        distance: fromMetersToKms,
      },
    });

    setSearchText(location.name);
    setShowLocations(false);
  };

  const checkValid = () => {
    if (Object.keys(toCords).length === 0) {
      showErrorToast('Please enter your Destination location');
      return false;
    }
    return true;
  };

  const saveDropDetails = async (dropDetails: any) => {
    setIsSaving(true);
    try {
      // First update Redux state
      dispatch(setDropDetails(dropDetails));

      // Then save to storage
      const currentUserData = await loadUserFromStorage();
      const updatedUserData: any = {
        ...currentUserData,
        dropDetails: dropDetails,
      };

      await saveUserToStorage(updatedUserData);
      setUserLocalData(updatedUserData);

      return true;
    } catch (error) {
      console.error('Failed to save drop details:', error);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const onDone = async () => {
    if (!checkValid()) return;

    if (toCords?.distance && Number(toCords.distance) > 10000) {
      showErrorToast('The destination is too far away.');
      return;
    }

    const saved = await saveDropDetails({
      latitude: toCords.latitude,
      longitude: toCords.longitude,
      address: toCords.address,
      city: selectedPlace?.name || searchText,
      distance: toCords.distance,
    });

    if (saved) {
      fetchCordsValues(toCords);
      navigation?.navigate(NavigationString.Home);
    } else {
      showErrorToast('Failed to save destination. Please try again.');
    }
  };

  const handleSearchChange = (text: string) => {
    setSearchText(text);
    if (debounceTimeout) clearTimeout(debounceTimeout);
    setDebounceTimeout(setTimeout(() => searchPlaceByText(text), 400));
  };

  const handleSelectPlace = async (place: any) => {
    if (!userLocation?.latitude || !userLocation?.longitude) return;

    // dispatch(setDestinationByFavorite(false));

    const distance = getDistance(
      {latitude: userLocation.latitude, longitude: userLocation.longitude},
      {latitude: place.lat, longitude: place.lng},
    );
    const fromMetersToKms = (distance / 1000)?.toFixed(2);

    const newToCords = {
      latitude: place.lat,
      longitude: place.lng,
      address: place.address,
      distance: fromMetersToKms,
    };

    setState((prev: any) => ({...prev, toCords: newToCords}));
    setSearchText(place.name);
    setSelectedPlace(place);
    setShowLocations(false);

    const saved = await saveDropDetails({
      latitude: place.lat,
      longitude: place.lng,
      address: place.address,
      city: place.name,
      distance: fromMetersToKms,
    });

    if (saved) {
      fetchCordsValues(newToCords);
      navigation?.navigate(NavigationString.Home);
    }
  };

  const loadUserLocalDatas = async () => {
    try {
      const localData = await loadUserFromStorage();
      setUserLocalData(localData);

      // Load cached favorites from AsyncStorage
      const cachedFavorites = await AsyncStorage.getItem('favoriteAddresses');
      if (cachedFavorites) {
        const parsedFavorites = JSON.parse(cachedFavorites);
        setFavorites(parsedFavorites);
        dispatch(setFavoriteAddresses(parsedFavorites));
      }

      // Always fetch fresh favorites from API
      await fetchFavoriteAddresses();
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  };

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
      setLoadingFavorites(true);
      const token = await AsyncStorage.getItem('userToken');
      console.log('token', token);
      console.log('url', `${BASE_URL}${GET_ALL_FAVORITE_ADDRESSES.url}`);
      const response = await axios.get(
        `${BASE_URL}${GET_ALL_FAVORITE_ADDRESSES.url}`,
        {
          headers: {
            Authorization: token,
          },
        },
      );
      console.log('respomse', response);
      const favoriteData = response.data;
      setFavorites(favoriteData);
      dispatch(setFavoriteAddresses(favoriteData));
      await AsyncStorage.setItem(
        'favoriteAddresses',
        JSON.stringify(favoriteData),
      );
    } catch (error: any) {
      console.error('Error fetching favorite addresses:', error?.response);
      showErrorToast('Failed to load favorite addresses');
    } finally {
      setLoadingFavorites(false);
    }
  };

  const handleFavoriteSelect = async (favorite: any) => {
    const place = {
      lat: favorite.destination.coordinates.lat,
      lng: favorite.destination.coordinates.lng,
      address: favorite.destination.address,
      name: favorite.label,
    };

    dispatch(setDestinationByFavorite(true));
    await handleSelectPlace(place);
    setShowFavoritesModal(false);
  };

  const toggleFavoritesModal = async () => {
    // if (!showFavoritesModal) {
    //   await fetchFavoriteAddresses();
    // }
    setShowFavoritesModal(!showFavoritesModal);
  };

  useEffect(() => {
    loadUserLocalDatas();
  }, []);

  const renderFavoriteItem = ({item}: {item: any}) => (
    <TouchableOpacity
      style={[
        styles.favoriteItem,
        {borderBottomColor: isDarkMode ? '#333' : '#eee'},
      ]}
      onPress={() => handleFavoriteSelect(item)}>
      <View style={styles.favoriteContent}>
        <Text
          style={[
            styles.favoriteLabel,
            {color: isDarkMode ? 'white' : 'black'},
          ]}>
          {item.label}
        </Text>
        <Text
          style={[
            styles.favoriteAddress,
            {color: isDarkMode ? '#ccc' : '#666'},
          ]}>
          {item.destination.address}
        </Text>
      </View>
      {item.isDefault && (
        <View style={styles.defaultBadge}>
          <Text style={styles.defaultBadgeText}>Default</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <Container
      statusBarStyle={isDarkMode ? 'light-content' : 'dark-content'}
      statusBarBackgroundColor={isDarkMode ? '#000000' : '#f5f5f5'}
      backgroundColor={isDarkMode ? '#000000' : '#f5f5f5'}>
      <AppBar back title="Select Destination" isDarkMode={isDarkMode} />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        style={{backgroundColor: isDarkMode ? 'black' : 'white', flex: 1}}>
        <View
          style={{
            marginHorizontal: scale(15),
            marginVertical: verticalScale(10),
          }}>
          <InputText
            textInputProps={{
              placeholder: 'Enter Your Destination',
              value: searchText,
              onChangeText: handleSearchChange,
              style: {
                color: isDarkMode ? 'white' : 'black',
                flex: 1,
              },
            }}
          />

          {loading && (
            <ActivityIndicator
              size="small"
              color="#000"
              style={{marginVertical: 12}}
            />
          )}
          {!loading && places.length > 0 && (
            <FlatList
              data={places}
              keyExtractor={(item: any) => item.place_id}
              keyboardShouldPersistTaps="handled"
              renderItem={({item}) => (
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={{
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: isDarkMode ? '#333' : '#eee',
                  }}
                  onPress={() => {
                    dispatch(setDestinationByFavorite(false));
                    handleSelectPlace(item);
                  }}>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: '500',
                      color: isDarkMode ? 'white' : 'black',
                    }}>
                    {item.name}
                  </Text>
                  <Text
                    style={{fontSize: 14, color: isDarkMode ? '#ccc' : '#666'}}>
                    {item.address}
                  </Text>
                </TouchableOpacity>
              )}
            />
          )}
        </View>

        <PrimaryButton
          buttonText="Select from favorites"
          onPress={toggleFavoritesModal}
          marginHorizontal={moderateScale(15)}
          marginVertical={moderateScaleVertical(10)}
        />
        <PrimaryButton
          buttonText={isSaving ? 'Saving...' : 'Done'}
          onPress={onDone}
          disabled={isSaving}
          marginHorizontal={moderateScale(15)}
          marginVertical={moderateScaleVertical(25)}
        />

        {/* Favorites Modal */}
        <Modal
          isVisible={showFavoritesModal}
          onBackdropPress={() => setShowFavoritesModal(false)}
          onBackButtonPress={() => setShowFavoritesModal(false)}
          style={styles.modal}
          backdropOpacity={0.5}>
          <View
            style={[
              styles.modalContent,
              {backgroundColor: isDarkMode ? '#1a1a1a' : 'white'},
            ]}>
            <Text
              style={[
                styles.modalTitle,
                {color: isDarkMode ? 'white' : 'black'},
              ]}>
              Select Favorite Destination
            </Text>

            {loadingFavorites ? (
              <ActivityIndicator
                size="large"
                color={isDarkMode ? 'white' : '#000'}
              />
            ) : favorites.length === 0 ? (
              <Text
                style={[
                  styles.emptyText,
                  {color: isDarkMode ? '#ccc' : '#666'},
                ]}>
                No favorite addresses found
              </Text>
            ) : (
              <FlatList
                data={favorites}
                keyExtractor={item => item._id}
                renderItem={renderFavoriteItem}
                contentContainerStyle={styles.favoritesList}
              />
            )}
          </View>
        </Modal>
      </ScrollView>
    </Container>
  );
};

const styles = StyleSheet.create({
  modal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  favoritesList: {
    paddingBottom: 20,
  },
  favoriteItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  favoriteContent: {
    flex: 1,
  },
  favoriteLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  favoriteAddress: {
    fontSize: 14,
  },
  defaultBadge: {
    position: 'absolute',
    right: 0,
    top: 15,
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  defaultBadgeText: {
    color: 'white',
    fontSize: 12,
  },
  emptyText: {
    textAlign: 'center',
    marginVertical: 20,
    fontSize: 16,
  },
});

export default SelectPath;
