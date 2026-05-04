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

export async function checkAccountExistsApi(data: { email?: string, phone?: string }) {
    return apiClient.post('/auth/user/check-account-exists', data);
}

export async function googleLoginApi(data: any) {
    return apiClient.post('/auth/user/google-login', data);
}

export async function facebookLoginApi(data: any) {
    return apiClient.post('/auth/user/facebook-login', data);
}
