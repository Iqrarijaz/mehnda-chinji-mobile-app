import { useSocket } from '@/context/SocketContext';
import { useQueryClient } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import Toast from 'react-native-toast-message';

export interface InAppNotification {
    id: string;
    title: string;
    body: string;
    type: string;
    data?: any;
}

/**
 * Listens for real-time `new_notification` socket events, 
 */
export const useSocketNotifications = () => {
    const { socket } = useSocket();
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!socket) return;

        const handleNewNotification = async (payload: any) => {
            // 1. Invalidate notification queries to refresh counts and lists
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['notifications-badge'] });

            // 2. Show UI Toast (Visual)
            Toast.show({
                type: 'success',
                text1: payload.title || 'New Notification',
                text2: payload.body || '',
                visibilityTime: 3000,
            });

            // 3. Trigger Local Notification (for Sound/Vibration)
            // This relies on the NotificationHandler set in usePushNotifications.ts
            try {
                await Notifications.scheduleNotificationAsync({
                    content: {
                        title: payload.title || 'New Notification',
                        body: payload.body || '',
                        data: payload.data || {},
                        sound: 'default', // Explicitly request default sound
                    },
                    trigger: null, // Send immediately
                });
            } catch (error) {
                console.warn('[SocketNotifications] Error triggering local notification sound:', error);
            }
        };

        socket.on('new_notification', handleNewNotification);

        return () => {
            socket.off('new_notification', handleNewNotification);
        };
    }, [socket]);

    return null;
};
