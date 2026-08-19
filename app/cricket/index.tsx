import React, { useState, useCallback, useMemo } from 'react';
import {
    View,
    StyleSheet,
    FlatList,
    RefreshControl,
    TouchableOpacity,
    ScrollView,
    Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DrawerActions } from '@react-navigation/native';
import { useNavigation } from 'expo-router';

import { SearchBar } from '@/components/common/SearchBar';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { ThemedText } from '@/components/ThemedText';
import { TournamentCard } from '@/components/cricket/TournamentCard';
import { CricketMatchCard } from '@/components/cricket/CricketMatchCard';
import { ActionMenuItem } from '@/components/common/ActionMenu';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useCricketAPI } from '@/hooks/useCricketAPI';
import { Tournament, CricketMatch, canUserManageTournament } from '@/types/cricket';

interface QuickActionCircle {
    id: string;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    badge?: string;
    onPress: () => void;
}

export default function CricketFeedScreen() {
    const { theme, isDark } = useTheme();
    const colors = Colors[theme];
    const router = useRouter();
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const { user } = useAuth();

    // Check if user has administrative rights for cricket
    const isCricketAdmin = !!user?.user?.isCricketAdmin;

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFilter, setSelectedFilter] = useState<string>('MATCHES');

    const { useTournamentsFeedQuery } = useCricketAPI();
    const { data, isLoading, isError, refetch, isRefetching } = useTournamentsFeedQuery({});

    const tournamentsList: Tournament[] = data?.data || [];

    // The feed returns fixtures alongside tournaments. Matches are their own
    // collection, so they can't be read off a tournament — the "matches"
    // field on a tournament is a per-player count, not a list.
    const allMatches: CricketMatch[] = useMemo(() => data?.matches || [], [data]);

    // The Matches circle lists fixtures; the rest list tournaments.
    const isMatchMode = selectedFilter === 'MATCHES';

    // Filter tournaments based on search query and status pill
    const filteredTournaments = useMemo(() => {
        let list = tournamentsList;

        // Only the tournament-status circles narrow the list; MATCHES isn't
        // a tournament status and is handled separately.
        if (selectedFilter !== 'ALL' && !isMatchMode) {
            list = list.filter(t => t.status === selectedFilter);
        }

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            list = list.filter(t =>
                t.name.toLowerCase().includes(query) ||
                t.city.toLowerCase().includes(query) ||
                t.venue.toLowerCase().includes(query)
            );
        }

        return list;
    }, [tournamentsList, selectedFilter, searchQuery, isMatchMode]);

    const filteredMatches = useMemo(() => {
        let list = allMatches;

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            list = list.filter(m =>
                m.matchTitle?.toLowerCase().includes(query) ||
                m.teamA?.name?.toLowerCase().includes(query) ||
                m.teamB?.name?.toLowerCase().includes(query) ||
                m.venue?.toLowerCase().includes(query)
            );
        }

        return list;
    }, [allMatches, searchQuery]);

    const handleOpenDrawer = useCallback(() => {
        let currentNav: any = navigation;
        let drawerNav: any = null;

        while (currentNav) {
            try {
                const state = currentNav.getState?.();
                if (state?.type === 'drawer' || typeof currentNav.openDrawer === 'function') {
                    drawerNav = currentNav;
                    break;
                }
            } catch (e) {
                // Ignore state inspection errors
            }
            currentNav = currentNav.getParent ? currentNav.getParent() : null;
        }

        if (drawerNav) {
            try {
                if (typeof drawerNav.openDrawer === 'function') {
                    drawerNav.openDrawer();
                } else {
                    drawerNav.dispatch(DrawerActions.openDrawer());
                }
            } catch (err) {
                router.push('/(drawer)/(tabs)' as any);
            }
        } else {
            if (router.canGoBack()) {
                router.back();
            } else {
                router.replace('/(drawer)/(tabs)' as any);
            }
        }
    }, [navigation, router]);

    const handleSelectTournament = useCallback((id: string) => {
        router.push(`/cricket/${id}` as any);
    }, [router]);

    const handleSelectMatch = useCallback((matchId: string) => {
        router.push(`/cricket/match/${matchId}` as any);
    }, [router]);

    const buildTournamentActions = useCallback((tournament: Tournament): ActionMenuItem[] => [
        {
            label: 'Manage & Edit Details',
            icon: 'create-outline',
            onPress: () => router.push(`/cricket/create-tournament?id=${tournament._id}` as any)
        },
        {
            label: 'Schedule Match',
            icon: 'calendar-outline',
            onPress: () => router.push(`/cricket/${tournament._id}/schedule-match` as any)
        },
        {
            label: 'Register Team',
            icon: 'people-outline',
            onPress: () => router.push(`/cricket/${tournament._id}/add-team` as any)
        }
    ], [router]);

    // Quick Action Highlight Circles mapped directly to filter states
    const quickCircles = useMemo(() => [
        {
            id: 'MATCHES',
            label: 'Matches',
            icon: 'baseball-outline' as keyof typeof Ionicons.glyphMap,
            filterKey: 'MATCHES'
        },
        {
            id: 'ALL',
            label: 'Tournaments',
            icon: 'trophy-outline' as keyof typeof Ionicons.glyphMap,
            filterKey: 'ALL'
        },
        {
            id: 'LIVE',
            label: 'Live Matches',
            icon: 'flame-outline' as keyof typeof Ionicons.glyphMap,
            filterKey: 'LIVE'
        },
        {
            id: 'UPCOMING',
            label: 'Upcoming',
            icon: 'calendar-outline' as keyof typeof Ionicons.glyphMap,
            filterKey: 'UPCOMING'
        },
        {
            id: 'COMPLETED',
            label: 'Results',
            icon: 'checkmark-done-circle-outline' as keyof typeof Ionicons.glyphMap,
            filterKey: 'COMPLETED'
        }
    ], []);

    const renderTournamentCard = useCallback(({ item }: { item: Tournament }) => {
        const createdById = typeof item.createdBy === 'object' ? item.createdBy?._id : item.createdBy;
        const canManage = canUserManageTournament(user, item._id, createdById, item.admins);

        return (
            <TournamentCard
                tournament={item}
                onPress={() => handleSelectTournament(item._id)}
                actions={canManage ? buildTournamentActions(item) : undefined}
            />
        );
    }, [user, handleSelectTournament, buildTournamentActions]);

    const ListHeader = useMemo(() => (
        <View style={styles.headerFeedContainer}>
            {/* Match Cards Carousel (Horizontal) — hidden in match mode, where the main list already shows fixtures */}
            {!isMatchMode && allMatches.length > 0 ? (
                <View style={styles.carouselSection}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.carouselContainer}
                    >
                        {allMatches.map((match) => (
                            <CricketMatchCard
                                key={match._id}
                                match={match}
                                onPress={() => handleSelectMatch(match._id)}
                            />
                        ))}
                    </ScrollView>
                </View>
            ) : null}

            {/* Quick Action Highlight Circles */}
            <View style={styles.circlesSection}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.circlesContainer}
                >
                    {quickCircles.map((circle) => {
                        const isActive = selectedFilter === circle.filterKey;
                        return (
                            <TouchableOpacity
                                key={circle.id}
                                style={styles.circleItem}
                                onPress={() => setSelectedFilter(circle.filterKey)}
                                activeOpacity={0.8}
                            >
                                <View style={[styles.circleRing, { borderColor: isActive ? colors.primary : `${colors.primary}40` }]}>
                                    <View style={[styles.circleInner, { backgroundColor: isActive ? colors.primary : `${colors.primary}1A` }]}>
                                        <Ionicons name={circle.icon} size={22} color={isActive ? '#FFFFFF' : colors.primary} />
                                    </View>
                                </View>
                                <ThemedText
                                    style={[
                                        styles.circleLabel,
                                        { color: isActive ? colors.primary : colors.text },
                                        isActive && { fontWeight: '700' }
                                    ]}
                                    numberOfLines={1}
                                >
                                    {circle.label}
                                </ThemedText>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            {/* Search Input Bar with Card Background */}
            <View style={styles.searchSection}>
                <SearchBar
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder={isMatchMode ? "Search matches by team, venue..." : "Search tournaments by name, city..."}
                    style={{
                        backgroundColor: colors.cardBg,
                        borderRadius: Layout.borderRadius
                    }}
                />
            </View>

            {/* Section Header */}
            <View style={styles.sectionHeaderRow}>
                <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
                    {isMatchMode ? 'All Matches' : 'Featured Tournaments'}
                </ThemedText>
                <ThemedText style={[styles.sectionCount, { color: colors.textSecondary }]}>
                    {(isMatchMode ? filteredMatches.length : filteredTournaments.length)} available
                </ThemedText>
            </View>
        </View>
    ), [
        colors,
        selectedFilter,
        allMatches,
        isMatchMode,
        quickCircles,
        searchQuery,
        filteredMatches.length,
        filteredTournaments.length,
        handleSelectMatch
    ]);

    const renderMatchListItem = useCallback(({ item }: { item: CricketMatch }) => (
        <View style={styles.matchListItem}>
            <CricketMatchCard
                match={item}
                onPress={() => handleSelectMatch(item._id)}
                fullWidth
            />
        </View>
    ), [handleSelectMatch]);

    return (
        <ErrorBoundary>
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                {/* Standard Compact Header Bar */}
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
                        {/* Action Menu Icon */}
                        <TouchableOpacity
                            style={styles.headerIconBtn}
                            onPress={handleOpenDrawer}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Ionicons name="menu-outline" size={24} color="#FFFFFF" />
                        </TouchableOpacity>

                        {/* Clean Standard Title */}
                        <ThemedText style={styles.headerTitle}>Cricket Hub</ThemedText>

                        {/* Right Actions */}
                        <View style={styles.headerRightActions}>
                            <TouchableOpacity
                                style={styles.headerIconBtn}
                                onPress={() => router.push('/notifications' as any)}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <Ionicons name="notifications-outline" size={22} color="#FFFFFF" />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.headerIconBtn}
                                onPress={() => router.push('/settings' as any)}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <Ionicons name="settings-outline" size={22} color="#FFFFFF" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Main Cricket Feed */}
                <FlatList
                    data={(isMatchMode ? filteredMatches : filteredTournaments) as any[]}
                    keyExtractor={(item) => item._id}
                    renderItem={(isMatchMode ? renderMatchListItem : renderTournamentCard) as any}
                    ListHeaderComponent={ListHeader}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefetching}
                            onRefresh={refetch}
                            colors={[colors.primary]}
                            tintColor={colors.primary}
                        />
                    }
                    ListEmptyComponent={
                        !isLoading ? (
                            <View style={styles.emptyContainer}>
                                <Ionicons name={isMatchMode ? 'baseball-outline' : 'trophy-outline'} size={44} color={colors.icon} />
                                <ThemedText style={[styles.emptyTitle, { color: colors.text }]}>
                                    {isMatchMode ? 'No Matches Found' : 'No Tournaments Found'}
                                </ThemedText>
                                <ThemedText style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                                    {searchQuery
                                        ? `Nothing matches "${searchQuery}".`
                                        : isMatchMode
                                            ? 'No matches have been scheduled yet.'
                                            : 'Check back soon for upcoming cricket tournaments!'}
                                </ThemedText>
                            </View>
                        ) : null
                    }
                />

                {/* Admin Floating Action Button */}
                {isCricketAdmin && (
                    <TouchableOpacity
                        style={[styles.fab, { backgroundColor: colors.primary }]}
                        onPress={() => router.push('/cricket/create-tournament' as any)}
                        activeOpacity={0.8}
                        accessibilityLabel="Create Tournament"
                    >
                        <Ionicons name="add" size={26} color="#FFFFFF" />
                    </TouchableOpacity>
                )}

            </View>
        </ErrorBoundary>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1
    },
    compactHeader: {
        paddingHorizontal: 12,
        paddingBottom: 8
    },
    topBarContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 38
    },
    headerIconBtn: {
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center'
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 0.2
    },
    headerRightActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4
    },
    headerFeedContainer: {
        paddingTop: 8
    },
    carouselSection: {
        marginBottom: 10
    },
    carouselContainer: {
        paddingHorizontal: 10
    },
    circlesSection: {
        marginBottom: 10
    },
    circlesContainer: {
        paddingHorizontal: 10,
        gap: 12
    },
    circleItem: {
        alignItems: 'center',
        width: 64
    },
    circleRing: {
        width: 54,
        height: 54,
        borderRadius: 27,
        borderWidth: 2,
        padding: 2,
        justifyContent: 'center',
        alignItems: 'center'
    },
    circleInner: {
        width: '100%',
        height: '100%',
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center'
    },
    circleLabel: {
        fontSize: 10,
        fontWeight: '600',
        marginTop: 4,
        textAlign: 'center'
    },
    searchSection: {
        paddingHorizontal: 10,
        marginBottom: 8
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 10,
        marginBottom: 8
    },
    sectionTitle: {
        fontSize: 15.5,
        fontWeight: '800'
    },
    sectionCount: {
        fontSize: 11,
        fontWeight: '500'
    },
    matchListItem: {
        marginBottom: 10
    },
    listContent: {
        paddingHorizontal: 10,
        paddingBottom: 90
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
        gap: 8
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: '800'
    },
    emptySubtitle: {
        fontSize: 12,
        textAlign: 'center',
        lineHeight: 18
    },
    fab: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        alignItems: 'center',
        justifyContent: 'center',
        height: Platform.OS === 'android' ? 48 : 52,
        width: Platform.OS === 'android' ? 48 : 52,
        borderRadius: (Platform.OS === 'android' ? 48 : 52) / 2
    }
});
