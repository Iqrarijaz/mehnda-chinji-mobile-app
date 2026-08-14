import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { LinearGradient } from 'expo-linear-gradient';
import React, { forwardRef, useMemo } from 'react';
import { StyleSheet } from 'react-native';

import { RateTrendsSheet } from '@/components/common/RateTrendsSheet';
import { BASE_METALS_META, METALS_META } from '@/constants/metals';
import { Layout } from '@/constants/layout';
import { useMetalTrends } from '@/hooks/useMetals';

export interface MetalTrendsModalProps {
    /** Any metal key the backend recognizes — primary (gold/silver/…) or base (copper/…). */
    metal: string | null;
    /** Fired once the sheet has fully closed. */
    onDismiss?: () => void;
}

const TILE_SIZE = 40;
const FALLBACK_GRADIENT: [string, string] = ['#94A3B8', '#64748B'];

function resolveMeta(metal: string) {
    return (METALS_META as Record<string, { label: string; gradient: [string, string]; icon: any }>)[metal]
        ?? (BASE_METALS_META as Record<string, { label: string; gradient: [string, string]; icon: any }>)[metal]
        ?? null;
}

export const MetalTrendsModal = forwardRef<BottomSheetModal, MetalTrendsModalProps>(
    ({ metal, onDismiss }, ref) => {
        const { trendsData, isTrendsLoading, trendsError } = useMetalTrends(metal);
        const meta = metal ? resolveMeta(metal) : null;

        const chartPoints = useMemo(() => {
            if (!trendsData?.trends) return [];
            return trendsData.trends.map((t) => ({ date: t.date, value: t.price }));
        }, [trendsData]);

        const leading = (
            <LinearGradient
                colors={meta?.gradient ?? FALLBACK_GRADIENT}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.tile}
            >
                <MaterialCommunityIcons name={meta?.icon ?? 'chart-line'} size={19} color="#FFFFFF" />
            </LinearGradient>
        );

        return (
            <RateTrendsSheet
                ref={ref}
                leading={leading}
                title={meta ? `${meta.label} Trend` : ''}
                subtitle="Per gram · last 30 days"
                points={chartPoints}
                isLoading={isTrendsLoading}
                isError={!!trendsError}
                onDismiss={onDismiss}
            />
        );
    }
);

MetalTrendsModal.displayName = 'MetalTrendsModal';

const styles = StyleSheet.create({
    tile: {
        width: TILE_SIZE,
        height: TILE_SIZE,
        borderRadius: Layout.borderRadius,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
