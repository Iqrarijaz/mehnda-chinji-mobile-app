import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/context/ThemeContext';
import { CricketMatch } from '@/types/cricket';

interface LiveScorecardCardProps {
    match: CricketMatch;
}

export const LiveScorecardCard = React.memo(function LiveScorecardCard({ match }: LiveScorecardCardProps) {
    const { theme } = useTheme();
    const colors = Colors[theme];

    const currentInning = match.currentInnings === 1 ? match.innings1 : match.innings2;
    const battingTeamName = match.currentInnings === 1 ? match.teamA.name : match.teamB.name;
    const bowlingTeamName = match.currentInnings === 1 ? match.teamB.name : match.teamA.name;

    const runs = currentInning?.totalRuns ?? 0;
    const wickets = currentInning?.totalWickets ?? 0;
    const overs = currentInning?.totalOvers ?? 0.0;
    const maxOvers = currentInning?.maxOvers ?? match.maxOvers;

    const crr = overs > 0 ? (runs / overs).toFixed(2) : '0.00';

    let target = null;
    let rrr = null;
    if (match.currentInnings === 2 && match.innings1) {
        target = match.innings1.totalRuns + 1;
        const runsNeeded = target - runs;
        const oversRemaining = maxOvers - overs;
        rrr = oversRemaining > 0 ? (runsNeeded / oversRemaining).toFixed(2) : '0.00';
    }

    return (
        <View style={[styles.card, { backgroundColor: colors.primary, borderColor: colors.border }]}>
            {/* Status Header */}
            <View style={styles.header}>
                <View style={styles.liveIndicator}>
                    {match.status === 'LIVE' && <View style={styles.liveDot} />}
                    <ThemedText style={styles.statusText}>{match.status}</ThemedText>
                </View>
                <ThemedText style={styles.stageText}>{match.matchTitle}</ThemedText>
            </View>

            {/* Live Score Block */}
            <View style={styles.scoreBlock}>
                <ThemedText style={styles.battingTeam}>{battingTeamName}</ThemedText>
                <ThemedText style={styles.scoreText}>
                    {runs}/{wickets} <ThemedText style={styles.oversText}>({overs} / {maxOvers} ov)</ThemedText>
                </ThemedText>
            </View>

            {/* Run Rate & Target Stats */}
            <View style={styles.statsRow}>
                <ThemedText style={styles.statPill}>CRR: {crr}</ThemedText>
                {target !== null ? (
                    <>
                        <ThemedText style={styles.statPill}>Target: {target}</ThemedText>
                        <ThemedText style={styles.statPill}>RRR: {rrr}</ThemedText>
                    </>
                ) : (
                    <ThemedText style={styles.statPill}>vs {bowlingTeamName}</ThemedText>
                )}
            </View>

            {/* Result display if match completed */}
            {match.result ? (
                <View style={styles.resultBanner}>
                    <Ionicons name="trophy-outline" size={14} color="#FFFFFF" />
                    <ThemedText style={styles.resultText}>{match.result}</ThemedText>
                </View>
            ) : null}
        </View>
    );
});

const styles = StyleSheet.create({
    card: {
        padding: 16,
        borderRadius: Layout.borderRadius,
        marginBottom: 14,
        gap: 10
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    liveIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        gap: 4
    },
    liveDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#EF4444'
    },
    statusText: {
        color: '#FFFFFF',
        fontSize: 10.5,
        fontWeight: '800'
    },
    stageText: {
        color: 'rgba(255,255,255,0.85)',
        fontSize: 11.5,
        fontWeight: '600'
    },
    scoreBlock: {
        gap: 2
    },
    battingTeam: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '800'
    },
    scoreText: {
        color: '#FFFFFF',
        fontSize: 28,
        fontWeight: '900',
        letterSpacing: -0.5
    },
    oversText: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 16,
        fontWeight: '600'
    },
    statsRow: {
        flexDirection: 'row',
        gap: 8
    },
    statPill: {
        color: '#FFFFFF',
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        fontSize: 11,
        fontWeight: '700'
    },
    resultBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(0,0,0,0.25)',
        padding: 8,
        borderRadius: 6,
        marginTop: 4
    },
    resultText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '700'
    }
});
