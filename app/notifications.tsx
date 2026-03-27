import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Stack, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    FlatList,
    RefreshControl,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
    getNotifications,
    markAllNotificationsAsRead,
    markNotificationAsRead,
    deleteNotification,
} from '@/apis/notifications';

import NotificationEmptyState from '@/components/notification/NotificationEmptyState';
import NotificationFilterTabs from '@/components/notification/NotificationFilterTabs';
import NotificationHeader from '@/components/notification/NotificationHeader';
import NotificationItem from '@/components/notification/NotificationItem';
import NotificationSection from '@/components/notification/NotificationSection';
import NotificationSkeleton from '@/components/notification/NotificationSkeleton';
import { handleNotificationNavigation } from '@/utils/notificationNavigation';
import { useAuth } from '@/context/AuthContext';



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
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { isAuthenticated } = useAuth();
    const queryClient = useQueryClient();
    const [activeFilter, setActiveFilter] = useState('ALL');
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [showSwipeTooltip, setShowSwipeTooltip] = useState(false);
    const tooltipShownRef = useRef(false);

    const { data: response, isLoading, isFetching, refetch } = useQuery<any>({
        queryKey: ['notifications', activeFilter],
        queryFn: () => getNotifications({ type: activeFilter }),
        enabled: isAuthenticated,
    });

    const notifications = response?.data || [];
    const unreadCount = response?.unreadCount || 0;

    // Show swipe tooltip once when notifications first appear
    useEffect(() => {
        if (!tooltipShownRef.current && notifications.length > 0) {
            tooltipShownRef.current = true;
            const timer = setTimeout(() => setShowSwipeTooltip(true), 600);
            return () => clearTimeout(timer);
        }
    }, [notifications.length]);

    const closeSwipeTooltip = useCallback(() => setShowSwipeTooltip(false), []);

    const markAsReadMutation = useMutation({
        mutationFn: markNotificationAsRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['notifications-badge'] });
        },
    });

    const markAllReadMutation = useMutation({
        mutationFn: markAllNotificationsAsRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['notifications-badge'] });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteNotification(id),
        onMutate: (id: string) => {
            setDeletingId(id);
        },
        onSuccess: (_data, id) => {
            // Instantly remove from cache
            queryClient.setQueryData(['notifications', activeFilter], (old: any) => {
                if (!old) return old;
                return { ...old, data: old.data.filter((n: any) => n._id !== id) };
            });
            // Then invalidate to sync with server
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['notifications-badge'] });
        },
        onError: () => {
            // Rollback by refetching
            queryClient.invalidateQueries({ queryKey: ['notifications', activeFilter] });
        },
        onSettled: () => {
            setDeletingId(null);
        },
    });

    const handleDelete = useCallback((id: string) => {
        deleteMutation.mutate(id);
    }, [deleteMutation]);

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
        <View style={styles.container}>
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
            {/* Fixed Filter Tabs */}
            <View style={styles.filtersWrap}>
                <NotificationFilterTabs active={activeFilter} onSelect={setActiveFilter} />
            </View>
            {/* Scrollable List */}
            <FlatList
                data={listData}
                renderItem={renderItem}
                keyExtractor={(item, i) => `${item.type}-${i}`}
                contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 32 }]}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={isFetching && !isLoading} onRefresh={refetch} tintColor="#006666" />
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F6FA' },
    list: { flexGrow: 1, paddingTop: 8 },
    filtersWrap: { backgroundColor: '#F5F6FA', paddingBottom: 4 },
    sectionWrap: { paddingHorizontal: 16, marginTop: 12 },
});
