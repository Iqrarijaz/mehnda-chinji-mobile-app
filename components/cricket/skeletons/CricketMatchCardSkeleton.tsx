import React from 'react';
import { View, StyleSheet } from 'react-native';
import Skeleton from '@/components/common/Skeleton';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/context/ThemeContext';

interface CricketMatchCardSkeletonProps {
    fullWidth?: boolean;
}

export const CricketMatchCardSkeleton = React.memo(function CricketMatchCardSkeleton({
    fullWidth = false
}: CricketMatchCardSkeletonProps) {
    const { theme } = useTheme();
    const colors = Colors[theme];

    return (
        <View
            style={[
                styles.card,
                fullWidth && styles.cardFullWidth,
                { backgroundColor: colors.cardBg }
            ]}
        >
            {/* Header: Tournament tag + Status badge */}
            <View style={styles.headerRow}>
                <Skeleton width="45%" height={16} borderRadius={6} />
                <Skeleton width={56} height={18} borderRadius={6} />
            </View>

            {/* Teams Single Line Row */}
            <View style={styles.singleLineRow}>
                {/* Team A side */}
                <View style={styles.teamSideLeft}>
                    <View style={styles.nameScoreCol}>
                        <Skeleton width={70} height={14} borderRadius={4} style={{ marginBottom: 4 }} />
                        <Skeleton width={45} height={11} borderRadius={4} />
                    </View>
                    <Skeleton width={44} height={44} borderRadius={22} />
                </View>

                {/* VS Center */}
                <View style={styles.vsContainer}>
                    <Skeleton width={20} height={12} borderRadius={4} />
                </View>

                {/* Team B side */}
                <View style={styles.teamSideRight}>
                    <Skeleton width={44} height={44} borderRadius={22} />
                    <View style={styles.nameScoreColRight}>
                        <Skeleton width={70} height={14} borderRadius={4} style={{ marginBottom: 4 }} />
                        <Skeleton width={45} height={11} borderRadius={4} />
                    </View>
                </View>
            </View>

            {/* Venue & Time Row */}
            <View style={styles.locationTimeRow}>
                <Skeleton width="55%" height={11} borderRadius={4} />
                <Skeleton width="30%" height={11} borderRadius={4} />
            </View>

            {/* Prediction Bar Skeleton */}
            <View style={[styles.predictionGraphCard, { backgroundColor: `${colors.primary}0D` }]}>
                <View style={styles.graphHeaderRow}>
                    <Skeleton width="35%" height={10} borderRadius={4} />
                    <Skeleton width="20%" height={10} borderRadius={4} />
                    <Skeleton width="35%" height={10} borderRadius={4} />
                </View>
                <Skeleton width="100%" height={5} borderRadius={2.5} />
            </View>
        </View>
    );
});

CricketMatchCardSkeleton.displayName = 'CricketMatchCardSkeleton';

const styles = StyleSheet.create({
    card: {
        width: 300,
        borderRadius: Layout.borderRadius,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginRight: 10,
        gap: 6
    },
    cardFullWidth: {
        width: '100%',
        marginRight: 0
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8
    },
    singleLineRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 4
    },
    teamSideLeft: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 8
    },
    teamSideRight: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        gap: 8
    },
    nameScoreCol: {
        alignItems: 'flex-end',
        flex: 1
    },
    nameScoreColRight: {
        alignItems: 'flex-start',
        flex: 1
    },
    vsContainer: {
        paddingHorizontal: 6,
        marginHorizontal: 2
    },
    locationTimeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 1,
        gap: 6
    },
    predictionGraphCard: {
        paddingHorizontal: 8,
        paddingVertical: 6,
        borderRadius: Layout.borderRadius - 4,
        gap: 5
    },
    graphHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 4
    }
});
