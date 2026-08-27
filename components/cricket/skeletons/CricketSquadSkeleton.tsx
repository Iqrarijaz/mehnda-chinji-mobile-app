import React from 'react';
import { View, StyleSheet } from 'react-native';
import Skeleton from '@/components/common/Skeleton';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/context/ThemeContext';

export const CricketSquadSkeleton = React.memo(function CricketSquadSkeleton() {
    const { theme } = useTheme();
    const colors = Colors[theme];

    const renderPlayerRow = (idx: number) => (
        <View key={idx} style={styles.playerRowItem}>
            <Skeleton width={36} height={36} borderRadius={18} />
            <View style={styles.playerDetailCol}>
                <Skeleton width="75%" height={12} borderRadius={4} style={{ marginBottom: 4 }} />
                <Skeleton width="45%" height={10} borderRadius={3} />
            </View>
        </View>
    );

    return (
        <View style={[styles.bigSquadCard, { backgroundColor: colors.cardBg }]}>
            {/* Header */}
            <View style={styles.squadCardHeader}>
                <Skeleton width={130} height={16} borderRadius={4} />
            </View>

            <View style={styles.parallelSquadRow}>
                {/* Left Column: Team A */}
                <View style={styles.squadColumn}>
                    <Skeleton width="100%" height={26} borderRadius={6} style={{ marginBottom: 8 }} />
                    {[...Array(5)].map((_, i) => renderPlayerRow(i))}
                </View>

                {/* Middle Divider */}
                <View style={[styles.verticalDivider, { backgroundColor: colors.border }]} />

                {/* Right Column: Team B */}
                <View style={styles.squadColumn}>
                    <Skeleton width="100%" height={26} borderRadius={6} style={{ marginBottom: 8 }} />
                    {[...Array(5)].map((_, i) => renderPlayerRow(i))}
                </View>
            </View>
        </View>
    );
});

CricketSquadSkeleton.displayName = 'CricketSquadSkeleton';

const styles = StyleSheet.create({
    bigSquadCard: {
        borderRadius: Layout.borderRadius,
        padding: 10,
        gap: 8,
        marginTop: 4
    },
    squadCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingBottom: 4
    },
    parallelSquadRow: {
        flexDirection: 'row',
        alignItems: 'flex-start'
    },
    squadColumn: {
        flex: 1,
        gap: 6
    },
    verticalDivider: {
        width: 1,
        alignSelf: 'stretch',
        marginHorizontal: 8
    },
    playerRowItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 2
    },
    playerDetailCol: {
        flex: 1,
        justifyContent: 'center'
    }
});
