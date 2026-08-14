import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { LinearGradient } from 'expo-linear-gradient';
import React, { forwardRef, useCallback } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
import { OCTANE_PLUS_META } from '@/constants/fuel';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/context/ThemeContext';

export interface FuelCityReading {
    city: string;
    price_pkr: number;
}

export interface FuelCitiesSheetProps {
    /** Sorted low -> high; render order is preserved as-is. */
    cities: FuelCityReading[];
    /** The price shown on the main Octane Plus card, so outlier cities can be highlighted. */
    representativePrice: number | null;
    onDismiss?: () => void;
}

/**
 * Read-only city breakdown for Octane Plus — PSO's only per-city product.
 * Most cities share the same national price; this surfaces the handful
 * that don't (e.g. Gilgit, Quetta often run a few rupees higher).
 */
export const FuelCitiesSheet = forwardRef<BottomSheetModal, FuelCitiesSheetProps>(
    ({ cities, representativePrice, onDismiss }, ref) => {
        const { theme } = useTheme();
        const colors = Colors[theme];

        const handleClose = useCallback(() => {
            (ref as React.RefObject<BottomSheetModal>)?.current?.dismiss();
        }, [ref]);

        const renderBackdrop = useCallback(
            (props: any) => (
                <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.55} pressBehavior="close" />
            ),
            []
        );

        return (
            <BottomSheetModal
                ref={ref}
                index={0}
                snapPoints={['55%', '85%']}
                backdropComponent={renderBackdrop}
                backgroundStyle={{ backgroundColor: colors.background }}
                handleIndicatorStyle={{ backgroundColor: colors.secondary, width: 40 }}
                enablePanDownToClose
                onDismiss={onDismiss}
            >
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <LinearGradient
                            colors={OCTANE_PLUS_META.gradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.tile}
                        >
                            <MaterialCommunityIcons name={OCTANE_PLUS_META.icon} size={19} color="#FFFFFF" />
                        </LinearGradient>
                        <View style={styles.headerText}>
                            <ThemedText style={styles.title}>Octane Plus by City</ThemedText>
                            <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>
                                {cities.length} {cities.length === 1 ? 'city' : 'cities'} · PKR per litre
                            </ThemedText>
                        </View>
                    </View>
                    <TouchableOpacity
                        onPress={handleClose}
                        style={[styles.closeButton, { backgroundColor: colors.cardBg }]}
                        hitSlop={8}
                    >
                        <Ionicons name="close" size={20} color={colors.text} />
                    </TouchableOpacity>
                </View>

                <BottomSheetScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                >
                    {cities.map(({ city, price_pkr }) => {
                        const isOutlier = representativePrice !== null && price_pkr !== representativePrice;
                        return (
                            <View key={city} style={[styles.row, { backgroundColor: colors.cardBg }]}>
                                <ThemedText style={styles.cityName}>{city}</ThemedText>
                                <View style={styles.priceRow}>
                                    {isOutlier && (
                                        <View style={[styles.outlierDot, { backgroundColor: colors.secondary }]} />
                                    )}
                                    <ThemedText style={[styles.price, isOutlier && { color: colors.secondary }]}>
                                        {price_pkr.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </ThemedText>
                                </View>
                            </View>
                        );
                    })}
                </BottomSheetScrollView>
            </BottomSheetModal>
        );
    }
);

FuelCitiesSheet.displayName = 'FuelCitiesSheet';

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 14,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 12,
    },
    tile: {
        width: 40,
        height: 40,
        borderRadius: Layout.borderRadius,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerText: {
        flex: 1,
        marginLeft: 12,
    },
    title: {
        fontSize: 17,
        fontWeight: '800',
    },
    subtitle: {
        fontSize: 12.5,
        marginTop: 3,
    },
    closeButton: {
        width: 34,
        height: 34,
        borderRadius: 17,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 28,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderRadius: Layout.borderRadius,
        paddingVertical: 12,
        paddingHorizontal: 14,
        marginBottom: 8,
    },
    cityName: {
        fontSize: 14,
        fontWeight: '600',
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    outlierDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    price: {
        fontSize: 14,
        fontWeight: '700',
    },
});
