import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { StatusBadge } from '@/components/cricket/StatusBadge';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/context/ThemeContext';
import { CricketMatch } from '@/types/cricket';
import { capitalizeString } from '@/utils/string';

interface KnockoutBracketViewProps {
    matches: CricketMatch[];
    onSelectMatch: (matchId: string) => void;
}

export const KnockoutBracketView = React.memo(function KnockoutBracketView({
    matches,
    onSelectMatch
}: KnockoutBracketViewProps) {
    const { theme } = useTheme();
    const colors = Colors[theme];

    const quarterFinals = matches.filter(m => m.stage === 'QUARTER_FINAL');
    const semiFinals = matches.filter(m => m.stage === 'SEMI_FINAL');
    const finals = matches.filter(m => m.stage === 'FINAL');

    const hasKnockouts = quarterFinals.length > 0 || semiFinals.length > 0 || finals.length > 0;

    if (!hasKnockouts) {
        return (
            <View style={[styles.emptyContainer, { backgroundColor: colors.cardBg }]}>
                <Ionicons name="git-network-outline" size={42} color={colors.textSecondary} />
                <ThemedText style={[styles.emptyTitle, { color: colors.text }]}>
                    No Playoff Fixtures Yet
                </ThemedText>
                <ThemedText style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                    Knockout rounds (Quarter Finals, Semi Finals, and Finals) will appear here once scheduled.
                </ThemedText>
            </View>
        );
    }

    const renderMatchTile = (match: CricketMatch, isGrandFinal = false) => {
        const isCompleted = match.status === 'COMPLETED';
        const isLive = match.status === 'LIVE';
        const winnerId = match.winnerTeamId ? String(match.winnerTeamId) : null;
        const isWinnerA = isCompleted && winnerId && (String(match.teamA.id) === winnerId || (match.teamA as any)._id === winnerId);
        const isWinnerB = isCompleted && winnerId && (String(match.teamB.id) === winnerId || (match.teamB as any)._id === winnerId);

        const scoreA = match.innings1?.battingTeamId === match.teamA.id
            ? match.innings1
            : match.innings2?.battingTeamId === match.teamA.id
            ? match.innings2
            : null;

        const scoreB = match.innings1?.battingTeamId === match.teamB.id
            ? match.innings1
            : match.innings2?.battingTeamId === match.teamB.id
            ? match.innings2
            : null;

        return (
            <TouchableOpacity
                key={match._id}
                style={[
                    styles.bracketCard,
                    {
                        backgroundColor: colors.modalBackground,
                        borderColor: isGrandFinal ? colors.primary : colors.border
                    },
                    isGrandFinal && styles.grandFinalCard
                ]}
                onPress={() => onSelectMatch(match._id)}
                activeOpacity={0.8}
            >
                {/* Header with Title / Status */}
                <View style={styles.cardHeader}>
                    <View style={styles.titleRow}>
                        {isGrandFinal && (
                            <Ionicons name="trophy" size={14} color={colors.secondary} style={{ marginRight: 4 }} />
                        )}
                        <ThemedText style={[styles.matchTitle, { color: isGrandFinal ? colors.primary : colors.text }]} numberOfLines={1}>
                            {match.matchTitle || (isGrandFinal ? 'Grand Final' : 'Playoff Match')}
                        </ThemedText>
                    </View>
                    <StatusBadge status={match.status} />
                </View>

                {/* Team A Row */}
                <View style={[
                    styles.teamRow,
                    isWinnerA && { backgroundColor: `${colors.success}12` }
                ]}>
                    <View style={styles.teamInfo}>
                        {match.teamA.logo ? (
                            <Image source={{ uri: match.teamA.logo }} style={styles.teamLogo} />
                        ) : (
                            <View style={[styles.teamLogoFallback, { backgroundColor: `${colors.primary}18` }]}>
                                <ThemedText style={[styles.teamInitial, { color: colors.primary }]}>
                                    {match.teamA.name?.charAt(0)?.toUpperCase() || 'A'}
                                </ThemedText>
                            </View>
                        )}
                        <ThemedText
                            style={[
                                styles.teamName,
                                { color: colors.text },
                                isWinnerA && { fontWeight: '800', color: colors.success }
                            ]}
                            numberOfLines={1}
                        >
                            {capitalizeString(match.teamA.name)}
                        </ThemedText>
                        {isWinnerA && (
                            <Ionicons name="checkmark-circle" size={13} color={colors.success} style={{ marginLeft: 3 }} />
                        )}
                    </View>
                    {scoreA && (isLive || isCompleted) ? (
                        <ThemedText style={[styles.teamScore, { color: colors.text }]}>
                            {scoreA.totalRuns}/{scoreA.totalWickets}
                        </ThemedText>
                    ) : null}
                </View>

                {/* Team B Row */}
                <View style={[
                    styles.teamRow,
                    isWinnerB && { backgroundColor: `${colors.success}12` }
                ]}>
                    <View style={styles.teamInfo}>
                        {match.teamB.logo ? (
                            <Image source={{ uri: match.teamB.logo }} style={styles.teamLogo} />
                        ) : (
                            <View style={[styles.teamLogoFallback, { backgroundColor: `${colors.primary}18` }]}>
                                <ThemedText style={[styles.teamInitial, { color: colors.primary }]}>
                                    {match.teamB.name?.charAt(0)?.toUpperCase() || 'B'}
                                </ThemedText>
                            </View>
                        )}
                        <ThemedText
                            style={[
                                styles.teamName,
                                { color: colors.text },
                                isWinnerB && { fontWeight: '800', color: colors.success }
                            ]}
                            numberOfLines={1}
                        >
                            {capitalizeString(match.teamB.name)}
                        </ThemedText>
                        {isWinnerB && (
                            <Ionicons name="checkmark-circle" size={13} color={colors.success} style={{ marginLeft: 3 }} />
                        )}
                    </View>
                    {scoreB && (isLive || isCompleted) ? (
                        <ThemedText style={[styles.teamScore, { color: colors.text }]}>
                            {scoreB.totalRuns}/{scoreB.totalWickets}
                        </ThemedText>
                    ) : null}
                </View>

                {/* Footer result or date */}
                <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
                    <ThemedText style={[styles.footerText, { color: match.result ? colors.primary : colors.textSecondary }]} numberOfLines={1}>
                        {match.result ? match.result : (match.venue ? `📍 ${match.venue}` : 'Fixture Scheduled')}
                    </ThemedText>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollContainer}
        >
            {/* Quarter Finals Column */}
            {quarterFinals.length > 0 && (
                <View style={styles.stageColumn}>
                    <View style={[styles.stageHeaderBadge, { backgroundColor: `${colors.primary}15` }]}>
                        <ThemedText style={[styles.stageHeaderText, { color: colors.primary }]}>
                            Quarter Finals ({quarterFinals.length})
                        </ThemedText>
                    </View>
                    <View style={styles.columnMatches}>
                        {quarterFinals.map(m => renderMatchTile(m))}
                    </View>
                </View>
            )}

            {/* Semi Finals Column */}
            {semiFinals.length > 0 && (
                <View style={styles.stageColumn}>
                    <View style={[styles.stageHeaderBadge, { backgroundColor: `${colors.primary}15` }]}>
                        <ThemedText style={[styles.stageHeaderText, { color: colors.primary }]}>
                            Semi Finals ({semiFinals.length})
                        </ThemedText>
                    </View>
                    <View style={styles.columnMatches}>
                        {semiFinals.map(m => renderMatchTile(m))}
                    </View>
                </View>
            )}

            {/* Finals Column */}
            {finals.length > 0 && (
                <View style={styles.stageColumn}>
                    <View style={[styles.stageHeaderBadge, { backgroundColor: `${colors.secondary}20` }]}>
                        <Ionicons name="trophy" size={13} color={colors.secondary} style={{ marginRight: 4 }} />
                        <ThemedText style={[styles.stageHeaderText, { color: colors.secondary }]}>
                            Grand Final
                        </ThemedText>
                    </View>
                    <View style={styles.columnMatches}>
                        {finals.map(m => renderMatchTile(m, true))}
                    </View>
                </View>
            )}
        </ScrollView>
    );
});

