import apiClient from '../client';

export const CONFIG_QUERY_KEYS = {
    cities: ['configuration', 'CITIES'] as const,
    villages: ['configuration', 'VILLAGES'] as const,
    professions: ['configuration', 'PROFESSIONS'] as const,
    postCategories: ['configuration', 'POST_CATEGORIES'] as const,
};

/**
 * Fetch configuration by type (authenticated endpoint).
 * Used for CITIES, VILLAGES, PROFESSIONS, etc.
 */
export async function getAuthenticatedConfiguration(type: string) {
    return apiClient.get(`/api/user/v1/configuration/${type}`);
}
