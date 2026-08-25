import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { ThemedText } from '@/components/ThemedText';
import { StatusBadge } from '@/components/cricket/StatusBadge';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/context/ThemeContext';
import { CricketMatch, Innings } from '@/types/cricket';
import { capitalizeString } from '@/utils/string';

interface CricketMatchCardProps {
    match: CricketMatch;
    tournamentName?: string;
    onPress: () => void;
    canManage?: boolean;
    onPredictWinner?: (teamId: string) => void;
    userPrediction?: string;
    /** Stretch to full width */
    fullWidth?: boolean;
}

export const CricketMatchCard = React.memo(function CricketMatchCard({
    match,
    tournamentName,
    onPress,
    canManage = false,
    onPredictWinner,
    userPrediction,
    fullWidth = false
}: CricketMatchCardProps) {
    const { theme } = useTheme();
    const colors = Colors[theme];

    const resolvedTournamentName = tournamentName || (match.tournamentId as any)?.name || match.tournamentName;

    const formatScheduledTime = (dateStr: string) => {
        if (!dateStr) return '';
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return dateStr;
            const datePart = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const timePart = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
            return `${datePart} • ${timePart}`;
        } catch {
            return dateStr;
        }
    };

    const handleCardPress = () => {
        if (match.status === 'UPCOMING' && !canManage) {
            Toast.show({
                type: 'info',
                text1: 'Match Scheduled',
                text2: 'Match has not started yet. Admin scoring panel opens at match start.'
            });
            return;
        }
        onPress();
    };

    // Calculate prediction probabilities
    const summary = match.predictionsSummary;
    const probA = summary?.teamAProbability ?? 50;
    const probB = summary?.teamBProbability ?? 50;

    // Vibrant colors for prediction bar
    const isHigherA = probA >= probB;
    const colorA = isHigherA ? '#10B981' : colors.primary;
    const colorB = !isHigherA ? '#10B981' : colors.secondary;

    const selectedTeamId = userPrediction || (match as any).userPrediction;

    const inningsForTeam = (teamId: string): Innings | null | undefined => {
        if (match.innings1?.battingTeamId === teamId) return match.innings1;
        if (match.innings2?.battingTeamId === teamId) return match.innings2;
        return null;
    };

    const teamAInnings = inningsForTeam(match.teamA.id);
    const teamBInnings = inningsForTeam(match.teamB.id);

    return (
        <TouchableOpacity
            style={[
                styles.card,
                fullWidth && styles.cardFullWidth,
                { backgroundColor: colors.cardBg }
            ]}
            onPress={handleCardPress}
            activeOpacity={0.8}
        >
            {/* Header: Tournament on Left, LIVE / Status on Right */}
            <View style={styles.headerRow}>
                {resolvedTournamentName ? (
                    <View style={[styles.tournamentTag, { backgroundColor: `${colors.primary}15` }]}>
                        <ThemedText style={[styles.tournamentTagText, { color: colors.primary }]} numberOfLines={1}>
                            🏆 {capitalizeString(resolvedTournamentName)}
                        </ThemedText>
                    </View>
                ) : (
                    <ThemedText style={[styles.matchTitleText, { color: colors.textSecondary }]} numberOfLines={1}>
                        {capitalizeString(match.matchTitle || 'Match Fixture')}
                    </ThemedText>
                )}

                {/* Status Badge with Flashing Live Dot aligned to Right */}
                <View style={styles.statusWrapRight}>
                    <StatusBadge status={match.status} />
                </View>
            </View>

            {/* Single Line Teams & Logo Row (Centered to Icon) */}
            <View style={styles.singleLineRow}>
                {/* Team A (Name Right Aligned, Logo on Right, Centered Vertically) */}
                <View style={styles.teamSideLeft}>
                    <View style={styles.nameScoreCol}>
                        <ThemedText style={[styles.teamNameLeft, { color: colors.text }]} numberOfLines={1}>
                            {capitalizeString(match.teamA.name)}
                        </ThemedText>
                        {teamAInnings && (
                            <ThemedText style={[styles.scoreText, { color: colors.primary }]}>
                                {teamAInnings.totalRuns}/{teamAInnings.totalWickets} ({teamAInnings.totalOvers} ov)
                            </ThemedText>
                        )}
                    </View>
                    {match.teamA.logo ? (
                        <Image
                            source={{ uri: match.teamA.logo }}
                            style={styles.largeLogo}
                            contentFit="cover"
                            cachePolicy="memory-disk"
                            transition={150}
                        />
                    ) : (
                        <View style={[styles.largeLogoFallback, { backgroundColor: `${colors.primary}1A` }]}>
                            <ThemedText style={[styles.logoText, { color: colors.primary }]}>
                                {match.teamA.name.charAt(0).toUpperCase()}
                            </ThemedText>
                        </View>
                    )}
                </View>

                {/* Center VS Text (Transparent Background) */}
                <View style={styles.vsContainer}>
                    <ThemedText style={[styles.vsText, { color: colors.secondary }]}>VS</ThemedText>
                </View>

                {/* Team B (Logo on Left, Name Left Aligned, Centered Vertically) */}
                <View style={styles.teamSideRight}>
                    {match.teamB.logo ? (
                        <Image
                            source={{ uri: match.teamB.logo }}
                            style={styles.largeLogo}
                            contentFit="cover"
                            cachePolicy="memory-disk"
                            transition={150}
                        />
                    ) : (
                        <View style={[styles.largeLogoFallback, { backgroundColor: `${colors.primary}1A` }]}>
                            <ThemedText style={[styles.logoText, { color: colors.primary }]}>
                                {match.teamB.name.charAt(0).toUpperCase()}
                            </ThemedText>
                        </View>
                    )}
                    <View style={styles.nameScoreColRight}>
                        <ThemedText style={[styles.teamNameRight, { color: colors.text }]} numberOfLines={1}>
                            {capitalizeString(match.teamB.name)}
                        </ThemedText>
                        {teamBInnings && (
                            <ThemedText style={[styles.scoreText, { color: colors.primary }]}>
                                {teamBInnings.totalRuns}/{teamBInnings.totalWickets} ({teamBInnings.totalOvers} ov)
                            </ThemedText>
                        )}
                    </View>
                </View>
            </View>

            {/* Location of Ground on Left, Scheduled Time on Right */}
            <View style={styles.locationTimeRow}>
                <ThemedText style={[styles.venueLeftText, { color: colors.textSecondary }]} numberOfLines={1}>
                    📍 {capitalizeString(match.venue)} {match.maxOvers ? `• ${match.maxOvers} Ov` : ''}
                </ThemedText>

                {match.scheduledAt ? (
                    <ThemedText style={[styles.timeRightText, { color: colors.textSecondary }]} numberOfLines={1}>
                        ⏰ {formatScheduledTime(match.scheduledAt)}
                    </ThemedText>
                ) : null}
            </View>

            {/* Result banner if match is completed */}
            {match.result ? (
                <View style={styles.resultBanner}>
                    <ThemedText style={[styles.resultText, { color: colors.success }]} numberOfLines={1}>
                        🎉 {match.result}
                    </ThemedText>
                </View>
            ) : null}

            {/* Sleek Win Prediction Ratio Graph with Team Choice at Top */}
            <View style={[styles.predictionGraphCard, { backgroundColor: colors.surface }]}>
                {/* Prediction Choice / Action Row at Top */}
                <View style={styles.graphHeaderRow}>
                    {/* Team A Vote / Percentage Button */}
                    <TouchableOpacity
                        style={[
                            styles.compactVoteBtn,
                            selectedTeamId === match.teamA.id && { backgroundColor: `${colorA}20`, borderColor: colorA }
                        ]}
                        onPress={() => onPredictWinner?.(match.teamA.id)}
                        activeOpacity={0.7}
                    >
                        {selectedTeamId === match.teamA.id && (
                            <Ionicons name="checkmark-circle" size={12} color={colorA} />
                        )}
                        <ThemedText style={[styles.voteTeamName, { color: colorA }]} numberOfLines={1}>
                            {capitalizeString(match.teamA.name)}
                        </ThemedText>
                        <ThemedText style={[styles.voteProbText, { color: colorA }]}>
                            {probA}%
                        </ThemedText>
                    </TouchableOpacity>

                    <ThemedText style={[styles.graphCenterLabel, { color: colors.textSecondary }]}>
                        Win Probability
                    </ThemedText>

                    {/* Team B Vote / Percentage Button */}
                    <TouchableOpacity
                        style={[
                            styles.compactVoteBtn,
                            selectedTeamId === match.teamB.id && { backgroundColor: `${colorB}20`, borderColor: colorB }
                        ]}
                        onPress={() => onPredictWinner?.(match.teamB.id)}
                        activeOpacity={0.7}
                    >
                        <ThemedText style={[styles.voteProbText, { color: colorB }]}>
                            {probB}%
                        </ThemedText>
                        <ThemedText style={[styles.voteTeamName, { color: colorB }]} numberOfLines={1}>
                            {capitalizeString(match.teamB.name)}
                        </ThemedText>
                        {selectedTeamId === match.teamB.id && (
                            <Ionicons name="checkmark-circle" size={12} color={colorB} />
                        )}
                    </TouchableOpacity>
                </View>

                {/* Horizontal Dual Segmented Ratio Bar */}
                <View style={styles.barTrack}>
                    <View style={[styles.barSegmentLeft, { width: `${Math.max(probA, 5)}%`, backgroundColor: colorA }]} />
                    <View style={[styles.barSegmentRight, { width: `${Math.max(probB, 5)}%`, backgroundColor: colorB }]} />
                </View>
            </View>
        </TouchableOpacity>
    );
});

