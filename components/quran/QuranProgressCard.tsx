import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/context/ThemeContext';
import { SurahListItem } from '@/apis/quran';
import {
    getCompletedSurahs,
    getCompletionGoal,
    setCompletionGoal,
    clearCompletionGoal,
    TOTAL_SURAHS,
    TOTAL_JUZ,
    TOTAL_AYAHS,
    type CompletionGoal,
} from '@/utils/quranProgress';
import { QuranProgressRing } from './QuranProgressRing';
import { QuranGoalModal } from './QuranGoalModal';

interface QuranProgressCardProps {
    /** Full Surah list — used to look up ayah counts for completed Surahs (Juz estimate). */
    surahs: SurahListItem[];
}

/**
 * Reading progress tracker: a ring showing % of Surahs completed, an
 * estimated Juz count (derived from ayahs read, since Juz boundaries don't
 * line up with Surah ones), and an optional "complete the Quran in X days"
 * goal with a simple on-track/behind indicator.
 */
export function QuranProgressCard({ surahs }: QuranProgressCardProps) {
    const { theme } = useTheme();
    const colors = Colors[theme];

    const [completedSurahs, setCompletedSurahsState] = useState<number[]>([]);
    const [goal, setGoalState] = useState<CompletionGoal | null>(null);
    const [goalModalVisible, setGoalModalVisible] = useState(false);

    useFocusEffect(
        useCallback(() => {
            getCompletedSurahs().then(setCompletedSurahsState);
            getCompletionGoal().then(setGoalState);
        }, [])
    );

    const stats = useMemo(() => {
        const surahCount = completedSurahs.length;
        const surahProgress = surahCount / TOTAL_SURAHS;

        const ayahsRead = surahs
            .filter((s) => completedSurahs.includes(s.number))
            .reduce((sum, s) => sum + (s.numberOfAyahs || 0), 0);
        const estimatedJuz = Math.min(TOTAL_JUZ, Math.round((ayahsRead / TOTAL_AYAHS) * TOTAL_JUZ));

        return { surahCount, surahProgress, estimatedJuz };
    }, [completedSurahs, surahs]);

    const goalStatus = useMemo(() => {
        if (!goal) return null;
        const daysElapsed = Math.max(0, Math.floor((Date.now() - goal.startedAt) / 86400000));
        const daysRemaining = Math.max(0, goal.targetDays - daysElapsed);
        const isComplete = stats.surahCount >= TOTAL_SURAHS;
        const expectedProgress = Math.min(1, daysElapsed / goal.targetDays);
        // Small tolerance so hitting the exact expected pace doesn't read as "behind".
        const onTrack = isComplete || stats.surahProgress >= expectedProgress - 0.03;
        const expired = !isComplete && daysRemaining === 0;
        return { daysElapsed, daysRemaining, isComplete, onTrack, expired };
    }, [goal, stats.surahCount, stats.surahProgress]);

    const handleSelectGoal = useCallback((days: number) => {
        setCompletionGoal(days).then(setGoalState);
        setGoalModalVisible(false);
    }, []);

    const handleClearGoal = useCallback(() => {
        clearCompletionGoal();
        setGoalState(null);
        setGoalModalVisible(false);
    }, []);

    return (
        <View style={[styles.card, { backgroundColor: colors.cardBg }]}>
            <View style={styles.row}>
                <QuranProgressRing
                    progress={stats.surahProgress}
                    color={colors.primary}
                    trackColor={theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}
                >
                    <ThemedText style={[styles.ringPercent, { color: colors.text }]}>
                        {Math.round(stats.surahProgress * 100)}%
                    </ThemedText>
                </QuranProgressRing>

                <View style={styles.statsWrap}>
                    <ThemedText style={[styles.statsTitle, { color: colors.text }]}>Your Progress</ThemedText>
                    <View style={styles.statLine}>
                        <Ionicons name="bookmark" size={12} color={colors.primary} />
                        <ThemedText style={[styles.statText, { color: colors.textSecondary }]}>
                            {stats.surahCount}/{TOTAL_SURAHS} Surahs completed
                        </ThemedText>
                    </View>
                    <View style={styles.statLine}>
                        <Ionicons name="layers" size={12} color={colors.secondary} />
                        <ThemedText style={[styles.statText, { color: colors.textSecondary }]}>
                            ~{stats.estimatedJuz}/{TOTAL_JUZ} Juz (estimated)
                        </ThemedText>
                    </View>
                </View>
            </View>

            <View style={[styles.goalWrap, { borderTopColor: colors.border }]}>
                {goal && goalStatus ? (
                    <TouchableOpacity onPress={() => setGoalModalVisible(true)} style={styles.goalRow}>
                        <View style={{ flex: 1 }}>
                            <ThemedText style={[styles.goalLabel, { color: colors.textSecondary }]}>
                                GOAL: COMPLETE IN {goal.targetDays} DAYS
                            </ThemedText>
                            <ThemedText style={[styles.goalStatus, { color: goalStatus.isComplete ? colors.primary : goalStatus.onTrack ? colors.text : '#EF4444' }]}>
                                {goalStatus.isComplete
                                    ? '🎉 Goal complete — Alhamdulillah!'
                                    : goalStatus.expired
                                        ? 'Goal period ended — tap to set a new one'
                                        : `Day ${goalStatus.daysElapsed + 1} · ${goalStatus.daysRemaining} days left · ${goalStatus.onTrack ? 'on track' : 'behind pace'}`}
                            </ThemedText>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity style={styles.setGoalBtn} onPress={() => setGoalModalVisible(true)}>
                        <Ionicons name="flag-outline" size={15} color={colors.primary} />
                        <ThemedText style={[styles.setGoalText, { color: colors.primary }]}>
                            Set a &quot;Complete the Quran&quot; goal
                        </ThemedText>
                    </TouchableOpacity>
                )}
            </View>

            <QuranGoalModal
                visible={goalModalVisible}
                onClose={() => setGoalModalVisible(false)}
                onSelect={handleSelectGoal}
                onClearGoal={goal ? handleClearGoal : undefined}
                hasActiveGoal={!!goal}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: Layout.cardBorderRadius,
        padding: 14,
        marginBottom: 14,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    ringPercent: { fontSize: 15, fontWeight: '800' },
    statsWrap: { flex: 1, gap: 6 },
    statsTitle: { fontSize: 13.5, fontWeight: '800', marginBottom: 2 },
    statLine: { flexDirection: 'row', alignItems: 'center', gap: 7 },
    statText: { fontSize: 11.5, fontWeight: '600' },
    goalWrap: {
        marginTop: 14,
        paddingTop: 12,
        borderTopWidth: StyleSheet.hairlineWidth,
    },
    goalRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    goalLabel: { fontSize: 9.5, fontWeight: '800', letterSpacing: 0.5, marginBottom: 3 },
    goalStatus: { fontSize: 12.5, fontWeight: '700' },
    setGoalBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 4 },
    setGoalText: { fontSize: 12.5, fontWeight: '700' },
});
