import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getNotifications,
    getNotificationUnreadCounts,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification
} from '@/apis/notifications';

interface UseNotificationsAPIOptions {
    activeFilter?: string;
    enabled?: boolean;
}

export function useNotificationsAPI(options?: UseNotificationsAPIOptions) {
    const queryClient = useQueryClient();
    const activeFilter = options?.activeFilter || 'ALL';
    const enabled = options?.enabled;

    const notificationsQuery = useQuery<any>({
        queryKey: ['notifications', activeFilter],
        queryFn: () => getNotifications({ type: activeFilter }),
        enabled: enabled !== false,
    });

    const badgeQuery = useQuery<any>({
        queryKey: ['notifications-badge'],
        queryFn: () => getNotifications({ limit: 1 }),
        enabled: enabled !== false,
    });

    // Per-category unread counts, for the filter-chip badges.
    const unreadCountsQuery = useQuery({
        queryKey: ['notifications-unread-counts'],
        queryFn: getNotificationUnreadCounts,
        enabled: enabled !== false,
    });

    const markAsReadMutation = useMutation({
        mutationFn: markNotificationAsRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['notifications-badge'] });
            queryClient.invalidateQueries({ queryKey: ['notifications-unread-counts'] });
        },
    });

    const markAllReadMutation = useMutation({
        mutationFn: markAllNotificationsAsRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['notifications-badge'] });
            queryClient.invalidateQueries({ queryKey: ['notifications-unread-counts'] });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteNotification(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['notifications-badge'] });
            queryClient.invalidateQueries({ queryKey: ['notifications-unread-counts'] });
        },
    });

    return {
        notificationsQuery,
        badgeQuery,
        unreadCountsQuery,
        markAsReadMutation,
        markAllReadMutation,
        deleteMutation
    };
}
