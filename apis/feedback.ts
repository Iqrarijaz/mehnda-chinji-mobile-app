import apiClient from './client';

export interface SubmitFeedbackPayload {
    type: 'bug' | 'suggestion' | 'other';
    text: string;
    component_name?: string;
}

export const submitFeedback = async (data: SubmitFeedbackPayload) => {
    const response = await apiClient.post('/api/user/v1/feedback', data);
    return response.data;
};

export const getMyFeedback = async () => {
    const response = await apiClient.get('/api/user/v1/feedback');
    return response as any;
};
