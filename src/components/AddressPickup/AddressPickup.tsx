import React from "react";
import { Box, View } from "@gluestack-ui/themed"
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete"

import { moderateScaleVertical, moderateScale } from "../../utils/responsiveSize";
import { LocationMapTagFormIcon, LocationTargetFormIcon } from "../Icons";
import Body from "../Body/Body";
import { colors } from "../../constants/colors";

interface Props {
  placeHolder: string;
  fetchAddress: (lat: number, lng: number, address: string) => void;

}

const FormLeft = () => {
  return (
    <Box pl={moderateScale(5)}>
      <LocationTargetFormIcon />
    </Box>
  )
}

const ToLeft = () => {
  return (
    <Box pl={moderateScale(5)}>
      <LocationMapTagFormIcon />
    </Box>
  )
}

const AddressPickup = (props: Props) => {
  // init
  const { placeHolder, fetchAddress } = props;

  // const onPressAddress = (data: any, details: any) => {
  //   const lat = details?.geometry?.location?.lat; 
  //   const lng = details?.geometry?.location?.lng;
  //   const address = details?.formatted_address

  //   fetchAddress(lat, lng, address)
  // }

  const onPressAddress = (data: any, details: any) => {
    const lat = details?.geometry?.location?.lat;
    const lng = details?.geometry?.location?.lng;
    const address = details?.formatted_address;
    fetchAddress(lat, lng, address);
    console.log("Address Data", address, lat, lng);
  }
  
  return (
    <View style={{ flex: 1 }}>
      <GooglePlacesAutocomplete
        placeholder={placeHolder}
        fetchDetails={true}
        onPress={onPressAddress}
        query={{
          key: 'AIzaSyD9gQiOP8vVtzDFjLjF59SL2MlcHXhjAsA',
          language: 'en',
        }}
        renderLeftButton={() => placeHolder === 'From' ? <FormLeft /> : <ToLeft />}
        styles={{
          textInputContainer: { borderWidth: 1, height: moderateScale(50), alignItems: 'center', marginHorizontal: moderateScale(15), borderColor: colors.silverGray, marginTop: moderateScaleVertical(15), borderRadius: moderateScale(5) }
        }}
      />
    </View>
  )
}

export default AddressPickup