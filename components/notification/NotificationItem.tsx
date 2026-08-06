import { Ionicons } from '@expo/vector-icons';
import React, { useCallback } from 'react';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, {
    SlideInLeft,
    useAnimatedStyle,
    useSharedValue,
    withSpring } from 'react-native-reanimated';
import { ThemedText } from '../ThemedText';
import { Layout } from '@/constants/layout';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';

function getTypeStyle(type: string, primary: string): { icon: string; color: string } {
    switch (type) {
        case 'SYSTEM': return { icon: 'settings-outline', color: primary };
        case 'COMMUNITY': return { icon: 'people-outline', color: primary };
        case 'ACTIVITY': return { icon: 'flash-outline', color: primary };
        default: return { icon: 'notifications-outline', color: primary };
    }
}

function formatTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

interface Props {
    item: any;
    onPress: (item: any) => void;
    delay?: number;
}

const NotificationItem = React.memo(({ item, onPress, delay = 0 }: Props) => {
    const { theme } = useTheme();
    const colors = Colors[theme];
    const scale = useSharedValue(1);

    const animStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }] }));

    const handlePressIn = useCallback(() => {
        scale.value = withSpring(0.97, { damping: 15 });
    }, []);

    const handlePressOut = useCallback(() => {
        scale.value = withSpring(1, { damping: 12 });
    }, []);

    const { icon, color } = getTypeStyle(item.type, colors.primary);

    return (
        <Animated.View
            entering={SlideInLeft.delay(delay).duration(400)}
            style={animStyle}
        >
            <TouchableOpacity
                onPress={() => onPress(item)}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                activeOpacity={1}
                style={[
                    styles.card,
                    { backgroundColor: item.isRead ? colors.card : `${colors.primary}14` },
                ]}
            >
                {/* Left: Icon */}
                <View style={styles.iconWrap}>
                    <View style={[styles.iconCircle, { backgroundColor: `${colors.primary}14` }]}>
                        <Ionicons name={icon as any} size={18} color={color} />
                    </View>
                    {!item.isRead && <View style={[styles.badge, { backgroundColor: colors.primary }]} />}
                </View>

                {/* Middle: Content */}
                <View style={styles.content}>
                    <View style={styles.titleRow}>
                        <ThemedText
                            style={[styles.title, { color: colors.text }, !item.isRead && styles.titleUnread]}
                            numberOfLines={1}
                        >
                            {item.title}
                        </ThemedText>
                        {!item.isRead && <View style={[styles.dot, { backgroundColor: colors.primary }]} />}
                    </View>
                    <ThemedText style={[styles.body, { color: colors.textSecondary }]} numberOfLines={2}>{item.body}</ThemedText>
                    <ThemedText style={[styles.time, { color: colors.placeholder }]}>{formatTime(item.createdAt)}</ThemedText>
                </View>

            </TouchableOpacity>
        </Animated.View>
    );
});

export default NotificationItem;

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: Layout.borderRadius,
        padding: 5,
        marginBottom: 8 },
    iconWrap: { position: 'relative', marginRight: 10 },
    iconCircle: {
        width: 34,
        height: 34,
        borderRadius: Layout.borderRadius,
        justifyContent: 'center',
        alignItems: 'center' },
    badge: {
        position: 'absolute',
        top: -3,
        right: -3,
        width: 11,
        height: 11,
        borderRadius: Layout.borderRadius },
    content: { flex: 1 },
    titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
    title: { fontSize: 10.5, fontWeight: '600', flex: 1 },
    titleUnread: { fontWeight: '800' },
    dot: { width: 7, height: 7, borderRadius: Layout.borderRadius, marginLeft: 6 },
    body: { fontSize: 10, lineHeight: 16, marginBottom: 4 },
    time: { fontSize: 10, fontWeight: '500' } });
