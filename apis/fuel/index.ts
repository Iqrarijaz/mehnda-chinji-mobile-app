import apiClient from '../client';

export interface FuelReading {
    price_pkr: number;
    unit: string;
    effective_date: string | null;
}

/**
 * National products (petrol, lpg, ...) store a single reading directly.
 * City-specific products (octane_plus is PSO's only one today) nest a
 * city -> reading map instead, since PSO prices it per city.
 */
export type FuelPriceEntry = FuelReading | Record<string, FuelReading>;

export function isFuelReading(entry: FuelPriceEntry): entry is FuelReading {
    return typeof (entry as FuelReading)?.price_pkr === 'number';
}

export interface FuelPricesLatestData {
    date: string | null;
    source: string;
    prices: Record<string, FuelPriceEntry>;
}

export interface FuelTrendPoint {
    date: string;
    price_pkr: number;
    unit: string;
}

export interface FuelTrendsData {
    product: string;
    city: string | null;
    count: number;
    trends: FuelTrendPoint[];
}

export interface FuelSummarySeriesPoint {
    date: string;
    price_pkr: number;
}

export interface FuelSummaryItem {
    product: string;
    city: string | null;
    /** False when nothing is stored for this product; price and series are then empty. */
    available: boolean;
    price_pkr: number | null;
    unit: string | null;
    date: string | null;
    /** Movement against the previous stored day, not the start of the window. */
    change: number | null;
    changePercent: number | null;
    direction: 'up' | 'down' | 'flat';
    series: FuelSummarySeriesPoint[];
}

export interface FuelSummaryData {
    days: number;
    count: number;
    items: FuelSummaryItem[];
}

export const FUEL_QUERY_KEYS = {
    all: ['fuel-prices'] as const,
    latest: () => [...FUEL_QUERY_KEYS.all, 'latest'] as const,
    trends: (product: string, city?: string | null) => [...FUEL_QUERY_KEYS.all, 'trends', product, city ?? null] as const,
    summary: (products: string[], days: number) => [...FUEL_QUERY_KEYS.all, 'summary', products.join(','), days] as const,
};

/** GET /api/public/v1/fuel-prices/latest */
export async function getLatestFuelPrices(): Promise<FuelPricesLatestData> {
    const response: any = await apiClient.get('/api/public/v1/fuel-prices/latest');
    return response.data;
}

/** GET /api/public/v1/fuel-prices/trends?product=petrol&city=Karachi */
export async function getFuelPriceTrends(product: string, city?: string): Promise<FuelTrendsData> {
    const response: any = await apiClient.get('/api/public/v1/fuel-prices/trends', {
        params: city ? { product, city } : { product },
    });
    return response.data;
}

/**
 * GET /api/public/v1/fuel-prices/summary?products=petrol,octane_plus&days=7
 *
 * One call for the home carousel. Assembling this from /latest plus a /trends
 * per product would be three round trips on a screen opened constantly.
 */
export async function getFuelPriceSummary(
    products: string[],
    days: number,
): Promise<FuelSummaryData> {
    const response: any = await apiClient.get('/api/public/v1/fuel-prices/summary', {
        params: { products: products.join(','), days },
    });
    return response.data;
}
