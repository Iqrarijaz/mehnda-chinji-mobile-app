import React from 'react';
import { View, StyleSheet } from 'react-native';
import Skeleton from '@/components/common/Skeleton';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/context/ThemeContext';

export const LiveScorecardCardSkeleton = React.memo(function LiveScorecardCardSkeleton() {
    const { theme } = useTheme();
    const colors = Colors[theme];

    return (
        <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            {/* Header: Stage + Status badge */}
            <View style={styles.header}>
                <Skeleton width={60} height={20} borderRadius={6} />
                <Skeleton width="40%" height={16} borderRadius={4} />
            </View>

            {/* Scores Block */}
            <View style={styles.scoresBlock}>
                {/* Team 1 row */}
                <View style={styles.teamRow}>
                    <Skeleton width="45%" height={18} borderRadius={4} />
                    <Skeleton width="30%" height={22} borderRadius={4} />
                </View>

                <View style={[styles.divider, { backgroundColor: `${colors.border}` }]} />

                {/* Team 2 row */}
                <View style={styles.teamRow}>
                    <Skeleton width="45%" height={18} borderRadius={4} />
                    <Skeleton width="30%" height={22} borderRadius={4} />
                </View>
            </View>

            {/* Bottom Stats Pills */}
            <View style={styles.statsRow}>
                <Skeleton width={80} height={22} borderRadius={6} />
                <Skeleton width={90} height={22} borderRadius={6} />
                <Skeleton width={70} height={22} borderRadius={6} />
            </View>
        </View>
    );
});

LiveScorecardCardSkeleton.displayName = 'LiveScorecardCardSkeleton';

const styles = StyleSheet.create({
    card: {
        borderRadius: Layout.borderRadius,
        padding: 16,
        gap: 14,
        borderWidth: 1
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    scoresBlock: {
        gap: 10
    },
    teamRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    divider: {
        height: 1,
        width: '100%'
    },
    statsRow: {
        flexDirection: 'row',
        gap: 8,
        flexWrap: 'wrap'
    }
});
