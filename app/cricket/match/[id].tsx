import React, { useCallback } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ScreenHeader } from '@/components/common/ScreenHeader';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { ThemedText } from '@/components/ThemedText';
import { LiveScorecardCard } from '@/components/cricket/LiveScorecardCard';
import { WinPredictionCard } from '@/components/cricket/WinPredictionCard';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useCricketAPI } from '@/hooks/useCricketAPI';
import { OverRecord, canUserManageTournament } from '@/types/cricket';

export default function SpectatorMatchScreen() {
    const { id: matchId } = useLocalSearchParams<{ id: string }>();
    const { theme } = useTheme();
    const colors = Colors[theme];
    const router = useRouter();
    const { user } = useAuth();

    const { useMatchDetailsQuery, predictWinnerMutation, useLiveMatchSocket } = useCricketAPI();
    const { data, isLoading, isError, refetch, isRefetching } = useMatchDetailsQuery(matchId || '');

    // Socket.IO real-time sync hook
    useLiveMatchSocket(matchId || '');

    const match = data?.data;
    const userPrediction = data?.userPrediction;
    const canManage = canUserManageTournament(user, match?.tournamentId);

    const handleVote = useCallback((teamId: string) => {
        if (!matchId) return;
        predictWinnerMutation.mutate({ matchId, predictedTeamId: teamId });
    }, [matchId, predictWinnerMutation]);

    if (isLoading) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <ScreenHeader hero={{ title: "Live Match" }} showMenuIcon={false} />
                <View style={styles.centerContainer}>
                    <ThemedText style={{ color: colors.textSecondary }}>Loading match details...</ThemedText>
                </View>
            </View>
        );
    }

    if (isError || !match) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <ScreenHeader hero={{ title: "Live Match" }} showMenuIcon={false} />
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

    return (
        <ErrorBoundary>
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <ScreenHeader hero={{ title: match.matchTitle }} showMenuIcon={false} />

                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={[colors.primary]} tintColor={colors.primary} />}
                >
                    {/* Live Scorecard Card */}
                    <Animated.View entering={FadeInDown.duration(300)}>
                        <LiveScorecardCard match={match} />
                    </Animated.View>

                    {/* Win Prediction Card */}
                    <Animated.View entering={FadeInDown.delay(100).duration(300)}>
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
                    </Animated.View>

                    {/* Over-by-Over History List */}
                    <View style={styles.overSection}>
                        <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
                            Inning {match.currentInnings} Over History ({oversList.length})
                        </ThemedText>

                        {oversList.length > 0 ? (
                            oversList.slice().reverse().map((o, idx) => (
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
                            ))
                        ) : (
                            <View style={styles.emptyBox}>
                                <ThemedText style={{ color: colors.textSecondary }}>No overs bowled yet in this inning.</ThemedText>
                            </View>
                        )}
                    </View>
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
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scrollContent: { padding: 14, paddingBottom: 80, gap: 10 },
    overSection: { gap: 8, marginTop: 4 },
    sectionTitle: { fontSize: 14, fontWeight: '800' },
    overRow: { flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: Layout.borderRadius - 4, gap: 10 },
    overBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    overBadgeText: { color: '#FFF', fontSize: 11, fontWeight: '800' },
    bowlerText: { fontSize: 13, fontWeight: '700' },
    commText: { fontSize: 11 },
    runsBox: { alignItems: 'flex-end' },
    runsText: { fontSize: 13, fontWeight: '800' },
    wktText: { fontSize: 11, fontWeight: '700' },
    emptyBox: { padding: 20, alignItems: 'center' },
    scorerFab: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 30,
        gap: 8,
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 4.5
    },
    scorerFabText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' }
});
