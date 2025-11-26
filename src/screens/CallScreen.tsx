import React, { useState, useEffect } from 'react';
import {Image, StyleSheet, View, TouchableOpacity} from 'react-native';
import { Container } from '../components/Container';
import { colors } from '../constants/colors';
import { AppBar } from '../components/AppBar';
import { scale } from '../utils/responsiveSize';
import { moderateScale } from '../constants/contants';
import { Text } from '@gluestack-ui/themed';
import Icons from '../assets/Icons';
import { Colors } from 'react-native/Libraries/NewAppScreen';

export default function CallScreen({}) {
  const [isMuted, setIsMuted] = useState(false);
  const [isCallReceived, setIsCallReceived] = useState(false);
  const [timer, setTimer] = useState(0);
  const [autoReceiveTimeout, setAutoReceiveTimeout] = useState<NodeJS.Timeout | null>(null);

  const handleMuteToggle = () => {
    setIsMuted(!isMuted);
  };

  // Format timer to mm:ss
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Handle call receive
  const handleCallReceive = () => {
    setIsCallReceived(true);
    if (autoReceiveTimeout) {
      clearTimeout(autoReceiveTimeout);
    }
  };

  // Auto receive call after 20 seconds
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!isCallReceived) {
        handleCallReceive();
      }
    }, 20000); // 20 seconds
    setAutoReceiveTimeout(timeout);

    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timer;
    if (isCallReceived) {
      interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer + 1);
      }, 1000);
    }
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isCallReceived]);

  return (
      <Container statusBarStyle="dark-content" statusBarBackgroundColor={colors.white}>
         <AppBar back/>
         <View style={{marginTop:scale(100)}}>
          <Image 
            source={{ uri: 'https://i2.pngimg.me/thumb/f/720/m2H7K9A0b1d3b1m2.jpg'}} 
            style={styles.profileImage}
          />
          <Text  
            fontFamily='$poppinsBold' 
            textAlign='center' 
            lineHeight={scale(30)} 
            mt={moderateScale(10)} 
            fontSize={scale(25)} 
            color='$black'
          >
          Sergio Ramasis
          </Text>
          <Text  
            fontFamily='$poppinsRegular' 
            textAlign='center' 
            lineHeight={scale(25)} 
            mt={moderateScale(10)} 
            fontSize={scale(15)} 
            color='grey'
          >
            {isCallReceived ? formatTime(timer) : 'Calling.....'}
          </Text>
         </View>

         <View style={styles.bottomContainer}>
           {/* <TouchableOpacity style={styles.roundButton}>
             <Image source={Icons.Camera} style={styles.iconStyle}/>
           </TouchableOpacity> */}
           
           <TouchableOpacity 
             style={styles.roundButton}
             onPress={handleMuteToggle}
           >
             <Image 
               source={isMuted ? Icons.Unmute : Icons.Mute} 
               style={styles.iconStyle}
               tintColor={isMuted ? colors.primary : undefined}
             />
           </TouchableOpacity>
           
           <TouchableOpacity 
             style={[styles.callButton, isCallReceived && styles.activeCallButton]}
             onPress={handleCallReceive}
           >
             <Image 
               source={Icons.Call} 
               style={styles.callIconStyle} 
               tintColor={Colors.white}
             />
           </TouchableOpacity>
           
           {/* <TouchableOpacity style={styles.roundButton}>
             <Image source={Icons.Video} style={styles.iconStyle}/>
           </TouchableOpacity>
            */}
           <TouchableOpacity style={styles.roundButton}>
             <Image source={Icons.More} style={styles.iconStyle}/>
           </TouchableOpacity>
         </View>
   </Container>
  );
}

const styles = StyleSheet.create({
  profileImage: {
    height: scale(130),
    width: scale(130),
    borderRadius: moderateScale(100),
    alignSelf: 'center'
  },
  bottomContainer: {
    position: 'absolute',
    bottom: scale(40),
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingHorizontal: scale(20),
  },
  roundButton: {
    width: scale(50),
    height: scale(50),
    borderRadius: scale(25),
    backgroundColor: colors.Amber || '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  callButton: {
    width: scale(70),
    height: scale(70),
    borderRadius: scale(35),
    backgroundColor: colors.green || '#FF0000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconStyle: {
    height: scale(25),
    width: scale(25),
  },
  callIconStyle: {
    height: scale(30),
    width: scale(30),
  },
  activeCallButton: {
    backgroundColor: colors.red || '#FF0000',
  },
});