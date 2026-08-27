import React from 'react';
import { View, StyleSheet, ScrollView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Skeleton from '@/components/common/Skeleton';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/context/ThemeContext';
import { CricketMatchCardSkeleton } from './CricketMatchCardSkeleton';
import { TournamentCardSkeleton } from './TournamentCardSkeleton';

export const CricketHubSkeleton = React.memo(function CricketHubSkeleton() {
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
                    <Skeleton width={28} height={28} borderRadius={14} />
                </View>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Horizontal Match Cards Carousel */}
                <View style={styles.carouselSection}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.carouselContainer}
                    >
                        {[...Array(3)].map((_, i) => (
                            <CricketMatchCardSkeleton key={i} />
                        ))}
                    </ScrollView>
                </View>

                {/* Quick Action Circles */}
                <View style={styles.circlesSection}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.circlesContainer}
                    >
                        {[...Array(5)].map((_, i) => (
                            <View key={i} style={styles.circleItem}>
                                <Skeleton width={52} height={52} borderRadius={26} />
                                <Skeleton width={44} height={10} borderRadius={3} style={{ marginTop: 6 }} />
                            </View>
                        ))}
                    </ScrollView>
                </View>

                {/* Search Bar Skeleton */}
                <View style={styles.searchSection}>
                    <Skeleton width="100%" height={46} borderRadius={Layout.borderRadius} />
                </View>

                {/* Section Title Row */}
                <View style={styles.sectionHeaderRow}>
                    <Skeleton width={140} height={16} borderRadius={4} />
                    <Skeleton width={70} height={14} borderRadius={4} />
                </View>

                {/* Tournament Card Items */}
                <View style={styles.tournamentList}>
                    {[...Array(3)].map((_, i) => (
                        <TournamentCardSkeleton key={i} />
                    ))}
                </View>
            </ScrollView>
        </View>
    );
});

CricketHubSkeleton.displayName = 'CricketHubSkeleton';

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
        paddingBottom: 24
    },
    carouselSection: {
        paddingVertical: 10
    },
    carouselContainer: {
        paddingHorizontal: 16
    },
    circlesSection: {
        paddingVertical: 8
    },
    circlesContainer: {
        paddingHorizontal: 16,
        gap: 12
    },
    circleItem: {
        alignItems: 'center',
        width: 58
    },
    searchSection: {
        paddingHorizontal: 16,
        paddingVertical: 8
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 10
    },
    tournamentList: {
        paddingHorizontal: 16
    }
});
