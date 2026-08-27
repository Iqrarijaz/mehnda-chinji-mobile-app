import React from 'react';
import { View, StyleSheet, ScrollView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Skeleton from '@/components/common/Skeleton';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/context/ThemeContext';
import { LiveScorecardCardSkeleton } from './LiveScorecardCardSkeleton';
import { CricketSquadSkeleton } from './CricketSquadSkeleton';
import { CricketOverHistorySkeleton } from './CricketOverHistorySkeleton';

export const CricketMatchDetailsSkeleton = React.memo(function CricketMatchDetailsSkeleton() {
    const { theme } = useTheme();
    const colors = Colors[theme];
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header Skeleton Bar */}
            <View
                style={[
                    styles.compactHeader,
                    {
                        backgroundColor: colors.primary,
                        paddingTop: insets.top + (Platform.OS === 'android' ? 8 : 12)
                    }
                ]}
            >
                <View style={styles.topBarContent}>
                    <Skeleton width={28} height={28} borderRadius={14} />
                    <Skeleton width={120} height={18} borderRadius={4} />
                    <View style={{ width: 28 }} />
                </View>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Live Scorecard Card Skeleton */}
                <LiveScorecardCardSkeleton />

                {/* Win Prediction Card Skeleton */}
                <View style={[styles.predictionCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                    <View style={styles.predictionHeader}>
                        <Skeleton width="40%" height={14} borderRadius={4} />
                        <Skeleton width={60} height={14} borderRadius={4} />
                    </View>
                    <Skeleton width="100%" height={10} borderRadius={5} style={{ marginVertical: 6 }} />
                    <View style={styles.predictionBtnRow}>
                        <Skeleton width="48%" height={36} borderRadius={8} />
                        <Skeleton width="48%" height={36} borderRadius={8} />
                    </View>
                </View>

                {/* Playing Squad Lineups Skeleton */}
                <CricketSquadSkeleton />

                {/* Over History Skeleton */}
                <CricketOverHistorySkeleton rows={3} />
            </ScrollView>
        </View>
    );
});

CricketMatchDetailsSkeleton.displayName = 'CricketMatchDetailsSkeleton';

const styles = StyleSheet.create({
    container: {
        flex: 1
    },
    compactHeader: {
        paddingHorizontal: 16,
        paddingBottom: 10,
        justifyContent: 'flex-end'
    },
    topBarContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 36
    },
    scrollContent: {
        padding: 12,
        gap: 10,
        paddingBottom: 36
    },
    predictionCard: {
        borderRadius: Layout.borderRadius,
        padding: 12,
        gap: 8,
        borderWidth: 1
    },
    predictionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    predictionBtnRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 4
    }
});
