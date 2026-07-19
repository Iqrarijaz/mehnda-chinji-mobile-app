import { privateAxios } from './client';
import { EntityType } from './views';

export const trackEntityInquiry = async (entityId: string, entityType: EntityType) => {
    try {
        const response = await privateAxios.post('/api/user/v1/inquiries/track', {
            entityId,
            entityType
        });
        return response.data;
    } catch (error) {
        // Silently fail inquiry tracking so it doesn't break user experience
        console.warn(`Failed to track inquiry for ${entityType} ${entityId}:`, error);
        return null;
    }
};
