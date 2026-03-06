import apiClient from '../client';

export const AUTH_QUERY_KEYS = {
    user: ['user'] as const,
};

export async function signup(data: any) {
    return apiClient.post('/auth/user/signup-with-email', data);
}

export async function loginApi(data: any) {
    return apiClient.post('/auth/user/login-with-email', data);
}

export async function googleLoginApi(data: any) {
    return apiClient.post('/auth/user/google-login', data);
}




