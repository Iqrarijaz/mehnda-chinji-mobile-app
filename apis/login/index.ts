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
