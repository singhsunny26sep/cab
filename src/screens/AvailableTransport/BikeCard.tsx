// import React, { useEffect, useState } from 'react';
// import { FlatList } from 'react-native';
// import { Box, Image, Text } from '@gluestack-ui/themed';
// import { ParamListBase, useNavigation } from '@react-navigation/native';
// import { NativeStackNavigationProp } from '@react-navigation/native-stack';
// import axios from 'axios';

// import { Container } from '../components/Container';
// import { AppBar } from '../components/AppBar';   
// import { colors } from '../constants/colors';
// import { moderateScale, moderateScaleVertical } from '../utils/responsiveSize';
// import { MapMarkerBlackIcon } from '../components/Icons';
// import images from '../assets/images';
// import PrimaryButton from '../components/Button/PrimaryButton';
// import { NavigationString } from '../navigation/navigationStrings';
// import { Instance } from '../api/Instance';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { GET_CARS } from '../api/ApiEndpoints';

// const CarCardDetail = ({ item }: { item: any }) => {
//   const navigation = useNavigation<NativeStackNavigationProp<ParamListBase>>();

//   return (
//     <Box
//       h={moderateScale(160)}
//       bgColor={colors.ivoryYellow}
//       borderWidth={1}
//       borderColor={colors.themePrimary}
//       borderRadius={moderateScale(10)}
//       px={moderateScale(10)}
//       py={moderateScaleVertical(10)}
//       gap={moderateScaleVertical(25)}
//     >
//       <Box flexDirection="row" alignItems="center">
//         <Box flex={2} gap={moderateScale(3)}>
//           <Text
//             fontFamily={'$poppinsMedium'}
//             fontSize={16}
//             lineHeight={18}
//             color={colors.charcoalGray}
//             numberOfLines={1}
//           >
//             {item.manufacturer} {item.model}
//           </Text>
//           <Text
//             fontFamily={'$poppinsMedium'}
//             fontSize={12}
//             lineHeight={23}
//             color={colors.silverGray}
//             numberOfLines={1}
//           >
//             {item.transmissionType} | {item.fuelType} | {item.carNo}
//           </Text>

//           <Box flexDirection="row" alignItems="center">
//             <MapMarkerBlackIcon />
//             <Text
//               fontFamily={'$poppinsMedium'}
//               fontSize={12}
//               lineHeight={14}
//               color={colors.charcoalGray}
//               numberOfLines={1}
//             >
//               800m (5mins away)
//             </Text>
//           </Box>
//         </Box>

//         <Box flex={1} alignItems="center" justifyContent="center">
//           <Image
//             alt="car"
//             source={{ uri: item.imgUrl }} 
//             w={moderateScale(100)}
//             h={moderateScale(59)}
//             resizeMode="contain"
//             borderRadius={moderateScaleVertical(8)}
//           />
//         </Box>
//       </Box>

//       <Box flexDirection="row" alignItems="center" gap={moderateScale(10)}>
//         <PrimaryButton
//           buttonText="Book later"
//           flex={1}
//           borderWidth={1}
//           textColor={colors.themePrimary}
//           borderColor={colors.themePrimary}
//           backgroundColor={'transparent'}
//         />
//         <PrimaryButton
//           buttonText="Ride now"
//           onPress={() => navigation.navigate(NavigationString.VehicleDetail, { car: item })}
//           flex={1}
//         />
//       </Box>
//     </Box>
//   );
// };

// const AvailableTransport = () => {
//   const [cars, setCars] = useState<any[]>([]);
//   const [loading, setLoading] = useState<boolean>(false);
//   const [error, setError] = useState<string>('');

//   const navigation = useNavigation<NativeStackNavigationProp<ParamListBase>>();

//   useEffect(() => {
//     const fetchCars = async () => {
//       setLoading(true);
//       setError('');

//       try {
//         const token =AsyncStorage.getItem("userToken")
//         const response = await Instance.get(GET_CARS.url, {
//           headers: {
//             Authorization:token,
//           },
//         });

//         if (response.data.success) {
//           setCars(response.data.data);
//         } else {
//           setError('Failed to load cars.');
//         }
//       } catch (err) {
//         setError('An error occurred while fetching the cars.');
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchCars();
//   }, []);

//   return (
//     <Container statusBarStyle="dark-content" statusBarBackgroundColor={colors.white}>
//       <AppBar back />

//       <Box mx={moderateScale(20)} mt={moderateScaleVertical(25)} mb={moderateScaleVertical(15)}>
//         <Text
//           fontFamily={'$poppinsSemiBold'}
//           fontSize={24}
//           lineHeight={26}
//           color={colors.charcoalGray}
//           numberOfLines={1}
//         >
//           Available cars for ride
//         </Text>
//         <Text
//           fontFamily={'$poppinsMedium'}
//           fontSize={14}
//           lineHeight={16}
//           color={colors.silverGray}
//           numberOfLines={1}
//         >
//           {loading ? 'Loading cars...' : `${cars.length} cars found`}
//         </Text>
//       </Box>

