import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/context/ThemeContext';
import { BallRecord } from '@/types/cricket';
import { capitalizeString } from '@/utils/string';

interface BallTimelineRowProps {
    ball: BallRecord;
    ballIndex: number;
    isLast?: boolean;
}

export const BallTimelineRow = React.memo(function BallTimelineRow({
    ball,
    ballIndex,
    isLast = false
}: BallTimelineRowProps) {
    const { theme } = useTheme();
    const colors = Colors[theme];

    // Determine badge styling based on outcome
    const getOutcomeBadge = () => {
        if (ball.isWicket) {
            return {
                label: 'W',
                bgColor: colors.danger,
                textColor: '#FFFFFF',
                subText: ball.wicketType ? capitalizeString(ball.wicketType.replace('_', ' ')) : 'Wicket'
            };
        }
        if (ball.isWide) {
            return {
                label: ball.runs > 1 ? `Wd+${ball.runs - 1}` : 'Wd',
                bgColor: `${colors.warning}25`,
                textColor: colors.warning,
                subText: 'Wide Ball'
            };
        }
        if (ball.isNoBall) {
            return {
                label: ball.runs > 1 ? `Nb+${ball.runs - 1}` : 'Nb',
                bgColor: `${colors.warning}25`,
                textColor: colors.warning,
                subText: 'No Ball'
            };
        }
        if (ball.isBye || ball.isLegBye) {
            return {
                label: `${ball.runs}${ball.isLegBye ? 'LB' : 'B'}`,
                bgColor: `${colors.textSecondary}20`,
                textColor: colors.text,
                subText: ball.isLegBye ? 'Leg Bye' : 'Bye'
            };
        }
        if (ball.runs === 6) {
            return {
                label: '6',
                bgColor: '#8B5CF6', // Vivid Purple for 6s
                textColor: '#FFFFFF',
                subText: 'Maximum (SIX!)'
            };
        }
        if (ball.runs === 4) {
            return {
                label: '4',
                bgColor: colors.primary,
                textColor: '#FFFFFF',
                subText: 'Boundary (FOUR)'
            };
        }
        if (ball.runs === 0) {
            return {
                label: '•',
                bgColor: colors.surface,
                textColor: colors.textSecondary,
                subText: 'Dot ball'
            };
        }
        return {
            label: String(ball.runs),
            bgColor: `${colors.primary}18`,
            textColor: colors.primary,
            subText: `${ball.runs} run${ball.runs > 1 ? 's' : ''}`
        };
    };

    const badge = getOutcomeBadge();
    const batsmanName = ball.strikerName || (ball as any).batsmanName || '';
    const bowlerName = ball.bowlerName || '';

    return (
        <View style={[
            styles.container,
            { borderBottomColor: colors.border },
            isLast && styles.noBorder
        ]}>
            {/* Left Ball Index */}
            <View style={styles.leftCol}>
                <ThemedText style={[styles.ballNumberText, { color: colors.textSecondary }]}>
                    Ball {ballIndex + 1}
                </ThemedText>
            </View>

            {/* Outcome Badge */}
            <View style={[styles.badge, { backgroundColor: badge.bgColor }]}>
                <ThemedText style={[styles.badgeText, { color: badge.textColor }]}>
                    {badge.label}
                </ThemedText>
            </View>

            {/* Middle: Player Matchup & Commentary / Details */}
            <View style={styles.contentCol}>
                {(bowlerName || batsmanName) ? (
                    <ThemedText style={[styles.matchupText, { color: colors.text }]} numberOfLines={1}>
                        {bowlerName ? capitalizeString(bowlerName) : 'Bowler'}
                        <ThemedText style={{ color: colors.textSecondary, fontWeight: '400' }}> to </ThemedText>
                        {batsmanName ? capitalizeString(batsmanName) : 'Striker'}
                    </ThemedText>
                ) : null}

                <ThemedText style={[
                    styles.subText,
                    { color: ball.isWicket ? colors.danger : colors.textSecondary }
                ]} numberOfLines={1}>
                    {ball.commentary ? ball.commentary : badge.subText}
                </ThemedText>
            </View>

            {/* Right: Total Runs Pill */}
            <View style={styles.runsCol}>
                <ThemedText style={[styles.runsText, { color: colors.text }]}>
                    {ball.totalRuns ?? ball.runs} {ball.totalRuns === 1 ? 'run' : 'runs'}
                </ThemedText>
            </View>
        </View>
    );
});

BallTimelineRow.displayName = 'BallTimelineRow';

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 8,
        borderBottomWidth: StyleSheet.hairlineWidth,
        gap: 10
    },
    noBorder: {
        borderBottomWidth: 0
    },
    leftCol: {
        width: 44
    },
    ballNumberText: {
        fontSize: 10.5,
        fontWeight: '600'
    },
    badge: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center'
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '800'
    },
    contentCol: {
        flex: 1,
        justifyContent: 'center',
        gap: 2
    },
    matchupText: {
        fontSize: 11.5,
        fontWeight: '700'
    },
    subText: {
        fontSize: 10.5,
        fontWeight: '500'
    },
    runsCol: {
        alignItems: 'flex-end'
    },
    runsText: {
        fontSize: 11,
        fontWeight: '600'
    }
});
