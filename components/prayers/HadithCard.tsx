import React, { memo, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator, TouchableOpacity, Share, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { Layout } from '@/constants/layout';
import type { Hadith } from '@/apis/hadith';

interface HadithCardProps {
    hadith: Hadith | null;
    isLoading: boolean;
    error: string | null;
    colors: {
        card: string;
        cardBorder: string;
        gold: string;
        primaryLight: string;
        primary: string;
        textSecondary: string;
        text: string;
        divider: string;
        goldLight: string;
        background: string;
    };
    isDark: boolean;
}

const HadithCard = memo(({ hadith, isLoading, error, colors: C, isDark }: HadithCardProps) => {

    const handleShare = useCallback(async () => {
        if (!hadith) return;
        const msg = `Hadith of the Day\n\n${hadith.hadithUrdu}\n\n[Source: ${hadith.book?.bookName}, Hadith ${hadith.hadithNumber}]`;
        try {
            await Share.share({ message: msg });
        } catch (err) {
            console.error('Share error:', err);
        }
    }, [hadith]);

    /** Adaptive font size for long Hadiths */
    const getUrduFontSize = (text: string) => {
        if (text.length > 300) return 12;
        if (text.length > 150) return 14;
        return 16;
    };

    if (!hadith && !isLoading && !error) return null;
    const cardBg = isDark ? C.card : '#FFFFFF';

    return (
        <View style={styles.outerContainer}>
            <View
                style={[styles.hadithCard, { backgroundColor: cardBg }]}
            >
                {/* Decorative Motif */}
                <Ionicons
                    name="journal-outline"
                    size={80}
                    color={isDark ? 'rgba(255,255,255,0.04)' : 'rgba(4,120,87,0.03)'}
                    style={styles.motifIcon}
                />

                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <View style={[styles.titleBadge, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : C.primaryLight }]}>
                            <ThemedText style={[styles.titleLabel, { color: isDark ? '#FFFFFF' : C.primary }]}>HADITH OF THE DAY</ThemedText>
                        </View>
                    </View>

                    {hadith && (
                        <TouchableOpacity
                            onPress={handleShare}
                            style={[styles.iconButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="share-social-outline" size={18} color={isDark ? '#FFFFFF' : C.primary} />
                        </TouchableOpacity>
                    )}
                </View>

                <View style={styles.contentContainer}>
                    {isLoading ? (
                        <View style={styles.centerWrap}>
                            <ActivityIndicator size="small" color={C.primary} />
                        </View>
                    ) : error && !hadith ? (
                        <View style={styles.centerWrap}>
                            <ThemedText style={[styles.errorText, { color: C.textSecondary }]}>
                                Today's hadith is temporarily unavailable.
                            </ThemedText>
                        </View>
                    ) : hadith ? (
                        <View style={styles.hadithContent}>
                            <View style={styles.textContainer}>
                                <ThemedText
                                    type="urdu"
                                    style={[
                                        styles.urduText,
                                        {
                                            color: C.text,
                                            fontSize: getUrduFontSize(hadith.hadithUrdu)
                                        }
                                    ]}
                                >
                                    {hadith.hadithUrdu}
                                </ThemedText>
                            </View>

                            <View style={styles.footer}>
                                <ThemedText style={[styles.sourceText, { color: C.textSecondary }]}>
                                    {hadith.book?.bookName} • HADITH {hadith.hadithNumber}
                                </ThemedText>
                            </View>
                        </View>
                    ) : null}
                </View>
            </View>
        </View>
    );
});

export default HadithCard;

const styles = StyleSheet.create({
    outerContainer: {
        marginTop: 24,
        marginBottom: 24,
        paddingHorizontal: 1, // subtle gap
    },
    hadithCard: {
        borderRadius: Layout.borderRadius,
        paddingVertical: 20,
        paddingHorizontal: 16,
        minHeight: 220,
        overflow: 'hidden' },
    motifIcon: {
        position: 'absolute',
        top: -10,
        right: -10,
        transform: [{ rotate: '-15deg' }] },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
        zIndex: 2 },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center' },
    titleBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: Layout.borderRadius },
    titleLabel: {
        fontSize: 9,
        fontWeight: '900',
        letterSpacing: 1.2 },
    iconButton: {
        width: 36,
        height: 36,
        borderRadius: Layout.borderRadius,
        justifyContent: 'center',
        alignItems: 'center' },
    contentContainer: {
        flex: 1,
        justifyContent: 'center' },
    centerWrap: {
        paddingVertical: 36,
        alignItems: 'center' },
    hadithContent: {
        flex: 1 },
    textContainer: {
        paddingVertical: 4 },
    urduText: {
        textAlign: 'center',
        lineHeight: 28,
        paddingHorizontal: 4 },
    footer: {
        marginTop: 20,
        paddingTop: 13,
        alignItems: 'center' },
    sourceText: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.8,
        textTransform: 'uppercase',
        opacity: 0.8 },
    errorText: {
        textAlign: 'center',
        fontSize: 12.5,
        fontWeight: '500' } });
