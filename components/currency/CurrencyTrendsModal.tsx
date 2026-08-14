import { Ionicons } from '@expo/vector-icons';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { Image } from 'expo-image';
import React, { forwardRef, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { RateTrendsSheet } from '@/components/common/RateTrendsSheet';
import { Colors } from '@/constants/colors';
import { getCurrencyFlagUrl, getCurrencyMeta } from '@/constants/currencies';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/context/ThemeContext';
import { useExchangeRateTrends } from '@/hooks/useCurrency';

export interface CurrencyTrendsModalProps {
    /** Currency code to show trends for; sheet content reflects this value until it's next opened. */
    currency: string | null;
    /** Fired once the sheet has fully closed. */
    onDismiss?: () => void;
}

const TILE_SIZE = 40;

export const CurrencyTrendsModal = forwardRef<BottomSheetModal, CurrencyTrendsModalProps>(
    ({ currency, onDismiss }, ref) => {
        const { theme } = useTheme();
        const colors = Colors[theme];
        const { trendsData, isTrendsLoading, trendsError } = useExchangeRateTrends(currency);

        const meta = currency ? getCurrencyMeta(currency) : null;
        const flagUrl = currency ? getCurrencyFlagUrl(currency) : null;

        const chartPoints = useMemo(() => {
            if (!trendsData?.trends) return [];
            // Backend stores "1 PKR = X <currency>"; invert to the user-facing "1 <currency> = X PKR".
            return trendsData.trends
                .filter((t) => t.rate > 0)
                .map((t) => ({ date: t.date, value: 1 / t.rate }));
        }, [trendsData]);

        const leading = (
            <View style={[styles.tile, { backgroundColor: colors.primary + '12' }]}>
                {flagUrl ? (
                    <Image source={{ uri: flagUrl }} style={styles.flag} contentFit="cover" />
                ) : (
                    <Ionicons name="globe-outline" size={18} color={colors.primary} />
                )}
            </View>
        );

        return (
            <RateTrendsSheet
                ref={ref}
                leading={leading}
                title={currency ? `${currency} Trend` : ''}
                subtitle={currency ? `${meta?.name} · last 30 days` : ''}
                points={chartPoints}
                isLoading={isTrendsLoading}
                isError={!!trendsError}
                onDismiss={onDismiss}
            />
        );
    }
);

CurrencyTrendsModal.displayName = 'CurrencyTrendsModal';

const styles = StyleSheet.create({
    tile: {
        width: TILE_SIZE,
        height: TILE_SIZE,
        borderRadius: Layout.borderRadius,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    flag: {
        width: TILE_SIZE,
        height: TILE_SIZE,
    },
});
