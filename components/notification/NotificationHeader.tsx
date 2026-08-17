import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import Tooltip from 'react-native-walkthrough-tooltip';
import { ThemedText } from '../themedText';
import { Layout } from '@/constants/layout';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';

// PRIMARY is now accessed via colors.primary inside the component

interface Props {
    onBack: () => void;
    onMarkAllRead: () => void;
    unreadCount: number;
    isPending: boolean;
    paddingTop: number;
    showTooltip?: boolean;
    onCloseTooltip?: () => void;
}

const NotificationHeader = React.memo(({
    onBack,
    onMarkAllRead,
    unreadCount,
    isPending,
    paddingTop,
    showTooltip = false,
    onCloseTooltip = () => { },
}: Props) => {
    const { theme } = useTheme();
    const colors = Colors[theme];

    return (
        <Animated.View entering={FadeInUp.duration(600)} style={[styles.headerWrap, { backgroundColor: colors.primary }]}>

            {/* Top row */}
            <View style={[styles.headerTopRow, { paddingTop: paddingTop + 8 }]}>
                <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
                    <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
                </TouchableOpacity>

                <Animated.View entering={FadeIn.delay(200).duration(500)} style={styles.headerTitleWrap}>
                    <ThemedText style={styles.headerTitle}>Notifications</ThemedText>
                </Animated.View>

                {/* Right slot — tooltip anchored here */}
                <Tooltip
                    isVisible={showTooltip}
                    content={
                        <View style={styles.tooltipPill}>
                            <ThemedText style={styles.tooltipText}>← Swipe left to delete Notification</ThemedText>
                            <TouchableOpacity onPress={onCloseTooltip} style={styles.tooltipClose}>
                                <Ionicons name="close-circle" size={18} color="#64748B" />
                            </TouchableOpacity>
                        </View>
                    }
                    placement="bottom"
                    onClose={onCloseTooltip}
                    contentStyle={styles.tooltipContent}
                    backgroundColor="rgba(0,0,0,0.2)"
                >
                    {unreadCount > 0 && !isPending ? (
                        <TouchableOpacity onPress={onMarkAllRead} style={styles.markBtn} activeOpacity={0.7}>
                            <Ionicons name="checkmark-done" size={15} color="#FFFFFF" />
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.rightSpacer} />
                    )}
                </Tooltip>
            </View>

            {/* Subtitle */}
            <Animated.View entering={FadeIn.delay(400).duration(500)} style={styles.headerSubtitleWrap}>
                <ThemedText style={styles.headerSubtitle}>
                    {unreadCount > 0 ? `${unreadCount} unread message${unreadCount !== 1 ? 's' : ''}` : 'Stay updated with recent activity'}
                </ThemedText>
            </Animated.View>
        </Animated.View>
    );
});

export default NotificationHeader;

const styles = StyleSheet.create({
    headerWrap: {
        paddingBottom: 10,
        borderBottomLeftRadius: Layout.headerBorderRadius,
        borderBottomRightRadius: Layout.headerBorderRadius,
        overflow: 'hidden',
        zIndex: 2,
    },
    headerTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    backBtn: {
        width: 42,
        height: 42,
        borderRadius: 17,
        backgroundColor: 'rgba(255,255,255,0.18)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitleWrap: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: Platform.OS === 'android' ? 18 : 20,
        fontWeight: '700',
        color: 'rgba(255,255,255,1)',
    },
    markBtn: {
        width: 42,
        height: 42,
        borderRadius: 17,
        backgroundColor: 'rgba(255,255,255,0.18)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    rightSpacer: { width: 42, height: 42 },
    headerSubtitleWrap: {
        alignItems: 'center',
        marginTop: 8,
    },
    headerSubtitle: {
        fontSize: Platform.OS === 'android' ? 13 : 14,
        color: 'rgba(255,255,255,0.75)',
        fontWeight: '500',
    },
    // Tooltip styles — identical to categoryListingHeader
    tooltipContent: {
        padding: 0,
        borderRadius: Layout.borderRadius,
        backgroundColor: 'transparent',
    },
    tooltipPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: Layout.borderRadius,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        borderColor: 'rgba(0,0,0,0.05)',
        gap: 12,
    },
    tooltipText: {
        fontSize: 13,
        fontWeight: '600',
    },
    tooltipClose: {
        padding: 4,
    },
});
