import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { ThemedText } from '@/components/ThemedText';
import { Layout } from '@/constants/layout';

interface ShareAyahCardProps {
    arabic: string;
    translation?: string;
    surahName: string;       // Arabic
    surahEnglishName: string;
    verseNumber: number;
    primary: string;
    lime: string;
}

/**
 * Static, branded card rendered for capture into a shareable image. Kept
 * self-contained (fixed colours) so the exported image looks the same regardless
 * of the viewer's theme.
 */
export const ShareAyahCard: React.FC<ShareAyahCardProps> = React.memo(({
    arabic,
    translation,
    surahName,
    surahEnglishName,
    verseNumber,
    primary,
    lime }: ShareAyahCardProps) => {
    return (
        <LinearGradient
            colors={[primary, '#0b3b3b']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.card}
        >
            <View style={[styles.topBar, { backgroundColor: 'rgba(255,255,255,0.12)' }]}>
                <ThemedText style={styles.surah}>{surahName}</ThemedText>
                <View style={[styles.versePill, { backgroundColor: lime }]}>
                    <ThemedText style={styles.verseText}>{surahEnglishName} : {verseNumber}</ThemedText>
                </View>
            </View>

            <ThemedText style={styles.arabic}>{arabic}</ThemedText>

            {translation ? (
                <ThemedText style={styles.translation}>{translation}</ThemedText>
            ) : null}

            <View style={styles.footer}>
                <View style={[styles.dot, { backgroundColor: lime }]} />
                <ThemedText style={styles.brand}>Rehbar · Quran</ThemedText>
            </View>
        </LinearGradient>
    );
});

const styles = StyleSheet.create({
    card: {
        width: 360,
        paddingHorizontal: 22,
        paddingVertical: 26,
        borderRadius: Layout.borderRadius },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: Layout.borderRadius,
        paddingHorizontal: 11,
        paddingVertical: 8,
        marginBottom: 24 },
    surah: {
        color: '#FFFFFF',
        fontSize: 16.5,
        fontWeight: '700',
        writingDirection: 'rtl' },
    versePill: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: Layout.borderRadius },
    verseText: { color: '#0b3b3b', fontSize: 10, fontWeight: '800' },
    arabic: {
        color: '#FFFFFF',
        fontSize: 26,
        lineHeight: 58,
        textAlign: 'center',
        writingDirection: 'rtl',
        fontWeight: '500' },
    translation: {
        color: 'rgba(255,255,255,0.85)',
        fontSize: 12.5,
        lineHeight: 24,
        textAlign: 'center',
        marginTop: 20 },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 28 },
    dot: { width: 6, height: 6, borderRadius: Layout.borderRadius },
    brand: { color: 'rgba(255,255,255,0.9)', fontSize: 11.5, fontWeight: '700', letterSpacing: 0.4 } });
