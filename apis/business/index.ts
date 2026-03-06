import apiClient from '../client';

export const BUSINESS_QUERY_KEYS = {
    all: ['Businesses'] as const, // Changed Businesses to Businesses if needed, but keeping consistency
    list: (filters: any) => [...BUSINESS_QUERY_KEYS.all, 'infinite-list', filters] as const,
    status: (id: string) => [...BUSINESS_QUERY_KEYS.all, 'status', id] as const,
    myBusiness: () => [...BUSINESS_QUERY_KEYS.all, 'my-business'] as const,
};

export async function registerBusiness(data: any) {
    return apiClient.post('/api/user/v1/register-business', data);
}

export async function getBusinessStatus() {
    return apiClient.get('/api/user/v1/get-business-status');
}

export async function getCategories(type: string = 'SERVICES') {
    return apiClient.get('/api/user/category/list', { params: { type } });
}

export async function getBusinessesList(params: { search?: string; categoryId?: string; currentPage?: number }) {
    return apiClient.get('/api/user/v1/get-businesses-list', { params });
}

export async function deleteBusiness(businessId: string) {
    return apiClient.post('/api/user/v1/remove-business', { businessId });
}

export async function manageBusinessSearch(businessId: string, search: boolean) {
    return apiClient.post('/api/user/v1/manage-business-search', { businessId, search });
}

export async function updateBusiness(data: any) {
    return apiClient.post('/api/user/v1/update-business', data);
}
