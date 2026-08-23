import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
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
    onPress: () => void;
    canManage?: boolean;
    onPredictWinner?: (teamId: string) => void;
    userPrediction?: string;
    /** Stretch to full width */
    fullWidth?: boolean;
}

export const CricketMatchCard = React.memo(function CricketMatchCard({
    match,
    onPress,
    canManage = false,
    onPredictWinner,
    userPrediction,
    fullWidth = false
}: CricketMatchCardProps) {
    const { theme } = useTheme();
    const colors = Colors[theme];

    const isLive = match.status === 'LIVE';

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

    // Green for higher prediction, Red for lower prediction
    const isHigherA = probA > probB;
    const isHigherB = probB > probA;

    const colorA = isHigherA ? '#10B981' : (isHigherB ? '#EF4444' : colors.primary);
    const colorB = isHigherB ? '#10B981' : (isHigherA ? '#EF4444' : colors.primary);

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
            {/* Header: Status + Scheduled Time & Venue */}
            <View style={styles.headerRow}>
                <View style={styles.statusWrap}>
                    {isLive && <View style={[styles.liveDot, { backgroundColor: '#EF4444' }]} />}
                    <StatusBadge status={match.status} />
                </View>

                <ThemedText style={[styles.scheduleText, { color: colors.textSecondary }]} numberOfLines={1}>
                    {match.scheduledAt ? formatScheduledTime(match.scheduledAt) : match.venue}
                </ThemedText>
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
                        <Image source={{ uri: match.teamA.logo }} style={styles.largeLogo} />
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
                        <Image source={{ uri: match.teamB.logo }} style={styles.largeLogo} />
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

            {/* Summary / Result Bar */}
            {match.result ? (
                <View style={styles.summaryRow}>
                    <ThemedText style={[styles.resultText, { color: colors.success }]} numberOfLines={1}>
                        {match.result}
                    </ThemedText>
                </View>
            ) : (
                <View style={styles.summaryRow}>
                    <ThemedText style={[styles.venueSubText, { color: colors.textSecondary }]} numberOfLines={1}>
                        {match.venue} • {match.maxOvers} Overs
                    </ThemedText>
                </View>
            )}

            {/* Compact Prediction Section */}
            <View style={[styles.predictionContainer, { backgroundColor: colors.surface }]}>
                <View style={styles.predictionBarRow}>
                    <TouchableOpacity
                        style={[
                            styles.predictBtn,
                            {
                                backgroundColor: selectedTeamId === match.teamA.id ? colorA : `${colorA}15`
                            }
                        ]}
                        onPress={() => onPredictWinner?.(match.teamA.id)}
                        activeOpacity={0.8}
                    >
                        <ThemedText
                            style={[
                                styles.predictBtnText,
                                { color: selectedTeamId === match.teamA.id ? '#FFFFFF' : colorA }
                            ]}
                            numberOfLines={1}
                        >
                            {capitalizeString(match.teamA.name)} {probA}%
                        </ThemedText>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.predictBtn,
                            {
                                backgroundColor: selectedTeamId === match.teamB.id ? colorB : `${colorB}15`
                            }
                        ]}
                        onPress={() => onPredictWinner?.(match.teamB.id)}
                        activeOpacity={0.8}
                    >
                        <ThemedText
                            style={[
                                styles.predictBtnText,
                                { color: selectedTeamId === match.teamB.id ? '#FFFFFF' : colorB }
                            ]}
                            numberOfLines={1}
                        >
                            {capitalizeString(match.teamB.name)} {probB}%
                        </ThemedText>
                    </TouchableOpacity>
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
        paddingVertical: 8,
        marginRight: 10,
        gap: 4,
        borderWidth: 0
    },
    cardFullWidth: {
        width: '100%',
        marginRight: 0
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    statusWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4
    },
    liveDot: {
        width: 6,
        height: 6,
        borderRadius: 3
    },
    scheduleText: {
        fontSize: 10,
        fontWeight: '600',
        flex: 1,
        textAlign: 'right'
    },
    singleLineRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 4
    },
    teamSideLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flex: 1,
        justifyContent: 'flex-end'
    },
    teamSideRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flex: 1,
        justifyContent: 'flex-start'
    },
    nameScoreCol: {
        alignItems: 'flex-end',
        justifyContent: 'center',
        flex: 1
    },
    nameScoreColRight: {
        alignItems: 'flex-start',
        justifyContent: 'center',
        flex: 1
    },
    teamNameLeft: {
        fontSize: 12.5,
        fontWeight: '700',
        textAlign: 'right'
    },
    teamNameRight: {
        fontSize: 12.5,
        fontWeight: '700',
        textAlign: 'left'
    },
    scoreText: {
        fontSize: 9.5,
        fontWeight: '800',
        marginTop: 1
    },
    largeLogo: {
        width: 48,
        height: 48,
        borderRadius: 24
    },
    largeLogoFallback: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center'
    },
    logoText: {
        fontSize: 17,
        fontWeight: '800'
    },
    vsContainer: {
        paddingHorizontal: 4,
        marginHorizontal: 4,
        backgroundColor: 'transparent'
    },
    vsText: {
        fontSize: 11,
        fontWeight: '800'
    },
    summaryRow: {
        alignItems: 'center'
    },
    resultText: {
        fontSize: 10.5,
        fontWeight: '700'
    },
    venueSubText: {
        fontSize: 10,
        fontWeight: '500'
    },
    predictionContainer: {
        padding: 4,
        borderRadius: Layout.borderRadius - 4
    },
    predictionBarRow: {
        flexDirection: 'row',
        gap: 6
    },
    predictBtn: {
        flex: 1,
        paddingVertical: 5,
        paddingHorizontal: 6,
        borderRadius: 12,
        borderWidth: 0,
        alignItems: 'center',
        justifyContent: 'center'
    },
    predictBtnText: {
        fontSize: 10,
        fontWeight: '700'
    }
});