//       {error && (
//         <Box mx={moderateScale(20)} mb={moderateScaleVertical(15)}>
//           <Text color={colors.red}>{error}</Text>
//         </Box>
//       )}

//       <FlatList
//         data={cars}
//         renderItem={({ item }) => <CarCardDetail item={item} />}
//         keyExtractor={(item) => item._id.toString()}
//         showsVerticalScrollIndicator={false}
//         style={{}}
//         contentContainerStyle={{
//           marginHorizontal: moderateScale(15),
//           gap: moderateScaleVertical(15),
//           paddingBottom: moderateScaleVertical(15),
//         }}
//       />
//     </Container>
//   );
// };

// export default AvailableTransport;
import { FlatList } from 'react-native'
import { Box, Image, Text } from '@gluestack-ui/themed'
import { useState } from 'react';
import { ParamListBase, useNavigation ,useRoute} from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Container } from '../components/Container'
import { AppBar } from '../components/AppBar'
import { colors } from '../constants/colors'
import { moderateScale, moderateScaleVertical } from '../utils/responsiveSize'
import { MapMarkerBlackIcon } from '../components/Icons'
import images from '../assets/images'
import PrimaryButton from '../components/Button/PrimaryButton'
import { NavigationString } from '../navigation/navigationStrings';

const BikeCardDetails = ({ item, index }: { item: string, index: number }) => {
  // init 
  const navigation = useNavigation<NativeStackNavigationProp<ParamListBase>>();
  const route = useRoute();
  const { transportType } = route.params;

  return (
    <Box h={moderateScale(160)} bgColor={colors.ivoryYellow} borderWidth={1} borderColor={colors.themePrimary} borderRadius={moderateScale(10)} px={moderateScale(10)} py={moderateScaleVertical(10)} gap={moderateScaleVertical(25)}>
      <Box flexDirection='row' alignItems='center'>
        <Box flex={2} gap={moderateScale(3)}>
          <Text fontFamily={'$poppinsMedium'} fontSize={16} lineHeight={18} color={colors.charcoalGray} numberOfLines={1}>BMW Cabrio </Text>
          <Text fontFamily={'$poppinsMedium'} fontSize={12} lineHeight={14} color={colors.silverGray} numberOfLines={1}>Automatic   |   3 seats   |   Octane</Text>

          <Box flexDirection='row' alignItems='center'>
            <MapMarkerBlackIcon />
            <Text fontFamily={'$poppinsMedium'} fontSize={12} lineHeight={14} color={colors.charcoalGray} numberOfLines={1}>800m (5mins away)</Text>
          </Box>
        </Box>

        <Box flex={1} alignItems='center' justifyContent='center'>
          <Image alt='icon' source={images.availableCar} w={moderateScale(100)} h={moderateScale(59)} resizeMode='contain' />
        </Box>
      </Box>

      <Box flexDirection='row' alignItems='center' gap={moderateScale(10)}>
        <PrimaryButton buttonText='Book later' flex={1} borderWidth={1} textColor={colors.themePrimary} borderColor={colors.themePrimary} backgroundColor={'transparent'} />
        <PrimaryButton buttonText='Ride now' onPress={() => navigation.navigate(NavigationString.VehicleDetail)} flex={1} />
      </Box>
    </Box>
  )
}

const BikeCard = () => {
  // init 
  const navigation = useNavigation<NativeStackNavigationProp<ParamListBase>>();
  const [transportData, setTransportData] = useState([]);
  const [loading, setLoading] = useState(true);

  return (
    <Container statusBarStyle='dark-content' statusBarBackgroundColor={colors.white}>
      <AppBar back />

      <Box mx={moderateScale(20)} mt={moderateScaleVertical(25)} mb={moderateScaleVertical(15)}>
        <Text fontFamily={'$poppinsSemiBold'} fontSize={24} lineHeight={26} color={colors.charcoalGray} numberOfLines={1}>Available cars for ride</Text>
        <Text fontFamily={'$poppinsMedium'} fontSize={14} lineHeight={16} color={colors.silverGray} numberOfLines={1}>18 cars found</Text>
      </Box>

      <FlatList
        data={['01', '02', '03', '04', '05', '06', '07']}
        renderItem={({ item, index }: { item: string, index: number }) => <BikeCardDetails item={item} index={index} />}
        keyExtractor={(item) => item?.toString()}
        showsVerticalScrollIndicator={false}
        style={{}}
        contentContainerStyle={{ marginHorizontal: moderateScale(15), gap: moderateScaleVertical(15), paddingBottom: moderateScaleVertical(15) }}
      />
    </Container>
  )
}

export default BikeCard