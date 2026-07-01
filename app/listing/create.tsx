import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/colors';
import { CreateMarketplaceListing } from '@/components/marketplace/CreateMarketplaceListing';

export default function CreateListingScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { theme } = useTheme();
    const colors = Colors[theme];

    const listingToEdit = useMemo(() => {
        if (params.listing && typeof params.listing === 'string') {
            try {
                return JSON.parse(params.listing);
            } catch (e) {
                console.error("Failed to parse listing param", e);
                return null;
            }
        }
        return null;
    }, [params.listing]);

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{ headerShown: false }} />
            <View style={{ flex: 1 }}>
                <CreateMarketplaceListing
                    onClose={() => router.back()}
                    onSuccess={() => {
                        // The component triggers a toast and invalidates query,
                        // so we just go back.
                        router.back();
                    }}
                    listingToEdit={listingToEdit}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    }
});
