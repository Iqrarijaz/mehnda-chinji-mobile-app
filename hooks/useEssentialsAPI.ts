import { useMutation, useQueryClient, useInfiniteQuery, useQuery } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import {
    submitEssential,
    updateRequest,
    uploadUserImage,
    deleteRequest,
    ESSENTIAL_SUBMISSION_QUERY_KEYS,
    ESSENTIALS_QUERY_KEYS,
    getEssentialsList,
    getMyRequests
} from '@/apis/essentials';
import { getAuthenticatedConfiguration } from '@/apis/configuration';

interface UseEssentialsAPIOptions {
    category?: string;
    search?: string;
    type?: string;
    activeTab?: 'all' | 'requests';
    onDeleteSuccess?: () => void;
}

export function useEssentialsAPI(options?: UseEssentialsAPIOptions) {
    const queryClient = useQueryClient();
    const category = options?.category;
    const search = options?.search;
    const type = options?.type;
    const activeTab = options?.activeTab;
    const onDeleteSuccess = options?.onDeleteSuccess;

    const essentialsConfigQuery = useQuery({
        queryKey: ['configuration', 'ESSENTIALS_ICONS'],
        queryFn: () => getAuthenticatedConfiguration('ESSENTIALS_ICONS'),
        staleTime: 0, // Force fresh fetch to get newly added tags configuration
    });

    const submitMutation = useMutation({
        mutationFn: async ({ payload, isEditing, id }: { payload: any; isEditing: boolean; id?: string }) => {
            if (isEditing && id) {
                return updateRequest(id, payload);
            }
            return submitEssential(payload);
        },
        onSuccess: (data, variables) => {
            Toast.show({
                type: 'success',
                text1: variables.isEditing ? 'Updated' : 'Submitted',
                text2: variables.isEditing ? 'Request updated successfully.' : 'Request submitted successfully pending approval.',
            });
            queryClient.invalidateQueries({ queryKey: ['my-essential-requests'] });
        },
        onError: (error: any) => {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error?.message || error || 'Something went wrong',
            });
        },
    });

    const uploadImageMutation = useMutation({
        mutationFn: async (formData: FormData) => {
            return uploadUserImage(formData);
        },
        onError: (error: any) => {
            console.error('Upload Error:', error);
            Toast.show({
                type: 'error',
                text1: 'Upload Failed',
                text2: 'Could not upload image. Please try again.',
            });
        }
    });

    // 1. All Places
    const infiniteQuery = useInfiniteQuery({
        queryKey: ESSENTIALS_QUERY_KEYS.list({ category, search, type }),
        queryFn: ({ pageParam = 0 }) => getEssentialsList({
            category,
            search,
            type,
            skip: (pageParam as number) * 20,
            limit: 20
        }),
        getNextPageParam: (lastPage: any) => {
            const pagination = lastPage?.pagination;
            if (pagination && pagination.currentPage < pagination.totalPages) {
                return pagination.currentPage + 1;
            }
            return undefined;
        },
        initialPageParam: 0,
        enabled: !!category && activeTab === 'all',
    });

    // 2. My Requests
    const myRequestsQuery = useInfiniteQuery({
        queryKey: ESSENTIAL_SUBMISSION_QUERY_KEYS.myRequests({ page: 1, category }),
        queryFn: ({ pageParam = 1 }) => getMyRequests({ page: pageParam, category }),
        getNextPageParam: (lastPage: any) => {
            const pagination = lastPage?.pagination;
            if (pagination && pagination.page < pagination.pages) {
                return pagination.page + 1;
            }
            return undefined;
        },
        initialPageParam: 1,
        enabled: !!category && activeTab === 'requests',
    });

    // 3. Delete Request
    const deleteMutation = useMutation({
        mutationFn: deleteRequest,
        onSuccess: () => {
            Toast.show({
                type: 'success',
                text1: 'Deleted',
                text2: 'Request deleted successfully.',
            });
            onDeleteSuccess?.();
            queryClient.invalidateQueries({ queryKey: ['my-essential-requests'] });
        },
        onError: (error: any) => {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error?.message || error || 'Something went wrong',
            });
        }
    });

    return {
        essentialsConfigQuery,
        submitMutation,
        uploadImageMutation,
        infiniteQuery,
        myRequestsQuery,
        deleteMutation,
    };
}
