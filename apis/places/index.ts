import apiClient from "../client";

export const PLACES_QUERY_KEYS = {
    all: ["places"] as const,
    list: (filters: Record<string, any>) =>
        [...PLACES_QUERY_KEYS.all, "infinite-list", filters] as const
};

export const PLACE_SUBMISSION_QUERY_KEYS = {
    myRequests: (params: { page: number; category?: string }) =>
        ["my-place-requests", params] as const
};

export function getPlacesList(params: {
    search?: string;
    category?: string;
    limit?: number;
    skip?: number;
    lat?: number;
    lng?: number;
}) {
    return apiClient.get('/api/user/v1/get-places', { params });
}

export function submitPlace(data: any) {
    return apiClient.post('/api/user/v1/submit-place', data);
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
