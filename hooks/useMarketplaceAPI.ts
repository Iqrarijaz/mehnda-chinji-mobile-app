import { useQuery, useMutation, useQueryClient, useInfiniteQuery, keepPreviousData } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import {
    getMarketplaceDetails,
    deleteMarketplaceListing,
    markMarketplaceListingAsSold,
    toggleMarketplaceListingStatus,
    getMarketplaceList,
    getMyMarketplaceList,
    MARKETPLACE_QUERY_KEYS
} from '@/apis/marketplace';
import { getAuthenticatedConfiguration, CONFIG_QUERY_KEYS } from '@/apis/configuration';

interface UseMarketplaceAPIOptions {
    id?: string;
    filters?: any;
    isMineTab?: boolean;
    onDeleteSuccess?: () => void;
}

export function useMarketplaceAPI(options?: UseMarketplaceAPIOptions) {
    const queryClient = useQueryClient();
    const router = useRouter();
    const id = options?.id;
    const filters = options?.filters;
    const isMineTab = options?.isMineTab;
    const onDeleteSuccess = options?.onDeleteSuccess;

    // Config Query
    const categoriesConfigQuery = useQuery({
        queryKey: CONFIG_QUERY_KEYS.marketplaceCategories,
        queryFn: () => getAuthenticatedConfiguration('MARKETPLACE_CATEGORIES'),
        staleTime: 1000 * 60 * 60 * 12, // 12 hours
    });

    // Details Query
    const detailsQuery = useQuery({
        queryKey: MARKETPLACE_QUERY_KEYS.details(id as string),
        queryFn: () => getMarketplaceDetails(id as string),
        enabled: !!id,
    });

    // Public Listings Infinite Query
    const infiniteQuery = useInfiniteQuery({
        queryKey: [...MARKETPLACE_QUERY_KEYS.list(filters || {}), 'infinite'] as const,
        queryFn: async ({ pageParam = 1 }) => {
            return getMarketplaceList({ ...(filters || {}), page: pageParam, limit: 20 });
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
        enabled: !isMineTab && !id,
    });

    // Personal Listings Infinite Query
    const myListQuery = useInfiniteQuery({
        queryKey: [...MARKETPLACE_QUERY_KEYS.myList({ status: undefined }), 'infinite'] as const,
        queryFn: async ({ pageParam = 1 }) => {
            return getMyMarketplaceList({ status: undefined, page: pageParam, limit: 10 });
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
        enabled: !!isMineTab && !id,
    });

    // Mutations
    const markSoldMutation = useMutation({
        mutationFn: () => markMarketplaceListingAsSold(id as string),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: MARKETPLACE_QUERY_KEYS.all });
            queryClient.invalidateQueries({ queryKey: MARKETPLACE_QUERY_KEYS.details(id as string) });
            Toast.show({ type: 'success', text1: 'Success', text2: 'Item marked as sold!' });
        },
        onError: (err: any) => {
            Toast.show({ type: 'error', text1: 'Error', text2: err?.message || 'Failed to update listing' });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: () => deleteMarketplaceListing(id as string),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: MARKETPLACE_QUERY_KEYS.all });
            Toast.show({ type: 'success', text1: 'Deleted', text2: 'Listing deleted successfully!' });
            if (onDeleteSuccess) {
                onDeleteSuccess();
            } else {
                router.back();
            }
        },
        onError: (err: any) => {
            Toast.show({ type: 'error', text1: 'Error', text2: err?.message || 'Failed to delete listing' });
        }
    });

    const toggleStatusMutation = useMutation({
        mutationFn: (newStatus: 'live' | 'offline') => toggleMarketplaceListingStatus(id as string, newStatus),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: MARKETPLACE_QUERY_KEYS.all });
            queryClient.invalidateQueries({ queryKey: MARKETPLACE_QUERY_KEYS.details(id as string) });
            Toast.show({ type: 'success', text1: 'Success', text2: 'Listing status updated!' });
        },
        onError: (err: any) => {
            Toast.show({ type: 'error', text1: 'Error', text2: err?.message || 'Failed to update status' });
        }
    });

    return {
        categoriesConfigQuery,
        detailsQuery,
        infiniteQuery,
        myListQuery,
        markSoldMutation,
        deleteMutation,
        toggleStatusMutation
    };
}
