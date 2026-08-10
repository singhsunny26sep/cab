import {Text, Box, Pressable, Image} from '@gluestack-ui/themed';
import {
  responsiveHeight,
  responsiveWidth,
} from 'react-native-responsive-dimensions';
import Carousel from 'pinar';
import {ParamListBase, useNavigation, useRoute} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';

import {Container} from '../components/Container';
import {AppBar} from '../components/AppBar';
import {colors} from '../constants/colors';
import Body from '../components/Body/Body';
import {moderateScale, moderateScaleVertical} from '../utils/responsiveSize';
import {
  PowerIcon,
  ReviewStarIcon,
  SilderNextIcon,
  SliderPrevIcon,
} from '../components/Icons';
import images from '../assets/images';
import Icons from '../assets/Icons';
import PrimaryButton from '../components/Button/PrimaryButton';
import {NavigationString} from '../navigation/navigationStrings';
import {useTheme} from '../constants/ThemeContext';
import {BASE_URL, Instance} from '../api/Instance.ts';
import {useCallback, useEffect, useState, useMemo} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  GET_BIKE_DETAILS,
  GET_CAR_DETAILS,
  GET_CYCLE_DETAILS,
  GET_TAXI_DETAILS,
} from '../api/ApiEndpoints';
import {ActivityIndicator, View} from 'react-native';

