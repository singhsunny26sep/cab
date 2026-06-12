import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import LottieView from 'lottie-react-native';
import Modal from 'react-native-modal';
import {moderateScale, scale, textScale} from '../utils/responsiveSize';
import {colors} from '../constants/colors';
import {useTheme} from '../constants/ThemeContext';
import axios from 'axios';
import {useSelector} from 'react-redux';
import {RootState} from '../store/reduxStore/store';
import {BASE_URL} from '../api/Instance.ts';
import {CREATE_RATING} from '../api/ApiEndpoints';

type AlertType = 'confirmation' | 'rating' | null;

interface RideAlertProps {
  visible: boolean;
  onClose: () => void;
  type: AlertType;
  rideData?: any;
  onSubmitRating?: (rating: number, review: string) => void;
}

const CustomBottomsheetRideALerts: React.FC<RideAlertProps> = ({
  visible,
  onClose,
  type,
  rideData,
  onSubmitRating,
}) => {
  const {isDarkMode} = useTheme();
  const [rating, setRating] = useState<number>(0);
  const [review, setReview] = useState<string>('');
  const [internalVisible, setInternalVisible] = useState<boolean>(false);
  const [hasShownConfirmation, setHasShownConfirmation] = useState<boolean>(false);
  const autoCloseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const userData = useSelector((state: RootState) => state.user);

  useEffect(() => {
    if (visible) {
      // For confirmation type, only show if we haven't shown it before
      if (type === 'confirmation') {
        if (!hasShownConfirmation) {
          setInternalVisible(true);
          setHasShownConfirmation(true);

          // Auto-close after 3 seconds
          autoCloseTimerRef.current = setTimeout(() => {
            setInternalVisible(false);
            onClose();
          }, 3000);
        }
      }
      // For rating type, always show
      else if (type === 'rating') {
        setInternalVisible(true);
        setRating(0);
        setReview('');
      }
    } else {
      setInternalVisible(false);
    }

    return () => {
      if (autoCloseTimerRef.current) {
        clearTimeout(autoCloseTimerRef.current);
      }
    };
  }, [visible, type, hasShownConfirmation]);

  const handleClose = () => {
    setInternalVisible(false);
    onClose();
  };


  const handleSubmitRating = async () => {
    try {
      if (!rideData?._id || !rating) {return;}

      const response = await axios.post(
        `${BASE_URL}${CREATE_RATING.url}`,
        {
          bookingId: rideData._id,
          rating: rating,
          review: review,
          createdAt: new Date(),
        },
        {
          headers: {
            Authorization: `Bearer ${userData.token}`,
          },
        },
      );

      if (response.data.success) {
        handleClose();
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
    }
  };

  const renderStars = () => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map(star => (
          <TouchableOpacity
            key={star}
            onPress={() => setRating(star)}
            activeOpacity={0.7}>
            <Text
              style={[
                styles.star,
                star <= rating ? styles.selectedStar : null,
              ]}>
              {star <= rating ? '★' : '☆'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderConfirmation = () => (
    <View style={styles.content}>
      <LottieView
        source={require('../assets/lotties/doneTick.json')}
        autoPlay
        loop={true}
        style={styles.lottie}
      />
      <Text style={[styles.title, isDarkMode && styles.darkText]}>
        Ride Confirmed!
      </Text>
      {rideData?.pickupLocation?.address &&
        rideData?.destinationLocation?.address && (
          <View style={styles.detailsContainer}>
            <Text style={[styles.detailLabel, isDarkMode && styles.darkText]}>
              Pickup:
            </Text>
            <Text style={[styles.detailValue, isDarkMode && styles.darkText]}>
              {rideData?.pickupLocation?.address}
            </Text>
            <Text style={[styles.detailLabel, isDarkMode && styles.darkText]}>
              Destination:
            </Text>
            <Text style={[styles.detailValue, isDarkMode && styles.darkText]}>
              {rideData?.destinationLocation?.address}
            </Text>
          </View>
        )}
    </View>
  );

  const renderRating = () => (
    <View style={styles.content}>
      <Pressable style={styles.closeButton} onPress={handleClose}>
        <Text style={styles.closeIcon}>×</Text>
      </Pressable>
      <LottieView
        source={require('../assets/lotties/thankss.json')}
        autoPlay
        loop={true}
        style={styles.lottie}
      />
      <Text style={[styles.title, isDarkMode && styles.darkText]}>
        Thank You!
      </Text>
      <Text style={[styles.subtitle, isDarkMode && styles.darkText]}>
        How was your ride?
      </Text>
      {renderStars()}
      <TextInput
        style={[
          styles.reviewInput,
          isDarkMode && {backgroundColor: colors.gray5, color: colors.white},
        ]}
        placeholder="Write a review (optional)"
        placeholderTextColor={isDarkMode ? colors.gray10 : colors.gray}
        multiline
        numberOfLines={3}
        value={review}
        onChangeText={setReview}
      />
      <Pressable
        style={[styles.submitButton, !rating && styles.disabledButton]}
        onPress={handleSubmitRating}
        disabled={!rating}>
        <Text style={styles.submitButtonText}>Submit Rating</Text>
      </Pressable>
    </View>
  );

  return (
    <Modal
      isVisible={internalVisible}
      onBackdropPress={handleClose}
      onBackButtonPress={handleClose}
      onSwipeComplete={handleClose}
      swipeDirection={['down']}
      style={styles.modal}
      backdropOpacity={0.5}
      backdropTransitionOutTiming={0}
      hideModalContentWhileAnimating={true}
      useNativeDriverForBackdrop={true}
      useNativeDriver={true}
      statusBarTranslucent={true}
      animationIn="slideInUp"
      animationOut="slideOutDown"
      animationInTiming={400}
      animationOutTiming={400}>
      <View
        style={[
          styles.modalContent,
          isDarkMode && {backgroundColor: colors.black},
        ]}>
        {type === 'confirmation' && renderConfirmation()}
        {type === 'rating' && renderRating()}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: moderateScale(20),
    borderTopRightRadius: moderateScale(20),
    padding: moderateScale(20),
    paddingBottom: moderateScale(30),
    maxHeight: '80%',
  },
  content: {
    alignItems: 'center',
  },
  lottie: {
    width: moderateScale(150),
    height: moderateScale(150),
  },
  title: {
    fontSize: textScale(20),
    fontWeight: 'bold',
    marginVertical: moderateScale(10),
    color: colors.black,
  },
  subtitle: {
    fontSize: textScale(16),
    marginBottom: moderateScale(15),
    color: colors.black,
  },
  detailsContainer: {
    width: '100%',
    marginTop: moderateScale(10),
  },
  detailLabel: {
    fontWeight: 'bold',
    fontSize: textScale(14),
    color: colors.black,
  },
  detailValue: {
    fontSize: textScale(14),
    marginBottom: moderateScale(10),
    color: colors.black,
  },
  closeButton: {
    alignSelf: 'flex-end',
  },
  closeIcon: {
    fontSize: textScale(34),
    color: colors.gray,
  },
  starsContainer: {
    flexDirection: 'row',
    marginVertical: moderateScale(15),
  },
  star: {
    fontSize: textScale(30),
    color: colors.gray,
    marginHorizontal: moderateScale(5),
  },
  selectedStar: {
    color: colors.gold,
  },
  reviewInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: colors.gray5,
    borderRadius: moderateScale(8),
    padding: moderateScale(10),
    marginBottom: moderateScale(15),
    minHeight: moderateScale(80),
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: colors.themePrimary,
    padding: moderateScale(12),
    borderRadius: moderateScale(8),
    width: '100%',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: colors.gray5,
  },
  submitButtonText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: textScale(16),
  },
  darkText: {
    color: colors.white,
  },
});

export default CustomBottomsheetRideALerts;
