import apiClient from "../client";

export async function uploadPublicImage(formData: FormData) {
    return apiClient.post('/api/public/v1/upload-public-image', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
}

export async function getConfiguration(type: string) {
    return apiClient.get(`/api/public/v1/configuration/${type}`);
}

export async function deletePublicImage(imageUrl: string) {
    return apiClient.post('/api/public/v1/delete-public-image', { imageUrl });
}