KnockoutBracketView.displayName = 'KnockoutBracketView';

const styles = StyleSheet.create({
    scrollContainer: {
        paddingVertical: 12,
        paddingHorizontal: 4,
        gap: 16
    },
    stageColumn: {
        width: 240,
        gap: 10
    },
    stageHeaderBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20
    },
    stageHeaderText: {
        fontSize: 11.5,
        fontWeight: '800',
        letterSpacing: 0.3
    },
    columnMatches: {
        gap: 12
    },
    bracketCard: {
        borderRadius: Layout.borderRadius,
        borderWidth: 1,
        padding: 10,
        gap: 8,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3
    },
    grandFinalCard: {
        borderWidth: 1.5
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 6
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1
    },
    matchTitle: {
        fontSize: 11.5,
        fontWeight: '700',
        flex: 1
    },
    teamRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 4,
        paddingHorizontal: 6,
        borderRadius: 6
    },
    teamInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 6
    },
    teamLogo: {
        width: 20,
        height: 20,
        borderRadius: 10
    },
    teamLogoFallback: {
        width: 20,
        height: 20,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center'
    },
    teamInitial: {
        fontSize: 10,
        fontWeight: '800'
    },
    teamName: {
        fontSize: 11.5,
        fontWeight: '600',
        flex: 1
    },
    teamScore: {
        fontSize: 11.5,
        fontWeight: '800'
    },
    cardFooter: {
        borderTopWidth: StyleSheet.hairlineWidth,
        paddingTop: 6
    },
    footerText: {
        fontSize: 10.5,
        fontWeight: '600'
    },
    emptyContainer: {
        padding: 36,
        borderRadius: Layout.borderRadius,
        alignItems: 'center',
        gap: 8,
        marginVertical: 12
    },
    emptyTitle: {
        fontSize: 15,
        fontWeight: '800'
    },
    emptySubtitle: {
        fontSize: 11.5,
        textAlign: 'center',
        lineHeight: 16
    }
});
