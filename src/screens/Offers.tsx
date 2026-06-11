import React, { useRef, useState } from 'react'
import { FlatList, Modal, View, Alert, Platform, Clipboard, Dimensions } from 'react-native'
import { Box, CircleIcon, CloseIcon, Icon, Image, Pressable, Text, GluestackUIProvider } from '@gluestack-ui/themed'
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { ParamListBase, useNavigation } from '@react-navigation/native';
import { Line, Svg } from 'react-native-svg';
import LinearGradient from 'react-native-linear-gradient';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring, 
  withTiming,
  interpolate,
  Extrapolate,
  runOnJS
} from 'react-native-reanimated';

import { Container } from '../components/Container'
import { AppBar } from '../components/AppBar'
import { colors } from '../constants/colors'
import { moderateScale, moderateScaleVertical } from '../utils/responsiveSize'
import Icons from '../assets/Icons'
import { CopyIcon, HamburgerIcon, OfferInfoIcon, ShopingBagIcon } from '../components/Icons'
import { shadowStyle } from '../constants/contants'
import PrimaryButton from '../components/Button/PrimaryButton'
import { useTheme } from '../constants/ThemeContext';

const { width, height } = Dimensions.get('window');

// ----------------------------------------------------------------------
// Premium Animated Offer Card with Gradient & Glow Effect
// ----------------------------------------------------------------------
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const OfferCard = ({ item, index, open }: { item: any, index: number, open: (item: any) => void }) => {
  const { isDarkMode } = useTheme();
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);
  
  // Vibrant gradient palettes based on index
  const gradients = [
    ['#FF6B6B', '#FF8E53'], // Coral
    ['#4FACFE', '#00F2FE'], // Cyan
    ['#FA709A', '#FEE140'], // Pink-Yellow
    ['#667EEA', '#764BA2'], // Purple
    ['#F093FB', '#F5576C'], // Neon Pink
    ['#4FACFE', '#00F2FE'], // Blue
    ['#43E97B', '#38F9D7'], // Green
    ['#FF9A9E', '#FECFEF'], // Soft Pink
  ];
  const gradientColors = gradients[index % gradients.length];
  
  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  
  const animatedGlowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));
  
  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 10, stiffness: 150 });
    glowOpacity.value = withTiming(0.15, { duration: 200 });
  };
  
  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 10, stiffness: 150 });
    glowOpacity.value = withTiming(0, { duration: 300 });
  };
  
  return (
    <AnimatedPressable
      onPress={() => open(item)}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={animatedCardStyle}
    >
      <Box position="relative" mb={moderateScaleVertical(12)}>
        {/* Glow effect behind card */}
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: -4,
              left: -4,
              right: -4,
              bottom: -4,
              borderRadius: moderateScale(28),
              backgroundColor: gradientColors[0],
              filter: 'blur(12px)',
              opacity: 0,
            },
            animatedGlowStyle,
          ]}
        />
        
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: moderateScale(24),
            padding: moderateScale(1.5),
          }}
        >
          <Box
            flexDirection='row'
            alignItems='center'
            height={moderateScale(100)}
            bgColor={isDarkMode ? '#1C1C24' : '#FFFFFF'}
            borderRadius={moderateScale(23)}
            paddingHorizontal={moderateScale(18)}
            gap={moderateScale(14)}
          >
            {/* Icon Container with Gradient Background & Shadow */}
            <LinearGradient
              colors={gradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                width: moderateScale(64),
                height: moderateScale(64),
                borderRadius: moderateScale(22),
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: gradientColors[0],
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.4,
                shadowRadius: 12,
                elevation: 8,
              }}
            >
              <ShopingBagIcon width={32} height={32} color="#FFF" />
            </LinearGradient>
            
            <Box flex={1} gap={moderateScaleVertical(6)}>
              <Text
                fontFamily={'$poppinsBold'}
                fontSize={18}
                lineHeight={22}
                color={isDarkMode ? '#FFFFFF' : '#1A1A2E'}
                numberOfLines={1}
                letterSpacing={-0.3}
              >
                {item.title}
              </Text>
              <Text
                fontFamily={'$poppinsRegular'}
                fontSize={13}
                lineHeight={16}
                color={isDarkMode ? '#A0A0B8' : '#6C6C8A'}
                numberOfLines={1}
              >
                {item.subtitle}
              </Text>
              <Box flexDirection='row' alignItems='center' gap={8} mt={2}>
                <LinearGradient
                  colors={gradientColors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 }}
                >
                  <Text fontSize={10} fontFamily={'$poppinsBold'} color="#FFF">
                    {item.badge || "LIMITED"}
                  </Text>
                </LinearGradient>
                <Text fontSize={11} fontFamily={'$poppinsMedium'} color={colors.themePrimary}>
                  ✨ {item.discount || "Up to 40% off"}
                </Text>
              </Box>
            </Box>
            
            {/* Animated Arrow */}
            <Box opacity={0.7}>
              <Text fontSize={24} color={gradientColors[0]}>→</Text>
            </Box>
          </Box>
        </LinearGradient>
      </Box>
    </AnimatedPressable>
  )
};

