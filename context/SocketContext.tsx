

import { getApiUrl } from '@/lib/remoteConfig';
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
    socket: null,
    isConnected: false,
});

export function SocketProvider({ children }: { children: React.ReactNode }) {
    const { user, isAuthenticated } = useAuth();

    // alert(JSON.stringify(user?.user));
    // Store socket in state so consumers re-render when it becomes available
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    // Keep a ref for cleanup — avoids stale closure issues in effect teardown
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        if (!isAuthenticated || !user?.user?._id) {
            // Disconnect and clear when user logs out
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
                setSocket(null);
                setIsConnected(false);
            }
            return;
        }

        const userId = String(user.user._id);
        console.log('[Socket] Initializing for User ID:', userId);

        const newSocket = io(getApiUrl(), {
            transports: ['polling', 'websocket'], // Allow fallback to polling for robustness
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 2000,
            timeout: 10000,
        });

        socketRef.current = newSocket;
        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('[Socket] Connected successfully with ID:', newSocket.id);
            setIsConnected(true);
            newSocket.emit('join', userId);
        });

        newSocket.on('disconnect', (reason) => {
            console.log('[Socket] Disconnected. Reason:', reason);
            setIsConnected(false);
        });

        newSocket.on('connect_error', (err) => {
            console.warn('[Socket] Connection error details:', {
                message: err.message,
                type: err.name,
                description: (err as any).description, // Extra info from socket.io
                context: (err as any).context // Extra info from socket.io
            });
        });

        return () => {
            newSocket.disconnect();
            socketRef.current = null;
            setSocket(null);
            setIsConnected(false);
        };
    }, [isAuthenticated, user?.user?._id]); // ._id is consistent with backend

    useEffect(() => {
        const handleAppStateChange = (nextAppState: AppStateStatus) => {
            if (!socketRef.current) return;

            if (nextAppState === 'active') {
                console.log('[Socket] App came to foreground. Connecting...');
                if (!socketRef.current.connected) {
                    socketRef.current.connect();
                }
            } else if (nextAppState.match(/inactive|background/)) {
                console.log('[Socket] App went to background. Disconnecting...');
                if (socketRef.current.connected) {
                    socketRef.current.disconnect();
                }
            }
        };

        const subscription = AppState.addEventListener('change', handleAppStateChange);

        return () => {
            subscription.remove();
        };
    }, []);

    const socketValue = useMemo(() => ({ socket, isConnected }), [socket, isConnected]);

    return (
        <SocketContext.Provider value={socketValue}>
            {children}
        </SocketContext.Provider>
    );
}

export const useSocket = () => useContext(SocketContext);
