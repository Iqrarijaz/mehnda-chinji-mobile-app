import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useNotificationsAPI } from '@/hooks/useNotificationsAPI';

interface NotificationIconProps {
    color?: string;
    size?: number;
    badgeStyle?: any;
    containerStyle?: any;
}

export const NotificationIcon = React.memo(function NotificationIcon({
    color,
    size = 22,
    badgeStyle,
    containerStyle
}: NotificationIconProps) {
    const { theme, isDark } = useTheme();
    const { isAuthenticated } = useAuth();
    const colors = Colors[theme];
    const router = useRouter();
    const pathname = usePathname();

    const iconColor = color || (isDark ? '#FFFFFF' : colors.primary);

    const { badgeQuery } = useNotificationsAPI({
        enabled: isAuthenticated
    });

    const { data: notificationsData } = badgeQuery;

    const unreadCount = notificationsData?.unreadCount || 0;

    return (
        <TouchableOpacity
            onPress={() => {
                if (pathname !== '/notifications') {
                    router.push('/notifications');
                }
            }}
            style={[styles.iconButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9' }, containerStyle]}
            activeOpacity={0.7}
        >
            <Ionicons name="notifications-outline" size={size} color={iconColor} />
            {unreadCount > 0 && (
                <View style={[styles.badge, badgeStyle]}>
                    <ThemedText style={styles.badgeText}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </ThemedText>
                </View>
            )}
        </TouchableOpacity>
    );
});

const styles = StyleSheet.create({
    iconButton: {
        width: 38,
        height: 38,
        borderRadius: Layout.borderRadius,
        justifyContent: 'center',
        alignItems: 'center' },
    badge: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: '#ef4444',
        borderRadius: Layout.borderRadius,
        minWidth: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4 },
    badgeText: {
        color: '#FFFFFF',
        fontSize: 9,
        fontWeight: 'bold',
        textAlign: 'center',
        lineHeight: 14 }
});
