import React from 'react';
import { StyleSheet, View } from 'react-native';

import Skeleton from '@/components/common/Skeleton';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/context/ThemeContext';

function CategoryCardSkeleton() {
    const { theme } = useTheme();
    const colors = Colors[theme];

    return (
        <View style={styles.gridItem}>
            <View style={[styles.card, { backgroundColor: colors.cardBg }]}>
                <Skeleton width={42} height={42} borderRadius={Layout.borderRadius - 2} style={{ marginBottom: 8 }} />
                <Skeleton width="65%" height={11} borderRadius={4} />
            </View>
        </View>
    );
}

export const HomeSkeleton = React.memo(function HomeSkeleton() {
    return (
        <View style={styles.container}>
            {/* Explore Categories Section Skeleton */}
            <View style={styles.sectionHeader}>
                <Skeleton width={140} height={18} borderRadius={4} />
            </View>
            <View style={styles.grid}>
                {Array.from({ length: 6 }).map((_, i) => (
                    <CategoryCardSkeleton key={`cat-skel-${i}`} />
                ))}
            </View>

            {/* Daily Utilities Section 1 Skeleton */}
            <View style={[styles.sectionHeader, { marginTop: 14 }]}>
                <Skeleton width={120} height={16} borderRadius={4} />
            </View>
            <View style={styles.grid}>
                {Array.from({ length: 3 }).map((_, i) => (
                    <CategoryCardSkeleton key={`util1-skel-${i}`} />
                ))}
            </View>

            {/* Daily Utilities Section 2 Skeleton */}
            <View style={[styles.sectionHeader, { marginTop: 14 }]}>
                <Skeleton width={130} height={16} borderRadius={4} />
            </View>
            <View style={styles.grid}>
                {Array.from({ length: 3 }).map((_, i) => (
                    <CategoryCardSkeleton key={`util2-skel-${i}`} />
                ))}
            </View>
        </View>
    );
});

HomeSkeleton.displayName = 'HomeSkeleton';

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 14,
        paddingTop: 8,
        paddingBottom: 16,
    },
    sectionHeader: {
        marginLeft: 6,
        marginTop: 6,
        marginBottom: 12,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    gridItem: {
        width: '33.33%',
    },
    card: {
        borderRadius: Layout.borderRadius - 2,
        padding: 12,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 80,
        margin: 6,
    },
});
