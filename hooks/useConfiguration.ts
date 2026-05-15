import { useQuery } from '@tanstack/react-query';
import { getAuthenticatedConfiguration, CONFIG_QUERY_KEYS } from '@/apis/configuration';

export const useConfiguration = (type: string, queryKey: any) => {
    return useQuery({
        queryKey: queryKey,
        queryFn: () => getAuthenticatedConfiguration(type),
        staleTime: 24 * 60 * 60 * 1000, // 24 hours
    });
};

export const usePostCategories = () => {
    return useConfiguration('POST_CATEGORIES', CONFIG_QUERY_KEYS.postCategories);
};
