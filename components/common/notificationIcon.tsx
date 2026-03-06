import { getNotifications } from '@/apis/notifications';
import { ThemedText } from '@/components/themedText';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

interface NotificationIconProps {
    color?: string;
    size?: number;
    badgeStyle?: any;
    containerStyle?: any;
}

export function NotificationIcon({
    color,
    size = 22,
    badgeStyle,
    containerStyle
}: NotificationIconProps) {
    const { theme } = useTheme();
    const colors = Colors[theme];
    const router = useRouter();

    const iconColor = color || colors.white;

    const { data: notificationsData } = useQuery({
        queryKey: ['notifications-badge'],
        queryFn: () => getNotifications({ limit: 1 }),
        refetchInterval: 60 * 60 * 1000, // 1 hour auto-refresh
    });

    const unreadCount = notificationsData?.unreadCount || 0;

    return (
        <TouchableOpacity
            onPress={() => router.push('/notifications')}
            style={[styles.iconButton, containerStyle]}
        >
            <Ionicons name="notifications-outline" size={size} color={iconColor} />
            {unreadCount > 0 && (
                <View style={[styles.badge, { borderColor: colors.primary }, badgeStyle]}>
                    <ThemedText style={styles.badgeText}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </ThemedText>
                </View>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    iconButton: {
        width: 38,
        height: 38,
        borderRadius: 11,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    badge: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: '#ef4444',
        borderRadius: 10,
        minWidth: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
        borderWidth: 1.5,
    },
    badgeText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: 'bold',
        textAlign: 'center',
        lineHeight: 14,
    }
});
