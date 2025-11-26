import React, {useEffect, useState} from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  Linking,
  StyleSheet,
  Dimensions,
  Platform,
  Alert,
} from 'react-native';
import {
  Box,
  Text,
  ChevronDownIcon,
  CloseIcon,
  Pressable,
  Icon,
  Toast,
  ToastTitle,
  useToast,
} from '@gluestack-ui/themed';
import MapView, {Marker, PROVIDER_DEFAULT, PROVIDER_GOOGLE} from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import { GOOGLE_API_KEY } from '../../constants/contants';
import { scale, moderateScale, moderateScaleVertical, textScale } from '../../utils/responsiveSize';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Modal from 'react-native-modal';
import Icons from '../../assets/Icons';
import { LocationMakerRedIcon, ReviewStarIcon } from '../Icons';
import { useTheme } from '../../constants/ThemeContext';
import { colors } from '../../constants/colors';
import { useNavigation } from '@react-navigation/native';
import { NavigationString } from '../../navigation/navigationStrings';
import { Dropdown } from 'react-native-element-dropdown';
import { customerCancelRideReasons } from '../../constants/contants';
import axios from 'axios';
import { BASE_URL } from '../../api/Instance';
import { UPDATE_RIDE_STATUS } from '../../api/ApiEndpoints';
import { loadUserFromStorage } from '../../store/slice/UserSlice';
import socketServices from '../../utils/socketServices';

