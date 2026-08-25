import React, { useEffect, useCallback, useMemo } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Platform,
    KeyboardAvoidingView
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { ThemedText } from '@/components/ThemedText';
import { LiveScorecardCard } from '@/components/cricket/LiveScorecardCard';
import { OverScorerBox } from '@/components/cricket/OverScorerBox';
import { TossPanel } from '@/components/cricket/TossPanel';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useCricketAPI } from '@/hooks/useCricketAPI';
import { Team, canUserManageTournament } from '@/types/cricket';

export default function OverScorerPanelScreen() {
    const { id: matchId } = useLocalSearchParams<{ id: string }>();
    const { theme } = useTheme();
    const colors = Colors[theme];
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { user } = useAuth();

    const { useMatchDetailsQuery, postOverMutation, recordTossMutation, useTournamentDetailsQuery } = useCricketAPI();
    const { data, isLoading, isError } = useMatchDetailsQuery(matchId || '');

    const match = data?.data;

    // The match document only carries team id/name/logo, so the roster for the
    // bowler picker has to come from the tournament's team list.
    const { data: tournamentData } = useTournamentDetailsQuery(match?.tournamentId || '');

    const currentInningForRoster = match?.currentInnings === 1 ? match?.innings1 : match?.innings2;
    const bowlingTeam = useMemo(() => {
        const teams = tournamentData?.data?.teams || [];
        const bowlingTeamId = currentInningForRoster?.bowlingTeamId;
        if (!bowlingTeamId) return undefined;
        return teams.find((t: Team) => t._id === bowlingTeamId);
    }, [tournamentData, currentInningForRoster]);

    const battingTeam = useMemo(() => {
        const teams = tournamentData?.data?.teams || [];
        const battingTeamId = currentInningForRoster?.battingTeamId;
        if (!battingTeamId) return undefined;
        return teams.find((t: Team) => t._id === battingTeamId);
    }, [tournamentData, currentInningForRoster]);
    const canManage = canUserManageTournament(user, match?.tournamentId);

    // Permission Guard: Non-admin protection
    useEffect(() => {
        if (!isLoading && match && !canManage) {
            Toast.show({
                type: 'error',
                text1: 'Access Denied',
                text2: 'You do not have permission to score this match.'
            });
            router.replace(`/cricket/match/${matchId}` as any);
        }
    }, [canManage, isLoading, match, matchId, router]);

    const handleSubmitOver = useCallback((overData: any) => {
        if (!matchId) return;

        postOverMutation.mutate({ matchId, payload: overData }, {
            onSuccess: (res) => {
                if (res.data?.status === 'COMPLETED') {
                    Toast.show({
                        type: 'success',
                        text1: 'Match Completed!',
                        text2: res.data.result || 'Match finalized successfully.'
                    });
                    router.replace(`/cricket/match/${matchId}` as any);
                }
            }
        });
    }, [matchId, postOverMutation, router]);

    const handleRecordToss = useCallback((payload: { tossWinnerId: string; tossDecision: 'BAT' | 'BOWL' }) => {
        if (!matchId) return;
        recordTossMutation.mutate({ matchId, payload });
    }, [matchId, recordTossMutation]);

    if (!canManage) return null;

    if (isLoading) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
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
                        <ThemedText style={styles.headerTitle} numberOfLines={1}>Live Scorer Panel</ThemedText>
                        <View style={{ width: 36 }} />
                    </View>
                </View>
                <View style={styles.centerContainer}>
                    <ThemedText style={{ color: colors.textSecondary }}>Loading scorer panel...</ThemedText>
                </View>
            </View>
        );
    }

    if (isError || !match) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
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
                        <ThemedText style={styles.headerTitle} numberOfLines={1}>Live Scorer Panel</ThemedText>
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
    const nextOverNumber = (currentInning?.totalOvers || 0) + 1;
    const hasToss = !!match.tossWinnerId && !!match.tossDecision;

    return (
        <ErrorBoundary>
            <View style={[styles.container, { backgroundColor: colors.background }]}>
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
                        <ThemedText style={styles.headerTitle} numberOfLines={1}>{`Scorer — ${match.matchTitle}`}</ThemedText>
                        <View style={{ width: 36 }} />
                    </View>
                </View>

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                        {/* Live Summary Header */}
                        <LiveScorecardCard match={match} />

                        {/* Toss — must be recorded before any over can be scored */}
                        {match.status !== 'COMPLETED' && (
                            <TossPanel
                                match={match}
                                onSubmit={handleRecordToss}
                                isLoading={recordTossMutation.isPending}
                            />
                        )}

                        {/* Over Scorer Input Panel */}
                        {match.status !== 'COMPLETED' ? (
                            hasToss ? (
                                <OverScorerBox
                                    nextOverNumber={nextOverNumber}
                                    onSubmitOver={handleSubmitOver}
                                    isLoading={postOverMutation.isPending}
                                    bowlingTeamName={bowlingTeam?.name}
                                    bowlerOptions={bowlingTeam?.players || []}
                                    battingTeamName={battingTeam?.name}
                                    batsmanOptions={battingTeam?.players || []}
                                />
                            ) : null
                        ) : (
                            <View style={styles.completedBox}>
                                <Ionicons name="checkmark-circle-outline" size={48} color={colors.success} />
                                <ThemedText style={[styles.completedTitle, { color: colors.text }]}>
                                    Match Complete
                                </ThemedText>
                                <ThemedText style={[styles.completedSub, { color: colors.textSecondary }]}>
                                    {match.result}
                                </ThemedText>
                            </View>
                        )}
                    </ScrollView>
                </KeyboardAvoidingView>
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
    scrollContent: { padding: 14, gap: 12, paddingBottom: 40 },
    completedBox: { padding: 30, alignItems: 'center', gap: 6 },
    completedTitle: { fontSize: 18, fontWeight: '800' },
    completedSub: { fontSize: 13 }
});