const VehicleDetail = ({route}: any) => {
  const navigation = useNavigation<NativeStackNavigationProp<ParamListBase>>();
  const {vehicle} = route.params;
  const {isDarkMode} = useTheme();

  const [loading, setLoading] = useState<boolean>(false);
  const [vehicleDetail, setVehicleDetail] = useState<any>(null);

  const carouselStyle = useMemo(
    () => ({
      width: '100%' as const,
      height: '100%' as const,
      alignSelf: 'center' as const,
    }),
    [],
  );

  const activeDotStyle = useMemo(
    () => ({
      width: responsiveWidth(3),
      height: responsiveHeight(1.5),
      backgroundColor: colors.themePrimary,
      borderRadius: responsiveHeight(1),
    }),
    [],
  );

  const dotStyle = useMemo(
    () => ({
      width: responsiveWidth(3),
      height: responsiveHeight(1.5),
      backgroundColor: colors.gray6,
      borderRadius: responsiveHeight(1),
    }),
    [],
  );

  const dotsContainerStyle = useMemo(
    () => ({
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: responsiveWidth(1.5),
      alignSelf: 'center' as const,
      marginTop: responsiveHeight(-1.5),
    }),
    [],
  );

  const controlsButtonStyle = useMemo(
    () => ({
      marginRight: moderateScale(-20),
      marginLeft: moderateScale(-20),
    }),
    [],
  );

  const renderNext = useCallback(({scrollToNext}: {scrollToNext: () => void}) => {
    return (
      <Pressable onPress={scrollToNext}>
        <SilderNextIcon />
      </Pressable>
    );
  }, []);

  const renderPrev = useCallback(({scrollToPrev}: {scrollToPrev: () => void}) => {
    return (
      <Pressable onPress={scrollToPrev}>
        <SliderPrevIcon />
      </Pressable>
    );
  }, []);

  const handleBookNow = useCallback(() => {
    navigation.navigate(NavigationString.ConfirmBooking, {vehicle});
  }, [navigation, vehicle]);

  const carouselImages = useMemo(
    () =>
      vehicleDetail?.imagesList?.map((img: string) => (
        <Image
          alt="SilderIcon"
          source={{uri: img}}
          key={img}
          w={'80%'}
          h={'90%'}
          resizeMode="contain"
          alignSelf="center"
          borderRadius={10}
          style={{resizeMode: 'contain'}}
        />
      )) || [],
    [vehicleDetail?.imagesList],
  );

  const fetchVehicleDetails = useCallback(async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        return;
      }

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
          return;
      }
      const newUrl = `${url}?lat=${23.399855}&lng=${85.343489}`;
      const response = await Instance.get(newUrl, {
        headers: {
          Authorization: token,
        },
      });
      if (response.data.success && response.status === 200) {
        const vehicleDetails =
          vehicle.type === 'Car' ? response.data.data.car : response.data.data;
        setVehicleDetail(vehicleDetails);
      }
    } catch (err) {
      console.log('error gott -> ', err);
    } finally {
      setLoading(false);
    }
  }, [vehicle._id, vehicle.type]);

  useEffect(() => {
    fetchVehicleDetails();
  }, [fetchVehicleDetails]);

  return (
    <Container
      statusBarStyle={isDarkMode ? 'light-content' : 'dark-content'}
      statusBarBackgroundColor={isDarkMode ? '#000000' : '#ffffff'}
      backgroundColor={isDarkMode ? '#000000' : '#ffffff'}>
      <AppBar back isDarkMode={isDarkMode} />
      {loading ? (
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
          <ActivityIndicator size="large" color="#00ff00" />
        </View>
      ) : (
        <Body>
          <Box
            mx={moderateScale(15)}
            mt={moderateScaleVertical(25)}
            mb={moderateScaleVertical(15)}
            gap={moderateScaleVertical(4)}>
            <Text
              fontFamily={'$poppinsSemiBold'}
              fontSize={24}
              lineHeight={26}
              color={isDarkMode ? colors.white : colors.charcoalGray}
              numberOfLines={1}>
              {vehicleDetail?.manufacturer} {vehicleDetail?.model}
            </Text>
            <Box
              flexDirection="row"
              alignItems="center"
              gap={moderateScale(10)}>
              <ReviewStarIcon />
              <Text
                fontFamily={'$poppinsMedium'}
                fontSize={14}
                lineHeight={18}
                color={isDarkMode ? colors.white : colors.silverGray}
                numberOfLines={1}>
                4.9 (531 reviews)
              </Text>
            </Box>
          </Box>

          <Box
            h={moderateScale(170)}
            w={'93%'}
            borderRadius={10}
            overflow="hidden"
            my={moderateScaleVertical(20)}
            alignSelf="center">
            <Carousel
              style={carouselStyle}
              showsControls={true}
              loop={true}
              autoplay={false}
              showsDots={false}
              autoplayInterval={1500}
              activeDotStyle={activeDotStyle}
              dotStyle={dotStyle}
              dotsContainerStyle={dotsContainerStyle}
              contentContainerStyle={{}}
              controlsButtonStyle={controlsButtonStyle}
              renderNext={renderNext}
              renderPrev={renderPrev}>
              {carouselImages}
            </Carousel>
          </Box>

          {/* Specification box */}
          <Box
            mx={moderateScale(15)}
            gap={moderateScaleVertical(20)}
            mb={moderateScaleVertical(25)}>
            <Text
              fontFamily={'$poppinsMedium'}
              fontSize={18}
              lineHeight={20}
              color={isDarkMode ? colors.white : colors.dimGray}
              numberOfLines={1}>
              Specifications
            </Text>

            <Box
              flexDirection="row"
              alignItems="center"
              gap={moderateScale(15)}>
              <Box
                bgColor={colors.ivoryYellow}
                borderColor={colors.themePrimary}
                borderWidth={1}
                flex={1}
                h={moderateScale(75)}
                gap={moderateScaleVertical(8)}
                alignItems="center"
                justifyContent="center"
                borderRadius={moderateScale(8)}>
                <PowerIcon />

                <Box alignItems="center" gap={moderateScaleVertical(3)}>
                  <Text
                    fontFamily={'$poppinsMedium'}
                    fontSize={10}
                    lineHeight={12}
                    color={colors.dimGray}
                    numberOfLines={1}>
                    Max. power
                  </Text>
                  <Text
                    fontFamily={'$poppinsRegular'}
                    fontSize={8}
                    lineHeight={10}
                    color={colors.dimGray}
                    numberOfLines={1}>
                    {vehicleDetail?.maxpower}
                  </Text>
                </Box>
              </Box>

              <Box
                bgColor={colors.ivoryYellow}
                borderColor={colors.themePrimary}
                borderWidth={1}
                flex={1}
                h={moderateScale(75)}
                gap={moderateScaleVertical(8)}
                alignItems="center"
                justifyContent="center"
                borderRadius={moderateScale(8)}>
                <Image
                  alt="icon"
                  source={Icons.Fual}
                  w={moderateScale(24)}
                  h={moderateScale(24)}
                  resizeMode="contain"
                />

                <Box alignItems="center" gap={moderateScaleVertical(3)}>
                  <Text
                    fontFamily={'$poppinsMedium'}
                    fontSize={10}
                    lineHeight={12}
                    color={colors.dimGray}
                    numberOfLines={1}>
                    Fuel
                  </Text>
                  <Text
                    fontFamily={'$poppinsRegular'}
                    fontSize={8}
                    lineHeight={10}
                    color={colors.dimGray}
                    numberOfLines={1}>
                    {vehicleDetail?.fuelCostAverage}km per litre
                  </Text>
                </Box>
              </Box>

              <Box
                bgColor={colors.ivoryYellow}
                borderColor={colors.themePrimary}
                borderWidth={1}
                flex={1}
                h={moderateScale(75)}
                gap={moderateScaleVertical(8)}
                alignItems="center"
                justifyContent="center"
                borderRadius={moderateScale(8)}>
                <Image
                  alt="icon"
                  source={Icons.Speed}
                  w={moderateScale(24)}
                  h={moderateScale(24)}
                  resizeMode="contain"
                />

                <Box alignItems="center" gap={moderateScaleVertical(3)}>
                  <Text
                    fontFamily={'$poppinsMedium'}
                    fontSize={10}
                    lineHeight={12}
                    color={colors.dimGray}
                    numberOfLines={1}>
                    Max. speed
                  </Text>
                  <Text
                    fontFamily={'$poppinsRegular'}
                    fontSize={8}
                    lineHeight={10}
                    color={colors.dimGray}
                    numberOfLines={1}>
                    {vehicleDetail?.maxSpeed}
                  </Text>
                </Box>
              </Box>

              <Box
                bgColor={colors.ivoryYellow}
                borderColor={colors.themePrimary}
                borderWidth={1}
                flex={1}
                h={moderateScale(75)}
                gap={moderateScaleVertical(8)}
                alignItems="center"
                justifyContent="center"
                borderRadius={moderateScale(8)}>
                <Image
                  alt="icon"
                  source={Icons.mph}
                  w={moderateScale(24)}
                  h={moderateScale(24)}
                  resizeMode="contain"
                />

                <Box alignItems="center" gap={moderateScaleVertical(3)}>
                  <Text
                    fontFamily={'$poppinsMedium'}
                    fontSize={10}
                    lineHeight={12}
                    color={colors.dimGray}
                    numberOfLines={1}>
                    0-60mph
                  </Text>
                  <Text
                    fontFamily={'$poppinsRegular'}
                    fontSize={8}
                    lineHeight={10}
                    color={colors.dimGray}
                    numberOfLines={1}>
                    {vehicleDetail?.zeroToSixtySpeedTime}
                  </Text>
                </Box>
              </Box>
            </Box>
          </Box>

          {/* Feature Box */}
          <Box mx={moderateScale(15)} gap={moderateScaleVertical(20)}>
            <Text
              fontFamily={'$poppinsMedium'}
              fontSize={18}
              lineHeight={20}
              color={isDarkMode ? colors.white : colors.dimGray}
              numberOfLines={1}>
              Car features
            </Text>

            <Box gap={moderateScaleVertical(15)}>
              <Box
                flexDirection="row"
                alignItems="center"
                justifyContent="space-between"
                bgColor={colors.ivoryYellow}
                borderColor={colors.themePrimary}
                borderWidth={1}
                flex={1}
                h={moderateScale(45)}
                borderRadius={moderateScale(8)}
                px={moderateScale(15)}>
                <Text
                  fontFamily={'$poppinsMedium'}
                  fontSize={14}
                  lineHeight={16}
                  color={colors.dimGray}
                  numberOfLines={1}>
                  Fuel Type
                </Text>
                <Text
                  fontFamily={'$poppinsMedium'}
                  fontSize={14}
                  lineHeight={16}
                  color={colors.dimGray}
                  numberOfLines={1}>
                  {vehicleDetail?.fuelType}
                </Text>
              </Box>

              <Box
                flexDirection="row"
                alignItems="center"
                justifyContent="space-between"
                bgColor={colors.ivoryYellow}
                borderColor={colors.themePrimary}
                borderWidth={1}
                flex={1}
                h={moderateScale(45)}
                borderRadius={moderateScale(8)}
                px={moderateScale(15)}>
                <Text
                  fontFamily={'$poppinsMedium'}
                  fontSize={14}
                  lineHeight={16}
                  color={colors.dimGray}
                  numberOfLines={1}>
                  Seating Capacity
                </Text>
                <Text
                  fontFamily={'$poppinsMedium'}
                  fontSize={14}
                  lineHeight={16}
                  color={colors.dimGray}
                  numberOfLines={1}>
                  {vehicleDetail?.seatingCapacity}
                </Text>
              </Box>

              <Box
                flexDirection="row"
                alignItems="center"
                justifyContent="space-between"
                bgColor={colors.ivoryYellow}
                borderColor={colors.themePrimary}
                borderWidth={1}
                flex={1}
                h={moderateScale(45)}
                borderRadius={moderateScale(8)}
                px={moderateScale(15)}>
                <Text
                  fontFamily={'$poppinsMedium'}
                  fontSize={14}
                  lineHeight={16}
                  color={colors.dimGray}
                  numberOfLines={1}>
                  luggage Capacity
                </Text>
                <Text
                  fontFamily={'$poppinsMedium'}
                  fontSize={14}
                  lineHeight={16}
                  color={colors.dimGray}
                  numberOfLines={1}>
                  {vehicleDetail?.luggageCapacity}
                </Text>
              </Box>

              <Box
                flexDirection="row"
                alignItems="center"
                justifyContent="space-between"
                bgColor={colors.ivoryYellow}
                borderColor={colors.themePrimary}
                borderWidth={1}
                flex={1}
                h={moderateScale(45)}
                borderRadius={moderateScale(8)}
                px={moderateScale(15)}>
                <Text
                  fontFamily={'$poppinsMedium'}
                  fontSize={14}
                  lineHeight={16}
                  color={colors.dimGray}
                  numberOfLines={1}>
                  Transmission Type
                </Text>
                <Text
                  fontFamily={'$poppinsMedium'}
                  fontSize={14}
                  lineHeight={16}
                  color={colors.dimGray}
                  numberOfLines={1}>
                  {vehicleDetail?.transmissionType}
                </Text>
              </Box>
              <Box
                flexDirection="row"
                alignItems="center"
                justifyContent="space-between"
                bgColor={colors.ivoryYellow}
                borderColor={colors.themePrimary}
                borderWidth={1}
                flex={1}
                h={moderateScale(45)}
                borderRadius={moderateScale(8)}
                px={moderateScale(15)}>
                <Text
                  fontFamily={'$poppinsMedium'}
                  fontSize={14}
                  lineHeight={16}
                  color={colors.dimGray}
                  numberOfLines={1}>
                  Vehicle No
                </Text>
                <Text
                  fontFamily={'$poppinsMedium'}
                  fontSize={14}
                  lineHeight={16}
                  color={colors.dimGray}
                  numberOfLines={1}>
                  {vehicleDetail?.vehicleNo}
                </Text>
              </Box>
            </Box>
          </Box>

          <Box
            flexDirection="row"
            alignItems="center"
            gap={moderateScale(15)}
            mx={moderateScale(15)}
            my={moderateScaleVertical(25)}>
            <PrimaryButton
              buttonText="Book later"
              flex={1}
              borderWidth={1}
              textColor={colors.themePrimary}
              borderColor={colors.themePrimary}
              backgroundColor={'transparent'}
            />
            <PrimaryButton
              buttonText="Ride now"
              onPress={handleBookNow}
              flex={1}
            />
          </Box>
        </Body>
      )}
    </Container>
  );
};

export default VehicleDetail;
