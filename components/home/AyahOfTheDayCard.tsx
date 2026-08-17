import React, { useCallback } from 'react';
import { StyleSheet, View, TouchableOpacity, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/context/ThemeContext';
import { useAyahOfTheDay } from '@/hooks/useAyahOfTheDay';
import Skeleton from '@/components/common/Skeleton';

/**
 * Daily spiritual touchpoint on the Home screen — Arabic calligraphy, Urdu
 * translation, and a share button. Rotates once a day (see
 * useAyahOfTheDay). Renders nothing on error rather than showing a broken
 * card — this is a nice-to-have, not core navigation.
 */
export function AyahOfTheDayCard() {
    const { theme } = useTheme();
    const colors = Colors[theme];
    const { ayah, isLoading, error } = useAyahOfTheDay();

    const handleShare = useCallback(async () => {
        if (!ayah) return;
        const message =
            `${ayah.arabicText}` +
            (ayah.urduText ? `\n\n${ayah.urduText}` : '') +
            `\n\n— ${ayah.surahEnglishName} (${ayah.surahName}) : ${ayah.numberInSurah}` +
            `\nAyah of the Day · Shared via Rehbar`;
        try {
            await Share.share({ message });
        } catch { }
    }, [ayah]);

    if (error) return null;

    if (isLoading || !ayah) {
        return (
            <View style={[styles.wrap, { backgroundColor: colors.cardBg }]}>
                <Skeleton width="40%" height={12} borderRadius={4} style={{ marginBottom: 16 }} />
                <Skeleton width="90%" height={22} borderRadius={4} style={{ marginBottom: 10, alignSelf: 'flex-end' }} />
                <Skeleton width="70%" height={22} borderRadius={4} style={{ marginBottom: 16, alignSelf: 'flex-end' }} />
                <Skeleton width="60%" height={14} borderRadius={4} />
            </View>
        );
    }

    return (
        <View style={styles.wrap}>
            <View
                style={[styles.card, { backgroundColor: colors.primary }]}
            >
                <View style={styles.topRow}>
                    <View style={[styles.badge, { backgroundColor: 'rgba(255,255,255,0.16)' }]}>
                        <Ionicons name="sparkles" size={12} color={colors.lime} />
                        <ThemedText style={styles.badgeText}>AYAH OF THE DAY</ThemedText>
                    </View>
                    <TouchableOpacity onPress={handleShare} hitSlop={10} style={styles.shareBtn}>
                        <Ionicons name="share-social-outline" size={18} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>

                <ThemedText style={styles.arabic}>{ayah.arabicText}</ThemedText>

                {ayah.urduText ? (
                    <ThemedText type="urdu" style={styles.urdu}>{ayah.urduText}</ThemedText>
                ) : null}

                <View style={[styles.footerRow, { borderTopColor: 'rgba(255,255,255,0.15)' }]}>
                    <ThemedText style={styles.reference}>
                        {ayah.surahEnglishName} ({ayah.surahName}) · {ayah.numberInSurah}
                    </ThemedText>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: {
        marginHorizontal: 14,
        marginTop: 8,
        marginBottom: 8,
        borderRadius: Layout.cardBorderRadius,
        overflow: 'hidden',
    },
    card: {
        paddingHorizontal: 18,
        paddingVertical: 18,
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 9,
        paddingVertical: 5,
        borderRadius: 10,
    },
    badgeText: {
        fontSize: 9.5,
        fontWeight: '800',
        letterSpacing: 0.6,
        color: '#FFFFFF',
    },
    shareBtn: {
        width: 30,
        height: 30,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.14)',
    },
    arabic: {
        color: '#FFFFFF',
        fontSize: 22,
        lineHeight: 46,
        textAlign: 'right',
        writingDirection: 'rtl',
        fontWeight: '500',
    },
    urdu: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 15,
        lineHeight: 30,
        textAlign: 'right',
        marginTop: 8,
    },
    footerRow: {
        marginTop: 16,
        paddingTop: 12,
        borderTopWidth: StyleSheet.hairlineWidth,
    },
    reference: {
        fontSize: 11,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.75)',
    },
});
