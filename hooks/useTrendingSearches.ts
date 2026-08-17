import { useQuery } from '@tanstack/react-query';
import { getTrendingSearches } from '@/apis/search';

// Backend recomputes this at most every 30 min, so there's no reason to
// re-hit it more often than that from the client either.
const THIRTY_MINUTES = 1000 * 60 * 30;

/** Top 5 most-searched terms in the user's city over the last 7 days. */
export function useTrendingSearches(enabled: boolean = true) {
    const { data, isLoading } = useQuery({
        queryKey: ['trending-searches'],
        queryFn: getTrendingSearches,
        staleTime: THIRTY_MINUTES,
        gcTime: THIRTY_MINUTES * 2,
        enabled,
    });

    return { trending: data?.data ?? [], isTrendingLoading: isLoading };
}
