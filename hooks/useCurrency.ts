import { useQuery } from '@tanstack/react-query';

import { CURRENCY_QUERY_KEYS, getExchangeRateTrends, getLatestExchangeRates } from '@/apis/currency';

// Rates only refresh once a day on the backend, so cache heavily and avoid
// re-hitting the backend every time the user re-opens the screen.
const ONE_DAY = 1000 * 60 * 60 * 24;

export function useExchangeRates(unlocked: boolean) {
    const { data, isLoading, isFetching, error, refetch } = useQuery({
        queryKey: CURRENCY_QUERY_KEYS.latest(unlocked),
        queryFn: () => getLatestExchangeRates(unlocked),
        staleTime: ONE_DAY,
        gcTime: ONE_DAY * 2,
        refetchOnWindowFocus: false,
    });

    return {
        ratesData: data,
        isRatesLoading: isLoading,
        isRatesFetching: isFetching,
        ratesError: error,
        refetchRates: refetch,
    };
}

export function useExchangeRateTrends(currency: string | null) {
    const { data, isLoading, error } = useQuery({
        queryKey: CURRENCY_QUERY_KEYS.trends(currency ?? ''),
        queryFn: () => getExchangeRateTrends(currency as string),
        enabled: !!currency,
        staleTime: ONE_DAY,
        gcTime: ONE_DAY * 2,
    });

    return {
        trendsData: data,
        isTrendsLoading: isLoading,
        trendsError: error,
    };
}
