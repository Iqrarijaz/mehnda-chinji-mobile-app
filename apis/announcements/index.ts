import apiClient from '../client';

export interface AnnouncementData {
    _id: string;
    title: string;
    message: string;
    type: 'public' | 'health' | 'education' | 'emergency' | 'banks' | 'travel' | 'religious' | 'govt' | 'lost_found';
    images: string[];
    eventDate?: string;
    authorId: {
        _id: string;
        name: string;
        profileImage?: string;
    };
    essentialId?: {
        _id: string;
        name: string;
        category: string;
        type: string;
    } | null;
    createdAt: string;
}

export const ANNOUNCEMENT_QUERY_KEYS = {
    all: ['announcements'] as const,
    list: (filters: any) => [...ANNOUNCEMENT_QUERY_KEYS.all, 'list', filters] as const,
};

export const getAnnouncementsList = async (params: { page?: number; limit?: number; type?: string; essentialId?: string; authorId?: string; search?: string } = {}) => {
    const response: any = await apiClient.get('/api/user/v1/announcements/list', { params });
    return response;
};

export const createAnnouncement = async (formData: FormData) => {
    return apiClient.post('/api/user/v1/announcements/create', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
};

export const updateAnnouncement = async (formData: FormData) => {
    return apiClient.post('/api/user/v1/announcements/update', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
};

export const deleteAnnouncement = async (announcementId: string) => {
    return apiClient.post('/api/user/v1/announcements/delete', { announcementId });
};
