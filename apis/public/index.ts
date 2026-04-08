import apiClient from "../client";

export async function uploadPublicImage(formData: FormData) {
    return apiClient.post('/api/public/v1/upload-public-image', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
}
