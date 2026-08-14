import apiClient from '../client';

export interface ExchangeRatesLatestData {
    baseCode: string | null;
    date: string | null;
    unlocked: boolean;
    currencyCount: number;
    rates: Record<string, number>;
}

export interface ExchangeRateTrendPoint {
    date: string;
    baseCode: string;
    rate: number;
}

export interface ExchangeRateTrendsData {
    currency: string;
    count: number;
    trends: ExchangeRateTrendPoint[];
}

export const CURRENCY_QUERY_KEYS = {
    all: ['exchange-rates'] as const,
    latest: (unlocked: boolean) => [...CURRENCY_QUERY_KEYS.all, 'latest', unlocked] as const,
    trends: (currency: string) => [...CURRENCY_QUERY_KEYS.all, 'trends', currency] as const,
};

/**
 * GET /api/public/v1/exchange-rates/latest
 * Free tier (default): PKR, USD, AED, SAR, MYR.
 * Pass `unlocked: true` (after a rewarded ad view) to get all 160+ currencies.
 */
export async function getLatestExchangeRates(unlocked: boolean = false): Promise<ExchangeRatesLatestData> {
    const response: any = await apiClient.get('/api/public/v1/exchange-rates/latest', {
        params: unlocked ? { unlocked: true } : undefined,
    });
    return response.data;
}

/**
 * GET /api/public/v1/exchange-rates/trends?currency=USD
 * Last 30 daily snapshots for a single currency, oldest -> newest.
 */
export async function getExchangeRateTrends(currency: string): Promise<ExchangeRateTrendsData> {
    const response: any = await apiClient.get('/api/public/v1/exchange-rates/trends', {
        params: { currency },
    });
    return response.data;
}
