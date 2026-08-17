import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    RefreshControl,
    StyleSheet,
    TouchableOpacity,
    View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { useQueryClient } from '@tanstack/react-query';
import { useNotificationsAPI } from '@/hooks/useNotificationsAPI';

import NotificationEmptyState from '@/components/notification/NotificationEmptyState';
import NotificationFilterTabs from '@/components/notification/NotificationFilterTabs';
import NotificationHeader from '@/components/notification/NotificationHeader';
import NotificationItem from '@/components/notification/NotificationItem';
import NotificationSection from '@/components/notification/NotificationSection';
import NotificationSkeleton from '@/components/notification/NotificationSkeleton';
import { handleNotificationNavigation } from '@/utils/notificationNavigation';
import { useAuth } from '@/context/AuthContext';
import { useTooltipStore } from '@/store/tooltipStore';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/colors';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

function getDayLabel(dateStr: string): string {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

function groupByDay(items: any[]): { label: string; data: any[] }[] {
    const map = new Map<string, any[]>();
    for (const item of items) {
        const label = getDayLabel(item.createdAt);
        if (!map.has(label)) map.set(label, []);
        map.get(label)!.push(item);
    }
    return Array.from(map.entries()).map(([label, data]) => ({ label, data }));
}

// ── Screen ───────────────────────────────────────────────────────────────────

export default function NotificationsScreen() {
    const { theme } = useTheme();
    const colors = Colors[theme];
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { isAuthenticated } = useAuth();
    const queryClient = useQueryClient();
    const [activeFilter, setActiveFilter] = useState('ALL');
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [showSwipeTooltip, setShowSwipeTooltip] = useState(false);
    const viewedTooltips = useTooltipStore(state => state.viewedTooltips);
    const markAsViewed = useTooltipStore(state => state.markAsViewed);

    const {
        notificationsQuery,
        unreadCountsQuery,
        markAsReadMutation,
        markAllReadMutation,
        deleteMutation
    } = useNotificationsAPI({
        activeFilter,
        enabled: isAuthenticated
    });

    const { data: response, isLoading, isFetching, refetch } = notificationsQuery;
    const unreadCounts = unreadCountsQuery.data?.data;

    const notifications = response?.data || [];
    const unreadCount = response?.unreadCount || 0;

    // Show swipe tooltip once when notifications first appear and wasn't viewed before
    useEffect(() => {
        const tooltipId = 'notifications-screen';
        if (!viewedTooltips[tooltipId] && notifications.length > 0) {
            const timer = setTimeout(() => setShowSwipeTooltip(true), 600);
            return () => clearTimeout(timer);
        }
    }, [notifications.length, viewedTooltips]);

    const closeSwipeTooltip = useCallback(() => {
        const tooltipId = 'notifications-screen';
        markAsViewed(tooltipId);
        setShowSwipeTooltip(false);
    }, [markAsViewed]);

    const handleDelete = useCallback((id: string) => {
        setDeletingId(id);
        deleteMutation.mutate(id, {
            onSuccess: () => {
                queryClient.setQueryData(['notifications', activeFilter], (old: any) => {
                    if (!old) return old;
                    return { ...old, data: old.data.filter((n: any) => n._id !== id) };
                });
            },
            onSettled: () => {
                setDeletingId(null);
            }
        });
    }, [deleteMutation, activeFilter, queryClient]);

    const handlePress = useCallback((item: any) => {
        if (!item.isRead) markAsReadMutation.mutate(item._id);
        if (item.data) handleNotificationNavigation(item.data, router);
    }, [markAsReadMutation, router]);

    const handleBack = useCallback(() => {
        router.canGoBack() ? router.back() : router.replace('/(drawer)/(tabs)' as any);
    }, [router]);

    const sections = useMemo(() => groupByDay(notifications), [notifications]);

    // For FlatList data — each section is one item type
    type ListItem =
        | { type: 'header' }
        | { type: 'filters' }
        | { type: 'skeleton' }
        | { type: 'section'; label: string; data: any[]; startDelay: number }
        | { type: 'empty' };

    const listData = useMemo<ListItem[]>(() => {
        const items: ListItem[] = [];
        if (isLoading) {
            items.push({ type: 'skeleton' });
        } else if (sections.length === 0) {
            items.push({ type: 'empty' });
        } else {
            let delay = 0;
            sections.forEach(s => {
                items.push({ type: 'section', label: s.label, data: s.data, startDelay: delay });
                delay += s.data.length * 50 + 60;
            });
        }
        return items;
    }, [isLoading, sections]);

    const renderItem = useCallback(({ item }: { item: ListItem }) => {
        switch (item.type) {
            case 'skeleton':
                return <NotificationSkeleton />;
            case 'empty':
                return <NotificationEmptyState />;
            case 'section':
                return (
                    <View style={styles.sectionWrap}>
                        <NotificationSection
                            title={item.label}
                            items={item.data}
                            onPress={handlePress}
                            onDelete={handleDelete}
                            deletingId={deletingId}
                            startDelay={item.startDelay}
                        />
                    </View>
                );
            default:
                return null;
        }
    }, [handlePress, handleDelete, deletingId]);

    return (
        <ErrorBoundary>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{ headerShown: false }} />
            {/* Fixed Header */}
            <NotificationHeader
                onBack={handleBack}
                onMarkAllRead={() => markAllReadMutation.mutate()}
                unreadCount={unreadCount}
                isPending={markAllReadMutation.isPending}
                paddingTop={insets.top}
                showTooltip={showSwipeTooltip}
                onCloseTooltip={closeSwipeTooltip}
            />
            {/* Content Wrapper */}
            <View style={{ flex: 1, backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, overflow: 'hidden' }}>
                {/* Fixed Filter Tabs */}
                <View style={styles.filtersWrap}>
                    <NotificationFilterTabs active={activeFilter} onSelect={setActiveFilter} unreadCounts={unreadCounts} />
                </View>
                {/* Scrollable List */}
                <View style={{ flex: 1 }}>
                    <FlashList
                        data={listData}
                        renderItem={renderItem as any}
                        keyExtractor={(item: any, i: number) => `${item.type}-${i}`}
                        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 32 }]}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl refreshing={isFetching && !isLoading} onRefresh={refetch} tintColor="#006666" />
                        }
                    />
                </View>
            </View>
        </View>
        </ErrorBoundary>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    list: { flexGrow: 1, paddingTop: 7 },
    filtersWrap: { paddingBottom: 4 },
    sectionWrap: { paddingHorizontal: 13, marginTop: 12 } });
