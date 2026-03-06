import apiClient from '../client';

export async function updateProfile(data: any) {
    return apiClient.post('/api/user/v1/update-profile', data);
}

export async function deleteAccount(data: any) {
    return apiClient.post('/api/user/v1/delete-account', data);
}

export async function changePassword(data: any) {
    return apiClient.post('/api/user/v1/change-password', data);
}

export async function getActiveSessions() {
    return apiClient.get('/api/user/v1/sessions');
}

export async function revokeSession(data: any) {
    return apiClient.post('/api/user/v1/revoke-session', data);
}

export async function logout() {
    return apiClient.post('/auth/user/logout', {});
}

export async function savePushToken(data: any) {
    return apiClient.post('/api/user/v1/save-push-token', data);
}

export async function uploadProfileImage(formData: FormData) {
    return apiClient.post('/api/user/v1/upload-profile-image', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
}

export async function deleteProfileImage() {
    return apiClient.delete('/api/user/v1/delete-profile-image');
}

export const updateLocationApi = async (data: { latitude: number; longitude: number }) => {
    return apiClient.post('/api/user/v1/update-location', {
        latitude: data.latitude,
        longitude: data.longitude
    });
};

export async function acceptTerms(data: { version: string }) {
    return apiClient.post('/api/user/v1/accept-terms', data);
}

export async function acceptPrivacyPolicy(data: { version: string }) {
    return apiClient.post('/api/user/v1/accept-privacy-policy', data);
}

export async function acceptCommunityGuidelines(data: { version: string }) {
    return apiClient.post('/api/user/v1/accept-community-guidelines', data);
}
