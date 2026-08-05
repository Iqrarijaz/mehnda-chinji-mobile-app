import React from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';

import Skeleton from '@/components/common/Skeleton';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';

const { width } = Dimensions.get('window');

/**
 * Shimmer skeleton for the Marketplace details screen, mirroring the real
 * layout (image hero, title/price, action, info rows, similar items).
 */
export const MarketplaceDetailsSkeleton = React.memo(() => {
    const { theme } = useTheme();
    const colors = Colors[theme];

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Image hero */}
            <Skeleton width={width} height={300} borderRadius={0} />

            <View style={[styles.card, { backgroundColor: colors.cardBg }]}>
                {/* Title + price */}
                <Skeleton width="70%" height={22} borderRadius={6} />
                <Skeleton width="40%" height={26} borderRadius={8} style={{ marginTop: 10 }} />

                {/* Action button */}
                <Skeleton width="100%" height={52} borderRadius={26} style={{ marginTop: 18 }} />

                {/* Info rows */}
                <View style={styles.grid}>
                    {[0, 1, 2, 3].map((i) => (
                        <Skeleton key={i} width={(width - 44) / 2} height={64} borderRadius={16} />
                    ))}
                </View>

                {/* Description */}
                <Skeleton width="30%" height={12} borderRadius={4} style={{ marginTop: 22 }} />
                <Skeleton width="100%" height={12} borderRadius={4} style={{ marginTop: 10 }} />
                <Skeleton width="90%" height={12} borderRadius={4} style={{ marginTop: 8 }} />
                <Skeleton width="75%" height={12} borderRadius={4} style={{ marginTop: 8 }} />

                {/* Similar items */}
                <Skeleton width="35%" height={12} borderRadius={4} style={{ marginTop: 26 }} />
                <View style={styles.rowScroll}>
                    {[0, 1, 2].map((i) => (
                        <Skeleton key={i} width={140} height={170} borderRadius={16} />
                    ))}
                </View>
            </View>
        </View>
    );
});

MarketplaceDetailsSkeleton.displayName = 'MarketplaceDetailsSkeleton';

const styles = StyleSheet.create({
    container: {
        flex: 1 },
    card: {
        flex: 1,
        marginTop: -20,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingHorizontal: 13,
        paddingTop: 16 },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginTop: 20 },
    rowScroll: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 12 } });
