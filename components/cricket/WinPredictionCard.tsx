import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/context/ThemeContext';
import { PredictionsSummary } from '@/types/cricket';

interface WinPredictionCardProps {
    teamAName: string;
    teamBName: string;
    teamAId: string;
    teamBId: string;
    predictionsSummary?: PredictionsSummary;
    userPrediction?: string | null;
    onVote: (teamId: string) => void;
    isVotingLoading?: boolean;
}

export const WinPredictionCard = React.memo(function WinPredictionCard({
    teamAName,
    teamBName,
    teamAId,
    teamBId,
    predictionsSummary,
    userPrediction,
    onVote,
    isVotingLoading = false
}: WinPredictionCardProps) {
    const { theme } = useTheme();
    const colors = Colors[theme];

    const teamAProb = predictionsSummary?.teamAProbability ?? 50;
    const teamBProb = predictionsSummary?.teamBProbability ?? 50;
    const totalVotes = predictionsSummary?.totalVotes ?? 0;

    const isVotedA = userPrediction === teamAId;
    const isVotedB = userPrediction === teamBId;

    return (
        <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <View style={styles.header}>
                <Ionicons name="stats-chart" size={16} color={colors.primary} />
                <ThemedText style={[styles.title, { color: colors.text }]}>
                    Who Will Win? (Fan Predictions)
                </ThemedText>
                <ThemedText style={[styles.votesCount, { color: colors.textSecondary }]}>
                    {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
                </ThemedText>
            </View>

            {/* Probability Progress Bar */}
            <View style={styles.barContainer}>
                <View style={[styles.barSegmentA, { flex: Math.max(teamAProb, 5), backgroundColor: colors.primary }]}>
                    <ThemedText style={styles.barText}>{teamAProb}%</ThemedText>
                </View>
                <View style={[styles.barSegmentB, { flex: Math.max(teamBProb, 5), backgroundColor: colors.secondary }]}>
                    <ThemedText style={styles.barText}>{teamBProb}%</ThemedText>
                </View>
            </View>

            {/* Voting Action Buttons */}
            <View style={styles.buttonsRow}>
                <TouchableOpacity
                    style={[
                        styles.voteBtn,
                        { backgroundColor: isVotedA ? colors.primary : `${colors.primary}15`, borderColor: colors.primary },
                        isVotingLoading && { opacity: 0.6 }
                    ]}
                    onPress={() => onVote(teamAId)}
                    disabled={isVotingLoading}
                    activeOpacity={0.7}
                >
                    {isVotedA && <Ionicons name="checkmark-circle" size={14} color="#FFFFFF" />}
                    <ThemedText style={[styles.btnText, { color: isVotedA ? '#FFFFFF' : colors.primary }]}>
                        {teamAName}
                    </ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.voteBtn,
                        { backgroundColor: isVotedB ? colors.secondary : `${colors.secondary}15`, borderColor: colors.secondary },
                        isVotingLoading && { opacity: 0.6 }
                    ]}
                    onPress={() => onVote(teamBId)}
                    disabled={isVotingLoading}
                    activeOpacity={0.7}
                >
                    {isVotedB && <Ionicons name="checkmark-circle" size={14} color="#FFFFFF" />}
                    <ThemedText style={[styles.btnText, { color: isVotedB ? '#FFFFFF' : colors.secondary }]}>
                        {teamBName}
                    </ThemedText>
                </TouchableOpacity>
            </View>
        </View>
    );
});

const styles = StyleSheet.create({
    card: {
        padding: 12,
        borderRadius: Layout.borderRadius,
        borderWidth: 1,
        marginBottom: 14,
        gap: 10
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6
    },
    title: {
        fontSize: 13.5,
        fontWeight: '700',
        flex: 1
    },
    votesCount: {
        fontSize: 11,
        fontWeight: '600'
    },
    barContainer: {
        height: 24,
        borderRadius: 12,
        flexDirection: 'row',
        overflow: 'hidden'
    },
    barSegmentA: {
        justifyContent: 'center',
        alignItems: 'flex-start',
        paddingLeft: 8
    },
    barSegmentB: {
        justifyContent: 'center',
        alignItems: 'flex-end',
        paddingRight: 8
    },
    barText: {
        color: '#FFFFFF',
        fontSize: 10.5,
        fontWeight: '800'
    },
    buttonsRow: {
        flexDirection: 'row',
        gap: 10
    },
    voteBtn: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderRadius: Layout.borderRadius - 4,
        borderWidth: 1,
        gap: 4
    },
    btnText: {
        fontSize: 12,
        fontWeight: '700'
    }
});
