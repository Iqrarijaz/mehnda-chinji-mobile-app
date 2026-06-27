import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';

interface StreakBannerProps {
    colors: any;
    accentColor: string;
    streak: number;
}

export const StreakBanner = React.memo(({ colors, accentColor, streak }: StreakBannerProps) => {

    const tip = useMemo(() => {
        if (streak === 0) {
            return "Start tracking your prayers today! Consistency brings peace and tranquility to your daily life.";
        }
        if (streak <= 3) {
            return "MashaAllah, great start! 'The most beloved deeds to Allah are those most consistent.' — Bukhari";
        }
        return `Excellent progress! You've maintained a ${streak}-day prayer streak. May Allah accept your efforts and grant you steadfastness.`;
    }, [streak]);

    return (
        <View style={[styles.container, { backgroundColor: colors.card }]}>
            <View style={styles.left}>
                <View style={[styles.streakIconCircle, { backgroundColor: accentColor + '15' }]}>
                    <Ionicons name="flame" size={24} color={streak > 0 ? '#F59E0B' : colors.textSecondary} />
                </View>
                <View style={{ marginLeft: 14, flex: 1 }}>
                    <ThemedText style={styles.streakTitle}>
                        {streak > 0 ? `${streak} Day Streak!` : '0 Day Streak'}
                    </ThemedText>
                    <ThemedText style={[styles.streakSub, { color: colors.textSecondary }]}>
                        {tip}
                    </ThemedText>
                </View>
            </View>
        </View>
    );
});

StreakBanner.displayName = 'StreakBanner';

const styles = StyleSheet.create({
    container: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        flexDirection: 'row',
        alignItems: 'center',
    },
    left: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    streakIconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    streakTitle: {
        fontSize: 16,
        fontWeight: '800',
    },
    streakSub: {
        fontSize: 11,
        marginTop: 4,
        lineHeight: 14,
    },
});
