import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { BackHandler } from 'react-native';

/**
 * Hook to handle Android hardware back button.
 * @param onBack Press handler. Should return true to indicate the event is handled, 
 *               or false/undefined to allow the default behavior (usually navigator.goBack() or exit).
 */
export function useBackHandler(onBack: () => boolean | null | undefined) {
    useFocusEffect(
        useCallback(() => {
            const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
                return onBack() ?? false;
            });

            return () => subscription.remove();
        }, [onBack])
    );
}
