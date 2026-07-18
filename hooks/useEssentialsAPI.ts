import { useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { submitEssential, updateRequest, uploadUserImage } from '@/apis/essentials';

export function useEssentialsAPI() {
    const queryClient = useQueryClient();

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

    return {
        submitMutation,
        uploadImageMutation,
    };
}
