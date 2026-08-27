import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
    View,
    StyleSheet,
    FlatList,
    RefreshControl,
    TouchableOpacity,
    ScrollView,
    Platform,
    BackHandler,
    PanResponder
} from 'react-native';
import { useRouter, useNavigation, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DrawerActions } from '@react-navigation/native';

import { SearchBar } from '@/components/common/SearchBar';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { ThemedText } from '@/components/ThemedText';
import { TournamentCard } from '@/components/cricket/TournamentCard';
import { CricketMatchCard } from '@/components/cricket/CricketMatchCard';
import { CricketNotificationModal } from '@/components/cricket/CricketNotificationModal';
import { CricketHubSkeleton } from '@/components/cricket/skeletons';
import { ActionMenuItem } from '@/components/common/ActionMenu';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useCricketAPI } from '@/hooks/useCricketAPI';
import { useNotificationStore } from '@/store/notificationStore';
import { useTooltipStore } from '@/store/tooltipStore';
import Tooltip from 'react-native-walkthrough-tooltip';
import { Tournament, CricketMatch, canUserManageTournament } from '@/types/cricket';

interface QuickActionCircle {
    id: string;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    filterKey: string;
    onPress?: () => void;
}

export default function CricketFeedScreen() {
    const { theme } = useTheme();
    const colors = Colors[theme];
    const router = useRouter();
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const { user, isCricketAdmin } = useAuth();

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFilter, setSelectedFilter] = useState<string>('MATCHES');

    // Notification topic subscription state
    const isCricketSubscribed = useNotificationStore(state => state.preferences.cricket ?? true);
    const isSavingNotification = useNotificationStore(state => state.isSaving);
    const setPreference = useNotificationStore(state => state.setPreference);

    const [showNotificationModal, setShowNotificationModal] = useState(false);
    const [showTooltip, setShowTooltip] = useState(false);

    const viewedTooltips = useTooltipStore(state => state.viewedTooltips);
    const markAsViewed = useTooltipStore(state => state.markAsViewed);
    const tooltipId = 'cricket-hub-notification-hint';

    const { useTournamentsFeedQuery, useMatchesFeedQuery, predictWinnerMutation } = useCricketAPI();
    const { data, isLoading, isError, refetch, isRefetching } = useTournamentsFeedQuery({});

    // First visit onboarding tooltip timer
    useEffect(() => {
        if (!viewedTooltips[tooltipId] && !isLoading) {
            const timer = setTimeout(() => setShowTooltip(true), 600);
            return () => clearTimeout(timer);
        }
    }, [viewedTooltips, isLoading]);

    const handleCloseTooltip = useCallback(() => {
        markAsViewed(tooltipId);
        setShowTooltip(false);
    }, [markAsViewed]);

    const handleOpenNotificationModal = useCallback(() => {
        if (showTooltip) {
            handleCloseTooltip();
        }
        setShowNotificationModal(true);
    }, [showTooltip, handleCloseTooltip]);

    const handleToggleCricketNotification = useCallback(() => {
        setPreference('cricket', !isCricketSubscribed);
    }, [setPreference, isCricketSubscribed]);

    const handlePredictWinner = useCallback((matchId: string, teamId: string) => {
        predictWinnerMutation.mutate({ matchId, predictedTeamId: teamId });
    }, [predictWinnerMutation]);

    // Matches live in their own collection, so they need their own request
    const {
        data: matchesData,
        isLoading: isMatchesLoading,
        refetch: refetchMatches,
        isRefetching: isMatchesRefetching
    } = useMatchesFeedQuery({});

    const tournamentsList: Tournament[] = data?.data || [];

    // Map tournament IDs to tournament names
    const tournamentMap = useMemo(() => {
        const map = new Map<string, string>();
        tournamentsList.forEach((t) => {
            if (t._id && t.name) {
                map.set(String(t._id), t.name);
            }
        });
        return map;
    }, [tournamentsList]);

    // Matches sorted with LIVE fixtures always first at top
    const allMatches: CricketMatch[] = useMemo(() => {
        const raw = matchesData?.data || [];
        return [...raw].sort((a, b) => {
            if (a.status === 'LIVE' && b.status !== 'LIVE') return -1;
            if (b.status === 'LIVE' && a.status !== 'LIVE') return 1;
            if (a.status === 'UPCOMING' && b.status !== 'UPCOMING') return -1;
            if (b.status === 'UPCOMING' && a.status !== 'UPCOMING') return 1;
            return new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime();
        });
    }, [matchesData]);

    // The Matches circle lists fixtures; the rest list tournaments.
    const isMatchMode = selectedFilter === 'MATCHES';

    // Filter tournaments based on search query and status pill
    const filteredTournaments = useMemo(() => {
        let list = tournamentsList;

        if (selectedFilter !== 'ALL' && selectedFilter !== 'MATCHES') {
            list = list.filter(t => t.status === selectedFilter);
        }

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            list = list.filter(t =>
                t.name.toLowerCase().includes(q) ||
                t.city.toLowerCase().includes(q) ||
                t.venue.toLowerCase().includes(q)
            );
        }

        return list;
    }, [tournamentsList, selectedFilter, searchQuery]);

    // Filter matches based on search query and preserve LIVE-first sorting
    const filteredMatches = useMemo(() => {
        let list = allMatches;
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            list = list.filter(m => {
                return (
                    m.matchTitle?.toLowerCase().includes(q) ||
                    m.teamA.name.toLowerCase().includes(q) ||
                    m.teamB.name.toLowerCase().includes(q) ||
                    m.venue.toLowerCase().includes(q)
                );
            });
        }
        return list;
    }, [allMatches, searchQuery]);

    // Android hardware back handler: navigates cleanly to Home
    useEffect(() => {
        const backAction = () => {
            router.replace('/(drawer)/(tabs)' as any);
            return true;
        };
        const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
        return () => backHandler.remove();
    }, [router]);

    // Edge swipe (left-to-right) pan responder to navigate to Home
    const panResponder = useMemo(() => PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) => {
            return gestureState.dx > 35 && Math.abs(gestureState.dy) < 35 && gestureState.x0 < 90;
        },
        onPanResponderRelease: (_, gestureState) => {
            if (gestureState.dx > 50) {
                router.replace('/(drawer)/(tabs)' as any);
            }
        }
    }), [router]);

    const handleBackPress = useCallback(() => {
        router.replace('/(drawer)/(tabs)' as any);
    }, [router]);

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

    const quickCircles: QuickActionCircle[] = useMemo(() => [
        {
            id: 'circle_matches',
            label: 'Matches',
            icon: 'baseball-outline' as keyof typeof Ionicons.glyphMap,
            filterKey: 'MATCHES'
        },
        {
            id: 'circle_all',
            label: 'All Tourneys',
            icon: 'trophy-outline' as keyof typeof Ionicons.glyphMap,
            filterKey: 'ALL'
        },
        {
            id: 'circle_upcoming',
            label: 'Upcoming',
            icon: 'calendar-outline' as keyof typeof Ionicons.glyphMap,
            filterKey: 'UPCOMING'
        },
        {
            id: 'circle_live',
            label: 'Live',
            icon: 'flame-outline' as keyof typeof Ionicons.glyphMap,
            filterKey: 'LIVE'
        },
        {
            id: 'circle_completed',
            label: 'Completed',
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
                                tournamentName={tournamentMap.get(String(match.tournamentId)) || (match.tournamentId as any)?.name || match.tournamentName}
                                onPress={() => handleSelectMatch(match._id)}
                                canManage={isCricketAdmin}
                                onPredictWinner={(teamId) => handlePredictWinner(match._id, teamId)}
                                userPrediction={(match as any).userPrediction}
                            />
                        ))}
                    </ScrollView>
                </View>
            ) : null}

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

            <View style={styles.searchSection}>
                <SearchBar
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder={isMatchMode ? "Search matches by team, venue, tournament..." : "Search tournaments by name, city..."}
                    style={{
                        backgroundColor: colors.cardBg,
                        borderRadius: Layout.borderRadius
                    }}
                />
            </View>

            <View style={styles.sectionHeaderRow}>
                <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
                    {isMatchMode ? 'All Matches' : 'Featured Tournaments'}
                </ThemedText>
                <ThemedText style={[styles.sectionCount, { color: colors.textSecondary }]}>
                    {isMatchMode ? `${filteredMatches.length} Matches` : `${filteredTournaments.length} Tournaments`}
                </ThemedText>
            </View>
        </View>
    ), [
        allMatches,
        colors,
        selectedFilter,
        isMatchMode,
        quickCircles,
        searchQuery,
        filteredMatches.length,
        filteredTournaments.length,
        handleSelectMatch,
        isCricketAdmin,
        handlePredictWinner,
        tournamentMap
    ]);

    const renderMatchListItem = useCallback(({ item }: { item: CricketMatch }) => (
        <View style={styles.matchListItem}>
            <CricketMatchCard
                match={item}
                tournamentName={tournamentMap.get(String(item.tournamentId)) || (item.tournamentId as any)?.name || item.tournamentName}
                onPress={() => handleSelectMatch(item._id)}
                canManage={isCricketAdmin}
                onPredictWinner={(teamId) => handlePredictWinner(item._id, teamId)}
                userPrediction={(item as any).userPrediction}
                fullWidth
            />
        </View>
    ), [handleSelectMatch, isCricketAdmin, handlePredictWinner, tournamentMap]);

    const isInitialLoading = (isLoading && tournamentsList.length === 0) || (isMatchesLoading && allMatches.length === 0);

    if (isInitialLoading) {
        return (
            <ErrorBoundary>
                <Stack.Screen options={{ headerShown: false, gestureEnabled: false }} />
                <CricketHubSkeleton />
            </ErrorBoundary>
        );
    }

    return (
        <ErrorBoundary>
            <Stack.Screen options={{ headerShown: false, gestureEnabled: false }} />
            <View style={[styles.container, { backgroundColor: colors.background }]} {...panResponder.panHandlers}>
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
                        {/* Back Icon */}
                        <TouchableOpacity
                            style={styles.headerIconBtn}
                            onPress={handleBackPress}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                        </TouchableOpacity>

                        {/* Clean Standard Title */}
                        <ThemedText style={styles.headerTitle}>Cricket Hub</ThemedText>

                        {/* Right Actions: Notification Bell with Onboarding Tooltip */}
                        <View style={styles.headerRightActions}>
                            <Tooltip
                                isVisible={showTooltip}
                                content={
                                    <TouchableOpacity
                                        style={[
                                            styles.tooltipPill,
                                            { backgroundColor: theme === 'dark' ? '#1E293B' : '#FFFFFF' }
                                        ]}
                                        onPress={handleOpenNotificationModal}
                                        activeOpacity={0.9}
                                    >
                                        <Ionicons name="notifications" size={15} color={colors.primary} />
                                        <ThemedText style={[styles.tooltipText, { color: colors.text }]}>
                                            Tap here for match & tournament alerts!
                                        </ThemedText>
                                        <TouchableOpacity onPress={handleCloseTooltip} style={styles.tooltipClose}>
                                            <Ionicons name="close-circle" size={16} color={colors.textSecondary} />
                                        </TouchableOpacity>
                                    </TouchableOpacity>
                                }
                                placement="bottom"
                                onClose={handleCloseTooltip}
                                contentStyle={styles.tooltipContent}
                                backgroundColor="rgba(0,0,0,0.3)"
                            >
                                <TouchableOpacity
                                    style={styles.headerIconBtn}
                                    onPress={handleOpenNotificationModal}
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons
                                        name={isCricketSubscribed ? "notifications" : "notifications-outline"}
                                        size={22}
                                        color="#FFFFFF"
                                    />
                                    {isCricketSubscribed && (
                                        <View style={styles.activeNotificationDot} />
                                    )}
                                </TouchableOpacity>
                            </Tooltip>
                        </View>
                    </View>
                </View>

                {/* Content List */}
                {isMatchMode ? (
                    <FlatList
                        data={filteredMatches}
                        keyExtractor={(item) => item._id}
                        renderItem={renderMatchListItem}
                        ListHeaderComponent={ListHeader}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        initialNumToRender={6}
                        maxToRenderPerBatch={8}
                        windowSize={5}
                        updateCellsBatchingPeriod={50}
                        removeClippedSubviews={Platform.OS === 'android'}
                        refreshControl={
                            <RefreshControl
                                refreshing={isMatchesRefetching}
                                onRefresh={refetchMatches}
                                colors={[colors.primary]}
                                tintColor={colors.primary}
                            />
                        }
                        ListEmptyComponent={
                            !isMatchesLoading ? (
                                <View style={styles.emptyContainer}>
                                    <Ionicons name="baseball-outline" size={48} color={colors.textSecondary} />
                                    <ThemedText style={[styles.emptyTitle, { color: colors.text }]}>No Matches Found</ThemedText>
                                    <ThemedText style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                                        There are no scheduled or live matches right now.
                                    </ThemedText>
                                </View>
                            ) : null
                        }
                    />
                ) : (
                    <FlatList
                        data={filteredTournaments}
                        keyExtractor={(item) => item._id}
                        renderItem={renderTournamentCard}
                        ListHeaderComponent={ListHeader}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        initialNumToRender={6}
                        maxToRenderPerBatch={8}
                        windowSize={5}
                        updateCellsBatchingPeriod={50}
                        removeClippedSubviews={Platform.OS === 'android'}
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
                                    <Ionicons name="trophy-outline" size={48} color={colors.textSecondary} />
                                    <ThemedText style={[styles.emptyTitle, { color: colors.text }]}>No Tournaments Found</ThemedText>
                                    <ThemedText style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                                        Try adjusting your search query or filter options.
                                    </ThemedText>
                                </View>
                            ) : null
                        }
                    />
                )}

                {/* FAB: Create Tournament (Admin Only) */}
                {isCricketAdmin && (
                    <TouchableOpacity
                        style={[styles.fab, { backgroundColor: colors.primary }]}
                        onPress={() => router.push('/cricket/create-tournament' as any)}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="add-outline" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                )}

                {/* Cricket Topic Notification Subscription Modal */}
                <CricketNotificationModal
                    visible={showNotificationModal}
                    onClose={() => setShowNotificationModal(false)}
                    isSubscribed={isCricketSubscribed}
                    onToggle={handleToggleCricketNotification}
                    isSaving={isSavingNotification}
                />
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
        paddingBottom: 10,
        borderRadius: 0
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
        justifyContent: 'center',
        position: 'relative'
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
    tooltipContent: {
        padding: 0,
        borderRadius: Layout.borderRadius,
        backgroundColor: 'transparent'
    },
    tooltipPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: Layout.borderRadius,
        gap: 8,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4
    },
    tooltipText: {
        fontSize: 11.5,
        fontWeight: '700'
    },
    tooltipClose: {
        padding: 2
    },
    activeNotificationDot: {
        position: 'absolute',
        top: 6,
        right: 6,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#10B981',
        borderWidth: 1.5,
        borderColor: '#FFFFFF'
    },
    headerFeedContainer: {
        paddingTop: 8
    },
    carouselSection: {
        marginBottom: 10
    },
    carouselContainer: {
        paddingHorizontal: 0
    },
    circlesSection: {
        marginBottom: 10
    },
    circlesContainer: {
        paddingHorizontal: 0,
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
        paddingHorizontal: 0,
        marginBottom: 10
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 0,
        marginBottom: 10
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
        paddingHorizontal: 12,
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
