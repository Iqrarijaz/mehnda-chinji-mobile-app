import { useQuery, useInfiniteQuery, keepPreviousData } from '@tanstack/react-query';
import { getMarketplaceList, getMyMarketplaceList, MARKETPLACE_QUERY_KEYS } from '../apis/marketplace';

export const useMarketplace = (filters: any = {}) => {
    return useQuery({
        queryKey: MARKETPLACE_QUERY_KEYS.list(filters),
        queryFn: async () => {
            const res = await getMarketplaceList(filters);
            return res?.data || [];
        },
        placeholderData: keepPreviousData,
    });
};

export const useInfiniteMarketplace = (filters: any = {}) => {
    return useInfiniteQuery({
        queryKey: [...MARKETPLACE_QUERY_KEYS.list(filters), 'infinite'] as const,
        queryFn: async ({ pageParam = 1 }) => {
            const res = await getMarketplaceList({ ...filters, page: pageParam, limit: 20 });
            return res;
        },
        initialPageParam: 1,
        getNextPageParam: (lastPage: any) => {
            const pagination = lastPage?.pagination;
            if (pagination && pagination.page < pagination.pages) {
                return pagination.page + 1;
            }
            return undefined;
        },
        placeholderData: keepPreviousData,
    });
};

export const useInfiniteMyMarketplace = (filters: any = {}) => {
    return useInfiniteQuery({
        queryKey: [...MARKETPLACE_QUERY_KEYS.myList(filters), 'infinite'] as const,
        queryFn: async ({ pageParam = 1 }) => {
            const res = await getMyMarketplaceList({ ...filters, page: pageParam, limit: 10 });
            return res;
        },
        initialPageParam: 1,
        getNextPageParam: (lastPage: any) => {
            const pagination = lastPage?.pagination;
            if (pagination && pagination.page < pagination.pages) {
                return pagination.page + 1;
            }
            return undefined;
        },
        placeholderData: keepPreviousData,
    });
};
