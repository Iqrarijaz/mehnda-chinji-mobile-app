import { useQuery } from '@tanstack/react-query';

import { METALS_QUERY_KEYS, getLatestMetals, getMetalTrends } from '@/apis/metals';

// Metals.dev, like the exchange-rate API, only refreshes once a day on the
// backend — cache heavily so re-opening the screen is instant.
const ONE_DAY = 1000 * 60 * 60 * 24;

export function useMetals() {
    const { data, isLoading, isFetching, error, refetch } = useQuery({
        queryKey: METALS_QUERY_KEYS.latest(),
        queryFn: getLatestMetals,
        staleTime: ONE_DAY,
        gcTime: ONE_DAY * 2,
        refetchOnWindowFocus: false,
    });

    return {
        metalsData: data,
        isMetalsLoading: isLoading,
        isMetalsFetching: isFetching,
        metalsError: error,
        refetchMetals: refetch,
    };
}

export function useMetalTrends(metal: string | null) {
    const { data, isLoading, error } = useQuery({
        queryKey: METALS_QUERY_KEYS.trends(metal ?? ''),
        queryFn: () => getMetalTrends(metal as string),
        enabled: !!metal,
        staleTime: ONE_DAY,
        gcTime: ONE_DAY * 2,
    });

    return {
        trendsData: data,
        isTrendsLoading: isLoading,
        trendsError: error,
    };
}
