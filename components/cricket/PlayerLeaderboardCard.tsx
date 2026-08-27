import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/context/ThemeContext';
import { capitalizeString } from '@/utils/string';

interface PlayerLeaderboardCardProps {
    player: {
        name: string;
        runs?: number;
        balls?: number;
        fours?: number;
        sixes?: number;
        strikeRate?: number;
        wickets?: number;
        overs?: number;
        runsConceded?: number;
        economy?: number;
        maidens?: number;
    };
    rank: number;
    type: 'batting' | 'bowling';
}

export const PlayerLeaderboardCard = React.memo(function PlayerLeaderboardCard({
    player,
    rank,
    type
}: PlayerLeaderboardCardProps) {
    const { theme } = useTheme();
    const colors = Colors[theme];

    const isTop1 = rank === 1;
    const capColor = type === 'batting' ? '#EA580C' : '#9333EA'; // Orange Cap vs Purple Cap
    const capLabel = type === 'batting' ? 'Orange Cap' : 'Purple Cap';

    const getRankBadgeColor = () => {
        if (rank === 1) return isTop1 ? capColor : '#F59E0B';
        if (rank === 2) return '#94A3B8';
        if (rank === 3) return '#D97706';
        return `${colors.textSecondary}20`;
    };

    return (
        <View style={[
            styles.card,
            {
                backgroundColor: colors.cardBg,
                borderColor: isTop1 ? capColor : colors.border
            },
            isTop1 && styles.topCard
        ]}>
            {/* Rank Indicator */}
            <View style={[
                styles.rankBadge,
                { backgroundColor: getRankBadgeColor() }
            ]}>
                <ThemedText style={[
                    styles.rankText,
                    { color: rank <= 3 ? '#FFFFFF' : colors.text }
                ]}>
                    #{rank}
                </ThemedText>
            </View>

            {/* Player Avatar Fallback / Icon */}
            <View style={[
                styles.avatarCircle,
                { backgroundColor: isTop1 ? `${capColor}20` : `${colors.primary}15` }
            ]}>
                <ThemedText style={[
                    styles.avatarInitial,
                    { color: isTop1 ? capColor : colors.primary }
                ]}>
                    {player.name ? player.name.charAt(0).toUpperCase() : 'P'}
                </ThemedText>
            </View>

            {/* Player Info */}
            <View style={styles.infoCol}>
                <View style={styles.nameRow}>
                    <ThemedText style={[styles.playerName, { color: colors.text }]} numberOfLines={1}>
                        {capitalizeString(player.name)}
                    </ThemedText>
                    {isTop1 && (
                        <View style={[styles.capBadge, { backgroundColor: `${capColor}18` }]}>
                            <ThemedText style={[styles.capText, { color: capColor }]}>
                                👑 {capLabel}
                            </ThemedText>
                        </View>
                    )}
                </View>

                {type === 'batting' ? (
                    <ThemedText style={[styles.metaText, { color: colors.textSecondary }]}>
                        SR: {player.strikeRate ?? 0} • 4s: {player.fours ?? 0} • 6s: {player.sixes ?? 0}
                    </ThemedText>
                ) : (
                    <ThemedText style={[styles.metaText, { color: colors.textSecondary }]}>
                        Econ: {player.economy ?? 0} • {player.overs ?? 0} ovs • {player.runsConceded ?? 0} runs
                    </ThemedText>
                )}
            </View>

            {/* Primary Stat Pillar */}
            <View style={styles.statPillar}>
                {type === 'batting' ? (
                    <>
                        <ThemedText style={[styles.mainStatText, { color: isTop1 ? capColor : colors.primary }]}>
                            {player.runs ?? 0}
                        </ThemedText>
                        <ThemedText style={[styles.subStatText, { color: colors.textSecondary }]}>
                            ({player.balls ?? 0} balls)
                        </ThemedText>
                    </>
                ) : (
                    <>
                        <ThemedText style={[styles.mainStatText, { color: isTop1 ? capColor : colors.primary }]}>
                            {player.wickets ?? 0} <ThemedText style={{ fontSize: 11 }}>wkts</ThemedText>
                        </ThemedText>
                        <ThemedText style={[styles.subStatText, { color: colors.textSecondary }]}>
                            ({player.overs ?? 0} overs)
                        </ThemedText>
                    </>
                )}
            </View>
        </View>
    );
});

PlayerLeaderboardCard.displayName = 'PlayerLeaderboardCard';

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: Layout.borderRadius,
        borderWidth: 1,
        marginBottom: 8,
        gap: 10
    },
    topCard: {
        borderWidth: 1.5
    },
    rankBadge: {
        width: 26,
        height: 26,
        borderRadius: 13,
        alignItems: 'center',
        justifyContent: 'center'
    },
    rankText: {
        fontSize: 11,
        fontWeight: '800'
    },
    avatarCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center'
    },
    avatarInitial: {
        fontSize: 14,
        fontWeight: '800'
    },
    infoCol: {
        flex: 1,
        gap: 2
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        flexWrap: 'wrap'
    },
    playerName: {
        fontSize: 12.5,
        fontWeight: '700'
    },
    capBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 10
    },
    capText: {
        fontSize: 9.5,
        fontWeight: '800'
    },
    metaText: {
        fontSize: 10.5,
        fontWeight: '500'
    },
    statPillar: {
        alignItems: 'flex-end'
    },
    mainStatText: {
        fontSize: 15,
        fontWeight: '900'
    },
    subStatText: {
        fontSize: 10,
        fontWeight: '500'
    }
});
