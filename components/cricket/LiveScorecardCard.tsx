import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { StatusBadge } from '@/components/cricket/StatusBadge';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/context/ThemeContext';
import { CricketMatch, Innings } from '@/types/cricket';
import { capitalizeString } from '@/utils/string';

interface LiveScorecardCardProps {
    match: CricketMatch;
}

interface TeamScoreLine {
    name: string;
    innings: Innings | null | undefined;
    hasBatted: boolean;
    isBatting: boolean;
}

export const LiveScorecardCard = React.memo(function LiveScorecardCard({ match }: LiveScorecardCardProps) {
    const { theme } = useTheme();
    const colors = Colors[theme];

    const battingInningsNumber = match.currentInnings;
    const currentInning = battingInningsNumber === 1 ? match.innings1 : match.innings2;

    // Resolve each team's innings by matching battingTeamId, so scores are
    // shown against the correct team regardless of who batted first.
    const inningsForTeam = (teamId: string): Innings | null | undefined => {
        if (match.innings1?.battingTeamId === teamId) return match.innings1;
        if (match.innings2?.battingTeamId === teamId) return match.innings2;
        return null;
    };

    const teamALine: TeamScoreLine = {
        name: capitalizeString(match.teamA.name),
        innings: inningsForTeam(match.teamA.id),
        hasBatted: !!inningsForTeam(match.teamA.id),
        isBatting: currentInning?.battingTeamId === match.teamA.id && match.status === 'LIVE'
    };
    const teamBLine: TeamScoreLine = {
        name: capitalizeString(match.teamB.name),
        innings: inningsForTeam(match.teamB.id),
        hasBatted: !!inningsForTeam(match.teamB.id),
        isBatting: currentInning?.battingTeamId === match.teamB.id && match.status === 'LIVE'
    };

    const runs = currentInning?.totalRuns ?? 0;
    const wickets = currentInning?.totalWickets ?? 0;
    const overs = currentInning?.totalOvers ?? 0;
    const crr = overs > 0 ? (runs / overs).toFixed(2) : '0.00';

    let target: number | null = null;
    let rrr: string | null = null;
    if (match.currentInnings === 2 && match.innings1) {
        const maxOvers = currentInning?.maxOvers ?? match.maxOvers;
        target = match.innings1.totalRuns + 1;
        const runsNeeded = target - runs;
        const oversRemaining = maxOvers - overs;
        rrr = oversRemaining > 0 ? (runsNeeded / oversRemaining).toFixed(2) : '0.00';
    }

    const renderTeamRow = (line: TeamScoreLine) => (
        <View style={styles.teamRow}>
            <View style={styles.teamNameWrap}>
                {line.isBatting && <View style={styles.battingDot} />}
                <ThemedText style={[styles.teamName, line.isBatting && styles.teamNameActive]} numberOfLines={1}>
                    {line.name}
                </ThemedText>
            </View>
            {line.hasBatted && line.innings ? (
                <ThemedText style={styles.teamScore}>
                    {line.innings.totalRuns}/{line.innings.totalWickets}
                    <ThemedText style={styles.teamOvers}> ({line.innings.totalOvers} ov)</ThemedText>
                </ThemedText>
            ) : (
                <ThemedText style={styles.yetToBat}>Yet to bat</ThemedText>
            )}
        </View>
    );

    return (
        <View style={[styles.card, { backgroundColor: colors.primary }]}>
            {/* Status Header */}
            <View style={styles.header}>
                <StatusBadge status={match.status} />
                <ThemedText style={styles.stageText} numberOfLines={1}>
                    {capitalizeString(match.matchTitle)}
                </ThemedText>
            </View>

            {/* Side-by-side Team Scores */}
            <View style={styles.scoresBlock}>
                {renderTeamRow(teamALine)}
                <View style={styles.divider} />
                {renderTeamRow(teamBLine)}
            </View>

            {/* Run Rate & Target Stats */}
            {match.status === 'LIVE' && (
                <View style={styles.statsRow}>
                    <ThemedText style={styles.statPill}>CRR: {crr}</ThemedText>
                    {target !== null && (
                        <>
                            <ThemedText style={styles.statPill}>Target: {target}</ThemedText>
                            <ThemedText style={styles.statPill}>RRR: {rrr}</ThemedText>
                        </>
                    )}
                </View>
            )}

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
        gap: 12
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8
    },
    stageText: {
        color: 'rgba(255,255,255,0.85)',
        fontSize: 11.5,
        fontWeight: '600',
        flex: 1
    },
    scoresBlock: {
        gap: 8
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.15)'
    },
    teamRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 8
    },
    teamNameWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        flex: 1
    },
    battingDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#FFFFFF'
    },
    teamName: {
        color: 'rgba(255,255,255,0.75)',
        fontSize: 16,
        fontWeight: '700'
    },
    teamNameActive: {
        color: '#FFFFFF',
        fontWeight: '800'
    },
    teamScore: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: '900',
        letterSpacing: -0.3
    },
    teamOvers: {
        color: 'rgba(255,255,255,0.75)',
        fontSize: 13,
        fontWeight: '600'
    },
    yetToBat: {
        color: 'rgba(255,255,255,0.65)',
        fontSize: 13,
        fontWeight: '600',
        fontStyle: 'italic'
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
        borderRadius: 6
    },
    resultText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '700'
    }
});
