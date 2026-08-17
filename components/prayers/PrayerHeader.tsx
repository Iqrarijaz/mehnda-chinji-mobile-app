import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themedText';
import { useRouter } from 'expo-router';
import { EdgeInsets } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { formatTime12h } from '@/utils/dateUtils';
import { Layout } from '@/constants/layout';

export interface PrayerHeaderProps {
    nextPrayer: any;
    gregorianDate: string;
    readableHijri: string;
    insets: EdgeInsets;
    C: Record<string, string>;
    isDark: boolean;
}

/** Parse "HH:MM" string → minutes since midnight */
function toMinutes(t: string): number {
    if (!t || !t.includes(':')) return 0;
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
}

/** Format seconds → "HH:MM:SS" */
function formatCountdown(secs: number): string {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':');
}

const HEADER_IMAGE = require('../../assets/images/mosque-banner.jpg');


/** Standalone component to isolate 1-second re-renders */
const PrayerCountdown = ({ targetTime, colors, isDark }: { targetTime: string, colors: Record<string, string>, isDark?: boolean }) => {
    const [countdown, setCountdown] = useState(0);

    useEffect(() => {
        if (!targetTime) return;

        const calcSecs = () => {
            const now = new Date();
            let targetMins = toMinutes(targetTime);
            const nowMins = now.getHours() * 60 + now.getMinutes();
            if (targetMins <= nowMins) targetMins += 24 * 60; // next day
            const diffMins = targetMins - nowMins;
            return diffMins * 60 - now.getSeconds();
        };

        setCountdown(calcSecs());
        const interval = setInterval(() => {
            setCountdown((s) => (s > 0 ? s - 1 : calcSecs()));
        }, 1000);

        return () => clearInterval(interval);
    }, [targetTime]);

    return (
        <ThemedText style={[styles.countdownText, { color: isDark ? '#FFFFFF' : colors.primary }]}>
            {formatCountdown(countdown)}
        </ThemedText>
    );
};

export const PrayerHeader = React.memo(({
    nextPrayer,
    gregorianDate,
    readableHijri,
    insets,
    C,
    isDark,
}: PrayerHeaderProps) => {
    const router = useRouter();

    return (
        <View style={[styles.headerContainer, { marginBottom: nextPrayer ? 70 : 24 }]}>
            <Image
                source={HEADER_IMAGE}
                style={[styles.headerImage, { height: 280 + insets.top }]}
                contentFit="cover"
                transition={0} // Removed transition to avoid mounting flickering
            />

            {/* Back button */}
            <TouchableOpacity
                style={[styles.backButton, { top: insets.top + 10 }]}
                onPress={() => router.back()}
            >
                <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
            </TouchableOpacity>

            {/* Greeting & Date */}
            <View style={[styles.headerTextWrap, { top: insets.top + 60 }]}>
                <View style={[styles.pill, { backgroundColor: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.85)' }]}>
                    <ThemedText style={[styles.gregorianDate, { color: isDark ? '#FFFFFF' : C.primary }]}>{gregorianDate}</ThemedText>
                </View>
                {readableHijri ? (
                    <View style={[styles.pill, { backgroundColor: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.85)', marginTop: 8 }]}>
                        <ThemedText style={[styles.hijriText, { color: isDark ? '#FFFFFF' : '#B8860B' }]}>
                            🌙 {readableHijri}
                        </ThemedText>
                    </View>
                ) : null}
            </View>

            {/* Next Prayer Card (overlapping the header) */}
            {nextPrayer && (
                <View style={[styles.nextPrayerCard, { backgroundColor: isDark ? C.card : '#FFFFFF', shadowColor: isDark ? 'rgba(0,0,0,0.3)' : C.primary }]}>
                    <View style={styles.nextPrayerLeft}>
                        <ThemedText style={[styles.nextPrayerLabel, { color: C.textSecondary }]}>NEXT PRAYER</ThemedText>
                        <ThemedText type="urdu" style={[styles.nextPrayerArabic, { color: C.gold, fontSize: 18, marginTop: 4 }]}>
                            {nextPrayer.arabic}
                        </ThemedText>
                    </View>

                    <View style={styles.nextPrayerRight}>
                        <ThemedText 
                            style={[styles.nextPrayerTime, { color: C.text, textAlign: 'right' }]}
                        >
                            {formatTime12h(nextPrayer.adhan)}
                        </ThemedText>
                        <View style={[styles.countdownWrap, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : C.primary + '18' }]}>
                            <Ionicons name="timer-outline" size={12} color={isDark ? '#FFFFFF' : C.primary} style={{ marginRight: 4 }} />
                            <PrayerCountdown targetTime={nextPrayer.adhan} colors={C} isDark={isDark} />
                        </View>
                    </View>
                </View>
            )}
        </View>
    );
});

const styles = StyleSheet.create({
    headerContainer: { width: '100%', position: 'relative' },
    headerImage: { width: '100%' },
    gradTop: {
        position: 'absolute', top: 0, left: 0, right: 0, height: '55%',
    },
    gradBottom: {
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%',
    },
    backButton: {
        position: 'absolute', left: 16,
        width: 36, height: 36, borderRadius: 15,
        backgroundColor: 'rgba(0,0,0,0.35)',
        justifyContent: 'center', alignItems: 'center', zIndex: 10,
    },
    headerTextWrap: { position: 'absolute', left: 16, right: 16, alignItems: 'flex-start' },
    pill: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        alignSelf: 'flex-start',
        borderColor: 'rgba(255,255,255,0.2)',
    },
    gregorianDate: {
        fontSize: 13,
        fontWeight: '800',
    },
    hijriText: {
        fontSize: 12,
        fontWeight: '700',
    },

    // Next Prayer card
    nextPrayerCard: {
        position: 'absolute', bottom: -58, left: 16, right: 16,
        borderRadius: Layout.borderRadius,
        paddingVertical: 12, paddingHorizontal: 16,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 12,
        elevation: 8,
        overflow: 'hidden',
    },
    nextPrayerLeft: { flex: 1 },
    nextPrayerLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.2, marginBottom: 2 },
    nextPrayerArabic: { fontSize: 13, fontWeight: '700', marginTop: 1, textAlign: 'left' },
    nextPrayerRight: { alignItems: 'flex-end' },
    nextPrayerTime: { fontSize: 20, fontWeight: '900', paddingVertical: 2, letterSpacing: -0.5, fontVariant: ['tabular-nums'] },
    countdownWrap: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16, marginTop: 6,
    },
    countdownText: { fontSize: 13, fontWeight: '800', letterSpacing: 1, fontVariant: ['tabular-nums'] },
});
