import apiClient from "../client";

export const WATER_SUPPLY_QUERY_KEYS = {
    all: ['water-supply'] as const,
    connections: (filters: any) => [...WATER_SUPPLY_QUERY_KEYS.all, 'connections', filters] as const,
    bills: (filters: any) => [...WATER_SUPPLY_QUERY_KEYS.all, 'bills', filters] as const,
    expenses: (filters: any) => [...WATER_SUPPLY_QUERY_KEYS.all, 'expenses', filters] as const,
    report: (filters: any) => [...WATER_SUPPLY_QUERY_KEYS.all, 'report', filters] as const,
};

export function listConnections(params?: {
    search?: string;
    page?: number;
    limit?: number;
    status?: string;
}) {
    return apiClient.get('/api/user/v1/water-supply/connections/list', { params });
}

export function createConnection(data: {
    name: string;
    phoneNumber?: string;
    address?: string;
    monthlyRate?: number;
    userId?: string | null;
}) {
    return apiClient.post('/api/user/v1/water-supply/connections/create', data);
}

export function updateConnection(data: {
    _id: string;
    name?: string;
    phoneNumber?: string;
    address?: string;
    status?: string;
    userId?: string | null;
}) {
    return apiClient.post('/api/user/v1/water-supply/connections/update', data);
}

export function deleteConnection(connectionId: string) {
    return apiClient.post('/api/user/v1/water-supply/connections/delete', { connectionId });
}

export function listBills(params?: {
    connectionId?: string;
    status?: string;
    billingMonth?: string;
    page?: number;
    limit?: number;
}) {
    return apiClient.get('/api/user/v1/water-supply/bills/list', { params });
}

export function createBill(data: {
    connectionId: string;
    billingMonth: string;
    amount: number;
}) {
    return apiClient.post('/api/user/v1/water-supply/bills/create', data);
}

export function bulkCreateBills(data: {
    billingMonth: string;
    amount: number;
}) {
    return apiClient.post('/api/user/v1/water-supply/bills/bulk-create', data);
}

export function updateBill(data: {
    _id: string;
    amount: number;
    billingMonth: string;
}) {
    return apiClient.post('/api/user/v1/water-supply/bills/update', data);
}

export function deleteBill(billId: string) {
    return apiClient.post('/api/user/v1/water-supply/bills/delete', { billId });
}

export function payBill(billId: string, paymentMode: string) {
    return apiClient.post('/api/user/v1/water-supply/bills/pay', { billId, paymentMode });
}

export function listExpenses(params?: {
    search?: string;
    expenseMonth?: string;
    page?: number;
    limit?: number;
}) {
    return apiClient.get('/api/user/v1/water-supply/expenses/list', { params });
}

export function createExpense(data: {
    title: string;
    amount: number;
    expenseDate?: string | Date;
}) {
    return apiClient.post('/api/user/v1/water-supply/expenses/create', data);
}

export function updateExpense(data: {
    _id: string;
    title?: string;
    amount?: number;
    expenseDate?: string | Date;
}) {
    return apiClient.post('/api/user/v1/water-supply/expenses/update', data);
}

export function deleteExpense(expenseId: string) {
    return apiClient.post('/api/user/v1/water-supply/expenses/delete', { expenseId });
}

export function getFinancialReport(params?: {
    reportMonth?: string;
    months?: number;
}) {
    return apiClient.get('/api/user/v1/water-supply/reports', { params });
}
