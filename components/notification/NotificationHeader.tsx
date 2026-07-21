import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import Tooltip from 'react-native-walkthrough-tooltip';
import { ThemedText } from '../ThemedText';
import { Layout } from '@/constants/layout';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { ScreenHeader } from '@/components/common/ScreenHeader';

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
    onMarkAllRead,
    unreadCount,
    isPending,
    showTooltip = false,
    onCloseTooltip = () => { } }: Props) => {
    const { theme } = useTheme();
    const colors = Colors[theme];

    return (
        <ScreenHeader
            showMenuIcon={false}
            rightActions={
                <Tooltip
                    isVisible={showTooltip}
                    content={
                        <View style={[styles.tooltipPill, { backgroundColor: theme === 'dark' ? '#1E293B' : '#FFFFFF' }]}>
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
                    <TouchableOpacity
                        onPress={onMarkAllRead}
                        style={[styles.markBtn, { marginRight: 12 }]}
                        activeOpacity={0.7}
                        disabled={isPending || unreadCount === 0}
                    >
                        {isPending ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                            <Ionicons
                                name="checkmark-done"
                                size={22}
                                color="#FFFFFF"
                            />
                        )}
                    </TouchableOpacity>
                </Tooltip>
            }
        >
            {/* Subtitle */}
            <Animated.View entering={FadeIn.delay(400).duration(500)} style={styles.headerSubtitleWrap}>
                <ThemedText style={styles.headerSubtitle}>
                    {unreadCount > 0 ? `${unreadCount} unread message${unreadCount !== 1 ? 's' : ''}` : 'Stay updated with recent activity'}
                </ThemedText>
            </Animated.View>
        </ScreenHeader>
    );
});

export default NotificationHeader;

const styles = StyleSheet.create({
    headerWrap: {
        paddingBottom: 8,
        borderBottomLeftRadius: Layout.headerBorderRadius,
        borderBottomRightRadius: Layout.headerBorderRadius,
        overflow: 'hidden',
        zIndex: 2 },
    headerTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20 },
    backBtn: {
        width: 32,
        height: 32,
        borderRadius: Layout.borderRadius,
        backgroundColor: 'rgba(255,255,255,0.18)',
        justifyContent: 'center',
        alignItems: 'center' },
    headerTitleWrap: {
        flex: 1,
        alignItems: 'center' },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: 'rgba(255,255,255,1)' },
    markBtn: {
        width: 38,
        height: 38,
        borderRadius: Layout.borderRadius,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center' },
    headerSubtitleWrap: {
        alignItems: 'center',
        marginTop: -8,
        marginBottom: 8 },
    headerSubtitle: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.75)',
        fontWeight: '500' },
    // Tooltip styles — identical to categoryListingHeader
    tooltipContent: {
        padding: 0,
        borderRadius: Layout.borderRadius,
        backgroundColor: 'transparent' },
    tooltipPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: Layout.borderRadius,
        gap: 12 },
    tooltipText: {
        fontSize: 13,
        fontWeight: '600' },
    tooltipClose: {
        padding: 4 } });
