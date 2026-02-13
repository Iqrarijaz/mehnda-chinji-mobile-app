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

export async function SIGNUP(data: any) {
    try {
        const response = await axios.post(`${baseUrl}/auth/user/signup-with-email`, data);
        return response.data;
    } catch (error) {
        console.error("Signup error", error);
        throw error;
    }
}

export async function LOGIN_API(data: any) {
    try {
        const response = await axios.post(`${baseUrl}/auth/user/login-with-email`, data);
        return response.data;
    } catch (error) {
        console.error("Login error", error);
        throw error;
    }
}

export async function LOGOUT() {
    try {
        const headers = await getAuthHeader();
        const response = await axios.post(
            `${baseUrl}/auth/user/logout`,
            {},
            { headers }
        );
        return response.data;
    } catch (error) {
        console.error("Logout error", error);
        throw error;
    }
}
export async function UPDATE_PROFILE(data: any) {
    try {
        const headers = await getAuthHeader();
        const response = await axios.post(`${baseUrl}/api/user/v1/update-profile`, data, {
            headers,
        });
        return response.data;
    } catch (error) {
        console.error("Update Profile error", error);
        throw error;
    }
}
