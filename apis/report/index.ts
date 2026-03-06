import apiClient from '../client';

export interface ReportPayload {
    targetId: string;
    targetType: 'BUSINESS' | 'DONOR' | 'PLACE';
    reason: string;
    description?: string;
}

export async function submitReport(data: ReportPayload) {
    return apiClient.post('/api/user/v1/report', data);
}

export async function getUserReports() {
    return apiClient.get('/api/user/v1/report/list');
}

export async function updateReport(id: string, data: Partial<ReportPayload>) {
    return apiClient.put(`/api/user/v1/report/${id}`, data);
}

export async function deleteReport(id: string) {
    return apiClient.delete(`/api/user/v1/report/${id}`);
}
