import React, { useCallback } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    RefreshControl,
    Platform
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { ThemedText } from '@/components/ThemedText';
import { LiveScorecardCard } from '@/components/cricket/LiveScorecardCard';
import { WinPredictionCard } from '@/components/cricket/WinPredictionCard';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useCricketAPI } from '@/hooks/useCricketAPI';
import { OverRecord, Player, canUserManageTournament } from '@/types/cricket';
import { capitalizeString } from '@/utils/string';

export default function SpectatorMatchScreen() {
    const { id: matchId } = useLocalSearchParams<{ id: string }>();
    const { theme } = useTheme();
    const colors = Colors[theme];
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { user } = useAuth();

    const { useMatchDetailsQuery, useTournamentDetailsQuery, predictWinnerMutation, useLiveMatchSocket } = useCricketAPI();
    const { data, isLoading, isError, refetch, isRefetching } = useMatchDetailsQuery(matchId || '');

    // Socket.IO real-time sync hook
    useLiveMatchSocket(matchId || '');

    const match = data?.data;
    const userPrediction = data?.userPrediction;
    const canManage = canUserManageTournament(user, match?.tournamentId);

    // Fetch tournament details to display full player squad
    const { data: tourneyData } = useTournamentDetailsQuery(match?.tournamentId || '');
    const tournament = tourneyData?.data;

    const teamAObject = tournament?.teams?.find((t: any) => t._id === match?.teamA?.id || t.name === match?.teamA?.name);
    const teamBObject = tournament?.teams?.find((t: any) => t._id === match?.teamB?.id || t.name === match?.teamB?.name);

    const teamASquad: Player[] = teamAObject?.players || [];
    const teamBSquad: Player[] = teamBObject?.players || [];

    const handleVote = useCallback((teamId: string) => {
        if (!matchId) return;
        predictWinnerMutation.mutate({ matchId, predictedTeamId: teamId });
    }, [matchId, predictWinnerMutation]);

    if (isLoading) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={[styles.compactHeader, { backgroundColor: colors.primary, paddingTop: insets.top + (Platform.OS === 'android' ? 8 : 12) }]}>
                    <View style={styles.topBarContent}>
                        <TouchableOpacity style={styles.headerIconBtn} onPress={() => router.back()}>
                            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                        <ThemedText style={styles.headerTitle}>Match Details</ThemedText>
                        <View style={{ width: 36 }} />
                    </View>
                </View>
                <View style={styles.centerContainer}>
                    <ThemedText style={{ color: colors.textSecondary }}>Loading match details...</ThemedText>
                </View>
            </View>
        );
    }

    if (isError || !match) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={[styles.compactHeader, { backgroundColor: colors.primary, paddingTop: insets.top + (Platform.OS === 'android' ? 8 : 12) }]}>
                    <View style={styles.topBarContent}>
                        <TouchableOpacity style={styles.headerIconBtn} onPress={() => router.back()}>
                            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                        <ThemedText style={styles.headerTitle}>Match Details</ThemedText>
                        <View style={{ width: 36 }} />
                    </View>
                </View>
                <View style={styles.centerContainer}>
                    <Ionicons name="alert-circle-outline" size={48} color={colors.danger} />
                    <ThemedText style={{ color: colors.text, fontWeight: '700', marginTop: 8 }}>
                        Match Not Found
                    </ThemedText>
                </View>
            </View>
        );
    }

    const currentInning = match.currentInnings === 1 ? match.innings1 : match.innings2;
    const oversList: OverRecord[] = currentInning?.overs || [];

    const getRoleLabel = (p: Player) => {
        switch (p.role) {
            case 'BATSMAN': return 'Batter';
            case 'BOWLER': return 'Bowler';
            case 'ALL_ROUNDER': return 'All-rounder';
            case 'WICKET_KEEPER': return 'Wicket Keeper';
            default: return 'Batter';
        }
    };

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
                            Match Details
                        </ThemedText>

                        <View style={{ width: 36 }} />
                    </View>
                </View>

                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={[colors.primary]} tintColor={colors.primary} />}
                >
                    {/* Live Scorecard Card */}
                    <LiveScorecardCard match={match} />

                    {/* Win Prediction Card */}
                    <WinPredictionCard
                        teamAName={match.teamA.name}
                        teamBName={match.teamB.name}
                        teamAId={match.teamA.id}
                        teamBId={match.teamB.id}
                        predictionsSummary={match.predictionsSummary}
                        userPrediction={userPrediction}
                        onVote={handleVote}
                        isVotingLoading={predictWinnerMutation.isPending}
                    />

                    {/* One Big Parallel Playing Squad Card */}
                    <View style={[styles.bigSquadCard, { backgroundColor: colors.cardBg }]}>
                        <View style={styles.squadCardHeader}>
                            <Ionicons name="people-outline" size={16} color={colors.primary} />
                            <ThemedText style={[styles.squadHeaderTitle, { color: colors.text }]}>
                                Playing Squad Lineups
                            </ThemedText>
                        </View>

                        <View style={styles.parallelSquadRow}>
                            {/* Left Column: Team A */}
                            <View style={styles.squadColumn}>
                                <View style={[styles.teamColumnHeader, { backgroundColor: `${colors.primary}15` }]}>
                                    <ThemedText style={[styles.teamColumnTitle, { color: colors.primary }]} numberOfLines={1}>
                                        {capitalizeString(match.teamA.name)}
                                    </ThemedText>
                                </View>

                                {teamASquad.length > 0 ? (
                                    teamASquad.map((player: Player, idx: number) => (
                                        <View key={player._id || idx} style={styles.playerRowItem}>
                                            <View style={styles.avatarWrap}>
                                                {player.image ? (
                                                    <Image source={{ uri: player.image }} style={styles.playerAvatarSmall} />
                                                ) : (
                                                    <View style={[styles.avatarFallbackSmall, { backgroundColor: `${colors.primary}1A` }]}>
                                                        <ThemedText style={[styles.avatarInitial, { color: colors.primary }]}>
                                                            {player.name.charAt(0).toUpperCase()}
                                                        </ThemedText>
                                                    </View>
                                                )}
                                            </View>

                                            <View style={styles.playerDetailCol}>
                                                <View style={styles.nameRow}>
                                                    <ThemedText style={[styles.playerNameText, { color: colors.text }]} numberOfLines={1}>
                                                        {player.name}
                                                    </ThemedText>
                                                    {player.isCaptain && (
                                                        <View style={[styles.captainBadgeNext, { backgroundColor: colors.primary }]}>
                                                            <ThemedText style={styles.captainBadgeText}>C</ThemedText>
                                                        </View>
                                                    )}
                                                </View>
                                                <ThemedText style={[styles.playerRoleText, { color: colors.textSecondary }]} numberOfLines={1}>
                                                    {getRoleLabel(player)}
                                                </ThemedText>
                                            </View>
                                        </View>
                                    ))
                                ) : (
                                    <ThemedText style={[styles.noPlayersText, { color: colors.placeholder }]}>
                                        No squad registered
                                    </ThemedText>
                                )}
                            </View>

                            {/* Middle Divider */}
                            <View style={[styles.verticalDivider, { backgroundColor: `${colors.border}` }]} />

                            {/* Right Column: Team B */}
                            <View style={styles.squadColumn}>
                                <View style={[styles.teamColumnHeader, { backgroundColor: `${colors.primary}15` }]}>
                                    <ThemedText style={[styles.teamColumnTitle, { color: colors.primary }]} numberOfLines={1}>
                                        {capitalizeString(match.teamB.name)}
                                    </ThemedText>
                                </View>

                                {teamBSquad.length > 0 ? (
                                    teamBSquad.map((player: Player, idx: number) => (
                                        <View key={player._id || idx} style={styles.playerRowItem}>
                                            <View style={styles.avatarWrap}>
                                                {player.image ? (
                                                    <Image source={{ uri: player.image }} style={styles.playerAvatarSmall} />
                                                ) : (
                                                    <View style={[styles.avatarFallbackSmall, { backgroundColor: `${colors.primary}1A` }]}>
                                                        <ThemedText style={[styles.avatarInitial, { color: colors.primary }]}>
                                                            {player.name.charAt(0).toUpperCase()}
                                                        </ThemedText>
                                                    </View>
                                                )}
                                            </View>

                                            <View style={styles.playerDetailCol}>
                                                <View style={styles.nameRow}>
                                                    <ThemedText style={[styles.playerNameText, { color: colors.text }]} numberOfLines={1}>
                                                        {player.name}
                                                    </ThemedText>
                                                    {player.isCaptain && (
                                                        <View style={[styles.captainBadgeNext, { backgroundColor: colors.primary }]}>
                                                            <ThemedText style={styles.captainBadgeText}>C</ThemedText>
                                                        </View>
                                                    )}
                                                </View>
                                                <ThemedText style={[styles.playerRoleText, { color: colors.textSecondary }]} numberOfLines={1}>
                                                    {getRoleLabel(player)}
                                                </ThemedText>
                                            </View>
                                        </View>
                                    ))
                                ) : (
                                    <ThemedText style={[styles.noPlayersText, { color: colors.placeholder }]}>
                                        No squad registered
                                    </ThemedText>
                                )}
                            </View>
                        </View>
                    </View>

                    {/* Over-by-Over History List (If match has started) */}
                    {oversList.length > 0 && (
                        <View style={styles.overSection}>
                            <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
                                Inning {match.currentInnings} Over History ({oversList.length})
                            </ThemedText>

                            {oversList.slice().reverse().map((o, idx) => (
                                <View key={o._id || idx} style={[styles.overRow, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                                    <View style={[styles.overBadge, { backgroundColor: colors.primary }]}>
                                        <ThemedText style={styles.overBadgeText}>Ov {o.overNumber}</ThemedText>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <ThemedText style={[styles.bowlerText, { color: colors.text }]}>{o.bowlerName}</ThemedText>
                                        {o.commentary ? (
                                            <ThemedText style={[styles.commText, { color: colors.textSecondary }]}>{o.commentary}</ThemedText>
                                        ) : null}
                                    </View>
                                    <View style={styles.runsBox}>
                                        <ThemedText style={[styles.runsText, { color: colors.primary }]}>
                                            {o.runsScored} runs
                                        </ThemedText>
                                        {o.wickets > 0 ? (
                                            <ThemedText style={[styles.wktText, { color: colors.danger }]}>
                                                {o.wickets} wkt
                                            </ThemedText>
                                        ) : null}
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}
                </ScrollView>

                {/* Admin Scorer Panel Floating Button — Only visible if user can manage this tournament */}
                {canManage && match.status !== 'COMPLETED' && (
                    <TouchableOpacity
                        style={[styles.scorerFab, { backgroundColor: colors.secondary }]}
                        onPress={() => router.push(`/cricket/match/${matchId}/scorer` as any)}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="create" size={20} color="#FFFFFF" />
                        <ThemedText style={styles.scorerFabText}>Open Scorer Panel</ThemedText>
                    </TouchableOpacity>
                )}
            </View>
        </ErrorBoundary>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
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
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scrollContent: { padding: 10, paddingBottom: 80, gap: 2 },
    bigSquadCard: {
        borderRadius: Layout.borderRadius,
        padding: 10,
        gap: 6,
        marginTop: 2
    },
    squadCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingBottom: 4
    },
    squadHeaderTitle: {
        fontSize: 13,
        fontWeight: '800'
    },
    parallelSquadRow: {
        flexDirection: 'row'
    },
    squadColumn: {
        flex: 1,
        gap: 6
    },
    teamColumnHeader: {
        paddingVertical: 5,
        paddingHorizontal: 8,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center'
    },
    teamColumnTitle: {
        fontSize: 11.5,
        fontWeight: '800'
    },
    verticalDivider: {
        width: 1,
        marginHorizontal: 8
    },
    playerRowItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 2
    },
    avatarWrap: {
        position: 'relative'
    },
    playerAvatarSmall: {
        width: 36,
        height: 36,
        borderRadius: 18
    },
    avatarFallbackSmall: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center'
    },
    avatarInitial: {
        fontSize: 14,
        fontWeight: '800'
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4
    },
    captainBadgeNext: {
        width: 16,
        height: 16,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 2
    },
    captainBadgeText: {
        color: '#FFFFFF',
        fontSize: 9,
        fontWeight: '900',
        textAlign: 'center',
        textAlignVertical: 'center',
        includeFontPadding: false,
        lineHeight: Platform.OS === 'android' ? 14 : 15
    },
    playerDetailCol: {
        flex: 1,
        justifyContent: 'center',
        gap: 0
    },
    playerNameText: {
        fontSize: 11.5,
        fontWeight: '700',
        lineHeight: 14
    },
    playerRoleText: {
        fontSize: 9.5,
        fontWeight: '500',
        lineHeight: 12,
        marginTop: 0
    },
    noPlayersText: {
        fontSize: 11,
        fontStyle: 'italic',
        textAlign: 'center',
        paddingVertical: 10
    },
    overSection: { gap: 6, marginTop: 4 },
    sectionTitle: { fontSize: 13, fontWeight: '800' },
    overRow: { flexDirection: 'row', alignItems: 'center', padding: 8, borderRadius: Layout.borderRadius - 4, gap: 8 },
    overBadge: { paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 },
    overBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '800' },
    bowlerText: { fontSize: 12, fontWeight: '700' },
    commText: { fontSize: 10.5 },
    runsBox: { alignItems: 'flex-end' },
    runsText: { fontSize: 12, fontWeight: '800' },
    wktText: { fontSize: 10, fontWeight: '700' },
    scorerFab: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 11,
        borderRadius: 28,
        gap: 8
    },
    scorerFabText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' }
});
