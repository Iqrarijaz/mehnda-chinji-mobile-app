import apiClient, { privateAxios } from './client';

/**
 * Fire-and-forget log of a search the user acted on (selected a result
 * for) — feeds the backend's trending-searches aggregation. Silently fails
 * so a logging hiccup never disrupts the actual search experience.
 */
export const trackSearch = async (query: string) => {
    try {
        return await privateAxios.post('/api/user/v1/search/track', { query });
    } catch (error) {
        console.warn('Failed to track search:', error);
        return null;
    }
};

/**
 * GET /api/user/v1/search/trending — top 5 most-searched terms over the
 * last 7 days, scoped to the current user's profile city.
 */
export const getTrendingSearches = async (): Promise<{ success: boolean; data: string[] }> => {
    return apiClient.get('/api/user/v1/search/trending');
};
