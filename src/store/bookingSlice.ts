import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  mapLangLogArr: [],
};

const bookingSlice = createSlice({
  name: 'booking',
  initialState,
  reducers: {
    handleMapLangLogArr: (state, action) => {
      state.mapLangLogArr.push(action.payload);
    },
  },
});

export const { handleMapLangLogArr } = bookingSlice.actions;
export default bookingSlice.reducer;
