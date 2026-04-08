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
            // 1. Always refresh notification list & badge
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['notifications-badge'] });

            // 2. If place status changed, auto-refresh the My Requests screen
            if (payload?.type === 'PLACE') {
                queryClient.invalidateQueries({ queryKey: ['my-place-requests'] });
            }

            // 3. Show UI Toast
            Toast.show({
                type: payload?.type === 'PLACE_STATUS' && payload?.body?.includes('منظور') ? 'success' : 'info',
                text1: payload.title || 'New Notification',
                text2: payload.body || '',
                visibilityTime: 4000,
            });

            // 4. Trigger Local Notification (Sound/Vibration)
            try {
                await Notifications.scheduleNotificationAsync({
                    content: {
                        title: payload.title || 'New Notification',
                        body: payload.body || '',
                        data: payload.data || {},
                        sound: 'default',
                    },
                    trigger: null,
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
