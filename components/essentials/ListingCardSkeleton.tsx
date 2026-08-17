import React from 'react';
import { StyleSheet, View } from 'react-native';

import Skeleton from '@/components/common/Skeleton';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { Layout } from '@/constants/layout';

/**
 * Skeleton matching the compact PlaceCard listing layout: image tile,
 * type chip, title, meta row, and CTA circle.
 */
export const ListingCardSkeleton = () => {
    const { theme } = useTheme();
    const colors = Colors[theme];

    return (
        <View style={[styles.card, { backgroundColor: colors.cardBg }]}>
            <Skeleton width={84} height={84} borderRadius={12} />
            <View style={styles.info}>
                <Skeleton width={64} height={16} borderRadius={999} />
                <Skeleton width="72%" height={15} borderRadius={4} style={{ marginTop: 8 }} />
                <Skeleton width="55%" height={12} borderRadius={4} style={{ marginTop: 8 }} />
            </View>
            <Skeleton width={30} height={30} borderRadius={15} style={{ marginRight: 4 }} />
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        gap: 12,
        borderRadius: Layout.cardBorderRadius - 2,
        marginBottom: 12 },
    info: {
        flex: 1 } });
