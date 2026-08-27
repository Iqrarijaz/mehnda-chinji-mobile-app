import React from 'react';
import { View, StyleSheet } from 'react-native';
import Skeleton from '@/components/common/Skeleton';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/context/ThemeContext';

export const CricketOverHistorySkeleton = React.memo(function CricketOverHistorySkeleton({
    rows = 3
}: {
    rows?: number;
}) {
    const { theme } = useTheme();
    const colors = Colors[theme];

    return (
        <View style={styles.overSection}>
            {/* Header with Title and Tab Switchers */}
            <View style={styles.overSectionHeaderRow}>
                <Skeleton width={100} height={16} borderRadius={4} />
                <View style={styles.inningsTabRow}>
                    <Skeleton width={80} height={24} borderRadius={16} />
                    <Skeleton width={80} height={24} borderRadius={16} />
                </View>
            </View>

            {/* Over Rows */}
            {[...Array(rows)].map((_, idx) => (
                <View
                    key={idx}
                    style={[
                        styles.overRow,
                        { backgroundColor: colors.cardBg, borderColor: colors.border }
                    ]}
                >
                    {/* Over Badge */}
                    <Skeleton width={44} height={22} borderRadius={6} />

                    {/* Bowler + Mini Ball Chips */}
                    <View style={{ flex: 1, gap: 4 }}>
                        <Skeleton width="60%" height={12} borderRadius={4} />
                        <View style={styles.ballsPillRow}>
                            {[...Array(6)].map((_, bIdx) => (
                                <Skeleton key={bIdx} width={22} height={18} borderRadius={6} />
                            ))}
                        </View>
                    </View>

                    {/* Runs Box */}
                    <View style={styles.runsBox}>
                        <Skeleton width={45} height={14} borderRadius={4} style={{ marginBottom: 2 }} />
                        <Skeleton width={30} height={10} borderRadius={3} />
                    </View>
                </View>
            ))}
        </View>
    );
});

CricketOverHistorySkeleton.displayName = 'CricketOverHistorySkeleton';

const styles = StyleSheet.create({
    overSection: {
        gap: 6,
        marginTop: 4
    },
    overSectionHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 6,
        marginBottom: 2
    },
    inningsTabRow: {
        flexDirection: 'row',
        gap: 4
    },
    overRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        borderRadius: Layout.borderRadius - 4,
        gap: 8,
        borderWidth: 1
    },
    ballsPillRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 4,
        marginTop: 4
    },
    runsBox: {
        alignItems: 'flex-end'
    }
});
