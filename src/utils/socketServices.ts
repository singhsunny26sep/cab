import { io, Socket } from "socket.io-client";

const SOCKET_URL = "http://192.168.31.250:5000";
// const SOCKET_URL = "https://48cb-2401-4900-51e0-1730-29ae-bd3a-55b4-939c.ngrok-free.app";
// const SOCKET_URL = "https://cabdriverserver-a3cdd048fc7c.herokuapp.com";

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
          type: "customer"
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

      // Setup event handlers
      this.socket.on("connect", () => {
        console.log("✅✅✅✅✅✅ Socket connected successfully!✅✅✅✅✅✅", this.socket?.connected);
      });

      this.socket.on("disconnect", () => {
        console.log("=== socket disconnected ===");
      });

      this.socket.on("connect_error", (error) => {
        console.log("=== socket connection error ===", error);
      });

      return this.socket;

    } catch (error) {
      console.log("=== socket initialization error ===", error);
      throw error;
    }
  }

  
  on(event: string, callback: EventCallback): void {
    if (!this.socket) {
      console.warn("Socket not initialized. Call initializeSocket first.");
      return;
    }
    this.socket.on(event, callback);
  }

  emit(event: string, data: any, callback?: EventCallback): void {
    if (!this.socket) {
      console.warn("Socket not initialized. Call initializeSocket first.");
      return;
    }
    this.socket.emit(event, data, callback);
  }

  removeListener(event: string, listener: EventCallback): void {
    if (!this.socket) {
      console.warn("Socket not initialized. Call initializeSocket first.");
      return;
    }
    this.socket.off(event, listener);
  }

  disconnectSocket = (): void => {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      console.log("=== Socket manually disconnected ===");
    }
  }

  isConnected = (): boolean => {
    return this.socket?.connected || false;
  }
}

const socketServices = new WSService();
export default socketServices;