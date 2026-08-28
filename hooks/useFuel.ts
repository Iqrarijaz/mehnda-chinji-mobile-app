import { useQuery } from '@tanstack/react-query';

import { FUEL_QUERY_KEYS, getFuelPriceSummary, getFuelPriceTrends, getLatestFuelPrices } from '@/apis/fuel';

// PSO prices only refresh once a day on the backend — cache heavily so
// re-opening the screen is instant.
const ONE_DAY = 1000 * 60 * 60 * 24;

export function useFuelPrices() {
    const { data, isLoading, isFetching, error, refetch } = useQuery({
        queryKey: FUEL_QUERY_KEYS.latest(),
        queryFn: getLatestFuelPrices,
        staleTime: ONE_DAY,
        gcTime: ONE_DAY * 2,
        refetchOnWindowFocus: false,
    });

    return {
        fuelData: data,
        isFuelLoading: isLoading,
        isFuelFetching: isFetching,
        fuelError: error,
        refetchFuel: refetch,
    };
}

export function useFuelPriceTrends(product: string | null, city?: string | null) {
    const { data, isLoading, error } = useQuery({
        queryKey: FUEL_QUERY_KEYS.trends(product ?? '', city),
        queryFn: () => getFuelPriceTrends(product as string, city ?? undefined),
        enabled: !!product,
        staleTime: ONE_DAY,
        gcTime: ONE_DAY * 2,
    });

    return {
        trendsData: data,
        isTrendsLoading: isLoading,
        trendsError: error,
    };
}

/** Products and window the home carousel's fuel slide asks for. */
export const HOME_FUEL_PRODUCTS = ['petrol', 'octane_plus'];
export const HOME_FUEL_DAYS = 7;

/**
 * Petrol and high octane with a week of history, in a single request.
 *
 * Same day-long cache as the rest of the fuel data: PSO publishes once a day,
 * so anything shorter just burns requests on a screen opened many times a day.
 */
export function useFuelSummary(
    products: string[] = HOME_FUEL_PRODUCTS,
    days: number = HOME_FUEL_DAYS,
) {
    const { data, isLoading, isFetching, error } = useQuery({
        queryKey: FUEL_QUERY_KEYS.summary(products, days),
        queryFn: () => getFuelPriceSummary(products, days),
        staleTime: ONE_DAY,
        gcTime: ONE_DAY * 2,
        refetchOnWindowFocus: false,
    });

    return {
        summary: data,
        isSummaryLoading: isLoading,
        isSummaryFetching: isFetching,
        summaryError: error,
    };
}