const styles = StyleSheet.create({
    card: {
        width: 300,
        borderRadius: Layout.borderRadius,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginRight: 10,
        gap: 6,
        borderWidth: 0
    },
    cardFullWidth: {
        width: '100%',
        marginRight: 0
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'nowrap',
        gap: 8
    },
    tournamentTag: {
        paddingHorizontal: 7,
        paddingVertical: 2.5,
        borderRadius: 6,
        flex: 1,
        alignSelf: 'flex-start'
    },
    tournamentTagText: {
        fontSize: 10.5,
        fontWeight: '700'
    },
    matchTitleText: {
        fontSize: 10.5,
        fontWeight: '600',
        flex: 1
    },
    statusWrapRight: {
        alignItems: 'flex-end',
        justifyContent: 'center',
        flexShrink: 0
    },
    singleLineRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 4
    },
    teamSideLeft: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 8
    },
    teamSideRight: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        gap: 8
    },
    nameScoreCol: {
        alignItems: 'flex-end',
        flex: 1
    },
    nameScoreColRight: {
        alignItems: 'flex-start',
        flex: 1
    },
    teamNameLeft: {
        fontSize: 12.5,
        fontWeight: '800',
        textAlign: 'right'
    },
    teamNameRight: {
        fontSize: 12.5,
        fontWeight: '800',
        textAlign: 'left'
    },
    scoreText: {
        fontSize: 10,
        fontWeight: '800',
        marginTop: 1
    },
    largeLogo: {
        width: 44,
        height: 44,
        borderRadius: 22
    },
    largeLogoFallback: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center'
    },
    logoText: {
        fontSize: 16,
        fontWeight: '800'
    },
    vsContainer: {
        paddingHorizontal: 6,
        marginHorizontal: 2,
        backgroundColor: 'transparent'
    },
    vsText: {
        fontSize: 11,
        fontWeight: '800'
    },
    locationTimeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 1,
        gap: 6
    },
    venueLeftText: {
        fontSize: 10,
        fontWeight: '600',
        flex: 1
    },
    timeRightText: {
        fontSize: 10,
        fontWeight: '700',
        flexShrink: 0,
        textAlign: 'right'
    },
    resultBanner: {
        alignItems: 'center',
        paddingVertical: 1
    },
    resultText: {
        fontSize: 11,
        fontWeight: '700'
    },
    predictionGraphCard: {
        paddingHorizontal: 8,
        paddingVertical: 6,
        borderRadius: Layout.borderRadius - 4,
        gap: 5
    },
    graphHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 4
    },
    compactVoteBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: 'transparent',
        flexShrink: 1
    },
    voteTeamName: {
        fontSize: 10,
        fontWeight: '700',
        maxWidth: 75
    },
    voteProbText: {
        fontSize: 10.5,
        fontWeight: '900'
    },
    graphCenterLabel: {
        fontSize: 9,
        fontWeight: '600',
        letterSpacing: 0.2
    },
    barTrack: {
        height: 5,
        borderRadius: 2.5,
        flexDirection: 'row',
        overflow: 'hidden',
        gap: 2
    },
    barSegmentLeft: {
        height: '100%',
        borderRadius: 2.5
    },
    barSegmentRight: {
        height: '100%',
        borderRadius: 2.5
    }
});
