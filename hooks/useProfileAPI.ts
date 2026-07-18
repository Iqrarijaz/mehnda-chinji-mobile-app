import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { useRouter } from 'expo-router';
import { updateProfile, uploadProfileImage, deleteProfileImage } from '@/apis/profile';
import { AUTH_QUERY_KEYS } from '@/apis/login';
import { getAuthenticatedConfiguration, CONFIG_QUERY_KEYS } from '@/apis/configuration';
import { AnalyticsEvents, analyticsService } from '@/analytics';

interface UseProfileAPIOptions {
    updateUser?: (data: any) => Promise<void>;
}

export function useProfileAPI(options?: UseProfileAPIOptions) {
    const queryClient = useQueryClient();
    const router = useRouter();
    const updateUser = options?.updateUser;

    const citiesConfigQuery = useQuery({
        queryKey: CONFIG_QUERY_KEYS.cities,
        queryFn: () => getAuthenticatedConfiguration('CITIES'),
        staleTime: 1000 * 60 * 60 * 24, // 24 hours
    });

    const villagesConfigQuery = useQuery({
        queryKey: CONFIG_QUERY_KEYS.villages,
        queryFn: () => getAuthenticatedConfiguration('VILLAGES'),
        staleTime: 1000 * 60 * 60 * 24, // 24 hours
    });

    const profileMutation = useMutation({
        mutationFn: updateProfile,
        onSuccess: async (response) => {
            if (response) {
                analyticsService.trackEvent(AnalyticsEvents.PROFILE_UPDATED);
                if (updateUser) {
                    await updateUser(response);
                }
                queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.user });
                Toast.show({
                    type: 'success',
                    text1: 'Success!',
                    text2: 'Profile updated successfully',
                });
                router.replace('/(drawer)/(tabs)' as any);
            }
        },
        onError: (error: any) => {
            Toast.show({
                type: 'error',
                text1: 'Update Failed',
                text2: error?.response?.data?.message || 'Something went wrong',
            });
        }
    });

    const uploadImageMutation = useMutation({
        mutationFn: uploadProfileImage,
        onSuccess: async (response) => {
            const newUrl = response?.data?.profileImage;
            if (newUrl) {
                analyticsService.trackEvent(AnalyticsEvents.AVATAR_CHANGED, { action: 'upload' });
                if (updateUser) {
                    await updateUser({ profileImage: newUrl });
                }
                queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.user });
                Toast.show({ type: 'success', text1: 'Success', text2: 'Profile image updated' });
            }
        },
        onError: (error: any) => {
            Toast.show({ type: 'error', text1: 'Upload Failed', text2: 'Failed to upload image' });
        }
    });

    const deleteImageMutation = useMutation({
        mutationFn: deleteProfileImage,
        onSuccess: async () => {
            analyticsService.trackEvent(AnalyticsEvents.AVATAR_CHANGED, { action: 'delete' });
            if (updateUser) {
                await updateUser({ profileImage: null });
            }
            queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.user });
            Toast.show({ type: 'success', text1: 'Success', text2: 'Profile image removed' });
        },
        onError: (error: any) => {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error.response?.data?.message || 'Failed to remove image'
            });
        }
    });

    return {
        citiesConfigQuery,
        villagesConfigQuery,
        profileMutation,
        uploadImageMutation,
        deleteImageMutation
    };
}
