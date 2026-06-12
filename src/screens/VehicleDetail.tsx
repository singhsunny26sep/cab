
import { Text, Box, Pressable, Image } from '@gluestack-ui/themed';
import { responsiveHeight, responsiveWidth } from 'react-native-responsive-dimensions';
import Carousel from 'pinar';
import { ParamListBase, useNavigation,useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Container } from '../components/Container';
import { AppBar } from '../components/AppBar';
import { colors } from '../constants/colors';
import Body from '../components/Body/Body';
import { moderateScale, moderateScaleVertical } from '../utils/responsiveSize';
import { PowerIcon, ReviewStarIcon, SilderNextIcon, SliderPrevIcon } from '../components/Icons';
import images from '../assets/images';
import Icons from '../assets/Icons';
import PrimaryButton from '../components/Button/PrimaryButton';
import { NavigationString } from '../navigation/navigationStrings';
import { useTheme } from '../constants/ThemeContext';
import { BASE_URL, Instance } from '../api/Instance.ts';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadUserFromStorage } from '../store/slice/UserSlice';
import { GET_BIKE_DETAILS, GET_CAR_DETAILS, GET_CYCLE_DETAILS, GET_TAXI_DETAILS } from '../api/ApiEndpoints';
import { ActivityIndicator, View } from 'react-native';
import { getCurrentLocationOnce } from '../utils/locationHelper';

