import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { StatusBadge } from '@/components/cricket/StatusBadge';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/context/ThemeContext';
import { CricketMatch, Innings } from '@/types/cricket';
import { capitalizeString } from '@/utils/string';

interface CricketMatchCardProps {
    match: CricketMatch;
    onPress: () => void;
    /** Stretch to the container width instead of the fixed carousel width. */
    fullWidth?: boolean;
}

export const CricketMatchCard = React.memo(function CricketMatchCard({ match, onPress, fullWidth = false }: CricketMatchCardProps) {
    const { theme } = useTheme();
    const colors = Colors[theme];

    const currentInning = match.currentInnings === 1 ? match.innings1 : match.innings2;

    const inningsForTeam = (teamId: string): Innings | null | undefined => {
        if (match.innings1?.battingTeamId === teamId) return match.innings1;
        if (match.innings2?.battingTeamId === teamId) return match.innings2;
        return null;
    };

    const teamAInnings = inningsForTeam(match.teamA.id);
    const teamBInnings = inningsForTeam(match.teamB.id);

    const isLive = match.status === 'LIVE';

    // Who won the toss and what they chose — null until a scorer records it.
    const tossLabel = (() => {
        if (!match.tossWinnerId || !match.tossDecision) return null;
        const winner = match.tossWinnerId === match.teamA.id ? match.teamA.name : match.teamB.name;
        return `${capitalizeString(winner)} won the toss & chose to ${match.tossDecision === 'BAT' ? 'bat' : 'bowl'}`;
    })();

    const formatScore = (innings?: Innings | null) => {
        if (!innings) return null;
        return (
            <View style={styles.scoreWrap}>
                <ThemedText style={[styles.runsText, { color: colors.text }]}>
                    {innings.totalRuns}{innings.totalWickets < 10 ? `/${innings.totalWickets}` : ''}
                </ThemedText>
                {innings.totalOvers > 0 && (
                    <ThemedText style={[styles.oversText, { color: colors.textSecondary }]}>
                        ({innings.totalOvers} ov)
                    </ThemedText>
                )}
            </View>
        );
    };

    return (
        <TouchableOpacity
            style={[
                styles.card,
                fullWidth && styles.cardFullWidth,
                { backgroundColor: colors.cardBg }
            ]}
            onPress={onPress}
            activeOpacity={0.8}
        >
            {/* Header: Status + Stage/Venue */}
            <View style={styles.headerRow}>
                <View style={styles.statusWrap}>
                    {isLive && <View style={[styles.liveDot, { backgroundColor: '#EF4444' }]} />}
                    <StatusBadge status={match.status} />
                </View>
                <ThemedText style={[styles.stageText, { color: colors.textSecondary }]} numberOfLines={1}>
                    {match.stage} • {match.venue}
                </ThemedText>
            </View>

            {/* Teams & Scores Block */}
            <View style={styles.teamsBlock}>
                {/* Team A */}
                <View style={styles.teamRow}>
                    <View style={styles.teamInfo}>
                        {match.teamA.logo ? (
                            <Image source={{ uri: match.teamA.logo }} style={styles.teamLogo} />
                        ) : (
                            <View style={[styles.teamLogoFallback, { backgroundColor: `${colors.primary}1A` }]}>
                                <ThemedText style={[styles.logoText, { color: colors.primary }]}>
                                    {match.teamA.name.charAt(0)}
                                </ThemedText>
                            </View>
                        )}
                        <ThemedText style={[styles.teamName, { color: colors.text }]} numberOfLines={1}>
                            {capitalizeString(match.teamA.name)}
                        </ThemedText>
                    </View>
                    {teamAInnings ? formatScore(teamAInnings) : (
                        <ThemedText style={[styles.yetToBat, { color: colors.placeholder }]}>Yet to bat</ThemedText>
                    )}
                </View>

                {/* Team B */}
                <View style={styles.teamRow}>
                    <View style={styles.teamInfo}>
                        {match.teamB.logo ? (
                            <Image source={{ uri: match.teamB.logo }} style={styles.teamLogo} />
                        ) : (
                            <View style={[styles.teamLogoFallback, { backgroundColor: `${colors.primary}1A` }]}>
                                <ThemedText style={[styles.logoText, { color: colors.primary }]}>
                                    {match.teamB.name.charAt(0)}
                                </ThemedText>
                            </View>
                        )}
                        <ThemedText style={[styles.teamName, { color: colors.text }]} numberOfLines={1}>
                            {capitalizeString(match.teamB.name)}
                        </ThemedText>
                    </View>
                    {teamBInnings ? formatScore(teamBInnings) : (
                        <ThemedText style={[styles.yetToBat, { color: colors.placeholder }]}>Yet to bat</ThemedText>
                    )}
                </View>
            </View>

            {/* Toss result */}
            {tossLabel && (
                <View style={styles.tossRow}>
                    <Ionicons name="disc-outline" size={12} color={colors.secondary} />
                    <ThemedText style={[styles.tossText, { color: colors.secondary }]} numberOfLines={1}>
                        {tossLabel}
                    </ThemedText>
                </View>
            )}

            {/* Summary / Result Text */}
            <View style={styles.summaryRow}>
                <ThemedText style={[styles.summaryText, { color: colors.textSecondary }]} numberOfLines={1}>
                    {match.result || (isLive && currentInning ? `Live • CRR: ${(currentInning.totalRuns / (currentInning.totalOvers || 1)).toFixed(1)}` : `Scheduled match`)}
                </ThemedText>
            </View>

            {/* Card Footer: Details Button */}
            <View style={[styles.footer, { borderTopColor: `${colors.border}66` }]}>
                <ThemedText style={[styles.scheduleBtnText, { color: colors.primary }]}>
                    Match Details
                </ThemedText>
                <Ionicons name="chevron-forward" size={14} color={colors.primary} />
            </View>
        </TouchableOpacity>
    );
});

const styles = StyleSheet.create({
    card: {
        width: 270,
        borderRadius: Layout.borderRadius,
        padding: 12,
        marginRight: 10,
        justifyContent: 'space-between'
    },
    cardFullWidth: {
        width: '100%',
        marginRight: 0
    },
    tossRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 6
    },
    tossText: {
        fontSize: 10,
        fontWeight: '600',
        flex: 1
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10
    },
    statusWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6
    },
    liveDot: {
        width: 7,
        height: 7,
        borderRadius: 4
    },
    stageText: {
        fontSize: 10,
        fontWeight: '600',
        flex: 1,
        textAlign: 'right'
    },
    teamsBlock: {
        gap: 10,
        marginBottom: 10
    },
    teamRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    teamInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flex: 1
    },
    teamLogo: {
        width: 24,
        height: 24,
        borderRadius: 12
    },
    teamLogoFallback: {
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center'
    },
    logoText: {
        fontSize: 11,
        fontWeight: '800'
    },
    teamName: {
        fontSize: 13,
        fontWeight: '700',
        flex: 1
    },
    scoreWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4
    },
    runsText: {
        fontSize: 13,
        fontWeight: '800'
    },
    oversText: {
        fontSize: 10,
        fontWeight: '500'
    },
    yetToBat: {
        fontSize: 10,
        fontWeight: '500'
    },
    summaryRow: {
        marginBottom: 8
    },
    summaryText: {
        fontSize: 11,
        fontWeight: '500'
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 8,
        borderTopWidth: 1
    },
    scheduleBtnText: {
        fontSize: 11,
        fontWeight: '700'
    }
});
