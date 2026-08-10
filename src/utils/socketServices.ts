import {io, Socket} from 'socket.io-client';

const SOCKET_URL = 'https://api.fixetservices.com/';
// Make sure your socket server is running on this IP/port

type EventCallback = (...args: any[]) => void;

class WSService {
  private socket: Socket | null = null;

  initializeSocket = async (userToken: string): Promise<Socket> => {
    try {
      // If socket already exists and is connected, return it
      if (this.socket?.connected) {
        return this.socket;
      }
      // Initialize new socket connection
      this.socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        secure: true,
        auth: {
          token: userToken,
          type: 'customer',
        },
        query: {
          token: userToken,
        },
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        timeout: 30000,
        // extraHeaders: {
        // "Authorization": `${userToken}`,
        // "User-Agent": "okhttp/4.12.0",
        // "Accept-Encoding": "gzip",
        // Origin: SOCKET_URL,
        // "Host": "cabdriver-987432da3a86.herokuapp.com",
        // }
      });

      console.log('👋 Initializing socket');
      this.socket.on('connect', () => {
        console.log(
          '✅✅✅✅✅✅ Socket connected successfully!✅✅✅✅✅✅',
          this.socket?.connected,
        );
      });
      this.socket.on('disconnect', () => {
        console.log('=== socket disconnected ===');
      });
      this.socket.on('connect_error', (error: any) => {
        console.log('=== socket connection error ===', error?.message || error);
      });
      this.socket.on('error', (error: any) => {
        console.log('=== socket error ===', error?.message || error);
      });
      this.socket.on('reconnect_attempt', (attempt: number) => {
        console.log('=== socket reconnect attempt ===', attempt);
      });
      this.socket.on('reconnect_failed', () => {
        console.log('=== socket reconnect failed ===');
      });
      return this.socket;
    } catch (error) {
      console.log('=== socket initialization error ===', error);
      throw error;
    }
  };

  on(event: string, callback: EventCallback): void {
    if (!this.socket) {
      console.warn('Socket not initialized. Call initializeSocket first.');
      return;
    }
    this.socket.on(event, callback);
  }

  emit(event: string, data: any, callback?: EventCallback): void {
    if (!this.socket) {
      console.warn('Socket not initialized. Call initializeSocket first.');
      return;
    }
    this.socket.emit(event, data, callback);
  }

  removeListener(event: string, listener: EventCallback): void {
    if (!this.socket) {
      console.warn('Socket not initialized. Call initializeSocket first.');
      return;
    }
    this.socket.off(event, listener);
  }

  off(event: string, listener?: EventCallback): void {
    if (!this.socket) {
      console.warn('Socket not initialized. Call initializeSocket first.');
      return;
    }
    if (listener) {
      this.socket.off(event, listener);
    } else {
      this.socket.off(event);
    }
  }

  disconnectSocket = (): void => {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      console.log('=== Socket manually disconnected ===');
    }
  };

  isConnected = (): boolean => {
    return this.socket?.connected || false;
  };
}

const socketServices = new WSService();
export default socketServices;
