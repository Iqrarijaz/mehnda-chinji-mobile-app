import apiClient from '../client';

export const getSupportTickets = async ({ status, page = 1, limit = 20 }: { status?: string; page?: number; limit?: number }) => {
    return apiClient.get('/api/user/v1/support/tickets', {
        params: { status, page, limit }
    });
};

export const createSupportTicket = async (formData: FormData) => {
    return apiClient.post('/api/user/v1/support/ticket/create', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
};

export const getTicketById = async (id: string) => {
    return apiClient.get(`/api/user/v1/support/ticket/${id}`);
};

export const deleteSupportTicket = async (id: string) => {
    return apiClient.delete(`/api/user/v1/support/ticket/${id}`);
};

export const replyToSupportTicket = async (id: string, formData: FormData) => {
    return apiClient.post(`/api/user/v1/support/ticket/${id}/reply`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
};