const OngoingRideModal = ({
  visible,
  onClose,
  rideData,
  currentLocation,
  remainTimeForPickup,
  remainDurationForPickup,
  isRideStarted,
  setOngoingRide,
  setShowOngoingRideModal
}: {
  visible: boolean;
  isRideStarted: boolean;
  onClose: () => void;
  rideData: any;
  currentLocation: any;
  remainTimeForPickup: any;
  remainDurationForPickup: any;
  setOngoingRide: any;
  setShowOngoingRideModal: any
}) => {
  const navigation = useNavigation<any>();
  const {isDarkMode} = useTheme();
  const toast = useToast();
  const [showCancelAlert, setShowCancelAlert] = useState(false);
  const [selectedCancelReason, setSelectedCancelReason] = useState<any>(null);
  const [userLocalData, setUserLocalData] = useState<any>(null);

  // console.log("rideData - ", rideData?._id)

  useEffect(() => {
    const loadUserData = async () => {
      const data = await loadUserFromStorage();
      setUserLocalData(data);
    };
    loadUserData();
  }, []);
  useEffect(() => {
    if(selectedCancelReason){
      confirmCancelRide();
    }
  }, [selectedCancelReason]);

  const handleCallDriver = () => {
    if (rideData?.driverInfO?.contact) {
      Linking.openURL(`tel:${rideData.driverInfO.contact}`);
    }
  };

  const handleCancelRide = () => {
    setShowCancelAlert(true);
  };

  const handleRejectRide = async () => {
    try {
      if (!selectedCancelReason) {
        toast.show({
          placement: 'top',
          render: ({id}: any) => {
            return (
              <Toast nativeID={id} variant="accent" action="error">
                <ToastTitle>Please select a cancellation reason</ToastTitle>
              </Toast>
            );
          },
        });
        return;
      }

      socketServices.emit('update_booking_status', {
        bookingId: rideData?._id,
        bookingType: 'cancelled',
        rejectMessage: selectedCancelReason,
        cancelledBy: 'customer',
      });
      onClose();
      setShowCancelAlert(false);
      setSelectedCancelReason(null);
      setShowOngoingRideModal(false)
      setOngoingRide(null);
    } catch (error) {
      console.error('Error rejecting ride:', error);
      // showToast('error', 'Error', 'Failed to cancel the ride');
    }
  };

  // const cancelRide = async () => {
  //   console.log("selectedCancelReason--->", selectedCancelReason)
  //   if (!selectedCancelReason) {
  //     toast.show({
  //       placement: 'top',
  //       render: ({id}: any) => {
  //         return (
  //           <Toast nativeID={id} variant="accent" action="error">
  //             <ToastTitle>Please select a cancellation reason</ToastTitle>
  //           </Toast>
  //         );
  //       },
  //     });
  //     return;
  //   }

  //   try {
  //     const response = await axios({
  //       url: `${BASE_URL}${UPDATE_RIDE_STATUS.url}${rideData?._id}`,
  //       method: UPDATE_RIDE_STATUS.method,
  //       headers: {
  //         Authorization: userLocalData?.token,
  //       },
  //       data: {
  //         status: 'cancelled',
  //         rejectMessage: selectedCancelReason,
  //         cancelledBy: "customer"
  //       },
  //     });

  //     if (response.status === 200 && response.data) {
  //       toast.show({
  //         placement: 'top',
  //         render: ({id}: any) => {
  //           return (
  //             <Toast nativeID={id} variant="accent" action="success">
  //               <ToastTitle>Ride cancelled successfully</ToastTitle>
  //             </Toast>
  //           );
  //         },
  //       });
  //       navigation.navigate(NavigationString.Home);
  //     }
  //   } catch (error: any) {
  //     const errorMessage = error?.response?.data?.message || 'Failed to cancel ride';
  //     toast.show({
  //       placement: 'top',
  //       render: ({id}: any) => {
  //         return (
  //           <Toast nativeID={id} variant="accent" action="error">
  //             <ToastTitle>{errorMessage}</ToastTitle>
  //           </Toast>
  //         );
  //       },
  //     });
  //   } finally {
  //     setShowCancelAlert(false);
  //     setSelectedCancelReason(null);
  //   }
  // };

  const confirmCancelRide = () => {
    Alert.alert(
      "Confirm Cancellation",
      `Are you sure you want to cancel the ride?${selectedCancelReason ? `\nReason: ${selectedCancelReason}` : ''}`,
      [
        {
          text: "Cancel",
          onPress: () => setShowCancelAlert(false),
          style: "cancel"
        },
        { 
          text: "Confirm", 
          onPress: () => {handleRejectRide()}
        }
      ]
    );
  };

  return (
    <Modal
      isVisible={visible}
      onBackdropPress={onClose}
      onBackButtonPress={onClose}
      style={styles.modal}
      backdropOpacity={0.5}
      animationIn="slideInUp"
      animationOut="slideOutDown"
      backdropTransitionInTiming={500}
      backdropTransitionOutTiming={500}>
      <Box
        style={[
          styles.modalContent,
          {backgroundColor: isDarkMode ? colors.black : colors.white},
        ]}>
        <Box p={moderateScale(15)}>
          <Box flexDirection="row" alignItems="center" mb={moderateScale(10)}>
            <Image
              source={{uri: rideData?.driverInfO?.profileImgUrl}}
              style={{
                width: moderateScale(60),
                height: moderateScale(60),
                borderRadius: moderateScale(30),
                marginRight: moderateScale(10),
              }}
            />
            <Box flex={1}>
              <Text
                fontFamily="$poppinsSemiBold"
                fontSize={textScale(16)}
                color={isDarkMode ? colors.white : colors.black}>
                {rideData?.driverInfO?.name}
              </Text>
              <Text
                fontFamily="$poppinsMedium"
                fontSize={textScale(14)}
                color={isDarkMode ? colors.white : colors.black}>
                {rideData?.driverInfO?.riderId}
              </Text>
              <Box flexDirection="row" alignItems="center" mt={moderateScale(5)}>
                <ReviewStarIcon />
                <Text
                  ml={moderateScale(5)}
                  fontFamily="$poppinsMedium"
                  fontSize={textScale(12)}
                  color={isDarkMode ? colors.white : colors.black}>
                  4.9 (25 reviews)
                </Text>
              </Box>
            </Box>
            <Box>
              <Text
                fontFamily="$poppinsSemiBold"
                fontSize={textScale(18)}
                color={isDarkMode ? colors.white : colors.black}>
                Ride PIN
              </Text>
              <Text
                textAlign='center'
                textAlignVertical='center'
                fontFamily="$poppinsSemiBold"
                fontSize={textScale(18)}
                borderWidth={scale(2)}
                borderRadius={scale(10)}
                borderColor={colors.themePrimary}
                color={isDarkMode ? colors.white : colors.black}>
                {rideData?.bookingOtp}
              </Text>
            </Box>
          </Box>

          <Box
            flexDirection="row"
            justifyContent="space-between"
            mt={moderateScale(10)}>
            <Box>
              <Text
                fontFamily="$poppinsMedium"
                fontSize={textScale(14)}
                color={isDarkMode ? colors.white : colors.black}>
                Ride Details - {!isRideStarted ? "Waiting for driver reach" : "Ride Started"}
              </Text>
              <Box flexDirection="row" alignItems="center" mt={moderateScale(5)}>
                {isRideStarted ? 
                <Text
                  ml={moderateScale(5)}
                  fontFamily="$poppinsRegular"
                  fontSize={textScale(12)}
                  color={isDarkMode ? colors.white : colors.black}>
                  📌 {rideData?.distance?.toFixed(1)} km • {rideData?.duration?.toFixed(2)} min
                </Text> :
                <Text
                  ml={moderateScale(5)}
                  fontFamily="$poppinsRegular"
                  fontSize={textScale(12)}
                  color={isDarkMode ? colors.white : colors.black}>📌 {remainDurationForPickup?.toFixed(1)} km • {remainTimeForPickup?.toFixed(2)} min
                </Text> 
                }
              </Box>
              <Text
                mt={moderateScale(5)}
                fontFamily="$poppinsRegular"
                fontSize={textScale(12)}
                color={isDarkMode ? colors.white : colors.black}>
                {rideData?.rideCategory === 'car' || rideData?.rideCategory === 'taxi' ? "🚗" : "🚲"}  {rideData?.rideCategory?.toUpperCase()} • {rideData?.type}
              </Text>
            </Box>

            <Box alignItems="flex-end">
              <Text
                fontFamily="$poppinsMedium"
                fontSize={textScale(14)}
                color={isDarkMode ? colors.white : colors.black}>
                Amount
              </Text>
              <Text
                fontFamily="$poppinsSemiBold"
                fontSize={textScale(18)}
                color={isDarkMode ? colors.white : colors.black}>
                ₹{rideData?.payableAmount?.toFixed(2) || '--'}
              </Text>
            </Box>
          </Box>

          {/* Pickup and Destination Address */}
          <Box mt={moderateScale(15)}>
            <Box flexDirection="row" alignItems="center">
              <MaterialIcons
                name="location-on"
                size={scale(16)}
                color={colors.red}
              />
              <Box ml={moderateScale(10)} flex={1}>
                <Text
                  fontFamily="$poppinsMedium"
                  fontSize={textScale(14)}
                  color={isDarkMode ? colors.white : colors.black}>
                  Pickup
                </Text>
                <Text
                  fontFamily="$poppinsRegular"
                  fontSize={textScale(12)}
                  color={isDarkMode ? colors.white : colors.black}>
                  {rideData?.pickupLocation?.address}
                </Text>
              </Box>
            </Box>

            <Box flexDirection="row" alignItems="center" mt={moderateScale(10)}>
              <MaterialIcons
                name="location-on"
                size={scale(16)}
                color={colors.green}
              />
              <Box ml={moderateScale(10)} flex={1}>
                <Text
                  fontFamily="$poppinsMedium"
                  fontSize={textScale(14)}
                  color={isDarkMode ? colors.white : colors.black}>
                  Destination
                </Text>
                <Text
                  fontFamily="$poppinsRegular"
                  fontSize={textScale(12)}
                  color={isDarkMode ? colors.white : colors.black}>
                  {rideData?.destinationLocation?.address}
                </Text>
              </Box>
            </Box>
          </Box>

          {/* Action Buttons */}
          <Box
            flexDirection="row"
            justifyContent="space-between"
            mt={moderateScale(20)}>
            <TouchableOpacity onPress={handleCallDriver}>
              <Box
                flexDirection="row"
                alignItems="center"
                bg={colors.themePrimary}
                p={moderateScale(10)}
                borderRadius={moderateScale(5)}>
                <MaterialIcons
                  name="call"
                  size={scale(20)}
                  color={isDarkMode ? colors.white : colors.black}
                />
                <Text
                  ml={moderateScale(5)}
                  fontFamily="$poppinsMedium"
                  fontSize={textScale(12)}
                  color={isDarkMode ? colors.white : colors.black}>
                  Call
                </Text>
              </Box>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                navigation.navigate(NavigationString.ChatScreen, {bookingId: rideData?._id});
              }}>
              <Box
                flexDirection="row"
                alignItems="center"
                bg={colors.themePrimary}
                p={moderateScale(10)}
                borderRadius={moderateScale(5)}>
                <MaterialIcons
                  name="chat"
                  size={scale(20)}
                  color={isDarkMode ? colors.white : colors.black}
                />
                <Text
                  ml={moderateScale(5)}
                  fontFamily="$poppinsMedium"
                  fontSize={textScale(12)}
                  color={isDarkMode ? colors.white : colors.black}>
                  Chat
                </Text>
              </Box>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleCancelRide}>
              <Box
                flexDirection="row"
                alignItems="center"
                bg={colors.white}
                borderColor={colors.red}
                borderWidth={scale(1)}
                p={moderateScale(10)}
                borderRadius={moderateScale(5)}>
                <MaterialIcons
                  name="cancel"
                  size={scale(20)}
                  color={colors.red}
                />
                <Text
                  ml={moderateScale(5)}
                  fontFamily="$poppinsMedium"
                  fontSize={textScale(12)}
                  color={colors.black}>
                  Cancel Ride
                </Text>
              </Box>
            </TouchableOpacity>
          </Box>

          {/* Cancel Ride Reason Dropdown */}
          {showCancelAlert && (
            <Box mt={moderateScale(15)}>
              <Dropdown
                style={[
                  styles.dropdown,
                  {backgroundColor: isDarkMode ? colors.gray : colors.white},
                ]}
                placeholderStyle={[
                  styles.placeholderStyle,
                  {color: isDarkMode ? colors.white : colors.gray},
                ]}
                selectedTextStyle={[
                  styles.selectedTextStyle,
                  {color: isDarkMode ? colors.white : colors.black},
                ]}
                data={customerCancelRideReasons}
                labelField="label"
                valueField="value"
                placeholder="Select cancellation reason"
                value={selectedCancelReason}
                onChange={item => {
                  setSelectedCancelReason(item.value);
                  confirmCancelRide();
                }}
                renderRightIcon={() => (
                  <Icon
                    as={ChevronDownIcon}
                    size="lg"
                    mr="$2"
                    color={isDarkMode ? colors.white : colors.black}
                  />
                )}
              />
            </Box>
          )}
        </Box>
      </Box>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  modalContent: {
    width: '100%',
    borderTopLeftRadius: moderateScale(20),
    borderTopRightRadius: moderateScale(20),
    maxHeight: Dimensions.get('window').height * 0.7,
  },
  dropdown: {
    height: moderateScale(50),
    borderColor: colors.gray,
    borderWidth: 0.5,
    borderRadius: moderateScale(8),
    paddingHorizontal: moderateScale(8),
  },
  placeholderStyle: {
    fontSize: textScale(14),
    fontFamily: 'Poppins-Medium',
  },
  selectedTextStyle: {
    fontSize: textScale(14),
    fontFamily: 'Poppins-Medium',
  },
});

export default OngoingRideModal;