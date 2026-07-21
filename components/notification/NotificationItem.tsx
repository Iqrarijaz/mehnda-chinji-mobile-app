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

const PRIMARY = '#006666';

function getTypeStyle(type: string): { icon: string; color: string } {
    switch (type) {
        case 'SYSTEM': return { icon: 'settings-outline', color: PRIMARY };
        case 'COMMUNITY': return { icon: 'people-outline', color: PRIMARY };
        case 'ACTIVITY': return { icon: 'flash-outline', color: PRIMARY };
        default: return { icon: 'notifications-outline', color: PRIMARY };
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
    const scale = useSharedValue(1);

    const animStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }] }));

    const handlePressIn = useCallback(() => {
        scale.value = withSpring(0.97, { damping: 15 });
    }, []);

    const handlePressOut = useCallback(() => {
        scale.value = withSpring(1, { damping: 12 });
    }, []);

    const { icon, color } = getTypeStyle(item.type);

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
                style={[styles.card, !item.isRead && styles.cardUnread]}
            >
                {/* Left: Icon */}
                <View style={styles.iconWrap}>
                    <View style={[styles.iconCircle, { backgroundColor: `${PRIMARY}14` }]}>
                        <Ionicons name={icon as any} size={18} color={color} />
                    </View>
                    {!item.isRead && <View style={styles.badge} />}
                </View>

                {/* Middle: Content */}
                <View style={styles.content}>
                    <View style={styles.titleRow}>
                        <ThemedText
                            style={[styles.title, !item.isRead && styles.titleUnread]}
                            numberOfLines={1}
                        >
                            {item.title}
                        </ThemedText>
                        {!item.isRead && <View style={styles.dot} />}
                    </View>
                    <ThemedText style={styles.body} numberOfLines={2}>{item.body}</ThemedText>
                    <ThemedText style={styles.time}>{formatTime(item.createdAt)}</ThemedText>
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
        backgroundColor: '#FFFFFF',
        borderRadius: Layout.borderRadius,
        padding: 6,
        marginBottom: 8 },
    cardUnread: {
        backgroundColor: `${PRIMARY}08` },
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
        borderRadius: Layout.borderRadius,
        backgroundColor: PRIMARY },
    content: { flex: 1 },
    titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
    title: { fontSize: 12, fontWeight: '600', color: '#0F172A', flex: 1 },
    titleUnread: { fontWeight: '800' },
    dot: { width: 7, height: 7, borderRadius: Layout.borderRadius, backgroundColor: PRIMARY, marginLeft: 6 },
    body: { fontSize: 11, color: '#64748B', lineHeight: 16, marginBottom: 4 },
    time: { fontSize: 11, color: '#94A3B8', fontWeight: '500' } });
