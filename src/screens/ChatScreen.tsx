import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  FlatList, 
  KeyboardAvoidingView, 
  Platform, 
  TouchableOpacity,
  ActivityIndicator 
} from 'react-native';
import { Container } from '../components/Container';
import { colors } from '../constants/colors';
import { AppBar } from '../components/AppBar';
import { Box, Image } from '@gluestack-ui/themed';
import { moderateScale } from '../constants/contants';
import Icons from '../assets/Icons';
import { scale } from '../utils/responsiveSize';
import { useRoute } from '@react-navigation/native';
import axios from 'axios';
import socketServices from '../utils/socketServices';
import { BASE_URL, Instance } from '../api/Instance.ts';
import { loadUserFromStorage } from '../store/slice/UserSlice';
import { GET_CHATS_DATA } from '../api/ApiEndpoints';

interface Message {
  _id: string;
  message: string;
  senderType: 'RIDER' | 'CLIENT';
  timestamp: string;
}

interface ChatScreenProps {
  route: {
    params: {
      bookingId: string;
      riderInfo: any;
    };
  };
}

export default function ChatScreen({ route }: ChatScreenProps) {
  const { params } = useRoute<any>();
  const { bookingId, riderInfo } = params;
  const [userLocalData, setUserLocalData] = useState<any>(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [socketInitialized, setSocketInitialized] = useState(false);
  const [driverInfo, setDriverInfo] = useState<any>(null);
  const [clientInfo, setClientInfo] = useState<any>(null);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [initializingSocket, setInitializingSocket] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const messageIdRef = useRef<Set<string>>(new Set());

  console.log("booking Id ", bookingId)

  // Load user data and initialize socket
  useEffect(() => {
    const initializeApp = async () => {
      try {
        const localData = await loadUserFromStorage();
        setUserLocalData(localData);
      } catch (error) {
        console.error('Initialization error:', error);
      }
    };

    initializeApp();

    return () => {
      // socketServices.disconnectSocket();
      messageIdRef.current.clear();
    };
  }, []);

  // Initialize socket when token is available
  useEffect(() => {
    if (!userLocalData?.token) return;

    const initializeSocket = async () => {
      try {
        if(socketServices.isConnected()){
          setInitializingSocket(true);
          // await socketServices.initializeSocket(userLocalData.token);
          setSocketInitialized(true);
        }
      } catch (error) {
        console.error('Socket initialization failed:', error);
      } finally {
        setInitializingSocket(false);
      }
    };

    initializeSocket();

    return () => {
      // socketServices.disconnectSocket();
      setSocketInitialized(false);
    };
  }, [userLocalData]);

  // Load messages and setup socket listeners
  useEffect(() => {
    if (!socketInitialized || !bookingId) return;

    // console.log("url -> ", `${BASE_URL}${GET_CHATS_DATA.url}${bookingId}`);
    // console.log("token -> ", userLocalData?.token);

    const loadMessages = async () => {
      try {
        setLoadingMessages(true);        
        const url = `${BASE_URL}${GET_CHATS_DATA.url}${bookingId}`;
        // const url = `http://192.168.31.250:5000/api/chat/${bookingId}`;
        const response = await Instance.get(url, {
          headers: {
            Authorization: `Bearer ${userLocalData?.token}`
          },
        });
        
        setClientInfo(response?.data?.clientInfo);
        setDriverInfo(response?.data?.riderInfo);
        
        // Clear existing message IDs and add new ones
        messageIdRef.current.clear();
        const newMessages = response.data.messages.map((msg: Message) => {
          messageIdRef.current.add(msg._id);
          return msg;
        });
        
        setMessages(newMessages);
        scrollToBottom();
      } catch (error: any) {
        console.error('Error loading messages:', error.response?.data);
      } finally {
        setLoadingMessages(false);
      }
    };

    // Join chat room
    socketServices.emit('joinBookingChatRoom', { bookingId });

    // Listen for new messages
    const handleReceiveMessage = (newMessage: Message) => {
      // Check if message already exists to prevent duplicates
      if (!messageIdRef.current.has(newMessage._id)) {
        messageIdRef.current.add(newMessage._id);
        setMessages(prev => [...prev, newMessage]);
        scrollToBottom();
      }
    };

    socketServices.on('receiveMessage', handleReceiveMessage);

    loadMessages();

    return () => {
      // socketServices.removeListener('receiveMessage', handleReceiveMessage);
    };
  }, [socketInitialized, bookingId]);

  const scrollToBottom = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleSendMessage = () => {
    if (message.trim() === '') return;

    const tempId = Date.now().toString();
    const newMessage = {
      _id: tempId,
      senderType: 'CLIENT' as const,
      bookingId,
      message,
      timestamp: new Date().toISOString()
    };

    // Optimistically update UI
    messageIdRef.current.add(tempId);
    setMessage('');
    scrollToBottom();

    // Emit message via socket
    socketServices.emit('sendMessage', {
      senderType: 'CLIENT',
      bookingId,
      message
    });
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = item.senderType === 'CLIENT';
    const profileImage = isMe ? clientInfo?.imgUrl : driverInfo?.profileImgUrl;

    return (
      <Box 
        flexDirection="row"
        alignItems="flex-end"
        my={moderateScale(4)}
        mx={moderateScale(3)}
        alignSelf={isMe ? 'flex-end' : 'flex-start'}
      >
        {!isMe && profileImage && (
          <Image 
            source={{ uri: profileImage }}
            alt="Profile"
            borderRadius={100}
            height={scale(30)}
            width={scale(30)}
            bottom={scale(28)}
            marginHorizontal={scale(5)}
          />
        )}
        <Box 
          bg={isMe ? '$amber400' : '#F0F0F0'}
          px={moderateScale(15)}
          py={moderateScale(10)}
          borderRadius={moderateScale(10)}
          maxWidth="75%"
          style={[
            isMe 
              ? styles.myMessageContainer 
              : styles.otherMessageContainer
          ]}
        >
          <Text style={[
            styles.messageText, 
            isMe && styles.myMessageText
          ]}>
            {item.message}
          </Text>
          <Text style={[
            styles.timeText,
            isMe && styles.myTimeText
          ]}>
            {formatTime(item.timestamp)}
          </Text>
        </Box>
      </Box>
    );
  };

  if (initializingSocket || loadingMessages) {
    return (
      <Container statusBarStyle="dark-content" statusBarBackgroundColor={colors.white}>
        <AppBar back title={driverInfo?.name || "Loading..."} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.themePrimary} />
          <Text style={styles.loadingText}>
            {initializingSocket ? "Connecting to chat..." : "Loading messages..."}
          </Text>
        </View>
      </Container>
    );
  }

  return (
    <Container 
      statusBarStyle="dark-content" 
      statusBarBackgroundColor={colors.white}>
      <AppBar 
        back 
        title={driverInfo?.name} 
      />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}>
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={scrollToBottom}
          onLayout={scrollToBottom}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No messages yet</Text>
            </View>
          }
        />

        <Box 
          flexDirection="row" 
          p={moderateScale(12)} 
          borderTopWidth={1}
          borderTopColor="#E8E8E8"
          bg={colors.white}
          alignItems="center"
          style={styles.inputContainer}
        >
          <TextInput
            style={styles.input}
            value={message}
            onChangeText={setMessage}
            placeholder="Type your message here..."
            placeholderTextColor="#999"
            multiline
            maxLength={1000}
          />
          
          <TouchableOpacity onPress={handleSendMessage}>
            <Image 
              source={Icons.Navigation} 
              style={[
                styles.sendIcon,
                message.length > 0 && styles.activeSendIcon
              ]}
              alt="Send message"
            />
          </TouchableOpacity>
        </Box>
      </KeyboardAvoidingView>
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  messageList: {
    padding: moderateScale(1),
    flexGrow: 1,
  },
  myMessageContainer: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
  },
  otherMessageContainer: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.12,
    shadowRadius: 1.0,
  },
  messageText: {
    fontSize: moderateScale(15),
    color: '#2C2C2C',
    lineHeight: moderateScale(20),
  },
  myMessageText: {
    color: colors.white,
    fontFamily:'$poppinsRegular'
  },
  timeText: {
    fontSize: moderateScale(11),
    color: '#888',
    marginTop: moderateScale(4),
    alignSelf: 'flex-end',
    fontFamily:'$poppinsMedium'
  },
  myTimeText: {
    color: 'rgba(255,255,255,0.8)',
  },
  inputContainer: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  input: {
    flex: 1,
    backgroundColor: '#F8F8F8',
    borderRadius: moderateScale(10),
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(10),
    maxHeight: moderateScale(100),
    fontSize: moderateScale(15),
    color: '#2C2C2C',
    fontFamily: '$poppinsRegular',
    marginHorizontal: moderateScale(8),
    borderWidth:moderateScale(0.5)
  },
  sendIcon: {
    height: scale(28),
    width: scale(28),
  },
  activeSendIcon: {
    tintColor: colors.themePrimary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  loadingText: {
    marginTop: moderateScale(16),
    fontSize: moderateScale(16),
    color: colors.themePrimary,
    fontFamily: '$poppinsMedium',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: moderateScale(20),
  },
  emptyText: {
    fontSize: moderateScale(16),
    color: '#888',
    fontFamily: '$poppinsMedium',
  },
});