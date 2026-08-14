import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { LinearGradient } from 'expo-linear-gradient';
import React, { forwardRef, useMemo } from 'react';
import { StyleSheet } from 'react-native';

import { RateTrendsSheet } from '@/components/common/RateTrendsSheet';
import { getFuelProductMeta } from '@/constants/fuel';
import { Layout } from '@/constants/layout';
import { useFuelPriceTrends } from '@/hooks/useFuel';

export interface FuelTrendsModalProps {
    /** PSO product to show trends for — national products only (petrol, hsd, lpg, ...). */
    product: string | null;
    /** Fired once the sheet has fully closed. */
    onDismiss?: () => void;
}

const TILE_SIZE = 40;

export const FuelTrendsModal = forwardRef<BottomSheetModal, FuelTrendsModalProps>(
    ({ product, onDismiss }, ref) => {
        const { trendsData, isTrendsLoading, trendsError } = useFuelPriceTrends(product);
        const meta = product ? getFuelProductMeta(product) : null;

        const chartPoints = useMemo(() => {
            if (!trendsData?.trends) return [];
            return trendsData.trends.map((t) => ({ date: t.date, value: t.price_pkr }));
        }, [trendsData]);

        const leading = (
            <LinearGradient
                colors={meta?.gradient ?? ['#94A3B8', '#64748B']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.tile}
            >
                <MaterialCommunityIcons name={meta?.icon ?? 'gas-station'} size={19} color="#FFFFFF" />
            </LinearGradient>
        );

        return (
            <RateTrendsSheet
                ref={ref}
                leading={leading}
                title={meta ? `${meta.label} Trend` : ''}
                subtitle={meta ? `${meta.unitLabel} · last 30 days` : ''}
                points={chartPoints}
                isLoading={isTrendsLoading}
                isError={!!trendsError}
                onDismiss={onDismiss}
            />
        );
    }
);

FuelTrendsModal.displayName = 'FuelTrendsModal';

const styles = StyleSheet.create({
    tile: {
        width: TILE_SIZE,
        height: TILE_SIZE,
        borderRadius: Layout.borderRadius,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
