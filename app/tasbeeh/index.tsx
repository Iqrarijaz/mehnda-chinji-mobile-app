import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView, Alert, Image } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { ThemedText } from '@/components/themedText';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';

// Import memoized local components
import { DhikrChip } from '@/components/tasbeeh/DhikrChip';
import { CounterHero } from '@/components/tasbeeh/CounterHero';
import { StatCard } from '@/components/tasbeeh/StatCard';
import { TargetChip } from '@/components/tasbeeh/TargetChip';

// Import Analytics components
import { PrayerTrackerCard, PrayerKey, PrayerStatus } from '@/components/tasbeeh/PrayerTrackerCard';
import { StreakBanner } from '@/components/tasbeeh/StreakBanner';
import { WeeklyBarChart } from '@/components/tasbeeh/SpiritualCharts';

// ─── Constants ────────────────────────────────────────────────────────────────

const ACCENT = '#059669'; // emerald green — Quran module colour

const DHIKR_PRESETS = [
    { id: 'subhanallah',   arabic: 'سُبْحَانَ ٱللَّهِ',   roman: 'SubhanAllah',   meaning: 'Glory be to Allah' },
    { id: 'alhamdulillah', arabic: 'ٱلْحَمْدُ لِلَّهِ',   roman: 'Alhamdulillah', meaning: 'Praise be to Allah' },
    { id: 'allahuakbar',   arabic: 'ٱللَّهُ أَكْبَرُ',    roman: 'Allahu Akbar',  meaning: 'Allah is the Greatest' },
    { id: 'astaghfirullah',arabic: 'أَسْتَغْفِرُ ٱللَّهَ', roman: 'Astaghfirullah',meaning: 'I seek forgiveness' },
];

const TARGETS = [33, 99, 100, 0];

