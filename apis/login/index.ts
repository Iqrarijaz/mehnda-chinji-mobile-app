import axios from 'axios';
import { baseUrl } from '../../configs';

export const AUTH_QUERY_KEYS = {
    user: ['user'] as const,
};

export async function SIGNUP(data: any) {
    try {
        console.log("API REQUEST LOGS", data);
        const response = await axios.post(`${baseUrl}/auth/user/signup-with-email`, data);
        console.log("API RESPONSE LOGS", response.data);
        return response.data;
    } catch (error) {
        console.error("Signup error", error);
        throw error;
    }
}

export async function LOGIN_API(data: any) {
    try {
        console.log("API REQUEST LOGS", data);
        const response = await axios.post(`${baseUrl}/auth/user/login-with-email`, data);
        console.log("API RESPONSE LOGS", response.data);
        return response.data;
    } catch (error) {
        console.error("Login error", error);
        throw error;
    }
}

export async function GOOGLE_LOGIN_API(data: any) {
    try {
        console.log("API REQUEST LOGS", data);
        const response = await axios.post(`${baseUrl}/auth/user/google-login`, data);
        console.log("API RESPONSE LOGS", response.data);
        return response.data;
    } catch (error) {
        console.error("Google Login error", error);
        throw error;
    }
}

export const UPDATE_LOCATION_API = async (data: { latitude: number; longitude: number; token: string }) => {
    try {
        const response = await axios.post(`${baseUrl}/auth/user/update-location`,
            { latitude: data.latitude, longitude: data.longitude },
            { headers: { Authorization: `Bearer ${data.token}` } }
        );
        return response.data;
    } catch (error: any) {
        throw error.response?.data || error.message;
    }
};


