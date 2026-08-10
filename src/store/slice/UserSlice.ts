import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Location {
  latitude: number;
  longitude: number;
  address?: string;
  distance?: string;
  city?: string;
  state?: string;
  country?: string;
  routeDurationinMinutes?: number;
}

// Define the initial state's types for the user slice
interface UserState {
  pickupDetails?: Location | null;
  dropDetails?: Location | null;
  dropDistance?: number | string | null;
  token?: string | null;
  profileData?: any;
  destinationByFavorite: boolean;
  favoriteAddresses?: any[];
}

// Define the initial state for the user slice
const initialState: UserState = {
  pickupDetails: null,
  dropDetails: null,
  dropDistance: null,
  token: null,
  profileData: null,
  destinationByFavorite: false,
  favoriteAddresses: [],
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setPickupDetails: (state, action: PayloadAction<Location>) => {
      state.pickupDetails = {
        latitude: action.payload.latitude,
        longitude: action.payload.longitude,
        address: action.payload.address,
        city: action.payload.city,
        country: action.payload.country,
        state: action.payload.state,
      };
    },
    setDropDetails: (state, action: PayloadAction<Location>) => {
      console.warn('action payload  getting ... ', action.payload);
      state.dropDetails = {
        latitude: action.payload.latitude,
        longitude: action.payload.longitude,
        address: action.payload.address,
        city: action.payload.city,
        distance: action.payload.distance,
        routeDurationinMinutes: action.payload.routeDurationinMinutes,
      };
    },
    setDestinationByFavorite: (state, action: PayloadAction<boolean>) => {
      state.destinationByFavorite = action.payload;
    },
    setFavoriteAddresses: (state, action: PayloadAction<any[]>) => {
      state.favoriteAddresses = action.payload;
    },
    setDropDistance: (state, action: PayloadAction<any>) => {
      state.dropDistance = action.payload;
    },
    setProfileData: (state, action: PayloadAction<any>) => {
      state.profileData = action.payload;
    },
    setToken: (state, action: PayloadAction<any>) => {
      state.token = action.payload;
    },
    clearUserData: state => {
      state.pickupDetails = null;
      state.dropDetails = null;
      state.dropDistance = null;
      state.token = null;
      state.profileData = null;
      state.destinationByFavorite = false;
      state.favoriteAddresses = [];
    },
  },
});

export const {
  clearUserData,
  setPickupDetails,
  setDropDetails,
  setDropDistance,
  setToken,
  setProfileData,
  setDestinationByFavorite,
  setFavoriteAddresses,
} = userSlice.actions;

// AsyncStorage helper functions
export const saveUserToStorage = async (userData: UserState) => {
  const dataToSave = {
    ...userData,
    destinationByFavorite: userData.destinationByFavorite || false,
    favoriteAddresses: userData.favoriteAddresses || [],
  };
  await AsyncStorage.setItem('userData', JSON.stringify(dataToSave));
};

export const loadUserFromStorage = async (): Promise<UserState | null> => {
  const userData = await AsyncStorage.getItem('userData');
  if (userData) {
    const parsedData = JSON.parse(userData);
    return {
      ...parsedData,
      destinationByFavorite: parsedData.destinationByFavorite || false,
      favoriteAddresses: parsedData.favoriteAddresses || [],
    };
  }
  return null;
};

export default userSlice.reducer;
