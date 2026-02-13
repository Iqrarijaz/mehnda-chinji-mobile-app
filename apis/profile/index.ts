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

export async function UPDATE_PROFILE(data: any) {
    try {
        const headers = await getAuthHeader();
        console.log("API REQUEST LOGS", data);
        const response = await axios.post(`${baseUrl}/api/user/v1/update-profile`, data, {
            headers,
        });
        console.log("API RESPONSE LOGS", response.data);
        return response.data;
    } catch (error) {
        console.error("Update Profile error", error);
        throw error;
    }
}

export async function DELETE_ACCOUNT(data: any) {
    try {
        const headers = await getAuthHeader();
        console.log("API REQUEST LOGS", data);
        const response = await axios.post(`${baseUrl}/api/user/v1/delete-account`, data, {
            headers,
        });
        console.log("API RESPONSE LOGS", response.data);
        return response.data;
    } catch (error) {
        console.error("Delete Account error", error);
        throw error;
    }
}

export async function CHANGE_PASSWORD(data: any) {
    try {
        const headers = await getAuthHeader();
        console.log("API REQUEST LOGS", data);
        const response = await axios.post(`${baseUrl}/api/user/v1/change-password`, data, {
            headers,
        });
        console.log("API RESPONSE LOGS", response.data);
        return response.data;
    } catch (error) {
        console.error("Change Password error", error);
        throw error;
    }
}

export async function GET_ACTIVE_SESSIONS() {
    try {
        console.log("API REQUEST LOGS");
        const headers = await getAuthHeader();
        const response = await axios.get(`${baseUrl}/api/user/v1/sessions`, {
            headers,
        });
        console.log("API RESPONSE LOGS", response.data);
        return response.data;
    } catch (error) {
        console.error("Get Active Sessions error", error);
        throw error;
    }
}

export async function REVOKE_SESSION(data: any) {
    try {
        const headers = await getAuthHeader();
        console.log("API REQUEST LOGS", data);
        const response = await axios.post(`${baseUrl}/api/user/v1/revoke-session`, data, {
            headers,
        });
        console.log("API RESPONSE LOGS", response.data);

        return response.data;
    } catch (error) {
        console.error("Revoke Session error", error);
        throw error;
    }
}

export async function LOGOUT() {
    try {
        const headers = await getAuthHeader();
        console.log("API REQUEST LOGS");
        const response = await axios.post(
            `${baseUrl}/auth/user/logout`,
            {},
            { headers }
        );
        console.log("API RESPONSE LOGS", response.data);
        return response.data;
    } catch (error) {
        console.error("Logout error", error);
        throw error;
    }
}


export async function SAVE_PUSH_TOKEN(token: string) {
    try {
        const headers = await getAuthHeader();
        console.log("API REQUEST LOGS: Save Push Token", token);
        const response = await axios.post(`${baseUrl}/api/user/v1/save-push-token`, { pushToken: token }, {
            headers,
        });
        console.log("API RESPONSE LOGS", response.data);
        return response.data;
    } catch (error) {
        console.error("Save Push Token error", error);
        throw error;
    }
}
