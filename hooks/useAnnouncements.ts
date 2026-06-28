import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { getAnnouncementsList, ANNOUNCEMENT_QUERY_KEYS } from '../apis/announcements';

export const useAnnouncements = (filters: { type?: string; essentialId?: string; authorId?: string } = {}) => {
    return useQuery({
        queryKey: ANNOUNCEMENT_QUERY_KEYS.list(filters),
        queryFn: async () => {
            const res = await getAnnouncementsList(filters);
            return res?.data || [];
        },
        placeholderData: keepPreviousData,
    });
};