// ----------------------------------------------------------------------
// Main Offers Screen - Ultra Modern, Glassmorphic, Aesthetic
// ----------------------------------------------------------------------
const Offers = () => {
  const navigation = useNavigation<DrawerNavigationProp<ParamListBase>>();
  const { isDarkMode } = useTheme();
  const [showInfoDetails, setShowInfoDetails] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<any>(null);
  const modalScale = useSharedValue(0);
  const modalOpacity = useSharedValue(0);
  
  // Premium offers data with rich fields
  const offersData = [
    { id: "1", title: "Flash Sale 40%", subtitle: "Limited time blowout", code: "FLASH40", badge: "HOT", discount: "40% OFF", gradient: ['#FF6B6B', '#FF8E53'] },
    { id: "2", title: "Free Shipping", subtitle: "No minimum order", code: "SHIPFREE", badge: "POPULAR", discount: "₹0 Delivery", gradient: ['#4FACFE', '#00F2FE'] },
    { id: "3", title: "Buy 1 Get 1", subtitle: "On selected styles", code: "BOGO", badge: "BEST DEAL", discount: "BOGO", gradient: ['#FA709A', '#FEE140'] },
    { id: "4", title: "New User Bonus", subtitle: "First purchase extra", code: "WELCOME200", badge: "EXCLUSIVE", discount: "₹200 OFF", gradient: ['#667EEA', '#764BA2'] },
    { id: "5", title: "Weekend Cashback", subtitle: "10% instant back", code: "WEEKEND10", badge: "LIMITED", discount: "10% CB", gradient: ['#43E97B', '#38F9D7'] },
    { id: "6", title: "Student Special", subtitle: "Valid with ID", code: "STUDENT25", badge: "VERIFIED", discount: "25% OFF", gradient: ['#F093FB', '#F5576C'] },
  ];
  
  const openModalWithAnimation = (offer: any) => {
    setSelectedOffer(offer);
    setShowInfoDetails(true);
    modalScale.value = withSpring(1, { damping: 12, stiffness: 100 });
    modalOpacity.value = withTiming(1, { duration: 200 });
  };
  
  const closeModal = () => {
    modalScale.value = withTiming(0, { duration: 200 });
    modalOpacity.value = withTiming(0, { duration: 200 });
    setTimeout(() => setShowInfoDetails(false), 250);
  };
  
  const copyToClipboard = (code: string) => {
    Clipboard.setString(code);
    Alert.alert("✨ Copied!", `Promo code ${code} applied successfully`, [{ text: "Awesome" }]);
  };
  
  const modalBackdropStyle = useAnimatedStyle(() => ({
    opacity: modalOpacity.value,
  }));
  
  const modalContentStyle = useAnimatedStyle(() => ({
    transform: [{ scale: modalScale.value }],
  }));
  
  const renderHeader = () => (
    <Box mb={moderateScaleVertical(24)} px={moderateScale(6)}>
      <Text
        fontFamily={'$poppinsBold'}
        fontSize={34}
        lineHeight={40}
        color={isDarkMode ? '#FFFFFF' : '#1A1A2E'}
        letterSpacing={-0.8}
      >
        Exclusive 🎉
      </Text>
      <Text
        fontFamily={'$poppinsSemiBold'}
        fontSize={34}
        lineHeight={40}
        color={colors.themePrimary}
        letterSpacing={-0.8}
      >
        Offers Just for You
      </Text>
      <Box flexDirection="row" alignItems="center" mt={moderateScaleVertical(8)}>
        <Box bgColor={colors.themePrimary} width={40} height={4} borderRadius={2} />
        <Box bgColor={colors.themePrimary} width={20} height={4} borderRadius={2} ml={2} opacity={0.5} />
      </Box>
    </Box>
  );
  
  return (
    <Container
      statusBarStyle={isDarkMode ? 'light-content' : 'dark-content'}
      statusBarBackgroundColor={isDarkMode ? '#0A0A0F' : '#F8F9FF'}
      backgroundColor={isDarkMode ? '#0A0A0F' : '#F8F9FF'}
    >
      {/* Glassmorphic Header */}
      <Box
        flexDirection='row'
        alignItems='center'
        justifyContent='space-between'
        py={moderateScaleVertical(16)}
        px={moderateScale(20)}
        style={{
          backgroundColor: isDarkMode ? 'rgba(26,26,36,0.8)' : 'rgba(255,255,255,0.9)',
          backdropFilter: 'blur(20px)',
          borderBottomWidth: 0,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 10,
          elevation: 4,
        }}
      >
        <Pressable
          onPress={() => { navigation.openDrawer() }}
          bgColor={isDarkMode ? '#2C2C38' : '#FFFFFF'}
          width={moderateScale(44)}
          height={moderateScale(44)}
          borderRadius={moderateScale(16)}
          alignItems='center'
          justifyContent='center'
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 5,
          }}
        >
          <HamburgerIcon width={22} height={22} />
        </Pressable>
        
        <Box alignItems='center' flex={1}>
          <Text
            fontFamily={'$poppinsSemiBold'}
            fontSize={20}
            lineHeight={24}
            color={isDarkMode ? '#FFFFFF' : '#1A1A2E'}
            letterSpacing={-0.3}
          >
            Special Offers
          </Text>
        </Box>
        <Box width={moderateScale(44)} />
      </Box>
      
      <FlatList
        data={offersData}
        renderItem={({ item, index }) => (
          <OfferCard item={item} index={index} open={openModalWithAnimation} />
        )}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: moderateScale(20),
          paddingBottom: moderateScaleVertical(30),
          paddingTop: moderateScaleVertical(8),
        }}
        ListHeaderComponent={renderHeader}
      />
      
      {/* Premium Modal with Glassmorphism & Spring Animation */}
      <Modal
        animationType="none"
        transparent={true}
        visible={showInfoDetails}
        onRequestClose={closeModal}
      >
        <Animated.View style={[{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' }, modalBackdropStyle]}>
          <Animated.View style={[modalContentStyle, { width: '100%' }]}>
            <LinearGradient
              colors={selectedOffer?.gradient || ['#FF6B6B', '#FF8E53']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                borderTopLeftRadius: moderateScale(40),
                borderTopRightRadius: moderateScale(40),
                padding: moderateScale(2),
              }}
            >
              <Box
                bgColor={isDarkMode ? '#1C1C24' : '#FFFFFF'}
                borderTopLeftRadius={moderateScale(38)}
                borderTopRightRadius={moderateScale(38)}
                paddingBottom={Platform.OS === 'ios' ? moderateScaleVertical(40) : moderateScaleVertical(24)}
              >
                {/* Drag Handle */}
                <Box alignItems='center' py={moderateScaleVertical(12)}>
                  <Box
                    width={moderateScale(50)}
                    height={moderateScale(5)}
                    bgColor={isDarkMode ? '#3A3A44' : '#E0E0E8'}
                    borderRadius={10}
                  />
                </Box>
                
                <Box px={moderateScale(24)}>
                  {/* Premium Badge & Close */}
                  <Box flexDirection='row' justifyContent='space-between' alignItems='center' mb={moderateScaleVertical(8)}>
                    <LinearGradient
                      colors={selectedOffer?.gradient || ['#FF6B6B', '#FF8E53']}
                      style={{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: 30 }}
                    >
                      <Text fontFamily={'$poppinsBold'} fontSize={12} color="#FFF">{selectedOffer?.badge || "HOT OFFER"}</Text>
                    </LinearGradient>
                    <Pressable onPress={closeModal} p={8}>
                      <Icon as={CloseIcon} color={isDarkMode ? '#A0A0B8' : '#8E8E9A'} size={24} />
                    </Pressable>
                  </Box>
                  
                  {/* Main Offer Title */}
                  <Text
                    fontFamily={'$poppinsBold'}
                    fontSize={32}
                    lineHeight={38}
                    color={isDarkMode ? '#FFFFFF' : '#1A1A2E'}
                    mt={moderateScaleVertical(8)}
                  >
                    {selectedOffer?.title}
                  </Text>
                  <Text
                    fontFamily={'$poppinsRegular'}
                    fontSize={16}
                    lineHeight={22}
                    color={isDarkMode ? '#A0A0B8' : '#6C6C8A'}
                    mt={4}
                  >
                    {selectedOffer?.subtitle}
                  </Text>
                  
                  {/* Hero Illustration */}
                  <Box alignItems='center' my={moderateScaleVertical(24)}>
                    <OfferInfoIcon width={100} height={100} />
                  </Box>
                  
                  {/* Promo Code Card with Glass Effect */}
                  <LinearGradient
                    colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.02)']}
                    style={{
                      borderRadius: moderateScale(24),
                      padding: moderateScale(1),
                      marginVertical: moderateScaleVertical(12),
                    }}
                  >
                    <Box
                      flexDirection='row'
                      alignItems='center'
                      justifyContent='space-between'
                      bgColor={isDarkMode ? 'rgba(42,42,54,0.8)' : 'rgba(240,240,248,0.8)'}
                      borderRadius={moderateScale(23)}
                      px={moderateScale(20)}
                      py={moderateScaleVertical(16)}
                      style={{
                        backdropFilter: 'blur(10px)',
                      }}
                    >
                      <Text
                        fontFamily={'$poppinsBold'}
                        fontSize={24}
                        letterSpacing={1.5}
                        color={selectedOffer?.gradient?.[0] || colors.themePrimary}
                      >
                        {selectedOffer?.code}
                      </Text>
                      <Pressable onPress={() => copyToClipboard(selectedOffer?.code || "")}>
                        <CopyIcon width={28} height={28} color={selectedOffer?.gradient?.[0] || colors.themePrimary} />
                      </Pressable>
                    </Box>
                  </LinearGradient>
                  
                  {/* Decorative Line */}
                  <Box my={moderateScaleVertical(20)}>
                    <Svg height="2" width="100%">
                      <Line
                        x1="0"
                        y1="0"
                        x2="100%"
                        y2="0"
                        stroke={selectedOffer?.gradient?.[0] || colors.themePrimary}
                        strokeWidth="2"
                        strokeDasharray="8, 6"
                        opacity={0.5}
                      />
                    </Svg>
                  </Box>
                  
                  {/* Terms Section */}
                  <Box gap={moderateScaleVertical(12)}>
                    <Text fontFamily={'$poppinsSemiBold'} fontSize={18} color={isDarkMode ? '#FFFFFF' : '#1A1A2E'}>
                      📜 Terms apply
                    </Text>
                    {[
                      "Valid on minimum order of ₹999",
                      "Cannot be clubbed with other offers",
                      "Valid till 31st Dec 2025",
                      "One time use per customer"
                    ].map((term, idx) => (
                      <Box flexDirection='row' gap={moderateScale(12)} key={idx} alignItems="center">
                        <Icon as={CircleIcon} color={selectedOffer?.gradient?.[0] || colors.themePrimary} size={6} />
                        <Text fontFamily={'$poppinsMedium'} fontSize={13} lineHeight={18} color={isDarkMode ? '#B0B0C0' : '#5A5A6E'} flex={1}>
                          {term}
                        </Text>
                      </Box>
                    ))}
                  </Box>
                  
                  {/* Glowing Action Button */}
                  <Box mt={moderateScaleVertical(28)} mb={moderateScaleVertical(12)}>
                    <LinearGradient
                      colors={selectedOffer?.gradient || ['#FF6B6B', '#FF8E53']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{
                        borderRadius: moderateScale(40),
                        padding: moderateScale(1),
                        shadowColor: selectedOffer?.gradient?.[0],
                        shadowOffset: { width: 0, height: 8 },
                        shadowOpacity: 0.5,
                        shadowRadius: 16,
                        elevation: 12,
                      }}
                    >
                      <Pressable
                        onPress={() => {
                          copyToClipboard(selectedOffer?.code || "");
                          closeModal();
                        }}
                        style={({ pressed }) => ({
                          opacity: pressed ? 0.9 : 1,
                          transform: [{ scale: pressed ? 0.98 : 1 }],
                        })}
                      >
                        <Box
                          bgColor={isDarkMode ? '#1C1C24' : '#FFFFFF'}
                          py={moderateScaleVertical(16)}
                          borderRadius={moderateScale(40)}
                          alignItems='center'
                        >
                          <Text fontFamily={'$poppinsBold'} fontSize={18} color={selectedOffer?.gradient?.[0] || colors.themePrimary}>
                            Apply & Enjoy 🎁
                          </Text>
                        </Box>
                      </Pressable>
                    </LinearGradient>
                  </Box>
                </Box>
              </Box>
            </LinearGradient>
          </Animated.View>
        </Animated.View>
      </Modal>
    </Container>
  )
};

export default Offers;