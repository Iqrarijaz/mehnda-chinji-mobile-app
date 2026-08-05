import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import Toast from 'react-native-toast-message';

import { listSurahs, getSurah, SurahListItem } from '@/apis/quran';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { Layout } from '@/constants/layout';
import { getDownloadedSurahSet, downloadSurahAudio } from '@/utils/quranAudioCache';

import { useSurahPlayer } from '@/hooks/useSurahPlayer';

// Import memoized components
import { SurahCard } from '@/components/quran/SurahCard';
import { QuranHeader } from '@/components/quran/QuranHeader';
import { MiniAudioPlayer } from '@/components/quran/MiniAudioPlayer';

const FAV_STORAGE_KEY = 'quran_favourites';
type TabType = 'all' | 'favourites';

export default function QuranListScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { theme } = useTheme();
    const colors = Colors[theme];

    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<TabType>('all');
    const [favourites, setFavourites] = useState<Set<number>>(new Set());

    // Offline audio download state
    const [downloadedSet, setDownloadedSet] = useState<Set<number>>(new Set());
    const [downloadingSet, setDownloadingSet] = useState<Set<number>>(new Set());
    const [progressMap, setProgressMap] = useState<Record<number, number>>({});

    // Detect already-downloaded Surahs from the cache manifest on mount.
    useEffect(() => {
        getDownloadedSurahSet().then(setDownloadedSet).catch(() => { });
    }, []);

    // Inline audio player (plays without navigating to the reader).
    const player = useSurahPlayer();
    const { surah: playingSurah, isPlaying, playSurah, toggle, stop: stopPlayer } = player;

    // Play button on a card: start (or pause/resume) audio inline.
    const handlePlay = useCallback((item: SurahListItem) => {
        if (playingSurah?.number === item.number) {
            toggle();
        } else {
            playSurah(item);
        }
    }, [playingSurah, toggle, playSurah]);

    // Tapping the card opens the reader; stop the inline player first so
    // the two audio engines never overlap.
    const handleOpen = useCallback((item: SurahListItem) => {
        stopPlayer();
        router.push(`/quran/${item.number}` as any);
    }, [stopPlayer, router]);

    const handleDownload = useCallback(async (item: SurahListItem) => {
        const n = item.number;
        setDownloadingSet((prev) => {
            if (prev.has(n)) return prev;
            const next = new Set(prev);
            next.add(n);
            return next;
        });
        setProgressMap((prev) => ({ ...prev, [n]: 0 }));
        try {
            const res = await getSurah(n, { edition: 'ar.alafasy' });
            const d: any = res?.data;
            const audioSurah = Array.isArray(d) ? d[0] : d;
            const audioAyahs = audioSurah?.ayahs || [];
            if (!audioAyahs.length) throw new Error('No audio available');
            await downloadSurahAudio(n, audioAyahs, (completed, total) => {
                setProgressMap((prev) => ({ ...prev, [n]: total ? completed / total : 0 }));
            });
            setDownloadedSet((prev) => new Set(prev).add(n));
            Toast.show({ type: 'success', text1: 'Downloaded', text2: `${item.englishName} saved for offline listening.` });
        } catch (e) {
            console.error('Surah download failed', e);
            Toast.show({ type: 'error', text1: 'Download failed', text2: 'Please check your connection and try again.' });
        } finally {
            setDownloadingSet((prev) => {
                const next = new Set(prev);
                next.delete(n);
                return next;
            });
        }
    }, []);

    const saveFavourites = useCallback(async (next: Set<number>) => {
        try {
            await AsyncStorage.setItem(FAV_STORAGE_KEY, JSON.stringify([...next]));
        } catch { }
    }, []);

    // Load persisted favourites or set defaults
    useEffect(() => {
        AsyncStorage.getItem(FAV_STORAGE_KEY).then((raw) => {
            if (raw) {
                setFavourites(new Set(JSON.parse(raw)));
            } else {
                const defaultFavs = new Set([36, 55, 67]);
                setFavourites(defaultFavs);
                saveFavourites(defaultFavs);
            }
        }).catch(() => { });
    }, [saveFavourites]);

    const toggleFavourite = useCallback((number: number) => {
        setFavourites((prev) => {
            const next = new Set(prev);
            next.has(number) ? next.delete(number) : next.add(number);
            saveFavourites(next);
            return next;
        });
    }, [saveFavourites]);

    const { data: response, isLoading, isError, refetch, isRefetching } = useQuery({
        queryKey: ['quran-surahs'],
        queryFn: listSurahs });

    const surahs = response?.data || [];

    const filteredSurahs = useMemo(() => {
        let list = surahs;

        if (activeTab === 'favourites') {
            list = list.filter((s) => favourites.has(s.number));
        }

        if (searchQuery) {
            const query = searchQuery.toLowerCase().trim();
            list = list.filter(
                (surah) =>
                    surah.englishName.toLowerCase().includes(query) ||
                    surah.englishNameTranslation.toLowerCase().includes(query) ||
                    surah.name.includes(query) ||
                    surah.number.toString() === query
            );
        }

        return list;
    }, [searchQuery, surahs, activeTab, favourites]);

    const renderSurahCard = useCallback(({ item, index }: { item: SurahListItem; index: number }) => {
        return (
            <SurahCard
                item={item}
                index={index}
                isFav={favourites.has(item.number)}
                isDownloaded={downloadedSet.has(item.number)}
                isDownloading={downloadingSet.has(item.number)}
                downloadProgress={progressMap[item.number] ?? 0}
                isActivePlaying={playingSurah?.number === item.number && isPlaying}
                onPress={() => handleOpen(item)}
                onFavToggle={() => toggleFavourite(item.number)}
                onPlay={() => handlePlay(item)}
                onDownload={() => handleDownload(item)}
            />
        );
    }, [favourites, downloadedSet, downloadingSet, progressMap, playingSurah, isPlaying, handleOpen, toggleFavourite, handlePlay, handleDownload]);

    const handleBack = useCallback(() => {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace('/(drawer)/(tabs)' as any);
        }
    }, [router]);

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Custom Header using QuranHeader */}
            <QuranHeader
                title="The Holy Quran"
                subtitle="Read & listen to the verses"
                paddingTop={insets.top + 16}
                onBack={handleBack}
            />

            <View style={styles.headerAddon}>
                {/* Search Bar */}
                <View style={[styles.searchBarContainer, { backgroundColor: colors.cardBg }]}>
                    <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
                    <TextInput
                        placeholder="Search Surah by name..."
                        placeholderTextColor={colors.textSecondary + '77'}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        style={[styles.searchInput, { color: colors.text }]}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Segmented Tabs Control */}
                <View style={[styles.segmentedContainer, { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
                    {(['all', 'favourites'] as TabType[]).map((tab) => {
                        const isActive = activeTab === tab;
                        return (
                            <TouchableOpacity
                                key={tab}
                                activeOpacity={0.85}
                                onPress={() => setActiveTab(tab)}
                                style={[
                                    styles.segmentedTab,
                                    isActive && { backgroundColor: colors.primary },
                                ]}
                            >
                                {isActive && <View style={[styles.activeDot, { backgroundColor: colors.lime }]} />}
                                {tab === 'favourites' && (
                                    <Ionicons
                                        name={isActive ? 'heart' : 'heart-outline'}
                                        size={14}
                                        color={isActive ? '#FFFFFF' : colors.secondary}
                                        style={{ marginRight: 6 }}
                                    />
                                )}
                                <ThemedText style={[
                                    styles.segmentedTabText,
                                    { color: isActive ? '#FFFFFF' : colors.textSecondary },
                                    isActive && { fontWeight: '800' },
                                ]}>
                                    {tab === 'all' ? 'All Surahs' : 'Favourites'}
                                </ThemedText>
                                {tab === 'favourites' && favourites.size > 0 && (
                                    <View style={[
                                        styles.favBadge,
                                        { backgroundColor: isActive ? '#FFFFFF' : colors.lime },
                                    ]}>
                                        <ThemedText style={[
                                            styles.favBadgeText,
                                            { color: isActive ? colors.primary : '#1E293B' },
                                        ]}>
                                            {favourites.size}
                                        </ThemedText>
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>

            {/* Content List */}
            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <ThemedText style={styles.loadingText}>Loading Surahs...</ThemedText>
                </View>
            ) : isError ? (
                <View style={styles.errorContainer}>
                    <Ionicons name="warning-outline" size={48} color="#EF4444" />
                    <ThemedText style={styles.errorText}>Unable to load Surah list</ThemedText>
                    <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.primary }]} onPress={() => refetch()}>
                        <ThemedText style={{ color: '#fff', fontWeight: 'bold' }}>Retry</ThemedText>
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={{ flex: 1 }}>
                    <FlashList
                        data={filteredSurahs}
                        keyExtractor={(item) => item.number.toString()}
                        renderItem={renderSurahCard}
                        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 32 }]}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl
                                refreshing={isRefetching}
                                onRefresh={refetch}
                                colors={[colors.primary]}
                                tintColor={colors.primary}
                            />
                        }
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Ionicons
                                    name={activeTab === 'favourites' ? 'heart-outline' : 'search-outline'}
                                    size={48}
                                    color={colors.textSecondary}
                                />
                                <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>
                                    {activeTab === 'favourites'
                                        ? 'No favourites yet.\nTap ♥ on a Surah to save it here.'
                                        : `No Surahs match "${searchQuery}"`}
                                </ThemedText>
                            </View>
                        }
                    />
                </View>
            )}

            {/* Inline audio media player */}
            {playingSurah ? (
                <MiniAudioPlayer
                    surah={playingSurah}
                    isPlaying={isPlaying}
                    isLoading={player.isLoading}
                    ayahIndex={player.ayahIndex}
                    total={player.total}
                    position={player.position}
                    duration={player.duration}
                    onToggle={toggle}
                    onNext={player.next}
                    onPrev={player.prev}
                    onSeek={player.seek}
                    onClose={stopPlayer}
                    bottomInset={insets.bottom}
                />
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    backgroundImage: { flex: 1 },
    headerAddon: {
        paddingHorizontal: 16,
        paddingBottom: 0 },
    searchBarContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: Layout.borderRadius,
        paddingHorizontal: 10,
        height: 42,
        marginTop: 16,
        marginBottom: 12 },
    searchIcon: { marginRight: 8 },
    searchInput: { flex: 1, fontSize: 12.5, paddingVertical: 7 },
    // Segmented Control
    segmentedContainer: {
        flexDirection: 'row',
        borderRadius: Layout.borderRadius,
        padding: 4,
        marginBottom: 16 },
    segmentedTab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 8,
        borderRadius: Layout.borderRadius },
    activeDot: {
        width: 5,
        height: 5,
        borderRadius: Layout.borderRadius },
    segmentedTabText: {
        fontSize: 11.5,
        fontWeight: '500' },
    favBadge: {
        marginLeft: 5,
        minWidth: 18,
        height: 18,
        borderRadius: Layout.borderRadius,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4 },
    favBadgeText: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#fff',
        lineHeight: 18,
        textAlignVertical: 'center',
        includeFontPadding: false },
    // List
    listContent: {
        paddingHorizontal: 16,
        paddingVertical: 13 },
    // States
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 12, fontSize: 12.5 },
    errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    errorText: { marginTop: 12, fontSize: 12.5, textAlign: 'center' },
    retryButton: { marginTop: 16, paddingVertical: 8, paddingHorizontal: 20, borderRadius: Layout.borderRadius },
    emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 56 },
    emptyText: { marginTop: 12, fontSize: 12.5, textAlign: 'center', lineHeight: 22 } });
