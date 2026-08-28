import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import {
    registerBusiness,
    getBusinessStatus,
    getBusinessesList,
    deleteBusiness,
    manageBusinessSearch,
    updateBusiness,
    BUSINESS_QUERY_KEYS
} from '@/apis/business';
import { getAuthenticatedConfiguration, CONFIG_QUERY_KEYS } from '@/apis/configuration';

interface UseBusinessAPIOptions {
    filters?: any;
    enabledList?: boolean;
    onDeleteSuccess?: () => void;
    onUpdateSuccess?: () => void;
    onRegisterSuccess?: () => void;
}

export function useBusinessAPI(options?: UseBusinessAPIOptions) {
    const queryClient = useQueryClient();
    const filters = options?.filters;
    const enabledList = options?.enabledList;
    const onDeleteSuccess = options?.onDeleteSuccess;
    const onUpdateSuccess = options?.onUpdateSuccess;
    const onRegisterSuccess = options?.onRegisterSuccess;

    // 1. Professions list config query
    const professionsConfigQuery = useQuery({
        queryKey: CONFIG_QUERY_KEYS.professions,
        queryFn: () => getAuthenticatedConfiguration('PROFESSIONS'),
        staleTime: 1000 * 60 * 60 * 24, // 24 hours
    });

    // 2. Businesses List Infinite Query
    const infiniteQuery = useInfiniteQuery({
        queryKey: BUSINESS_QUERY_KEYS.list(filters || {}),
        queryFn: ({ pageParam = 1 }) => getBusinessesList({
            text: filters?.text,
            categoryEn: filters?.categoryEn,
            currentPage: pageParam
        }),
        getNextPageParam: (lastPage: any, allPages: any[]) => {
            const pagination = lastPage?.pagination;
            if (pagination && pagination.currentPage < pagination.totalPages) {
                return pagination.currentPage + 1;
            }
            const currentData = lastPage?.data;
            if (Array.isArray(currentData) && currentData.length === 20) {
                return (Array.isArray(allPages) ? allPages.length : 0) + 1;
            }
            return undefined;
        },
        initialPageParam: 1,
        enabled: enabledList !== false,
    });

    // 3. My Registered Business Query
    const myBusinessQuery = useQuery({
        queryKey: BUSINESS_QUERY_KEYS.myBusiness(),
        queryFn: getBusinessStatus,
    });

    // Mutations
    const registerMutation = useMutation({
        mutationFn: registerBusiness,
        onSuccess: (res: any) => {
            if (res.success) {
                queryClient.invalidateQueries({ queryKey: BUSINESS_QUERY_KEYS.myBusiness() });
                // Success is communicated via the caller's ThankYouModal, not a toast.
                if (onRegisterSuccess) onRegisterSuccess();
            }
        },
        onError: (err: any) => {
            Toast.show({ type: 'error', text1: 'Error', text2: err?.message || 'Registration failed' });
        }
    });

    const updateMutation = useMutation({
        mutationFn: updateBusiness,
        onSuccess: (res: any) => {
            if (res.success) {
                queryClient.invalidateQueries({ queryKey: BUSINESS_QUERY_KEYS.myBusiness() });
                // Success is communicated via the caller's ThankYouModal, not a toast.
                if (onUpdateSuccess) onUpdateSuccess();
            }
        },
        onError: (err: any) => {
            Toast.show({ type: 'error', text1: 'Error', text2: err?.message || 'Update failed' });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: deleteBusiness,
        onSuccess: (res: any) => {
            if (res.success) {
                queryClient.invalidateQueries({ queryKey: BUSINESS_QUERY_KEYS.all });
                Toast.show({ type: 'success', text1: 'Deleted', text2: 'Business deleted successfully.' });
                if (onDeleteSuccess) onDeleteSuccess();
            }
        },
        onError: (err: any) => {
            Toast.show({ type: 'error', text1: 'Error', text2: err?.message || 'Failed to delete business' });
        }
    });

    const manageSearchMutation = useMutation({
        mutationFn: ({ businessId, search }: { businessId: string; search: boolean }) =>
            manageBusinessSearch(businessId, search),
        onSuccess: (res: any, variables) => {
            if (res.success) {
                queryClient.invalidateQueries({ queryKey: BUSINESS_QUERY_KEYS.myBusiness() });
                Toast.show({
                    type: 'success',
                    text1: 'Status Updated',
                    text2: variables.search ? 'Business is now searchable' : 'Business is now hidden from search'
                });
            }
        },
        onError: (err: any) => {
            Toast.show({ type: 'error', text1: 'Error', text2: err?.message || 'Failed to update visibility status' });
        }
    });

    return {
        professionsConfigQuery,
        infiniteQuery,
        myBusinessQuery,
        registerMutation,
        updateMutation,
        deleteMutation,
        manageSearchMutation
    };
}
