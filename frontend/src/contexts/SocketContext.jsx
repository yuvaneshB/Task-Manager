import React, { createContext, useState, useEffect, useContext } from 'react';
import { io } from 'socket.io-client';
import { AuthContext } from './AuthContext';
import toast from 'react-hot-toast';

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    // If not logged in, ensure we clean up the socket state and disconnect
    if (!user) {
      setSocket(null);
      return;
    }

    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    console.log(`[Socket] Initializing connection to: ${socketUrl}...`);

    const newSocket = io(socketUrl, {
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('[Socket] Connected successfully. Socket ID:', newSocket.id);
      newSocket.emit('register', user.id || user._id);
    });

    newSocket.on('connect_error', (error) => {
      console.error('[Socket] Connection failed:', error.message);
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log(`[Socket] Reconnected after ${attemptNumber} attempts.`);
      newSocket.emit('register', user.id || user._id);
    });

    newSocket.on('reconnect_error', (error) => {
      console.error('[Socket] Reconnection attempt failed:', error.message);
    });

    newSocket.on('reconnect_failed', () => {
      console.error('[Socket] Reconnection failed completely.');
      toast.error('Unable to establish live connection. Live updates disabled.', { id: 'socket-failed' });
    });

    newSocket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected from server. Reason:', reason);
    });

    newSocket.on('online-users', (users) => {
      setOnlineUsers(users);
    });

    newSocket.on('new-notification', (notif) => {
      toast((t) => (
        <span className="flex flex-col gap-1">
          <strong className="text-indigo-600 dark:text-indigo-400 font-semibold">{notif.title}</strong>
          <span className="text-xs text-slate-600 dark:text-slate-300">{notif.message}</span>
        </span>
      ), {
        icon: '🔔',
        duration: 5000
      });
    });

    // Cleanup on unmount or user change to prevent duplicates and memory leaks
    return () => {
      console.log('[Socket] Cleaning up socket connection...');
      newSocket.disconnect();
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};
