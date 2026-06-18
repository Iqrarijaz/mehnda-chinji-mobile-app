import apiClient from './client';

export interface OptimizeTextRequest {
    module: 'business' | 'essentials';
    category: string;
    type: 'description' | 'services';
    text: string;
    tags?: { eng: string; ur: string }[];
}

export interface OptimizeTextResponse {
    success: boolean;
    optimizedText: string;
}

export async function optimizeText(data: OptimizeTextRequest): Promise<OptimizeTextResponse> {
    const response = await apiClient.post<any>('/api/user/v1/ai/optimize', data);
    return response as any; // apiClient interceptor resolves with response.data directly
}
