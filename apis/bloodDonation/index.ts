import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { baseUrl } from '../../configs';

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


export async function REGISTER_AS_DONOR(data: any) {
    try {
        const headers = await getAuthHeader();
        console.log("API REQUEST LOGS", data);
        const response = await axios.post(`${baseUrl}/api/user/v1/register-as-donor`, data, {
            headers,
        });
        return response.data;
    } catch (error) {
        console.error("Register as Donor error", error);
        throw error;
    }
}

export async function GET_DONOR_STATUS() {
    try {
        const headers = await getAuthHeader();
        const response = await axios.get(`${baseUrl}/api/user/v1/get-donor-status`, {
            headers,
        });
        return response.data;
    } catch (error) {
        console.error("Get Donor Status error", error);
        throw error;
    }
}

export async function REMOVE_AS_DONOR() {
    try {
        const headers = await getAuthHeader();
        console.log("API REQUEST LOGS");
        const response = await axios.post(`${baseUrl}/api/user/v1/remove-as-donor`, {}, {
            headers,
        });
        console.log("API RESPONSE LOGS", response.data);
        return response.data;
    } catch (error) {
        console.error("Remove as Donor error", error);
        throw error;
    }
}

export async function MANAGE_DONOR_STATUS() {
    try {
        const headers = await getAuthHeader();
        console.log("API REQUEST LOGS");
        const response = await axios.post(`${baseUrl}/api/user/v1/manage-donor-status`, {}, {
            headers,
        });
        console.log("API RESPONSE LOGS", response.data);
        return response.data;
    } catch (error) {
        console.error("Manage Donor Status error", error);
        throw error;
    }
}

export async function GET_DONORS_LIST(params: { bloodGroup?: string; name?: string; location?: string }) {
    try {
        const headers = await getAuthHeader();
        const response = await axios.get(`${baseUrl}/api/user/v1/get-donors-list`, {
            headers,
            params,
        });
        return response.data;
    } catch (error) {
        console.error("Get Donors List error", error);
        throw error;
    }
}
