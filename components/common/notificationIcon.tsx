import { getNotifications } from '@/apis/notifications';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
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
    const { isAuthenticated } = useAuth();
    const colors = Colors[theme];
    const router = useRouter();

    const iconColor = color || colors.primary;

    const { data: notificationsData } = useQuery({
        queryKey: ['notifications-badge'],
        queryFn: () => getNotifications({ limit: 1 }),
        enabled: isAuthenticated,
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
        borderRadius: Layout.borderRadius,
        backgroundColor: '#FFFFFF',
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
    },
    badgeText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: 'bold',
        textAlign: 'center',
        lineHeight: 14,
    }
});
