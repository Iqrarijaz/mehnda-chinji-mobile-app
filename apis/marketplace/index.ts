import apiClient from '../client';

export interface MarketplaceListing {
    _id: string;
    sellerId: {
        _id: string;
        name: string;
        profileImage?: string;
        phone?: string;
        email?: string;
    };
    title: string;
    description: string;
    category: {
        en: string;
        ur: string;
    };
    type: {
        en: string;
        ur: string;
    };
    price: number;
    negotiable: boolean;
    place: string;
    location?: {
        type: string;
        coordinates: [number, number];
    };
    images: string[];
    status: 'pending' | 'live' | 'rejected' | 'sold' | 'offline';
    rejectedReason?: string;
    isFeatured: boolean;
    sellerPhone: string;
    showPhoneNumber: boolean;
    viewsCount: number;
    inquiriesCount: number;
    metadata?: Record<string, any>;
    createdAt: string;
}

export const MARKETPLACE_QUERY_KEYS = {
    all: ['marketplace'] as const,
    list: (filters: any) => [...MARKETPLACE_QUERY_KEYS.all, 'list', filters] as const,
    myList: (filters: any) => [...MARKETPLACE_QUERY_KEYS.all, 'myList', filters] as const,
    details: (id: string) => [...MARKETPLACE_QUERY_KEYS.all, 'details', id] as const,
};

export const getMarketplaceList = async (params: { page?: number; limit?: number; search?: string; category?: string; type?: string; minPrice?: number; maxPrice?: number; negotiable?: boolean; place?: string; latitude?: number; longitude?: number; radius?: number } = {}) => {
    const response: any = await apiClient.get('/api/user/v1/marketplace/list', { params });
    return response;
};

export const getMyMarketplaceList = async (params: { page?: number; limit?: number; status?: string } = {}) => {
    const response: any = await apiClient.get('/api/user/v1/marketplace/my-listings', { params });
    return response;
};

export const getMarketplaceDetails = async (listingId: string) => {
    const response: any = await apiClient.get(`/api/user/v1/marketplace/details/${listingId}`);
    return response;
};

export const createMarketplaceListing = async (data: any) => {
    return apiClient.post('/api/user/v1/marketplace/create', data);
};

export const updateMarketplaceListing = async (data: any) => {
    return apiClient.post('/api/user/v1/marketplace/update', data);
};

export const markMarketplaceListingAsSold = async (listingId: string) => {
    return apiClient.post('/api/user/v1/marketplace/mark-sold', { listingId });
};

export const incrementMarketplaceInquiry = async (listingId: string) => {
    return apiClient.post(`/api/user/v1/marketplace/inquiry/${listingId}`);
};

export const deleteMarketplaceListing = async (listingId: string) => {
    return apiClient.post('/api/user/v1/marketplace/delete', { listingId });
};

export const toggleMarketplaceListingStatus = async (listingId: string, status: 'live' | 'offline') => {
    return apiClient.post('/api/user/v1/marketplace/toggle-status', { listingId, status });
};
