import apiClient from '../client';

export const DONOR_QUERY_KEYS = {
    all: ['donors'] as const,
    list: (filters: any) => [...DONOR_QUERY_KEYS.all, 'infinite-list', filters] as const,
    status: () => [...DONOR_QUERY_KEYS.all, 'status'] as const,
};

export async function registerAsDonor(data: any) {
    return apiClient.post('/api/user/v1/register-as-donor', data);
}

export async function getDonorStatus() {
    return apiClient.get('/api/user/v1/get-donor-status');
}

export async function removeAsDonor() {
    return apiClient.post('/api/user/v1/remove-as-donor', {});
}

export async function manageDonorStatus() {
    return apiClient.post('/api/user/v1/manage-donor-status', {});
}

export async function getDonorsList(params: { bloodGroup?: string; name?: string; location?: string; currentPage?: number }) {
    return apiClient.get('/api/user/v1/get-donors-list', { params });
}
