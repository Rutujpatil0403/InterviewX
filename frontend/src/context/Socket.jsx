import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import { CONFIG } from '../config/webrtc.config';

const SocketContext = React.createContext(null);

export const useSocket = () => {
  return React.useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  const socket = useMemo(() => {
    const socketInstance = io(CONFIG.SOCKET_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: CONFIG.CONNECTION_CONFIG.RECONNECT_ATTEMPTS,
      reconnectionDelay: CONFIG.CONNECTION_CONFIG.RECONNECT_DELAY,
      timeout: CONFIG.CONNECTION_CONFIG.CONNECTION_TIMEOUT,
      transports: ['websocket', 'polling']
    });
    
    return socketInstance;
  }, []);

  const handleConnect = useCallback(() => {
    console.log('Socket connected');
    setIsConnected(true);
    setConnectionError(null);
    setReconnectAttempts(0);
  }, []);

  const handleDisconnect = useCallback((reason) => {
    console.log('Socket disconnected:', reason);
    setIsConnected(false);
    if (reason === 'io server disconnect') {
      // Server disconnected the socket, need to reconnect manually
      socket.connect();
    }
  }, [socket]);

  const handleError = useCallback((error) => {
    console.error('Socket error:', error);
    setConnectionError(error.message || 'Connection error');
  }, []);

  const handleReconnectAttempt = useCallback((attemptNumber) => {
    console.log(`Socket reconnect attempt ${attemptNumber}`);
    setReconnectAttempts(attemptNumber);
  }, []);

  const handleReconnectError = useCallback((error) => {
    console.error('Socket reconnect error:', error);
    setConnectionError('Failed to reconnect');
  }, []);

  const handleReconnectFailed = useCallback(() => {
    console.error('Socket reconnection failed after maximum attempts');
    setConnectionError('Connection failed. Please refresh the page.');
  }, []);

  useEffect(() => {
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleError);
    socket.on('reconnect_attempt', handleReconnectAttempt);
    socket.on('reconnect_error', handleReconnectError);
    socket.on('reconnect_failed', handleReconnectFailed);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleError);
      socket.off('reconnect_attempt', handleReconnectAttempt);
      socket.off('reconnect_error', handleReconnectError);
      socket.off('reconnect_failed', handleReconnectFailed);
    };
  }, [socket, handleConnect, handleDisconnect, handleError, handleReconnectAttempt, handleReconnectError, handleReconnectFailed]);

  const manualReconnect = useCallback(() => {
    setConnectionError(null);
    setReconnectAttempts(0);
    socket.connect();
  }, [socket]);

  return (
    <SocketContext.Provider value={{ 
      socket, 
      isConnected, 
      connectionError, 
      reconnectAttempts,
      manualReconnect 
    }}>
      {children}
    </SocketContext.Provider>
  );
};
