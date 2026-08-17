import React, { memo } from 'react';
import { View, StyleSheet, ActivityIndicator, Animated } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { formatTime12h } from '@/utils/dateUtils';
import { Layout } from '@/constants/layout';

// ─── Types ──────────────────────────────────────────────────────────────────
export interface PrayerTimetableProps {
    prayerSchedule: Array<{
        name: string;
        arabic: string;
        adhan: string;
        iqama: string;
        icon: any;
    }>;
    nextPrayerIndex: number;
    isPrayerLoading: boolean;
    selectedCity: string;
    pulseAnim: Animated.Value;
    C: Record<string, string>;
    isDark?: boolean;
}

interface PrayerRowProps {
    prayer: {
        name: string;
        arabic: string;
        adhan: string;
        iqama: string;
        icon: any;
    };
    isNext: boolean;
    pulseAnim: Animated.Value;
    C: Record<string, string>;
    isDark?: boolean;
}

// ─── Color & Icon Mappings ─────────────────────────────────────────────────
const getPrayerTheme = (name: string, isDark: boolean = false) => {
    switch (name.toLowerCase()) {
        case 'fajr':
            return { bg: isDark ? '#0C2A3A' : '#E8F4F8', accent: isDark ? '#4DB6E0' : '#007AA5', icon: '🌙' };
        case 'dhuhr':
            return { bg: isDark ? '#3A2E0C' : '#FFF9E6', accent: isDark ? '#F5B041' : '#D48806', icon: '☀️' };
        case 'asr':
            return { bg: isDark ? '#3A1E0C' : '#FDF0E5', accent: isDark ? '#E67E22' : '#C45A00', icon: '🌤' };
        case 'maghrib':
            return { bg: isDark ? '#2E1529' : '#FBEBF4', accent: isDark ? '#C7519E' : '#A22878', icon: '🌇' };
        case 'isha':
            return { bg: isDark ? '#12102A' : '#EAEAF6', accent: isDark ? '#8E44AD' : '#512DA8', icon: '🌌' };
        default:
            return { bg: isDark ? '#1E293B' : '#F0FDF4', accent: isDark ? '#004D4D' : '#047857', icon: 'time' };
    }
};

// ─── Subcomponents ─────────────────────────────────────────────────────────
const PrayerRow = memo(({ prayer, isNext, pulseAnim, C, isDark }: PrayerRowProps) => {
    const theme = getPrayerTheme(prayer.name, isDark);
    const rowBg = isNext ? theme.bg : (isDark ? C.card : '#FFFFFF');
    const borderColor = isNext ? theme.accent : (isDark ? 'rgba(255,255,255,0.06)' : C.cardBorder);

    /** Adaptive font size for micro-tiles */
    const getUrduFontSize = (text: string) => {
        if (text.length > 10) return 10;
        if (text.length > 6) return 11;
        return 12;
    };

    return (
        <View
            style={[
                styles.gridCard,
                { backgroundColor: rowBg },
            ]}
        >
            {/* Micro Content Stack */}
            <View style={styles.miniBody}>
                <View style={styles.nameContainer}>
                    <ThemedText
                        type="urdu"
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        style={[
                            styles.prayerArabic,
                            { color: isNext ? (isDark ? '#FFFFFF' : theme.accent) : C.text, fontSize: getUrduFontSize(prayer.arabic) }
                        ]}
                    >
                        {prayer.arabic}
                    </ThemedText>
                </View>
                <ThemedText
                    style={[styles.adhanText, { color: isNext ? (isDark ? '#F1F5F9' : theme.accent) : C.textSecondary, textAlign: 'center' }]}
                >
                    {formatTime12h(prayer.adhan).replace(' ', '')}
                </ThemedText>
            </View>
        </View>
    );
});

// ─── Main Component ────────────────────────────────────────────────────────
export const PrayerTimetable = ({
    prayerSchedule,
    nextPrayerIndex,
    isPrayerLoading,
    selectedCity,
    pulseAnim,
    C,
    isDark }: PrayerTimetableProps) => {
    return (
        <>
            {/* Section Header */}
            <View style={styles.sectionHeader}>
                <ThemedText style={[styles.sectionTitle, { color: C.text }]}>Daily Prayers</ThemedText>
                <View style={[styles.sectionPill, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : C.primaryLight }]}>
                    <ThemedText style={[styles.sectionPillText, { color: isDark ? '#FFFFFF' : C.primary }]}>
                        {selectedCity || 'My City'}
                    </ThemedText>
                </View>
            </View>

            {/* 4-Column Micro Grid */}
            <View style={styles.gridContainer}>
                {isPrayerLoading ? (
                    <View style={styles.loadingWrap}>
                        <ActivityIndicator size="small" color={C.primary} />
                    </View>
                ) : (
                    prayerSchedule.map((prayer, index) => {
                        // Skip next prayer (already in header)
                        if (index === nextPrayerIndex) return null;
                        return (
                            <PrayerRow
                                key={prayer.name}
                                prayer={prayer}
                                isNext={false}
                                pulseAnim={pulseAnim}
                                C={C}
                                isDark={isDark}
                            />
                        );
                    })
                )}
            </View>
        </>
    );
};

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 4,
        paddingHorizontal: 2 },
    sectionTitle: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase', opacity: 0.6 },
    sectionPill: { paddingHorizontal: 5, paddingVertical: 1, borderRadius: Layout.borderRadius },
    sectionPillText: { fontSize: 9, fontWeight: '700' },

    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
        gap: 6,
        marginBottom: 8
    },
    loadingWrap: { width: '100%', height: 80, justifyContent: 'center', alignItems: 'center' },

    gridCard: {
        width: '23.5%', // 4 columns per row
        padding: 5,
        borderRadius: Layout.borderRadius,
        minHeight: 65,
        justifyContent: 'center' },
    miniBody: {
        alignItems: 'center',
        paddingBottom: 2 },
    nameContainer: {
        width: '100%',
        alignItems: 'center' },
    prayerArabic: {
        fontFamily: 'NotoNastaliqUrdu-Regular',
        fontSize: 10.5,
        padding: 2, // 2px padding around name as requested
        fontWeight: '700',
        lineHeight: 22, // Balanced for Hadith card aesthetic in micro tile
        textAlign: 'center' },
    adhanText: {
        fontSize: 10.5,
        fontWeight: '800',
        lineHeight: 20 } });