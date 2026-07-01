import { getApiUrl } from '@/lib/remoteConfig';
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

// ─── P2-7: Split into two contexts ──────────────────────────────────────────
//
// Previously: one context held both `socket` and `isConnected`.
// Problem: every connect/disconnect event called setIsConnected(), which
//          re-rendered ALL consumers of useSocket() — including ChatScreen and
//          ChatHeader — even though they only use the socket object.
//
// Fix: SocketRefContext holds the stable socket reference (changes rarely).
//      ConnectionStatusContext holds volatile connection status (changes on
//      every reconnect). Consumers subscribe only to what they need.

interface SocketRefContextType {
    socket: Socket | null;
}

interface ConnectionStatusContextType {
    isConnected: boolean;
}

const SocketRefContext = createContext<SocketRefContextType>({
    socket: null,
});

const ConnectionStatusContext = createContext<ConnectionStatusContextType>({
    isConnected: false,
});

export function SocketProvider({ children }: { children: React.ReactNode }) {
    const { user, isAuthenticated } = useAuth();

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
            auth: {
                token: user.token,
            },
        });

        socketRef.current = newSocket;
        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('[Socket] Connected successfully with ID:', newSocket.id);
            setIsConnected(true);
        });

        newSocket.on('disconnect', (reason) => {
            console.log('[Socket] Disconnected. Reason:', reason);
            setIsConnected(false);
        });

        newSocket.on('connect_error', (err) => {
            console.warn('[Socket] Connection error:', err.message);
        });

        return () => {
            newSocket.disconnect();
            socketRef.current = null;
            setSocket(null);
            setIsConnected(false);
        };
    }, [isAuthenticated, user?.user?._id]);

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

    // P2-7: socket reference is memoized separately from connection status.
    //        ChatScreen / ChatHeader consume useSocket() and are NOT re-rendered
    //        when the connection toggles — only connection-status UI components
    //        (e.g., a network indicator) need to consume useConnectionStatus().
    const socketValue = useMemo(() => ({ socket }), [socket]);
    const connectionValue = useMemo(() => ({ isConnected }), [isConnected]);

    return (
        <SocketRefContext.Provider value={socketValue}>
            <ConnectionStatusContext.Provider value={connectionValue}>
                {children}
            </ConnectionStatusContext.Provider>
        </SocketRefContext.Provider>
    );
}

// Primary hook — used by ChatScreen, ChatHeader, and other message consumers.
// Does NOT re-render on connect/disconnect.
export const useSocket = () => useContext(SocketRefContext);

// Secondary hook — used ONLY by UI that needs to display connection status
// (e.g., a "Connecting..." banner). Isolates reconnect re-renders to that UI only.
export const useConnectionStatus = () => useContext(ConnectionStatusContext);
