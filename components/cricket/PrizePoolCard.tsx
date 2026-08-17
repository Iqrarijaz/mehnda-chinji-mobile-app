import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/context/ThemeContext';
import { TournamentPrizes } from '@/types/cricket';

interface PrizePoolCardProps {
    prizes: TournamentPrizes;
}

export const PrizePoolCard = React.memo(function PrizePoolCard({ prizes }: PrizePoolCardProps) {
    const { theme } = useTheme();
    const colors = Colors[theme];

    if (!prizes?.winnerPrize && !prizes?.runnerUpPrize) return null;

    return (
        <View style={[styles.container, { backgroundColor: `${colors.accent}12`, borderColor: `${colors.accent}40` }]}>
            <View style={styles.header}>
                <Ionicons name="trophy" size={20} color={colors.secondary} />
                <ThemedText style={[styles.headerTitle, { color: colors.text }]}>
                    Prize Pool & Rewards
                </ThemedText>
            </View>

            <View style={styles.grid}>
                {/* Winner Prize */}
                <View style={[styles.prizeTile, { backgroundColor: colors.surface }]}>
                    <View style={styles.prizeBadge}>
                        <ThemedText style={styles.badgeText}>🥇 WINNER</ThemedText>
                    </View>
                    <ThemedText style={[styles.prizeValue, { color: colors.primary }]} numberOfLines={1}>
                        {prizes.winnerPrize}
                    </ThemedText>
                </View>

                {/* Runner-Up Prize */}
                <View style={[styles.prizeTile, { backgroundColor: colors.surface }]}>
                    <View style={[styles.prizeBadge, { backgroundColor: colors.textSecondary }]}>
                        <ThemedText style={styles.badgeText}>🥈 RUNNER-UP</ThemedText>
                    </View>
                    <ThemedText style={[styles.prizeValue, { color: colors.text }]} numberOfLines={1}>
                        {prizes.runnerUpPrize}
                    </ThemedText>
                </View>
            </View>

            {/* Special Prizes if present */}
            {(prizes.manOfTheSeriesPrize || prizes.bestBowlerPrize) && (
                <View style={styles.extraRow}>
                    {prizes.manOfTheSeriesPrize ? (
                        <ThemedText style={[styles.extraText, { color: colors.textSecondary }]}>
                            ⭐ Player of Tournament: <ThemedText style={{ color: colors.text, fontWeight: '700' }}>{prizes.manOfTheSeriesPrize}</ThemedText>
                        </ThemedText>
                    ) : null}
                    {prizes.bestBowlerPrize ? (
                        <ThemedText style={[styles.extraText, { color: colors.textSecondary }]}>
                            🎯 Best Bowler: <ThemedText style={{ color: colors.text, fontWeight: '700' }}>{prizes.bestBowlerPrize}</ThemedText>
                        </ThemedText>
                    ) : null}
                </View>
            )}
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        padding: 14,
        borderRadius: Layout.borderRadius,
        borderWidth: 1,
        marginBottom: 16,
        gap: 12
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8
    },
    headerTitle: {
        fontSize: 15,
        fontWeight: '800'
    },
    grid: {
        flexDirection: 'row',
        gap: 10
    },
    prizeTile: {
        flex: 1,
        padding: 10,
        borderRadius: Layout.borderRadius - 4,
        gap: 6
    },
    prizeBadge: {
        alignSelf: 'flex-start',
        backgroundColor: '#F59E0B',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4
    },
    badgeText: {
        color: '#FFFFFF',
        fontSize: 9,
        fontWeight: '800'
    },
    prizeValue: {
        fontSize: 13,
        fontWeight: '800'
    },
    extraRow: {
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: 'rgba(150,150,150,0.15)',
        gap: 4
    },
    extraText: {
        fontSize: 11.5
    }
});
