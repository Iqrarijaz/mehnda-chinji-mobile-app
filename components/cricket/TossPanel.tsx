import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { SubmitButton } from '@/components/common/SubmitButton';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/context/ThemeContext';
import { CricketMatch } from '@/types/cricket';
import { capitalizeString } from '@/utils/string';

interface TossPanelProps {
    match: CricketMatch;
    onSubmit: (payload: { tossWinnerId: string; tossDecision: 'BAT' | 'BOWL' }) => void;
    isLoading?: boolean;
}

type TeamSide = CricketMatch['teamA'];

/**
 * Toss step shown before the over-scoring panel.
 *
 * The toss decides who bats first, so it has to be recorded before any over
 * can be attributed to an innings — the backend rejects scoring until it's
 * set. Once recorded this collapses to a read-only summary.
 */
export const TossPanel = React.memo(function TossPanel({ match, onSubmit, isLoading = false }: TossPanelProps) {
    const { theme } = useTheme();
    const colors = Colors[theme];

    const [winnerId, setWinnerId] = useState<string>('');
    const [decision, setDecision] = useState<'BAT' | 'BOWL' | ''>('');

    const isRecorded = !!match.tossWinnerId && !!match.tossDecision;

    const renderTeamOption = (team: TeamSide) => {
        const isSelected = winnerId === team.id;
        return (
            <TouchableOpacity
                key={team.id}
                style={[
                    styles.teamOption,
                    { backgroundColor: isSelected ? colors.primary : colors.surface }
                ]}
                onPress={() => setWinnerId(team.id)}
                activeOpacity={0.8}
            >
                {team.logo ? (
                    <Image source={{ uri: team.logo }} style={styles.teamLogo} />
                ) : (
                    <View style={[styles.teamLogo, styles.teamLogoFallback, { backgroundColor: isSelected ? 'rgba(255,255,255,0.25)' : `${colors.primary}1A` }]}>
                        <ThemedText style={[styles.teamInitial, { color: isSelected ? '#FFFFFF' : colors.primary }]}>
                            {team.name?.charAt(0)?.toUpperCase() || '?'}
                        </ThemedText>
                    </View>
                )}
                <ThemedText
                    style={[styles.teamOptionText, { color: isSelected ? '#FFFFFF' : colors.text }]}
                    numberOfLines={1}
                >
                    {capitalizeString(team.name)}
                </ThemedText>
            </TouchableOpacity>
        );
    };

    if (isRecorded) {
        const winnerName = match.tossWinnerId === match.teamA.id ? match.teamA.name : match.teamB.name;
        return (
            <View style={[styles.card, { backgroundColor: colors.cardBg }]}>
                <View style={styles.header}>
                    <Ionicons name="disc-outline" size={16} color={colors.secondary} />
                    <ThemedText style={[styles.headerTitle, { color: colors.text }]}>Toss</ThemedText>
                </View>
                <ThemedText style={[styles.recordedText, { color: colors.textSecondary }]}>
                    <ThemedText style={{ color: colors.text, fontWeight: '800' }}>
                        {capitalizeString(winnerName)}
                    </ThemedText>
                    {' won the toss and chose to '}
                    <ThemedText style={{ color: colors.secondary, fontWeight: '800' }}>
                        {match.tossDecision === 'BAT' ? 'bat' : 'bowl'}
                    </ThemedText>
                    {' first.'}
                </ThemedText>
            </View>
        );
    }

    return (
        <View style={[styles.card, { backgroundColor: colors.cardBg }]}>
            <View style={styles.header}>
                <Ionicons name="disc-outline" size={16} color={colors.secondary} />
                <ThemedText style={[styles.headerTitle, { color: colors.text }]}>Record the Toss</ThemedText>
            </View>

            <ThemedText style={[styles.hint, { color: colors.textSecondary }]}>
                The toss sets the batting order, so it must be recorded before scoring can begin.
            </ThemedText>

            <View style={styles.section}>
                <ThemedText style={[styles.label, { color: colors.textSecondary }]}>WHO WON THE TOSS?</ThemedText>
                <View style={styles.teamsRow}>
                    {renderTeamOption(match.teamA)}
                    {renderTeamOption(match.teamB)}
                </View>
            </View>

            <View style={styles.section}>
                <ThemedText style={[styles.label, { color: colors.textSecondary }]}>THEY CHOSE TO</ThemedText>
                <View style={styles.decisionRow}>
                    {(['BAT', 'BOWL'] as const).map((d) => {
                        const isSelected = decision === d;
                        return (
                            <TouchableOpacity
                                key={d}
                                style={[
                                    styles.decisionPill,
                                    { backgroundColor: isSelected ? colors.primary : colors.surface }
                                ]}
                                onPress={() => setDecision(d)}
                                activeOpacity={0.8}
                            >
                                <ThemedText style={[styles.decisionText, { color: isSelected ? '#FFFFFF' : colors.text }]}>
                                    {d === 'BAT' ? 'Bat First' : 'Bowl First'}
                                </ThemedText>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>

            <SubmitButton
                title="Save Toss & Start Scoring"
                onPress={() => {
                    if (!winnerId || !decision) return;
                    onSubmit({ tossWinnerId: winnerId, tossDecision: decision });
                }}
                isLoading={isLoading}
                disabled={!winnerId || !decision}
            />
        </View>
    );
});

const styles = StyleSheet.create({
    card: {
        padding: 10,
        borderRadius: Layout.borderRadius - 4,
        marginBottom: 16,
        gap: 12
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6
    },
    headerTitle: {
        fontSize: 15,
        fontWeight: '800'
    },
    hint: {
        fontSize: 11,
        lineHeight: 16
    },
    recordedText: {
        fontSize: 12.5,
        lineHeight: 19
    },
    section: {
        gap: 6
    },
    label: {
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.5
    },
    teamsRow: {
        flexDirection: 'row',
        gap: 8
    },
    teamOption: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        height: 44,
        borderRadius: Layout.borderRadius - 4
    },
    teamLogo: {
        width: 24,
        height: 24,
        borderRadius: 12
    },
    teamLogoFallback: {
        justifyContent: 'center',
        alignItems: 'center'
    },
    teamInitial: {
        fontSize: 11,
        fontWeight: '800'
    },
    teamOptionText: {
        fontSize: 12,
        fontWeight: '700',
        flexShrink: 1
    },
    decisionRow: {
        flexDirection: 'row',
        gap: 8
    },
    decisionPill: {
        flex: 1,
        height: 34,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 17
    },
    decisionText: {
        fontSize: 12,
        fontWeight: '700'
    }
});
