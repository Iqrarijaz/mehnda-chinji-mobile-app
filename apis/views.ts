import { privateAxios } from './client';

export type EntityType = 'Marketplace' | 'Business' | 'Essential';

export const trackEntityView = async (entityId: string, entityType: EntityType) => {
    try {
        const response = await privateAxios.post('/api/user/v1/views/track', {
            entityId,
            entityType
        });
        return response.data;
    } catch (error) {
        // Silently fail view tracking so it doesn't break user experience
        console.warn(`Failed to track view for ${entityType} ${entityId}:`, error);
        return null;
    }
};
