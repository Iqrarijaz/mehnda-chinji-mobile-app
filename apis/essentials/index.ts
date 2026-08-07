import apiClient from "../client";

export const ESSENTIALS_QUERY_KEYS = {
    all: ["essentials"] as const,
    list: (filters: Record<string, any>) =>
        [...ESSENTIALS_QUERY_KEYS.all, "infinite-list", filters] as const
};

export const ESSENTIAL_SUBMISSION_QUERY_KEYS = {
    myRequests: (params: { page: number; category?: string }) =>
        ["my-essential-requests", params] as const
};

export function getEssentialsList(params: {
    search?: string;
    category?: string;
    limit?: number;
    skip?: number;
    lat?: number;
    lng?: number;
    type?: string;
}) {
    return apiClient.get('/api/user/v1/get-essentials', { params });
}

export function submitEssential(data: any) {
    return apiClient.post('/api/user/v1/submit-essential', data);
}

export function getMyRequests(params: {
    page?: number;
    limit?: number;
    category?: string;
}) {
    return apiClient.get('/api/user/v1/get-my-requests', { params });
}

export function updateRequest(id: string, data: any) {
    return apiClient.put(`/api/user/v1/update-request/${id}`, data);
}

export function deleteRequest(id: string) {
    return apiClient.delete(`/api/user/v1/delete-request/${id}`);
}

export function uploadUserImage(formData: FormData) {
    return apiClient.post('/api/user/v1/upload-user-image', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
}

export function deleteUserImage(imageUrl: string) {
    return apiClient.post('/api/user/v1/delete-user-image', { imageUrl });
}

// Toppers
export function addTopper(id: string, data: any) {
    return apiClient.post(`/api/user/v1/essential/${id}/topper`, data);
}

export function updateTopper(id: string, topperId: string, data: any) {
    return apiClient.put(`/api/user/v1/essential/${id}/topper/${topperId}`, data);
}

export function deleteTopper(id: string, topperId: string) {
    return apiClient.delete(`/api/user/v1/essential/${id}/topper/${topperId}`);
}

// Events
export function addEvent(id: string, data: any) {
    return apiClient.post(`/api/user/v1/essential/${id}/event`, data);
}

export function updateEvent(id: string, eventId: string, data: any) {
    return apiClient.put(`/api/user/v1/essential/${id}/event/${eventId}`, data);
}

export function deleteEvent(id: string, eventId: string) {
    return apiClient.delete(`/api/user/v1/essential/${id}/event/${eventId}`);
}
