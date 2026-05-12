/**
 * useSocket — React hook for WebSocket connection to RSTO POS Server
 */

import { useEffect, useRef, useState, useCallback } from 'react';

// Dynamically connect to the host computer's IP address
const SERVER_URL = `http://${window.location.hostname}:4000`;

export type SocketEvent =
  | 'order:create'
  | 'order:update'
  | 'order:pay';

interface UseSocketReturn {
  connected: boolean;
  emit: (event: SocketEvent, data: any) => void;
  on: (event: string, handler: (data: any) => void) => () => void;
}

export function useSocket(token?: string | null): UseSocketReturn {
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<any>(null);

  useEffect(() => {
    let socket: any;

    const init = async () => {
      try {
        const { io } = await import('socket.io-client' as any);
        const authToken = token || localStorage.getItem('pos_token');
        
        // Clean up previous connection if it exists
        if (socketRef.current) {
          socketRef.current.disconnect();
          socketRef.current = null;
        }

        console.log(`[Socket] Connecting to ${SERVER_URL}...`);
        socket = io(SERVER_URL, {
          transports: ['websocket'],
          auth: { token: authToken },
          reconnection: true,
          reconnectionAttempts: 10,
          reconnectionDelay: 1000,
        });

        socket.on('connect', () => {
          console.log('%c[Socket] Connected to RSTO POS Server', 'color: #10b981; font-weight: bold');
          setConnected(true);
        });

        socket.on('disconnect', (reason: string) => {
          console.warn('[Socket] Disconnected:', reason);
          setConnected(false);
        });

        socket.on('connect_error', (err: any) => {
          console.warn('[Socket] Connection failed:', err.message);
          setConnected(false);
        });

        socketRef.current = socket;
      } catch (err) {
        console.warn('[Socket] socket.io-client initialization failed:', err);
      }
    };

    init();

    return () => {
      if (socket) {
        console.log('[Socket] Cleaning up connection');
        socket.disconnect();
      }
    };
  }, [token]); // Reconnect when token changes

  const emit = useCallback((event: SocketEvent, data: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    }
  }, []);

  const on = useCallback((event: string, handler: (data: any) => void) => {
    const socket = socketRef.current;
    if (socket) {
      socket.on(event, handler);
      return () => socket.off(event, handler);
    }
    return () => {};
  }, []);

  return { connected, emit, on };
}