const VehicleDetail = ({route}:any) => {
  // init
  const navigation = useNavigation<NativeStackNavigationProp<ParamListBase>>();
  const { vehicle } = route.params;
  const { isDarkMode } = useTheme();
  console.log('vehicle data from route ....', vehicle);

  const [loading, setLoading] = useState<boolean>(false);
  const [vehicleDetail, setVehicleDetail] = useState<any>(null);

  useEffect(()=>{
    fetchVehicleDetails();
  },[]);

  const fetchVehicleDetails = async () => {
    setLoading(true);
    // setError('');
    try {
      // const localData = await loadUserFromStorage();
      const token = await AsyncStorage.getItem('userToken');
      const location = await getCurrentLocationOnce();
      // console.log("location ....", location?.coordinates?.latitude);
      // console.log("user token ....", token);
      // console.log("vehicle type ....", vehicle.type);
      if (!token) {
        return;
      }
      // console.log('transportType',transportType)

      let url = '';
      switch (vehicle.type) {
        case 'Car':
          url = `${BASE_URL}${GET_CAR_DETAILS.url}${vehicle._id}`;
          break;
        case 'bike':
          url = `${BASE_URL}${GET_BIKE_DETAILS.url}${vehicle._id}`;
          break;
        case 'Cycle':
          url = `${BASE_URL}${GET_CYCLE_DETAILS.url}${vehicle._id}`;
          break;
        case 'Taxi':
          url = `${BASE_URL}${GET_TAXI_DETAILS.url}${vehicle._id}`;
          break;
        default:
          // setError('Invalid transport type');
          return;
      }
      // console.log('url',url)
      // console.log("token passing -> ", token);
      let newUrl = `${url}?lat=${location?.coordinates?.latitude}&lng=${location?.coordinates?.longitude}`;
      const response = await Instance.get(newUrl, {
        headers: {
          Authorization: token,
        },
      });
      // console.warn("response for getting  vehicles details-> ", response.data.data);
      if (response.data.success && response.status === 200) {
        const vehicleDetails = vehicle.type === 'Car' ? response.data.data.car : response.data.data;
        setVehicleDetail(vehicleDetails);
        // setVehicles(availableVehicles);
      }
    } catch (err) {
      console.log('error gott -> ', err);
      // setError('An error occurred while fetching the vehicles.');
    } finally {
      setLoading(false);
    }
  };



  return (
    <Container statusBarStyle={isDarkMode ? 'light-content' : 'dark-content'} statusBarBackgroundColor={isDarkMode ? '#000000' : '#ffffff'} backgroundColor={isDarkMode ? '#000000' : '#ffffff'}>
      <AppBar back  isDarkMode={isDarkMode}/>
      {
        loading ?
        (
          <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
            <ActivityIndicator size="large" color="#00ff00"  />
          </View>
        ) :
        (
      <Body>
        <Box mx={moderateScale(15)} mt={moderateScaleVertical(25)} mb={moderateScaleVertical(15)} gap={moderateScaleVertical(4)}>
          <Text fontFamily={'$poppinsSemiBold'} fontSize={24} lineHeight={26} color={isDarkMode ? colors.white : colors.charcoalGray} numberOfLines={1}>{vehicleDetail?.manufacturer} {vehicleDetail?.model}</Text>
          <Box flexDirection="row" alignItems="center" gap={moderateScale(10)}>
            <ReviewStarIcon />
            <Text fontFamily={'$poppinsMedium'} fontSize={14} lineHeight={18} color={isDarkMode ? colors.white : colors.silverGray} numberOfLines={1}>4.9 (531 reviews)</Text>
          </Box>
        </Box>

        <Box h={moderateScale(170)} w={'93%'} borderRadius={10} overflow="hidden" my={moderateScaleVertical(20)} alignSelf="center">
          <Carousel style={{ width: '100%', height: '100%', alignSelf: 'center' }} showsControls={true} loop={true} autoplay={false} showsDots={false} autoplayInterval={1500}
            activeDotStyle={{ width: responsiveWidth(3), height: responsiveHeight(1.5), backgroundColor: colors.themeBlue, borderRadius: responsiveHeight(1) }}
            dotStyle={{ width: responsiveWidth(3), height: responsiveHeight(1.5), backgroundColor: colors.gray6, borderRadius: responsiveHeight(1) }}
            dotsContainerStyle={{ flexDirection: 'row', alignItems: 'center', gap: responsiveWidth(1.5), alignSelf: 'center', marginTop: responsiveHeight(-1.5) }}
            contentContainerStyle={{}}
            controlsButtonStyle={{ marginRight: moderateScale(-20), marginLeft: moderateScale(-20) }}
            renderNext={({ scrollToNext }) => {
              return (
                <Pressable onPress={scrollToNext} >
                  <SilderNextIcon />
                </Pressable>
              );
            }}

            renderPrev={({ scrollToPrev }) => {
              return (
                <Pressable onPress={scrollToPrev} >
                  <SliderPrevIcon />
                </Pressable>
              );
            }}
          >
            {vehicleDetail?.imagesList?.map((img: string) => <Image alt="SilderIcon" source={{uri:img}} key={img} w={'80%'} h={'90%'} resizeMode="contain" alignSelf="center" borderRadius={10} style={{resizeMode: 'contain'}} />)}
          </Carousel>
        </Box>

        {/* Specification box */}
        <Box mx={moderateScale(15)} gap={moderateScaleVertical(20)} mb={moderateScaleVertical(25)}>
          <Text fontFamily={'$poppinsMedium'} fontSize={18} lineHeight={20} color={isDarkMode ? colors.white : colors.dimGray} numberOfLines={1}>Specifications</Text>

          <Box flexDirection="row" alignItems="center" gap={moderateScale(15)}>
            <Box bgColor={colors.ivoryYellow} borderColor={colors.themePrimary} borderWidth={1} flex={1} h={moderateScale(75)} gap={moderateScaleVertical(8)} alignItems="center" justifyContent="center" borderRadius={moderateScale(8)}>
              <PowerIcon />

              <Box alignItems="center" gap={moderateScaleVertical(3)}>
                <Text fontFamily={'$poppinsMedium'} fontSize={10} lineHeight={12} color={colors.dimGray} numberOfLines={1}>Max. power</Text>
                <Text fontFamily={'$poppinsRegular'} fontSize={8} lineHeight={10} color={colors.dimGray} numberOfLines={1}>{vehicleDetail?.maxpower}</Text>
              </Box>
            </Box>

            <Box bgColor={colors.ivoryYellow} borderColor={colors.themePrimary} borderWidth={1} flex={1} h={moderateScale(75)} gap={moderateScaleVertical(8)} alignItems="center" justifyContent="center" borderRadius={moderateScale(8)}>
              <Image alt="icon" source={Icons.Fual} w={moderateScale(24)} h={moderateScale(24)} resizeMode="contain" />

              <Box alignItems="center" gap={moderateScaleVertical(3)}>
                <Text fontFamily={'$poppinsMedium'} fontSize={10} lineHeight={12} color={colors.dimGray} numberOfLines={1}>Fuel</Text>
                <Text fontFamily={'$poppinsRegular'} fontSize={8} lineHeight={10} color={colors.dimGray} numberOfLines={1}>{vehicleDetail?.fuelCostAverage}km per litre</Text>
              </Box>
            </Box>

            <Box bgColor={colors.ivoryYellow} borderColor={colors.themePrimary} borderWidth={1} flex={1} h={moderateScale(75)} gap={moderateScaleVertical(8)} alignItems="center" justifyContent="center" borderRadius={moderateScale(8)}>
              <Image alt="icon" source={Icons.Speed} w={moderateScale(24)} h={moderateScale(24)} resizeMode="contain" />


              <Box alignItems="center" gap={moderateScaleVertical(3)}>
                <Text fontFamily={'$poppinsMedium'} fontSize={10} lineHeight={12} color={colors.dimGray} numberOfLines={1}>Max. speed</Text>
                <Text fontFamily={'$poppinsRegular'} fontSize={8} lineHeight={10} color={colors.dimGray} numberOfLines={1}>{vehicleDetail?.maxSpeed}</Text>
              </Box>
            </Box>

            <Box bgColor={colors.ivoryYellow} borderColor={colors.themePrimary} borderWidth={1} flex={1} h={moderateScale(75)} gap={moderateScaleVertical(8)} alignItems="center" justifyContent="center" borderRadius={moderateScale(8)}>
              <Image alt="icon" source={Icons.mph} w={moderateScale(24)} h={moderateScale(24)} resizeMode="contain" />


              <Box alignItems="center" gap={moderateScaleVertical(3)}>
                <Text fontFamily={'$poppinsMedium'} fontSize={10} lineHeight={12} color={colors.dimGray} numberOfLines={1}>0-60mph</Text>
                <Text fontFamily={'$poppinsRegular'} fontSize={8} lineHeight={10} color={colors.dimGray} numberOfLines={1}>{vehicleDetail?.zeroToSixtySpeedTime}</Text>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Feature Box */}
        <Box mx={moderateScale(15)} gap={moderateScaleVertical(20)} >
          <Text fontFamily={'$poppinsMedium'} fontSize={18} lineHeight={20} color={isDarkMode ? colors.white : colors.dimGray} numberOfLines={1}>Car features</Text>

          <Box gap={moderateScaleVertical(15)}>
            <Box flexDirection="row" alignItems="center" justifyContent="space-between" bgColor={colors.ivoryYellow} borderColor={colors.themePrimary} borderWidth={1} flex={1} h={moderateScale(45)} borderRadius={moderateScale(8)} px={moderateScale(15)}  >
              <Text fontFamily={'$poppinsMedium'} fontSize={14} lineHeight={16} color={colors.dimGray} numberOfLines={1}>Fuel Type</Text>
              <Text fontFamily={'$poppinsMedium'} fontSize={14} lineHeight={16} color={colors.dimGray} numberOfLines={1}>{vehicleDetail?.fuelType}</Text>
            </Box>

            <Box flexDirection="row" alignItems="center" justifyContent="space-between" bgColor={colors.ivoryYellow} borderColor={colors.themePrimary} borderWidth={1} flex={1} h={moderateScale(45)} borderRadius={moderateScale(8)} px={moderateScale(15)}  >
              <Text fontFamily={'$poppinsMedium'} fontSize={14} lineHeight={16} color={colors.dimGray} numberOfLines={1}>Seating Capacity</Text>
              <Text fontFamily={'$poppinsMedium'} fontSize={14} lineHeight={16} color={colors.dimGray} numberOfLines={1}>{vehicleDetail?.seatingCapacity}</Text>
            </Box>

            <Box flexDirection="row" alignItems="center" justifyContent="space-between" bgColor={colors.ivoryYellow} borderColor={colors.themePrimary} borderWidth={1} flex={1} h={moderateScale(45)} borderRadius={moderateScale(8)} px={moderateScale(15)}  >
              <Text fontFamily={'$poppinsMedium'} fontSize={14} lineHeight={16} color={colors.dimGray} numberOfLines={1}>luggage Capacity</Text>
              <Text fontFamily={'$poppinsMedium'} fontSize={14} lineHeight={16} color={colors.dimGray} numberOfLines={1}>{vehicleDetail?.luggageCapacity}</Text>
            </Box>

            <Box flexDirection="row" alignItems="center" justifyContent="space-between" bgColor={colors.ivoryYellow} borderColor={colors.themePrimary} borderWidth={1} flex={1} h={moderateScale(45)} borderRadius={moderateScale(8)} px={moderateScale(15)}  >
              <Text fontFamily={'$poppinsMedium'} fontSize={14} lineHeight={16} color={colors.dimGray} numberOfLines={1}>Transmission Type</Text>
              <Text fontFamily={'$poppinsMedium'} fontSize={14} lineHeight={16} color={colors.dimGray} numberOfLines={1}>{vehicleDetail?.transmissionType}</Text>
            </Box>
            <Box flexDirection="row" alignItems="center" justifyContent="space-between" bgColor={colors.ivoryYellow} borderColor={colors.themePrimary} borderWidth={1} flex={1} h={moderateScale(45)} borderRadius={moderateScale(8)} px={moderateScale(15)}  >
              <Text fontFamily={'$poppinsMedium'} fontSize={14} lineHeight={16} color={colors.dimGray} numberOfLines={1}>Vehicle No</Text>
              <Text fontFamily={'$poppinsMedium'} fontSize={14} lineHeight={16} color={colors.dimGray} numberOfLines={1}>{vehicleDetail?.vehicleNo}</Text>
            </Box>
          </Box>
        </Box>

        <Box flexDirection="row" alignItems="center" gap={moderateScale(15)} mx={moderateScale(15)} my={moderateScaleVertical(25)}>
          <PrimaryButton buttonText="Book later" flex={1} borderWidth={1} textColor={colors.themePrimary} borderColor={colors.themePrimary} backgroundColor={'transparent'} />
          <PrimaryButton buttonText="Ride now" onPress={() => navigation.navigate(NavigationString.ConfirmBooking, { vehicle })} flex={1} />
        </Box>
      </Body>
        )
      }
    </Container>
  );
};

export default VehicleDetail;
