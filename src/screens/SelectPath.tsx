import React, {useEffect, useState, useRef} from 'react';
import {
  View,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  TextInput,
  Animated,
  Dimensions,
} from 'react-native';
import {Text, Box, Toast, ToastTitle, useToast} from '@gluestack-ui/themed';
import {ParamListBase, useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {getDistance} from 'geolib';
import Modal from 'react-native-modal';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import {AppBar} from '../components/AppBar';
import {Container} from '../components/Container';
import {colors as originalColors} from '../constants/colors';
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
import {BASE_URL} from '../api/Instance.ts';
import {GET_ALL_FAVORITE_ADDRESSES} from '../api/ApiEndpoints';

const {width} = Dimensions.get('window');

// ===== STATIC THEME (no inline styles) =====
const newTheme = {
  primary: '#4F46E5',
  primaryLight: '#818CF8',
  primaryDark: '#4338CA',
  secondary: '#0EA5E9',
  secondaryLight: '#38BDF8',
  accent: '#10B981',
  accentLight: '#34D399',
  warning: '#F59E0B',
  danger: '#EF4444',
  background: {
    light: '#FFFFFF',
    dark: '#111827',
    cardLight: '#F9FAFB',
    cardDark: '#1F2937',
  },
};

const fontFamily = {
  bold: 'Inter-Bold',
  semiBold: 'Inter-SemiBold',
  medium: 'Inter-Medium',
  regular: 'Inter-Regular',
};

const colors = {
  ...originalColors,
  themePrimary: newTheme.primary,
  emeraldGreen: newTheme.accent,
};

const FormLeft = () => (
  <Box pl={moderateScale(5)}>
    <LocationTargetFormIcon />
  </Box>
);
const ToLeft = () => (
  <Box pl={moderateScale(5)}>
    <LocationMapTagFormIcon />
  </Box>
);

const SelectPath = ({route}: any) => {
  const {isDarkMode} = useTheme();
  const dispatch = useDispatch();
  const {searchPlaceByText, places, loading} = useSearchPlace();
  const toast = useToast();
  const navigation = useNavigation<NativeStackNavigationProp<ParamListBase>>();
  const userLocation = route?.params?.userLocation;
  const fetchCordsValues = route?.params?.fetchCordsValues;

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {toValue: 1, duration: 500, useNativeDriver: true}),
      Animated.timing(slideAnim, {toValue: 0, duration: 400, useNativeDriver: true}),
    ]).start();
  }, []);

  const [state, setState] = useState<any>({toCords: {}});
  const {toCords} = state;
  const [searchText, setSearchText] = useState('');
  const [showLocations, setShowLocations] = useState(false);
  const [debounceTimeout, setDebounceTimeout] = useState<NodeJS.Timeout | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<any>(null);
  const [userLocalData, setUserLocalData] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showFavoritesModal, setShowFavoritesModal] = useState(false);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loadingFavorites, setLoadingFavorites] = useState(false);

  // ========== ORIGINAL FUNCTIONS (UNCHANGED) ==========
  const handleLocationSelect = (location: any) => {
    const {latitude, longitude, address} = location;
    if (!userLocation?.latitude || !userLocation?.longitude) {return;}
    const distance = getDistance(
      {latitude: userLocation?.latitude, longitude: userLocation?.longitude},
      {latitude, longitude},
    );
    const fromMetersToKms = (distance / 1000)?.toFixed(2);
    setState({
      ...state,
      toCords: {latitude, longitude, address, distance: fromMetersToKms},
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
      dispatch(setDropDetails(dropDetails));
      const currentUserData = await loadUserFromStorage();
      const updatedUserData = {...currentUserData, dropDetails};
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
    if (!checkValid()) {return;}
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
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.navigate(NavigationString.Home);
      }
    } else {
      showErrorToast('Failed to save destination. Please try again.');
    }
  };

  const handleSearchChange = (text: string) => {
    setSearchText(text);
    if (debounceTimeout) {clearTimeout(debounceTimeout);}
    setDebounceTimeout(setTimeout(() => searchPlaceByText(text), 400));
  };

  const handleSelectPlace = async (place: any) => {
    if (!userLocation?.latitude || !userLocation?.longitude) {
      showErrorToast('Location not ready. Please try again.');
      return;
    }
    if (!place?.lat || !place?.lng) {
      showErrorToast('Invalid place selected. Please try another place.');
      return;
    }
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
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.navigate(NavigationString.Home);
      }
    }
  };

  const loadUserLocalDatas = async () => {
    try {
      const localData = await loadUserFromStorage();
      setUserLocalData(localData);
      const cachedFavorites = await AsyncStorage.getItem('favoriteAddresses');
      if (cachedFavorites) {
        const parsedFavorites = JSON.parse(cachedFavorites);
        setFavorites(parsedFavorites);
        dispatch(setFavoriteAddresses(parsedFavorites));
      }
      await fetchFavoriteAddresses();
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  };

  const showErrorToast = (message: string) => {
    toast.show({
      placement: 'top',
      render: ({id}: any) => (
        <Toast nativeID={'toast-' + id} action="error" variant="accent">
          <ToastTitle>{message}</ToastTitle>
        </Toast>
      ),
    });
  };

  const fetchFavoriteAddresses = async () => {
    try {
      setLoadingFavorites(true);
      const token = await AsyncStorage.getItem('userToken');
      const response = await axios.get(`${BASE_URL}${GET_ALL_FAVORITE_ADDRESSES.url}`, {
        headers: {Authorization: token},
      });
      const favoriteData = response.data;
      setFavorites(favoriteData);
      dispatch(setFavoriteAddresses(favoriteData));
      await AsyncStorage.setItem('favoriteAddresses', JSON.stringify(favoriteData));
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

  const toggleFavoritesModal = () => setShowFavoritesModal(!showFavoritesModal);

  useEffect(() => {
    loadUserLocalDatas();
  }, []);

  const clearDestination = () => {
    setState({toCords: {}});
    setSearchText('');
    setSelectedPlace(null);
  };

  // ========== RENDER ==========
  return (
    <Container
      statusBarStyle={isDarkMode ? 'light-content' : 'dark-content'}
      statusBarBackgroundColor={isDarkMode ? '#111827' : '#FFFFFF'}
      backgroundColor={isDarkMode ? '#111827' : '#F9FAFB'}>

      {/* Static Gradient Header */}
      <LinearGradient
        colors={isDarkMode ? ['#1F2937', '#111827'] : [newTheme.primary, newTheme.primaryDark]}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={styles.headerGradient}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Where to?</Text>
        <Text style={styles.headerSubtitle}>Enter your destination</Text>
      </LinearGradient>

      <Animated.View
        style={[
          styles.animatedContainer,
          {
            opacity: fadeAnim,
            transform: [{translateY: slideAnim}],
          },
        ]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled">

          {/* Destination Input Card - static styles, dynamic background */}
          <View
            style={[
              styles.inputCard,
              {backgroundColor: isDarkMode ? newTheme.background.dark : '#FFFFFF'},
            ]}>
            <View style={styles.inputIconContainer}>
              <MaterialIcons name="location-on" size={24} color={newTheme.primary} />
            </View>
            <TextInput
              style={[styles.input, {color: isDarkMode ? '#F9FAFB' : '#111827'}]}
              placeholder="Search for a place or address..."
              placeholderTextColor={isDarkMode ? '#9CA3AF' : '#6B7280'}
              value={searchText}
              onChangeText={handleSearchChange}
              autoFocus
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={clearDestination} style={styles.clearButton}>
                <MaterialIcons name="close" size={20} color={isDarkMode ? '#9CA3AF' : '#6B7280'} />
              </TouchableOpacity>
            )}
          </View>

          {loading && (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color={newTheme.primary} />
              <Text style={[styles.loadingText, {color: isDarkMode ? '#9CA3AF' : '#6B7280'}]}>
                Searching places...
              </Text>
            </View>
          )}

          {!loading && places.length > 0 && (
            <View style={styles.resultsContainer}>
              <Text style={[styles.sectionTitle, {color: isDarkMode ? '#F9FAFB' : '#111827'}]}>
                Search Results
              </Text>
              {places.map((item: any) => (
                <TouchableOpacity
                  key={item.place_id}
                  style={[
                    styles.resultItem,
                    {borderBottomColor: isDarkMode ? '#374151' : '#E5E7EB'},
                  ]}
                  onPress={() => {
                    dispatch(setDestinationByFavorite(false));
                    handleSelectPlace(item);
                  }}
                  activeOpacity={0.7}>
                  <View style={styles.resultIcon}>
                    <MaterialIcons name="search" size={20} color={newTheme.primaryLight} />
                  </View>
                  <View style={styles.resultTextContainer}>
                    <Text style={[styles.resultName, {color: isDarkMode ? '#F9FAFB' : '#111827'}]}>
                      {item.name}
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={[styles.resultAddress, {color: isDarkMode ? '#9CA3AF' : '#6B7280'}]}>
                      {item.address}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <TouchableOpacity
            style={styles.favoritesButton}
            onPress={toggleFavoritesModal}
            activeOpacity={0.8}>
            <LinearGradient
              colors={[newTheme.primary, newTheme.primaryDark]}
              style={styles.favoritesGradient}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 0}}>
              <MaterialIcons name="star" size={22} color="#FFFFFF" />
              <Text style={styles.favoritesButtonText}>Select from favorites</Text>
            </LinearGradient>
          </TouchableOpacity>

          <PrimaryButton
            buttonText={isSaving ? 'Saving...' : 'Confirm Destination'}
            onPress={onDone}
            disabled={isSaving}
            marginHorizontal={moderateScale(20)}
            marginVertical={moderateScaleVertical(15)}
            style={styles.doneButton}
          />
        </ScrollView>
      </Animated.View>

      <Modal
        isVisible={showFavoritesModal}
        onBackdropPress={toggleFavoritesModal}
        onBackButtonPress={toggleFavoritesModal}
        style={styles.modal}
        backdropOpacity={0.6}
        animationIn="slideInUp"
        animationOut="slideOutDown">
        <View
          style={[
            styles.modalContent,
            {backgroundColor: isDarkMode ? newTheme.background.dark : '#FFFFFF'},
          ]}>
          <LinearGradient
            colors={isDarkMode ? ['#374151', '#1F2937'] : [newTheme.primary + '10', '#FFFFFF']}
            style={styles.modalHeader}>
            <MaterialIcons name="star" size={28} color={newTheme.primary} />
            <Text style={[styles.modalTitle, {color: isDarkMode ? '#F9FAFB' : '#111827'}]}>
              Favorite Places
            </Text>
            <Text style={[styles.modalSubtitle, {color: isDarkMode ? '#9CA3AF' : '#6B7280'}]}>
              Choose a saved location
            </Text>
          </LinearGradient>

          {loadingFavorites ? (
            <View style={styles.modalLoader}>
              <ActivityIndicator size="large" color={newTheme.primary} />
              <Text style={{color: isDarkMode ? '#9CA3AF' : '#6B7280', marginTop: 10}}>
                Loading...
              </Text>
            </View>
          ) : favorites.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="star-border" size={48} color={isDarkMode ? '#4B5563' : '#D1D5DB'} />
              <Text style={[styles.emptyText, {color: isDarkMode ? '#9CA3AF' : '#6B7280'}]}>
                No favorite addresses yet
              </Text>
            </View>
          ) : (
            <FlatList
              data={favorites}
              keyExtractor={item => item._id}
              renderItem={({item}) => (
                <TouchableOpacity
                  style={[
                    styles.favoriteItem,
                    {borderBottomColor: isDarkMode ? '#374151' : '#E5E7EB'},
                  ]}
                  onPress={() => handleFavoriteSelect(item)}
                  activeOpacity={0.7}>
                  <View style={styles.favoriteContent}>
                    <View style={styles.favoriteIcon}>
                      <MaterialIcons name="place" size={24} color={newTheme.primary} />
                    </View>
                    <View style={styles.favoriteTextContainer}>
                      <Text
                        style={[
                          styles.favoriteLabel,
                          {color: isDarkMode ? '#F9FAFB' : '#111827'},
                        ]}>
                        {item.label}
                      </Text>
                      <Text
                        numberOfLines={1}
                        style={[
                          styles.favoriteAddress,
                          {color: isDarkMode ? '#9CA3AF' : '#6B7280'},
                        ]}>
                        {item.destination.address}
                      </Text>
                    </View>
                  </View>
                  {item.isDefault && (
                    <View style={styles.defaultBadge}>
                      <Text style={styles.defaultBadgeText}>Default</Text>
                    </View>
                  )}
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.favoritesList}
            />
          )}
        </View>
      </Modal>
    </Container>
  );
};

// ========== STATIC STYLESHEET (no inline style objects) ==========
const styles = StyleSheet.create({
  headerGradient: {
    paddingTop: verticalScale(60),
    paddingBottom: verticalScale(30),
    paddingHorizontal: moderateScale(20),
    borderBottomLeftRadius: moderateScale(28),
    borderBottomRightRadius: moderateScale(28),
  },
  backButton: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: moderateScaleVertical(12),
  },
  headerTitle: {
    fontFamily: fontFamily.bold,
    fontSize: moderateScale(28),
    color: '#FFFFFF',
    marginBottom: moderateScaleVertical(4),
  },
  headerSubtitle: {
    fontFamily: fontFamily.regular,
    fontSize: moderateScale(14),
    color: 'rgba(255,255,255,0.8)',
  },
  animatedContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: moderateScaleVertical(40),
    marginTop:34,
  },
  inputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: moderateScale(20),
    marginTop: moderateScaleVertical(-24),
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScaleVertical(4),
    borderRadius: moderateScale(24),
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  inputIconContainer: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: newTheme.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: moderateScale(12),
  },
  input: {
    flex: 1,
    fontSize: moderateScale(16),
    fontFamily: fontFamily.regular,
    paddingVertical: moderateScaleVertical(12),
  },
  clearButton: {
    padding: moderateScale(8),
  },
  loaderContainer: {
    alignItems: 'center',
    marginTop: moderateScaleVertical(40),
  },
  loadingText: {
    marginTop: moderateScaleVertical(12),
    fontFamily: fontFamily.regular,
    fontSize: moderateScale(14),
  },
  resultsContainer: {
    marginTop: moderateScaleVertical(24),
    marginHorizontal: moderateScale(20),
  },
  sectionTitle: {
    fontFamily: fontFamily.semiBold,
    fontSize: moderateScale(18),
    marginBottom: moderateScaleVertical(12),
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: moderateScaleVertical(12),
    borderBottomWidth: 1,
  },
  resultIcon: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    backgroundColor: newTheme.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: moderateScale(12),
  },
  resultTextContainer: {
    flex: 1,
  },
  resultName: {
    fontFamily: fontFamily.medium,
    fontSize: moderateScale(15),
    marginBottom: moderateScaleVertical(2),
  },
  resultAddress: {
    fontFamily: fontFamily.regular,
    fontSize: moderateScale(12),
  },
  favoritesButton: {
    marginHorizontal: moderateScale(20),
    marginTop: moderateScaleVertical(20),
    borderRadius: moderateScale(30),
    overflow: 'hidden',
    shadowColor: newTheme.primary,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  favoritesGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: moderateScaleVertical(14),
    gap: moderateScale(10),
  },
  favoritesButtonText: {
    color: '#FFFFFF',
    fontFamily: fontFamily.semiBold,
    fontSize: moderateScale(16),
  },
  doneButton: {
    borderRadius: moderateScale(30),
    overflow: 'hidden',
  },
  modal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  modalContent: {
    borderTopLeftRadius: moderateScale(28),
    borderTopRightRadius: moderateScale(28),
    paddingHorizontal: moderateScale(20),
    paddingTop: moderateScaleVertical(20),
    maxHeight: '75%',
  },
  modalHeader: {
    alignItems: 'center',
    paddingVertical: moderateScaleVertical(16),
    borderRadius: moderateScale(20),
    marginBottom: moderateScaleVertical(16),
  },
  modalTitle: {
    fontFamily: fontFamily.bold,
    fontSize: moderateScale(22),
    marginTop: moderateScaleVertical(8),
  },
  modalSubtitle: {
    fontFamily: fontFamily.regular,
    fontSize: moderateScale(13),
    marginTop: moderateScaleVertical(2),
  },
  modalLoader: {
    alignItems: 'center',
    paddingVertical: moderateScaleVertical(40),
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: moderateScaleVertical(60),
  },
  emptyText: {
    fontFamily: fontFamily.medium,
    fontSize: moderateScale(16),
    marginTop: moderateScaleVertical(12),
  },
  favoritesList: {
    paddingBottom: moderateScaleVertical(30),
  },
  favoriteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: moderateScaleVertical(14),
    borderBottomWidth: 1,
  },
  favoriteContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  favoriteIcon: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(22),
    backgroundColor: newTheme.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: moderateScale(14),
  },
  favoriteTextContainer: {
    flex: 1,
  },
  favoriteLabel: {
    fontFamily: fontFamily.semiBold,
    fontSize: moderateScale(15),
    marginBottom: moderateScaleVertical(2),
  },
  favoriteAddress: {
    fontFamily: fontFamily.regular,
    fontSize: moderateScale(12),
  },
  defaultBadge: {
    backgroundColor: newTheme.primary,
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScaleVertical(4),
    borderRadius: moderateScale(12),
  },
  defaultBadgeText: {
    color: '#FFFFFF',
    fontSize: moderateScale(10),
    fontFamily: fontFamily.medium,
  },
});

export default SelectPath;
