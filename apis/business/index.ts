import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { baseUrl } from '../../configs';

export const BUSINESS_QUERY_KEYS = {
    all: ['businesses'] as const,
    list: (filters: any) => [...BUSINESS_QUERY_KEYS.all, 'infinite-list', filters] as const,
    status: (id: string) => [...BUSINESS_QUERY_KEYS.all, 'status', id] as const,
};

// Helper to get token
const getAuthHeader = async () => {
    try {
        const userData = await AsyncStorage.getItem("userData");
        const token = userData ? JSON.parse(userData).token : null;
        return token ? { Authorization: `Bearer ${token}` } : {};
    } catch (e) {
        return {};
    }
};

export async function REGISTER_BUSINESS(data: any) {
    try {
        const headers = await getAuthHeader();
        console.log("API REQUEST LOGS", data);
        const response = await axios.post(`${baseUrl}/api/user/v1/register-business`, data, {
            headers,
        });
        console.log("API RESPONSE LOGS", response.data);
        return response.data;
    } catch (error) {
        console.error("Register Business error", error);
        throw error;
    }
}

export async function GET_BUSINESS_STATUS() {
    try {
        const headers = await getAuthHeader();
        console.log("API REQUEST LOGS");
        const response = await axios.get(`${baseUrl}/api/user/v1/get-business-status`, {
            headers,
        });
        console.log("API RESPONSE LOGS", response.data);
        return response.data;
    } catch (error) {
        console.error("Get Business Status error", error);
        throw error;
    }
}

export async function GET_CATEGORIES(type: string = 'SERVICES') {
    try {
        const headers = await getAuthHeader();
        console.log("API REQUEST LOGS", { type });
        const response = await axios.get(`${baseUrl}/api/user/category/list?type=${type}`, {
            headers,
        });
        console.log("API RESPONSE LOGS", response.data);
        return response.data;
    } catch (error) {
        console.error("Get Categories error", error);
        throw error;
    }
}

export async function GET_BUSINESSES_LIST(params: { search?: string; categoryId?: string; currentPage?: number }) {
    try {
        const headers = await getAuthHeader();
        console.log("API REQUEST LOGS", params);
        const response = await axios.get(`${baseUrl}/api/user/v1/get-businesses-list`, {
            headers,
            params
        });
        console.log("API RESPONSE LOGS", response.data);
        return response.data;
    } catch (error) {
        console.error("Get Businesses List error", error);
        throw error;
    }
}
export async function DELETE_BUSINESS(businessId: string) {
    try {
        const headers = await getAuthHeader();
        console.log("API REQUEST LOGS", { businessId });
        const response = await axios.post(`${baseUrl}/api/user/v1/remove-business`, { businessId }, {
            headers,
        });
        console.log("API RESPONSE LOGS", response.data);
        return response.data;
    } catch (error) {
        console.error("Delete Business error", error);
        throw error;
    }
}
export async function MANAGE_BUSINESS_SEARCH(businessId: string, search: boolean) {
    try {
        const headers = await getAuthHeader();
        console.log("API REQUEST LOGS", { businessId, search });
        const response = await axios.post(`${baseUrl}/api/user/v1/manage-business-search`, { businessId, search }, {
            headers,
        });
        console.log("API RESPONSE LOGS", response.data);
        return response.data;
    } catch (error) {
        console.error("Manage Business Search error", error);
        throw error;
    }
}
