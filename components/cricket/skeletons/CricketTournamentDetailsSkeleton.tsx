import React from 'react';
import { View, StyleSheet, ScrollView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Skeleton from '@/components/common/Skeleton';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/context/ThemeContext';

export const CricketTournamentDetailsSkeleton = React.memo(function CricketTournamentDetailsSkeleton() {
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
                    <Skeleton width={130} height={18} borderRadius={4} />
                    <View style={{ width: 28 }} />
                </View>
            </View>

            {/* Tab Pills Row */}
            <View style={styles.tabPillsWrapper}>
                <View style={styles.tabPillsContainer}>
                    <Skeleton width={80} height={32} borderRadius={20} />
                    <Skeleton width={75} height={32} borderRadius={20} />
                    <Skeleton width={85} height={32} borderRadius={20} />
                </View>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Banner / Info Card Skeleton */}
                <View style={[styles.infoCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                    <Skeleton width="60%" height={16} borderRadius={4} style={{ marginBottom: 6 }} />
                    <Skeleton width="40%" height={12} borderRadius={4} style={{ marginBottom: 8 }} />
                    <View style={styles.badgeRow}>
                        <Skeleton width={70} height={20} borderRadius={6} />
                        <Skeleton width={90} height={20} borderRadius={6} />
                        <Skeleton width={60} height={20} borderRadius={6} />
                    </View>
                </View>

                {/* Fixture Match Cards Skeletons */}
                {[...Array(3)].map((_, i) => (
                    <View key={i} style={[styles.matchCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                        <View style={styles.matchHeader}>
                            <Skeleton width="40%" height={14} borderRadius={4} />
                            <Skeleton width={60} height={18} borderRadius={6} />
                        </View>

                        <View style={styles.teamsRow}>
                            <View style={styles.teamSide}>
                                <Skeleton width={40} height={40} borderRadius={20} />
                                <Skeleton width={65} height={12} borderRadius={4} style={{ marginTop: 4 }} />
                            </View>
                            <Skeleton width={24} height={14} borderRadius={4} />
                            <View style={styles.teamSide}>
                                <Skeleton width={40} height={40} borderRadius={20} />
                                <Skeleton width={65} height={12} borderRadius={4} style={{ marginTop: 4 }} />
                            </View>
                        </View>

                        <View style={styles.matchFooter}>
                            <Skeleton width="55%" height={11} borderRadius={4} />
                        </View>
                    </View>
                ))}
            </ScrollView>
        </View>
    );
});

CricketTournamentDetailsSkeleton.displayName = 'CricketTournamentDetailsSkeleton';

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
    tabPillsWrapper: {
        paddingHorizontal: 16,
        paddingVertical: 10
    },
    tabPillsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8
    },
    scrollContent: {
        padding: 16,
        paddingTop: 4,
        gap: 12,
        paddingBottom: 36
    },
    infoCard: {
        borderRadius: Layout.borderRadius,
        padding: 12,
        borderWidth: 1,
        marginBottom: 4
    },
    badgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6
    },
    matchCard: {
        borderRadius: Layout.borderRadius,
        padding: 12,
        gap: 10,
        borderWidth: 1
    },
    matchHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    teamsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingVertical: 4
    },
    teamSide: {
        alignItems: 'center'
    },
    matchFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 4
    }
});
