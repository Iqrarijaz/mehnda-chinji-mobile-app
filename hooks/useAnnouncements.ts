import { useQuery, useInfiniteQuery, keepPreviousData } from '@tanstack/react-query';
import { getAnnouncementsList, ANNOUNCEMENT_QUERY_KEYS } from '../apis/announcements';

export const useAnnouncements = (filters: { type?: string; essentialId?: string; authorId?: string; search?: string } = {}) => {
    return useQuery({
        queryKey: ANNOUNCEMENT_QUERY_KEYS.list(filters),
        queryFn: async () => {
            const res = await getAnnouncementsList(filters);
            return res?.data || [];
        },
        placeholderData: keepPreviousData,
    });
};

export const useInfiniteAnnouncements = (filters: { type?: string; essentialId?: string; authorId?: string; search?: string } = {}) => {
    return useInfiniteQuery({
        queryKey: [...ANNOUNCEMENT_QUERY_KEYS.list(filters), 'infinite'] as const,
        queryFn: async ({ pageParam = 1 }) => {
            const res = await getAnnouncementsList({ ...filters, page: pageParam, limit: 10 });
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
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
        placeholderData: keepPreviousData,
    });
};
