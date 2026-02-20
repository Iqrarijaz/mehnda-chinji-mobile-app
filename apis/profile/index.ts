import { GET_AUTH_HEADER } from '@/utils/token';
import axios from 'axios';
import { baseUrl } from '../../configs';


export async function UPDATE_PROFILE(data: any) {
    try {
        const headers = await GET_AUTH_HEADER();
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
        const headers = await GET_AUTH_HEADER();
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
        const headers = await GET_AUTH_HEADER();
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
        const headers = await GET_AUTH_HEADER();
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
        const headers = await GET_AUTH_HEADER();
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
        const headers = await GET_AUTH_HEADER();
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

export async function SAVE_PUSH_TOKEN(data: any) {
    try {
        const headers = await GET_AUTH_HEADER();
        console.log("API REQUEST LOGS", data);
        const response = await axios.post(`${baseUrl}/api/user/v1/save-push-token`, data, {
            headers,
        });
        console.log("API RESPONSE LOGS", response.data);

        return response.data;
    } catch (error) {
        console.error("Save Push Token error", error);
        throw error;
    }
}

export async function SAVE_FCM_TOKEN(data: any) {
    try {
        const headers = await GET_AUTH_HEADER();
        console.log("API REQUEST LOGS", data);
        const response = await axios.post(`${baseUrl}/api/user/v1/save-fcm-token`, data, {
            headers,
        });
        console.log("API RESPONSE LOGS", response.data);

        return response.data;
    } catch (error) {
        console.error("Save FCM Token error", error);
        throw error;
    }
}

export async function MANAGE_NOTIFICATIONS(data: any) {
    try {
        const headers = await GET_AUTH_HEADER();
        console.log("API REQUEST LOGS", data);
        const response = await axios.post(`${baseUrl}/api/user/v1/manage-notifications`, data, {
            headers,
        });
        console.log("API RESPONSE LOGS", response.data);
        return response.data;
    } catch (error) {
        console.error("Manage Notifications error", error);
        throw error;
    }
}

export async function UPLOAD_PROFILE_IMAGE(formData: FormData) {
    try {
        const headers = await GET_AUTH_HEADER();
        const response = await axios.post(`${baseUrl}/api/user/v1/upload-profile-image`, formData, {
            headers: {
                ...headers,
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    } catch (error) {
        console.error("Upload Profile Image error", error);
        throw error;
    }
}

export async function DELETE_PROFILE_IMAGE() {
    try {
        const headers = await GET_AUTH_HEADER();
        const response = await axios.delete(`${baseUrl}/api/user/v1/delete-profile-image`, {
            headers,
        });
        return response.data;
    } catch (error) {
        console.error("Delete Profile Image error", error);
        throw error;
    }
}