// Date helper for local date key YYYY-MM-DD
const getTodayString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function TasbeehScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { theme } = useTheme();
    const colors = Colors[theme];

    // Sub-modules tabs navigation state
    const [activeTab, setActiveTab] = useState<'counter' | 'analytics'>('counter');

    // Counter State
    const [count, setCount] = useState(0);
    const [dhikrIdx, setDhikrIdx] = useState(0);
    const [target, setTarget] = useState(33);
    const [sessions, setSessions] = useState(0);

    // Analytics States
    const [prayerLogs, setPrayerLogs] = useState<Record<string, Record<PrayerKey, PrayerStatus>>>({});
    const [tasbeehHistory, setTasbeehHistory] = useState<Record<string, number>>({});

    // ── Persistence ────────────────────────────────────────────────────────────
    useEffect(() => {
        (async () => {
            try {
                const [c, d, t, s, pLogs, tHistory] = await Promise.all([
                    AsyncStorage.getItem('tasbeeh_count'),
                    AsyncStorage.getItem('tasbeeh_dhikr_idx'),
                    AsyncStorage.getItem('tasbeeh_target'),
                    AsyncStorage.getItem('tasbeeh_sessions'),
                    AsyncStorage.getItem('prayer_tracker_logs'),
                    AsyncStorage.getItem('tasbeeh_history_logs'),
                ]);
                if (c) setCount(parseInt(c, 10));
                if (d) setDhikrIdx(parseInt(d, 10));
                if (t) setTarget(parseInt(t, 10));
                if (s) setSessions(parseInt(s, 10));
                if (pLogs) setPrayerLogs(JSON.parse(pLogs));
                if (tHistory) setTasbeehHistory(JSON.parse(tHistory));
            } catch {}
        })();
    }, []);

    const save = async (c: number, d: number, t: number, s: number) => {
        try {
            await Promise.all([
                AsyncStorage.setItem('tasbeeh_count', c.toString()),
                AsyncStorage.setItem('tasbeeh_dhikr_idx', d.toString()),
                AsyncStorage.setItem('tasbeeh_target', t.toString()),
                AsyncStorage.setItem('tasbeeh_sessions', s.toString()),
            ]);
        } catch {}
    };

    // ── Handlers ───────────────────────────────────────────────────────────────
    const handleTap = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        const next = count + 1;
        if (target > 0 && next >= target) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            const ns = sessions + 1;
            setCount(0); setSessions(ns);
            save(0, dhikrIdx, target, ns);

            // Increment today's Tasbeeh sessions completed
            const todayStr = getTodayString();
            const updatedHistory = {
                ...tasbeehHistory,
                [todayStr]: (tasbeehHistory[todayStr] || 0) + 1
            };
            setTasbeehHistory(updatedHistory);
            AsyncStorage.setItem('tasbeeh_history_logs', JSON.stringify(updatedHistory)).catch(() => {});

            Alert.alert('MashaAllah! 🎉', `Session ${ns} complete.`, [{ text: 'Alhamdulillah' }]);
        } else {
            setCount(next);
            save(next, dhikrIdx, target, sessions);
        }
    }, [count, target, dhikrIdx, sessions, tasbeehHistory]);

    const handleReset = useCallback(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        Alert.alert('Reset', 'Reset current count?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Reset', style: 'destructive', onPress: () => { setCount(0); save(0, dhikrIdx, target, sessions); } },
        ]);
    }, [dhikrIdx, target, sessions]);

    const handleClearAll = useCallback(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('Clear All', 'Clear count and sessions?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Clear', style: 'destructive', onPress: () => { setCount(0); setSessions(0); save(0, dhikrIdx, target, 0); } },
        ]);
    }, [dhikrIdx, target]);

    const selectDhikr = useCallback((i: number) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setDhikrIdx(i); save(count, i, target, sessions);
    }, [count, target, sessions]);

    const selectTarget = useCallback((t: number) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setTarget(t); save(count, dhikrIdx, t, sessions);
    }, [count, dhikrIdx, sessions]);

    // Toggle daily prayer status cycle
    const handleTogglePrayer = useCallback(async (prayerKey: PrayerKey) => {
        const todayStr = getTodayString();
        const currentDayLog = prayerLogs[todayStr] || { 
            fajr: 'unchecked', 
            dhuhr: 'unchecked', 
            asr: 'unchecked', 
            maghrib: 'unchecked', 
            isha: 'unchecked' 
        };
        const currentStatus = currentDayLog[prayerKey] || 'unchecked';
        
        let nextStatus: PrayerStatus = 'unchecked';
        if (currentStatus === 'unchecked') nextStatus = 'on_time';
        else if (currentStatus === 'on_time') nextStatus = 'late';
        else if (currentStatus === 'late') nextStatus = 'missed';
        
        const updatedLogs = {
            ...prayerLogs,
            [todayStr]: {
                ...currentDayLog,
                [prayerKey]: nextStatus
            }
        };
        
        setPrayerLogs(updatedLogs);
        try {
            await AsyncStorage.setItem('prayer_tracker_logs', JSON.stringify(updatedLogs));
        } catch {}
    }, [prayerLogs]);

    // ── Calculated Streaks & Weekly Charts Data ─────────────────────────────────
    const currentStreak = useMemo(() => {
        let streakCount = 0;
        const checkDate = new Date();
        const todayStr = getTodayString();

        // Check if there is anything logged today. If not, start yesterday to maintain streak
        const todayLog = prayerLogs[todayStr];
        const hasLoggedToday = todayLog && Object.values(todayLog).some(val => val === 'on_time' || val === 'late');
        
        if (!hasLoggedToday) {
            checkDate.setDate(checkDate.getDate() - 1);
        }

        while (true) {
            const year = checkDate.getFullYear();
            const month = String(checkDate.getMonth() + 1).padStart(2, '0');
            const day = String(checkDate.getDate()).padStart(2, '0');
            const dateStr = `${year}-${month}-${day}`;
            
            const dayLog = prayerLogs[dateStr];
            if (dayLog) {
                const hasLogged = Object.values(dayLog).some(val => val === 'on_time' || val === 'late');
                if (hasLogged) {
                    streakCount++;
                    checkDate.setDate(checkDate.getDate() - 1);
                    continue;
                }
            }
            break;
        }
        return streakCount;
    }, [prayerLogs]);

    const weeklyChartData = useMemo(() => {
        const data = [];
        const weekdaysShort = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
        
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const dateStr = `${year}-${month}-${day}`;
            
            const dayLog = prayerLogs[dateStr] || { 
                fajr: 'unchecked', 
                dhuhr: 'unchecked', 
                asr: 'unchecked', 
                maghrib: 'unchecked', 
                isha: 'unchecked' 
            };
            const completedCount = Object.values(dayLog).filter(val => val === 'on_time' || val === 'late').length;
            
            data.push({
                dayLabel: weekdaysShort[d.getDay()],
                percentage: completedCount / 5,
                count: completedCount
            });
        }
        return data;
    }, [prayerLogs]);

    const dhikr = DHIKR_PRESETS[dhikrIdx];
    const progress = target > 0 ? Math.min(count / target, 1) : 0;

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <View style={[styles.root, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 12, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={[styles.iconBtn, { backgroundColor: colors.card }]}>
                    <Ionicons name="arrow-back" size={22} color={colors.text} />
                </TouchableOpacity>
                <Image 
                    source={require('@/assets/icons/tasbeeh_icon.webp')} 
                    style={{ width: 26, height: 26, marginLeft: 10 }} 
                    resizeMode="contain" 
                />
                <View style={{ flex: 1, marginLeft: 10 }}>
                    <ThemedText style={styles.screenTitle}>Tasbeeh</ThemedText>
                    <ThemedText style={[styles.screenSub, { color: colors.textSecondary }]}>Digital Dhikr Counter</ThemedText>
                </View>
                <TouchableOpacity onPress={handleClearAll} style={[styles.iconBtn, { backgroundColor: colors.card }]}>
                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                </TouchableOpacity>
            </View>

            {/* Segmented Tab Controls */}
            <View style={[styles.tabContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <TouchableOpacity 
                    onPress={() => setActiveTab('counter')} 
                    style={[styles.tabButton, activeTab === 'counter' && { backgroundColor: ACCENT }]}
                >
                    <Ionicons name="finger-print-outline" size={16} color={activeTab === 'counter' ? '#fff' : colors.textSecondary} />
                    <ThemedText style={[styles.tabButtonText, { color: activeTab === 'counter' ? '#fff' : colors.textSecondary }]}>
                        Counter
                    </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity 
                    onPress={() => setActiveTab('analytics')} 
                    style={[styles.tabButton, activeTab === 'analytics' && { backgroundColor: ACCENT }]}
                >
                    <Ionicons name="analytics-outline" size={16} color={activeTab === 'analytics' ? '#fff' : colors.textSecondary} />
                    <ThemedText style={[styles.tabButtonText, { color: activeTab === 'analytics' ? '#fff' : colors.textSecondary }]}>
                        Analytics
                    </ThemedText>
                </TouchableOpacity>
            </View>

            {activeTab === 'counter' ? (
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
                >
                    {/* Dhikr Chips */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
                        {DHIKR_PRESETS.map((d, i) => (
                            <DhikrChip
                                key={d.id}
                                roman={d.roman}
                                isActive={dhikrIdx === i}
                                accentColor={ACCENT}
                                cardColor={colors.card}
                                textColor={colors.text}
                                onPress={() => selectDhikr(i)}
                            />
                        ))}
                    </ScrollView>

                    {/* Active Dhikr Display */}
                    <View style={[styles.dhikrCard, { backgroundColor: colors.card }]}>
                        <ThemedText style={[styles.dhikrArabic, { color: ACCENT }]}>{dhikr.arabic}</ThemedText>
                        <ThemedText style={[styles.dhikrMeaning, { color: colors.textSecondary }]}>{dhikr.meaning}</ThemedText>
                    </View>

                    {/* Counter Hero & Progress */}
                    <CounterHero
                        count={count}
                        target={target}
                        progress={progress}
                        accentColor={ACCENT}
                        cardColor={colors.card}
                        onTap={handleTap}
                    />

                    {/* Stats Row */}
                    <View style={styles.statsRow}>
                        <StatCard
                            iconName="repeat"
                            value={sessions}
                            label="Sessions"
                            accentColor={ACCENT}
                            cardColor={colors.card}
                            textSecondaryColor={colors.textSecondary}
                        />
                        <StatCard
                            iconName="flag-outline"
                            value={target === 0 ? '∞' : target}
                            label="Target"
                            accentColor={ACCENT}
                            cardColor={colors.card}
                            textSecondaryColor={colors.textSecondary}
                        />
                        <StatCard
                            iconName="checkmark-circle-outline"
                            value={target > 0 ? `${Math.round(progress * 100)}%` : '—'}
                            label="Done"
                            accentColor={ACCENT}
                            cardColor={colors.card}
                            textSecondaryColor={colors.textSecondary}
                        />
                    </View>

                    {/* Target Selector */}
                    <ThemedText style={[styles.sectionLabel, { color: colors.textSecondary }]}>TARGET</ThemedText>
                    <View style={styles.targetsRow}>
                        {TARGETS.map((t) => (
                            <TargetChip
                                key={t}
                                value={t}
                                isActive={target === t}
                                accentColor={ACCENT}
                                cardColor={colors.card}
                                textColor={colors.text}
                                onPress={() => selectTarget(t)}
                            />
                        ))}
                    </View>

                    {/* Reset */}
                    <TouchableOpacity onPress={handleReset} style={[styles.resetBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Ionicons name="refresh" size={16} color={colors.text} style={{ marginRight: 6 }} />
                        <ThemedText style={{ fontSize: 14, fontWeight: '600' }}>Reset Count</ThemedText>
                    </TouchableOpacity>
                </ScrollView>
            ) : (
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
                >
                    {/* Streak Banner */}
                    <StreakBanner 
                        colors={colors}
                        accentColor={ACCENT}
                        streak={currentStreak}
                    />

                    {/* Today's Prayers Checklist */}
                    <PrayerTrackerCard 
                        colors={colors}
                        accentColor={ACCENT}
                        log={prayerLogs[getTodayString()] || { fajr: 'unchecked', dhuhr: 'unchecked', asr: 'unchecked', maghrib: 'unchecked', isha: 'unchecked' }}
                        onToggle={handleTogglePrayer}
                    />

                    {/* Weekly Bar Chart */}
                    <WeeklyBarChart 
                        colors={colors}
                        accentColor={ACCENT}
                        data={weeklyChartData}
                    />
                </ScrollView>
            )}
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    root: { flex: 1 },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 14,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    iconBtn: {
        width: 38,
        height: 38,
        borderRadius: 19,
        justifyContent: 'center',
        alignItems: 'center',
    },
    screenTitle: { fontSize: 18, fontWeight: '700' },
    screenSub: { fontSize: 11, marginTop: 1 },

    // Segmented tabs styles
    tabContainer: {
        flexDirection: 'row',
        padding: 4,
        borderRadius: 12,
        marginHorizontal: 20,
        marginVertical: 10,
        borderWidth: 1,
    },
    tabButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        borderRadius: 8,
        gap: 6,
    },
    tabButtonText: {
        fontSize: 13,
        fontWeight: '700',
    },

    // Scroll
    scroll: { paddingHorizontal: 20, paddingTop: 12 },

    // Dhikr chips
    chipsRow: { paddingBottom: 12, gap: 8 },

    // Dhikr card
    dhikrCard: {
        borderRadius: 12,
        paddingVertical: 8,
        paddingHorizontal: 12,
        alignItems: 'center',
        marginBottom: 12,
    },
    dhikrArabic: { 
        fontSize: 21, 
        fontWeight: 'bold', 
        textAlign: 'center', 
        marginBottom: 2,
        paddingVertical: 4,
    },
    dhikrMeaning: { fontSize: 12, fontStyle: 'italic', textAlign: 'center' },

    // Stats
    statsRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 20,
    },

    // Targets
    sectionLabel: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 1,
        marginBottom: 10,
    },
    targetsRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 20,
    },

    // Reset
    resetBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderRadius: 10,
        borderWidth: 1,
        alignSelf: 'center',
        marginTop: 4,
    },
});
