import React, { useMemo, useRef, useEffect, useCallback } from 'react';
import {
    StyleSheet, View, ScrollView,
    Dimensions, Animated, TouchableOpacity, Alert, Platform } from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import { useWeatherCity } from '@/context/WeatherContext';
import { usePrayerTimes } from '@/hooks/usePrayerTimes';
import { useDailyHadith } from '@/hooks/useDailyHadith';
import { PrayerTimetable } from '@/components/prayers/PrayerTimetable';
import HadithCard from '@/components/prayers/HadithCard';
import { PrayerHeader } from '@/components/prayers/PrayerHeader';
import { Colors } from '@/constants/colors';
import { analyticsService, AnalyticsEvents } from '@/analytics';




// ─── Theme palette ────────────────────────────────────────────────────────────
const PALETTE = {
    light: {
        primary: Colors.light.primary,
        primaryLight: '#D1FAE5',
        gold: '#D4AF37',
        goldLight: '#FEF9C3',
        background: Colors.light.background,
        card: Colors.light.card,
        cardBorder: Colors.light.border,
        text: Colors.light.text,
        textSecondary: Colors.light.textSecondary,
        divider: Colors.light.border,
        headerOverlay: 'rgba(4,60,35,0.55)',
        headerOverlayBottom: 'rgba(3,30,18,0.85)' },
    dark: {
        primary: Colors.dark.primary,
        primaryLight: 'rgba(0,102,102,0.15)',
        gold: '#F0C040',
        goldLight: 'rgba(240,192,64,0.12)',
        background: Colors.dark.background,
        card: Colors.dark.card,
        cardBorder: Colors.dark.border,
        text: Colors.dark.text,
        textSecondary: Colors.dark.textSecondary,
        divider: Colors.dark.border,
        headerOverlay: 'rgba(1,1,1,0.55)',
        headerOverlayBottom: 'rgba(1,1,1,0.92)' } };

// ─── Helpers ──────────────────────────────────────────────────────────────────
const { width } = Dimensions.get('window');

/** Parse "HH:MM" string → minutes since midnight */
function toMinutes(t: string): number {
    if (!t || !t.includes(':')) return 0;
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function PrayerTimesScreen() {
    const insets = useSafeAreaInsets();
    const { isDark } = useTheme();
    const C = PALETTE[isDark ? 'dark' : 'light'];

    const { selectedCity } = useWeatherCity();
    const { prayerData, isPrayerLoading } = usePrayerTimes(selectedCity);
    const { hadith, isLoading: isHadithLoading, error: hadithError } = useDailyHadith();

    useEffect(() => {
        analyticsService.trackEvent(AnalyticsEvents.PRAYER_TIMES_VIEWED, { city: selectedCity });
    }, [selectedCity]);

    // ── Prayer schedule ──────────────────────────────────────────────────────
    const prayerSchedule = useMemo(() => {
        if (!prayerData?.data?.timings) return [];
        const timings = prayerData.data.timings;

        const addMinutes = (timeString: string, minutesToAdd: number) => {
            if (!timeString) return '--:--';
            const [h, m] = timeString.split(':').map(Number);
            const date = new Date();
            date.setHours(h, m + minutesToAdd, 0);
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        };

        return [
            { name: 'Fajr', arabic: 'فجر', adhan: timings.Fajr, iqama: addMinutes(timings.Fajr, 30), icon: 'partly-sunny-outline' as const },
            { name: 'Dhuhr', arabic: 'ظہر', adhan: timings.Dhuhr, iqama: addMinutes(timings.Dhuhr, 15), icon: 'sunny-outline' as const },
            { name: 'Asr', arabic: 'عصر', adhan: timings.Asr, iqama: addMinutes(timings.Asr, 15), icon: 'sunny' as const },
            { name: 'Maghrib', arabic: 'مغرب', adhan: timings.Maghrib, iqama: addMinutes(timings.Maghrib, 10), icon: 'cloudy-night-outline' as const },
            { name: 'Isha', arabic: 'عشاء', adhan: timings.Isha, iqama: addMinutes(timings.Isha, 15), icon: 'moon-outline' as const },
        ];
    }, [prayerData]);

    // ── Next prayer index ────────────────────────────────────────────────────
    const nextPrayerIndex = useMemo(() => {
        if (!prayerSchedule.length) return -1;
        const now = new Date();
        const nowMins = now.getHours() * 60 + now.getMinutes();
        const idx = prayerSchedule.findIndex((p) => toMinutes(p.adhan) > nowMins);
        return idx === -1 ? 0 : idx; // wrap to Fajr after Isha
    }, [prayerSchedule]);

    // ── Pulse animation for next prayer row ──────────────────────────────────
    const pulseAnim = useRef(new Animated.Value(1)).current;
    useEffect(() => {
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 0.5, duration: 900, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
            ])
        );
        loop.start();
        return () => loop.stop();
    }, []);

    // ── Dates ────────────────────────────────────────────────────────────────
    const hijriDate = prayerData?.data?.date?.hijri;
    const readableHijri = hijriDate
        ? `${hijriDate.day} ${hijriDate.month.en} ${hijriDate.year} ${hijriDate.designation.abbreviated}`
        : '';
    const gregorianDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    // ── Next prayer info ─────────────────────────────────────────────────────
    const nextPrayer = prayerSchedule[nextPrayerIndex] ?? null;




    return (
        <View style={[styles.container, { backgroundColor: C.background }]}>
            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>

                {/* ── Header ─────────────────────────────────────────────── */}
                <PrayerHeader
                    nextPrayer={nextPrayer}
                    gregorianDate={gregorianDate}
                    readableHijri={readableHijri}
                    insets={insets}
                    C={C}
                    isDark={isDark}
                />

                {/* ── Body ───────────────────────────────────────────────── */}
                <View style={styles.body}>
                    {/* Timetable */}
                    <PrayerTimetable
                        prayerSchedule={prayerSchedule as any}
                        nextPrayerIndex={nextPrayerIndex}
                        isPrayerLoading={isPrayerLoading}
                        selectedCity={selectedCity}
                        pulseAnim={pulseAnim}
                        C={C}
                        isDark={isDark}
                    />

                    {/* Daily Hadith */}
                    <HadithCard
                        hadith={hadith}
                        isLoading={isHadithLoading}
                        error={hadithError}
                        colors={C}
                        isDark={isDark}
                    />



                </View>
            </ScrollView>
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1 },
    body: { paddingHorizontal: 16, paddingBottom: 40 } });
