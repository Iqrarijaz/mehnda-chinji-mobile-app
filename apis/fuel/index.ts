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

export const FUEL_QUERY_KEYS = {
    all: ['fuel-prices'] as const,
    latest: () => [...FUEL_QUERY_KEYS.all, 'latest'] as const,
    trends: (product: string, city?: string | null) => [...FUEL_QUERY_KEYS.all, 'trends', product, city ?? null] as const,
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
