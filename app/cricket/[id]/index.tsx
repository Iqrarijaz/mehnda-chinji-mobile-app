import React, { useState, useCallback } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    FlatList,
    RefreshControl,
    Platform
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { ThemedText } from '@/components/ThemedText';
import { PointsTableCard } from '@/components/cricket/PointsTableCard';
import { KnockoutBracketView } from '@/components/cricket/KnockoutBracketView';
import { PlayerLeaderboardCard } from '@/components/cricket/PlayerLeaderboardCard';
import { StatusBadge } from '@/components/cricket/StatusBadge';
import { CricketTournamentDetailsSkeleton } from '@/components/cricket/skeletons';
import { ActionMenu, ActionMenuItem } from '@/components/common/ActionMenu';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useCricketAPI } from '@/hooks/useCricketAPI';
import { capitalizeString } from '@/utils/string';
import { CricketMatch, Team, canUserManageTournament } from '@/types/cricket';

type TabType = 'fixtures' | 'bracket' | 'teams' | 'standings' | 'leaderboard';

const tabLabels: Record<TabType, string> = {
    fixtures: 'Fixtures',
    bracket: 'Playoffs',
    teams: 'Teams',
    standings: 'Points Table',
    leaderboard: 'Leaderboard'
};

export default function TournamentHubScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { theme } = useTheme();
    const colors = Colors[theme];
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { user } = useAuth();

    const [activeTab, setActiveTab] = useState<TabType>('fixtures');
    const [leaderboardType, setLeaderboardType] = useState<'batting' | 'bowling'>('batting');

    const { useTournamentDetailsQuery } = useCricketAPI();
    const { data, isLoading, isError, refetch, isRefetching } = useTournamentDetailsQuery(id || '');

    const tournament = data?.data;
    const matches: CricketMatch[] = data?.matches || [];

    const createdById = typeof tournament?.createdBy === 'object' ? tournament?.createdBy?._id : tournament?.createdBy;
    const canManage = canUserManageTournament(user, id || '', createdById, tournament?.admins);

    const handleOpenMatch = useCallback((matchId: string) => {
        router.push(`/cricket/match/${matchId}` as any);
    }, [router]);

    const buildMatchActions = useCallback((match: CricketMatch): ActionMenuItem[] => [
        {
            label: 'Score Match (Admin)',
            icon: 'create-outline',
            onPress: () => router.push(`/cricket/match/${match._id}/scorer` as any)
        },
        {
            label: 'View Match Details',
            icon: 'eye-outline',
            onPress: () => handleOpenMatch(match._id)
        }
    ], [router, handleOpenMatch]);

    const buildTeamActions = useCallback((team: Team): ActionMenuItem[] => [
        {
            label: 'Edit Team & Roster',
            icon: 'create-outline',
            onPress: () => router.push(`/cricket/${id}/add-team?teamId=${team._id}` as any)
        }
    ], [router, id]);

    // One side of a fixture: logo (or initial tile) plus the team name.
    // `alignEnd` mirrors the layout so the two sides face the centre "VS".
    const renderMatchTeam = useCallback((team: CricketMatch['teamA'], alignEnd = false) => (
        <View style={[styles.matchTeam, alignEnd && styles.matchTeamEnd]}>
            {team.logo ? (
                <Image source={{ uri: team.logo }} style={styles.matchTeamLogo} />
            ) : (
                <View style={[styles.matchTeamLogo, styles.matchTeamLogoFallback, { backgroundColor: `${colors.primary}20` }]}>
                    <ThemedText style={[styles.matchTeamInitial, { color: colors.primary }]}>
                        {team.name?.charAt(0)?.toUpperCase() || '?'}
                    </ThemedText>
                </View>
            )}
            <ThemedText style={[styles.teamName, { color: colors.text }]} numberOfLines={1}>
                {capitalizeString(team.name)}
            </ThemedText>
        </View>
    ), [colors]);

    const renderMatchItem = useCallback(({ item }: { item: CricketMatch }) => (
        <TouchableOpacity
            style={[styles.matchCard, { backgroundColor: colors.cardBg }]}
            onPress={() => handleOpenMatch(item._id)}
            activeOpacity={0.8}
        >
            <View style={styles.matchHeader}>
                <ThemedText style={[styles.stageText, { color: colors.primary }]} numberOfLines={1}>
                    {capitalizeString(item.matchTitle)}
                </ThemedText>
                <StatusBadge status={item.status} />
            </View>

            <View style={styles.teamsRow}>
                {renderMatchTeam(item.teamA)}
                <ThemedText style={[styles.vsText, { color: colors.secondary }]}>VS</ThemedText>
                {renderMatchTeam(item.teamB, true)}
            </View>

            {/* Venue / result line — action menu sits at its right edge */}
            <View style={styles.matchFooter}>
                {item.result ? (
                    <ThemedText style={[styles.resultText, { color: colors.success }]} numberOfLines={1}>
                        {item.result}
                    </ThemedText>
                ) : (
                    <ThemedText style={[styles.venueText, { color: colors.textSecondary }]} numberOfLines={1}>
                        📍 {capitalizeString(item.venue)} • Max {item.maxOvers} Overs
                    </ThemedText>
                )}
                {canManage && (
                    <ActionMenu
                        actions={buildMatchActions(item)}
                        triggerIcon="ellipsis-horizontal"
                        triggerIconSize={18}
                        triggerIconColor={colors.textSecondary}
                    />
                )}
            </View>
        </TouchableOpacity>
    ), [colors, handleOpenMatch, canManage, buildMatchActions, renderMatchTeam]);

    if (isLoading) {
        return (
            <ErrorBoundary>
                <CricketTournamentDetailsSkeleton />
            </ErrorBoundary>
        );
    }

    if (isError || !tournament) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={[styles.compactHeader, { backgroundColor: colors.primary, paddingTop: insets.top + (Platform.OS === 'android' ? 8 : 12) }]}>
                    <View style={styles.topBarContent}>
                        <TouchableOpacity style={styles.headerIconBtn} onPress={() => router.back()}>
                            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                        <ThemedText style={styles.headerTitle}>Tournament Details</ThemedText>
                        <View style={{ width: 36 }} />
                    </View>
                </View>
                <View style={styles.centerContainer}>
                    <Ionicons name="alert-circle-outline" size={48} color={colors.danger} />
                    <ThemedText style={{ color: colors.text, fontWeight: '700', marginTop: 8 }}>
                        Tournament Not Found
                    </ThemedText>
                </View>
            </View>
        );
    }

    return (
        <ErrorBoundary>
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                {/* Straight Compact Header */}
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
                        <TouchableOpacity
                            style={styles.headerIconBtn}
                            onPress={() => router.back()}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                        </TouchableOpacity>

                        <ThemedText style={styles.headerTitle} numberOfLines={1}>
                            {tournament.name}
                        </ThemedText>

                        <View style={{ width: 36 }} />
                    </View>
                </View>

                {/* Rounded Pills Tab Bar (No Borders, Same Height) */}
                <View style={styles.tabPillsWrapper}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.tabPillsContainer}
                    >
                        {(['fixtures', 'bracket', 'teams', 'standings', 'leaderboard'] as TabType[]).map((tab) => {
                            const isActive = activeTab === tab;
                            return (
                                <TouchableOpacity
                                    key={tab}
                                    style={[
                                        styles.tabPill,
                                        {
                                            backgroundColor: isActive ? colors.primary : colors.cardBg
                                        }
                                    ]}
                                    onPress={() => setActiveTab(tab)}
                                    activeOpacity={0.8}
                                >
                                    <ThemedText
                                        style={[
                                            styles.tabPillText,
                                            { color: isActive ? '#FFFFFF' : colors.textSecondary }
                                        ]}
                                    >
                                        {tabLabels[tab]}
                                    </ThemedText>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>

                {/* Tab Views */}
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={[colors.primary]} tintColor={colors.primary} />}
                >
                    {activeTab === 'fixtures' && (
                        <View style={styles.tabContent}>
                            {canManage && (
                                <TouchableOpacity
                                    style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                                    onPress={() => router.push(`/cricket/${id}/schedule-match` as any)}
                                    activeOpacity={0.8}
                                >
                                    <Ionicons name="add-circle-outline" size={18} color="#FFF" />
                                    <ThemedText style={styles.actionBtnText}>+ Schedule Match</ThemedText>
                                </TouchableOpacity>
                            )}

                            {matches.length > 0 ? (
                                <FlatList
                                    data={matches}
                                    keyExtractor={(item) => item._id}
                                    renderItem={renderMatchItem}
                                    scrollEnabled={false}
                                    initialNumToRender={6}
                                    maxToRenderPerBatch={8}
                                    windowSize={5}
                                    removeClippedSubviews={Platform.OS === 'android'}
                                />
                            ) : (
                                <View style={styles.emptyBox}>
                                    <ThemedText style={{ color: colors.textSecondary }}>No matches scheduled yet.</ThemedText>
                                </View>
                            )}
                        </View>
                    )}

                    {activeTab === 'bracket' && (
                        <View style={styles.tabContent}>
                            <KnockoutBracketView
                                matches={matches}
                                onSelectMatch={handleOpenMatch}
                            />
                        </View>
                    )}

                    {activeTab === 'teams' && (
                        <View style={styles.tabContent}>
                            {canManage && (
                                <TouchableOpacity
                                    style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                                    onPress={() => router.push(`/cricket/${id}/add-team` as any)}
                                    activeOpacity={0.8}
                                >
                                    <Ionicons name="add-circle-outline" size={18} color="#FFF" />
                                    <ThemedText style={styles.actionBtnText}>+ Register Team</ThemedText>
                                </TouchableOpacity>
                            )}

                            {tournament.teams && tournament.teams.length > 0 ? (
                                tournament.teams.map((t: Team, idx: number) => (
                                    <View key={t._id || idx} style={[styles.teamTile, { backgroundColor: colors.cardBg }]}>
                                        {t.logo ? (
                                            <Image
                                                source={{ uri: t.logo }}
                                                style={styles.logoCircle}
                                                contentFit="cover"
                                                cachePolicy="memory-disk"
                                                transition={150}
                                            />
                                        ) : (
                                            <View style={[styles.logoCircle, styles.logoFallback, { backgroundColor: `${colors.primary}20` }]}>
                                                <ThemedText style={[styles.logoText, { color: colors.primary }]}>{t.shortName}</ThemedText>
                                            </View>
                                        )}
                                        <View style={{ flex: 1 }}>
                                            <ThemedText style={[styles.teamTileName, { color: colors.text }]} numberOfLines={1}>
                                                {capitalizeString(t.name)}
                                            </ThemedText>
                                            <ThemedText style={[styles.teamTileSub, { color: colors.textSecondary }]} numberOfLines={1}>
                                                Captain: {t.captainName ? capitalizeString(t.captainName) : 'N/A'} • {t.players?.length || 0} Players
                                            </ThemedText>
                                        </View>
                                        {canManage && (
                                            <ActionMenu
                                                actions={buildTeamActions(t)}
                                                triggerIcon="ellipsis-horizontal"
                                                triggerIconSize={18}
                                                triggerIconColor={colors.textSecondary}
                                            />
                                        )}
                                    </View>
                                ))
                            ) : (
                                <View style={styles.emptyBox}>
                                    <ThemedText style={{ color: colors.textSecondary }}>No teams registered yet.</ThemedText>
                                </View>
                            )}
                        </View>
                    )}

                    {activeTab === 'standings' && (
                        <View style={styles.tabContent}>
                            <PointsTableCard teams={tournament.teams || []} />
                        </View>
                    )}

                    {activeTab === 'leaderboard' && (
                        <View style={styles.tabContent}>
                            {/* Sub-toggle: Batting (Orange Cap) vs Bowling (Purple Cap) */}
                            <View style={[styles.leaderboardToggleRow, { backgroundColor: colors.surface }]}>
                                <TouchableOpacity
                                    style={[
                                        styles.leaderboardToggleBtn,
                                        leaderboardType === 'batting' && { backgroundColor: '#EA580C' }
                                    ]}
                                    onPress={() => setLeaderboardType('batting')}
                                    activeOpacity={0.8}
                                >
                                    <ThemedText
                                        style={[
                                            styles.leaderboardToggleText,
                                            { color: leaderboardType === 'batting' ? '#FFFFFF' : colors.textSecondary }
                                        ]}
                                    >
                                        👑 Top Batsmen (Runs)
                                    </ThemedText>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[
                                        styles.leaderboardToggleBtn,
                                        leaderboardType === 'bowling' && { backgroundColor: '#9333EA' }
                                    ]}
                                    onPress={() => setLeaderboardType('bowling')}
                                    activeOpacity={0.8}
                                >
                                    <ThemedText
                                        style={[
                                            styles.leaderboardToggleText,
                                            { color: leaderboardType === 'bowling' ? '#FFFFFF' : colors.textSecondary }
                                        ]}
                                    >
                                        👑 Top Bowlers (Wickets)
                                    </ThemedText>
                                </TouchableOpacity>
                            </View>

                            {/* Players List */}
                            {leaderboardType === 'batting' ? (
                                (data?.leaderboard?.topBatsmen && data.leaderboard.topBatsmen.length > 0) ? (
                                    data.leaderboard.topBatsmen.map((player: any, idx: number) => (
                                        <PlayerLeaderboardCard
                                            key={player.name + idx}
                                            player={player}
                                            rank={idx + 1}
                                            type="batting"
                                        />
                                    ))
                                ) : (
                                    <View style={styles.emptyBox}>
                                        <ThemedText style={{ color: colors.textSecondary }}>No batting statistics recorded yet.</ThemedText>
                                    </View>
                                )
                            ) : (
                                (data?.leaderboard?.topBowlers && data.leaderboard.topBowlers.length > 0) ? (
                                    data.leaderboard.topBowlers.map((player: any, idx: number) => (
                                        <PlayerLeaderboardCard
                                            key={player.name + idx}
                                            player={player}
                                            rank={idx + 1}
                                            type="bowling"
                                        />
                                    ))
                                ) : (
                                    <View style={styles.emptyBox}>
                                        <ThemedText style={{ color: colors.textSecondary }}>No bowling statistics recorded yet.</ThemedText>
                                    </View>
                                )
                            )}
                        </View>
                    )}
                </ScrollView>
            </View>
        </ErrorBoundary>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
        justifyContent: 'center'
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 0.2,
        flex: 1,
        textAlign: 'center'
    },
    tabPillsWrapper: {
        paddingTop: 10,
        paddingBottom: 6
    },
    tabPillsContainer: {
        paddingHorizontal: 10,
        gap: 8
    },
    tabPill: {
        height: 36,
        paddingHorizontal: 16,
        borderRadius: 18,
        borderWidth: 0,
        justifyContent: 'center',
        alignItems: 'center'
    },
    tabPillText: {
        fontSize: 12,
        fontWeight: '700'
    },
    scrollContent: { padding: 10, paddingBottom: 40 },
    tabContent: { gap: 10 },
    sectionTitle: { fontSize: 13, fontWeight: '700' },
    actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: Platform.OS === 'android' ? 46 : 50, borderRadius: Layout.borderRadius - 4, gap: 6, marginBottom: 6 },
    actionBtnText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
    matchCard: { padding: 10, borderRadius: Layout.borderRadius - 4, marginBottom: 8, gap: 6 },
    matchHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
    matchFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 2 },
    matchTeam: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
    matchTeamEnd: { justifyContent: 'flex-end' },
    matchTeamLogo: { width: 24, height: 24, borderRadius: 12 },
    matchTeamLogoFallback: { justifyContent: 'center', alignItems: 'center' },
    matchTeamInitial: { fontSize: 11, fontWeight: '800' },
    stageText: { fontSize: 11, fontWeight: '700', flex: 1 },
    teamsRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    teamName: { fontSize: 13, fontWeight: '600', flexShrink: 1 },
    vsText: { fontSize: 11, fontWeight: '700' },
    resultText: { fontSize: 11, fontWeight: '600', flex: 1 },
    venueText: { fontSize: 10.5, flex: 1 },
    teamTile: { flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: Layout.borderRadius - 4, marginBottom: 6, gap: 8 },
    logoCircle: { width: 38, height: 38, borderRadius: 19 },
    logoFallback: { justifyContent: 'center', alignItems: 'center' },
    logoText: { fontSize: 12, fontWeight: '700' },
    teamTileName: { fontSize: 13, fontWeight: '600' },
    teamTileSub: { fontSize: 11, marginTop: 2 },
    emptyBox: { padding: 20, alignItems: 'center' },
    leaderboardToggleRow: {
        flexDirection: 'row',
        borderRadius: 24,
        padding: 3,
        marginBottom: 8,
        gap: 4
    },
    leaderboardToggleBtn: {
        flex: 1,
        height: 36,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center'
    },
    leaderboardToggleText: {
        fontSize: 11.5,
        fontWeight: '800'
    }
});
