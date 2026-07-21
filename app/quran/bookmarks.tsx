import React, { useCallback, useState } from 'react';
import { View, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { QuranHeader } from '@/components/quran/QuranHeader';
import { getBookmarks, removeBookmark, type Bookmark } from '@/utils/quranPrefs';
import { Layout } from '@/constants/layout';

export default function BookmarksScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { theme, isDark } = useTheme();
    const colors = Colors[theme];

    const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);

    // Reload whenever the screen regains focus (bookmarks may change elsewhere).
    useFocusEffect(
        useCallback(() => {
            let active = true;
            getBookmarks().then((list) => active && setBookmarks(list));
            return () => { active = false; };
        }, []),
    );

    const openAyah = (b: Bookmark) => {
        router.push(`/quran/${b.surah}?ayah=${b.ayahIndex}` as any);
    };

    const handleRemove = async (b: Bookmark) => {
        const next = await removeBookmark(b.surah, b.ayahIndex);
        setBookmarks(next);
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{ headerShown: false }} />

            <QuranHeader
                title="Bookmarks"
                subtitle={bookmarks.length ? `${bookmarks.length} saved ${bookmarks.length === 1 ? 'ayah' : 'ayahs'}` : 'Saved verses'}
                paddingTop={insets.top + 16}
                onBack={() => router.back()}
            />

            {bookmarks.length === 0 ? (
                <View style={styles.empty}>
                    <Ionicons name="bookmark-outline" size={54} color={colors.icon} />
                    <ThemedText style={[styles.emptyTitle, { color: colors.text }]}>No bookmarks yet</ThemedText>
                    <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>
                        Long-press any ayah while reading and tap “Bookmark this Ayah”.
                    </ThemedText>
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
                    {bookmarks.map((b) => (
                        <TouchableOpacity
                            key={`${b.surah}:${b.ayahIndex}`}
                            style={[styles.card, { backgroundColor: colors.cardBg }]}>
                                <View style={styles.cardHeader}>
                                    <View style={[styles.badge, { backgroundColor: `${colors.primary}14` }]}>
                                        <ThemedText style={[styles.badgeText, { color: colors.primary }]}>
                                        {b.surahEnglishName} : {b.ayahNumberInSurah}
                                    </ThemedText>
                                </View>
                                <TouchableOpacity onPress={() => handleRemove(b)} hitSlop={10}>
                                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                                </TouchableOpacity>
                            </View>
                            <ThemedText style={[styles.arabic, { color: colors.text }]} numberOfLines={2}>
                                {b.text}
                            </ThemedText>
                        </TouchableOpacity>
                    ))}
                    <View style={{ height: 24 }} />
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    list: { paddingHorizontal: 16, paddingTop: 14 },
    card: {
        borderRadius: Layout.borderRadius,
        padding: 14,
        marginBottom: 12 },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10 },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: Layout.borderRadius },
    badgeText: { fontSize: 11, fontWeight: '800' },
    arabic: {
        fontSize: 22,
        lineHeight: 42,
        textAlign: 'right',
        writingDirection: 'rtl',
        fontWeight: '500' },
    empty: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
        gap: 10 },
    emptyTitle: { fontSize: 17, fontWeight: '800', marginTop: 6 },
    emptyText: { fontSize: 13, textAlign: 'center', lineHeight: 20 } });
