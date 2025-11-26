import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Dimensions, Platform, Modal,Image, TouchableOpacity } from 'react-native';
import { Container } from '../components/Container';
import { colors } from '../constants/colors';
import MapView, { Marker, AnimatedRegion, PROVIDER_DEFAULT, PROVIDER_GOOGLE } from 'react-native-maps';
import { deviceHeight, deviceWidth, GOOGLE_API_KEY } from '../constants/contants';
import { moderateScale, moderateScaleVertical, scale, verticalScale } from '../utils/responsiveSize';
import Icons from '../assets/Icons';
import { Box, CloseIcon, Pressable, Text } from '@gluestack-ui/themed';
import { LocationMakerRedIcon, LocationTargetIcon, ReviewStarIcon } from '../components/Icons';
import PrimaryButton from '../components/Button/PrimaryButton';
import { NavigationString } from '../navigation/navigationStrings';
import { useTheme } from '../constants/ThemeContext';
import { ParamListBase, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

const screen = Dimensions.get('window');
const ASPECT_RATIO = screen.width / screen.height;
const LATITUDE_DELTA = 0.05;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

interface Location {
  latitude: number;
  longitude: number;
  address?: string;
}

interface State {
  curLoc: Location;
  destinationCords: Location;
  isLoading: boolean;
  coordinate: AnimatedRegion;
  distance?: number;
  routeDuration?: string;
}

const ConfrimRide = () => {
  const navigation = useNavigation<NativeStackNavigationProp<ParamListBase>>();
  const { isDarkMode } = useTheme();

  const [curLoc, setCurLoc] = useState({
    latitude: 26.263882,
    longitude: 78.130791,
    address: '',
  });

  const [destinationCords, setDestinationCords] = useState({
    latitude: 0,
    longitude: 0,
  });

  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [state, setState] = useState<State>({
    curLoc: {
      latitude: 26.263882,
      longitude: 78.130791,
      address: '',
    },
    destinationCords: {
      latitude: 0,
      longitude: 0,
    },
    isLoading: false,
    coordinate: new AnimatedRegion({
      latitude: 26.263882,
      longitude: 78.130791,
      latitudeDelta: LATITUDE_DELTA,
      longitudeDelta: LONGITUDE_DELTA,
    }),
    distance: 0,
  });

  const [showLocationRoute, setShowLocationRoute] = useState(false);
  const [coordinate, setCoordinate] = useState(
    new AnimatedRegion({
      latitude: curLoc.latitude,
      longitude: curLoc.longitude,
      latitudeDelta: LATITUDE_DELTA,
      longitudeDelta: LONGITUDE_DELTA,
    })
  );
  const [modalVisible, setModalVisible] = useState(true); 

  const onCenter = () => {
    if (mapRef.current) {
      mapRef.current?.animateToRegion({
        latitude: state.curLoc.latitude,
        longitude: state.curLoc.longitude,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      });
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  const handleCloseModal = () => {
    setModalVisible(false);
  };

  return (
    <Container statusBarStyle={isDarkMode ? 'light-content' : 'dark-content'} statusBarBackgroundColor={isDarkMode ? '#000000' : '#ffffff'} backgroundColor={isDarkMode ? '#000000' : '#ffffff'}>
      <MapView
        style={{ flex: 1 }}
        ref={mapRef}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
        initialRegion={{
          ...curLoc,
          latitudeDelta: LATITUDE_DELTA,
          longitudeDelta: LONGITUDE_DELTA,
        }}
        showsUserLocation={false}
        showsMyLocationButton={false}
      >
        <Marker.Animated ref={markerRef} coordinate={coordinate} image={Icons.locationYellowMarker} />
        {destinationCords.latitude !== 0 && (
          <Marker coordinate={destinationCords} image={Icons.locationYellowMarker} />
        )}
      </MapView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible} 
        onRequestClose={handleCloseModal} 
      >
        <Box flex={1} justifyContent='flex-end' backgroundColor='rgba(0, 0, 0, 0.2)'>
          <Box style={[styles.modalContent,{ backgroundColor:isDarkMode ? colors.black : colors.white,}]}>
            <Box borderBottomWidth={0.5}>
              <Box flexDirection="row" alignItems="center" justifyContent='space-between' padding={scale(16)}>
                <Text fontFamily={'$poppinsRegular'} fontSize={15} lineHeight={20} color={isDarkMode ? colors.white : colors.charcoalGray} numberOfLines={1}>
                  Your driver is coming in 12:00
                </Text>
                <Pressable onPress={handleCloseModal}>
                  <CloseIcon />
                </Pressable>
              </Box>
            </Box>
            <Box borderBottomWidth={0.9} paddingBottom={verticalScale(15)}>
     <Box flexDirection="row" alignItems="center" justifyContent="space-between" marginHorizontal={scale(15)} mt={moderateScale(10)}>
     <Image 
      source={{uri:'https://cdn.pixabay.com/photo/2022/09/13/05/34/boy-handsome-pose-ideas-7450990_640.jpg'}}  
      style={{height: scale(80), width: scale(80), borderRadius: moderateScale(8), marginRight: moderateScale(10)}}/>
    <Box flex={1}>
    <Text fontFamily={'$poppinsSemiBold'} fontSize={15} lineHeight={20} color={isDarkMode ? colors.white : colors.charcoalGray}>
      Sergio Ramasis
    </Text>
     <Box flexDirection='row' alignItems='center' marginTop={moderateScale(5)}>
      <LocationMakerRedIcon />
      <Text marginLeft={moderateScale(5)} color={isDarkMode ? colors.white : colors.charcoalGray}>800M (Junagadh)</Text>
      </Box>
       <Box flexDirection='row' alignItems='center' marginTop={moderateScale(5)}>
        <Box marginLeft={moderateScale(3)}>
          <ReviewStarIcon />
        </Box>
      <Text marginLeft={moderateScale(8)} color={isDarkMode ? colors.white : colors.charcoalGray}>4.9 (Review)</Text>
    </Box>
  </Box>
  </Box>
  </Box>
  <Box mt={scale(10)} flexDirection='row' justifyContent='space-between' marginHorizontal={scale(15)}>
    <Text fontFamily={'$poppinsRegular'} fontSize={18} lineHeight={30}color={isDarkMode ? colors.white : colors.charcoalGray}>
      Payment Method    
    </Text>
    <Text fontFamily={'$poppinsMedium'} fontSize={25} lineHeight={30} color={isDarkMode ? colors.white : colors.charcoalGray}>
    {'\u20B9'}2000
    </Text>
  </Box>
  <Box flexDirection='row' marginHorizontal={scale(5)} mt={moderateScale(20)}>
  <TouchableOpacity  onPress={() => navigation.navigate(NavigationString.CallScreen)}  >
    <Box
      borderRadius={moderateScale(100)}
      padding={scale(10)}
      justifyContent='center'
      alignItems='center'
      marginLeft={moderateScale(10)}
      borderWidth={scale(1)}
      borderColor={colors.yellow}>
      <Image
        source={Icons.Call}
        style={{ tintColor: colors.yellow, height: scale(25), width: scale(25) }}
      />
    </Box>
  </TouchableOpacity>

  <TouchableOpacity onPress={() => navigation.navigate(NavigationString.ChatScreen)} >
    <Box
      borderRadius={moderateScale(100)}
      padding={scale(10)}
      justifyContent='center'
      alignItems='center'
      marginLeft={moderateScale(10)}
      borderWidth={scale(1)}
      borderColor={colors.yellow}>
      <Image
        source={Icons.Message}
        style={{ tintColor: colors.yellow, height: scale(25), width: scale(25) }}
      />
    </Box>
  </TouchableOpacity>

  <TouchableOpacity>
    <Box
      borderRadius={moderateScale(5)}
      padding={scale(10)}
      justifyContent='flex-end'
      alignItems='center'
      marginLeft={moderateScale(10)}
      backgroundColor={colors.yellow}
      ml={moderateScale(150)}> 
      <Text style={{ color: colors.white, fontSize: scale(15) }}>Cancel Ride</Text>
    </Box>
  </TouchableOpacity>
</Box>

  </Box>
  </Box>
      </Modal>
      <Pressable onPress={() => { onCenter(); }} position="absolute" bottom={0} mb={moderateScaleVertical(175)} right={0} mr={moderateScale(15)}>
        <LocationTargetIcon />
      </Pressable>
    </Container>
  );
};

const styles = StyleSheet.create({
  modalContent: {
    width: '100%',
    paddingBottom: scale(20),
    borderTopLeftRadius: moderateScale(20),
    borderTopRightRadius: moderateScale(20),
  },
  
 
});

export default ConfrimRide;
