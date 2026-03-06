import apiClient from '../client';

export interface NotificationResponse {
    success: boolean;
    data: any[];
    pagination?: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
    unreadCount: number;
}

export const getNotifications = async ({ type, page = 1, limit = 20 }: { type?: string; page?: number; limit?: number }): Promise<NotificationResponse> => {
    return apiClient.get('/api/user/v1/notifications', {
        params: { type, page, limit }
    });
};

export const markNotificationAsRead = async (id: string) => {
    return apiClient.put(`/api/user/v1/notification/${id}/read`, {});
};

export const markAllNotificationsAsRead = async () => {
    return apiClient.put('/api/user/v1/notifications/read-all', {});
};

export const getNotificationPreferences = async () => {
    return apiClient.get('/api/user/v1/manage-notifications');
};

export const manageNotifications = async (notificationPreferences: any) => {
    return apiClient.post('/api/user/v1/manage-notifications', { notificationPreferences });
};

export const deleteNotification = async (id: string) => {
    return apiClient.delete(`/api/user/v1/notification/${id}`);
};
