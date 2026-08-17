import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/context/ThemeContext';
import { Team } from '@/types/cricket';

interface PointsTableCardProps {
    teams: Team[];
}

export const PointsTableCard = React.memo(function PointsTableCard({ teams }: PointsTableCardProps) {
    const { theme } = useTheme();
    const colors = Colors[theme];

    if (!teams || teams.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>
                    No teams registered yet to display standings.
                </ThemedText>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            {/* Header */}
            <View style={[styles.row, styles.headerRow, { backgroundColor: colors.surface }]}>
                <ThemedText style={[styles.colRank, styles.headerText, { color: colors.textSecondary }]}>#</ThemedText>
                <ThemedText style={[styles.colTeam, styles.headerText, { color: colors.textSecondary }]}>Team</ThemedText>
                <ThemedText style={[styles.colStat, styles.headerText, { color: colors.textSecondary }]}>P</ThemedText>
                <ThemedText style={[styles.colStat, styles.headerText, { color: colors.textSecondary }]}>W</ThemedText>
                <ThemedText style={[styles.colStat, styles.headerText, { color: colors.textSecondary }]}>L</ThemedText>
                <ThemedText style={[styles.colStat, styles.headerText, { color: colors.primary }]}>Pts</ThemedText>
                <ThemedText style={[styles.colNRR, styles.headerText, { color: colors.textSecondary }]}>NRR</ThemedText>
            </View>

            {/* Team Rows */}
            {teams.map((team, index) => {
                const stats = team.stats || { played: 0, won: 0, lost: 0, points: 0, netRunRate: 0.0 };
                return (
                    <View
                        key={team._id || index}
                        style={[
                            styles.row,
                            index % 2 === 1 && { backgroundColor: `${colors.surface}50` }
                        ]}
                    >
                        <ThemedText style={[styles.colRank, { color: colors.textSecondary, fontWeight: '700' }]}>
                            {index + 1}
                        </ThemedText>
                        <ThemedText style={[styles.colTeam, { color: colors.text, fontWeight: '700' }]} numberOfLines={1}>
                            {team.name}
                        </ThemedText>
                        <ThemedText style={[styles.colStat, { color: colors.text }]}>{stats.played}</ThemedText>
                        <ThemedText style={[styles.colStat, { color: colors.success, fontWeight: '700' }]}>{stats.won}</ThemedText>
                        <ThemedText style={[styles.colStat, { color: colors.danger }]}>{stats.lost}</ThemedText>
                        <ThemedText style={[styles.colStat, { color: colors.primary, fontWeight: '800' }]}>{stats.points}</ThemedText>
                        <ThemedText style={[styles.colNRR, { color: colors.textSecondary }]}>
                            {stats.netRunRate >= 0 ? `+${stats.netRunRate.toFixed(2)}` : stats.netRunRate.toFixed(2)}
                        </ThemedText>
                    </View>
                );
            })}
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        borderRadius: Layout.borderRadius
        overflow: 'hidden',
        marginBottom: 16
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 12
    },
    headerRow: {,
        borderBottomColor: 'rgba(150,150,150,0.15)'
    },
    headerText: {
        fontSize: 10.5,
        fontWeight: '800',
        textTransform: 'uppercase'
    },
    colRank: {
        width: 24,
        fontSize: 12,
        textAlign: 'center'
    },
    colTeam: {
        flex: 1,
        fontSize: 12.5,
        paddingLeft: 6
    },
    colStat: {
        width: 32,
        fontSize: 12,
        textAlign: 'center'
    },
    colNRR: {
        width: 50,
        fontSize: 11,
        textAlign: 'right'
    },
    emptyContainer: {
        padding: 20,
        alignItems: 'center'
    },
    emptyText: {
        fontSize: 12.5,
        textAlign: 'center'
    }
});
