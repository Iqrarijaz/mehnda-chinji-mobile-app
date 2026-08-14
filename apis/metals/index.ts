import apiClient from '../client';

export interface GoldKarats {
    k24: number;
    k22: number;
    k21: number;
    k18: number;
}

export interface MetalEntry {
    price: number;
    /** Only present on the gold entry. */
    karats?: GoldKarats;
}

export interface MetalsLatestData {
    currency: string | null;
    unit: string | null;
    date: string | null;
    metals: {
        gold: MetalEntry | null;
        silver: MetalEntry | null;
        platinum: MetalEntry | null;
        palladium: MetalEntry | null;
    };
    raw: Record<string, number>;
}

export interface MetalTrendPoint {
    date: string;
    currency: string;
    unit: string;
    price: number;
}

export interface MetalTrendsData {
    metal: string;
    count: number;
    trends: MetalTrendPoint[];
}

export const METALS_QUERY_KEYS = {
    all: ['metals'] as const,
    latest: () => [...METALS_QUERY_KEYS.all, 'latest'] as const,
    trends: (metal: string) => [...METALS_QUERY_KEYS.all, 'trends', metal] as const,
};

/** GET /api/public/v1/metals/latest */
export async function getLatestMetals(): Promise<MetalsLatestData> {
    const response: any = await apiClient.get('/api/public/v1/metals/latest');
    return response.data;
}

/** GET /api/public/v1/metals/trends?metal=gold */
export async function getMetalTrends(metal: string): Promise<MetalTrendsData> {
    const response: any = await apiClient.get('/api/public/v1/metals/trends', {
        params: { metal },
    });
    return response.data;
}
