import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { StyleSheet, View, TouchableOpacity, ActivityIndicator, Alert, Share } from 'react-native';
import { FlashList, FlashListRef } from '@shopify/flash-list';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';

import { getSurah } from '@/apis/quran';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { analyticsService, AnalyticsEvents } from '@/analytics';

// Import memoized components
import { AyahItem } from '@/components/quran/AyahItem';
import { QuranHeader } from '@/components/quran/QuranHeader';
import { QuranSettingsModal } from '@/components/quran/QuranSettingsModal';
import { AyahActionsModal } from '@/components/quran/AyahActionsModal';
import { ShareAyahCard } from '@/components/quran/ShareAyahCard';
import { startSurahDownload, getPlayableAyahUri, cleanupExpiredCache } from '@/utils/quranAudioCache';
import { Layout } from '@/constants/layout';
import {
    getFontSize, setFontSize as persistFontSize,
    getLastPosition, setLastPosition,
    getBookmarks, toggleBookmark as toggleBookmarkStore, isBookmarked as isBookmarkedIn,
    FONT_SIZE_DEFAULT, type Bookmark } from '@/utils/quranPrefs';

export default function SurahDetailScreen() {
    const { id, autoplay, ayah: ayahParam } = useLocalSearchParams<{ id: string; autoplay?: string; ayah?: string }>();
    const surahNumber = parseInt(Array.isArray(id) ? id[0] : id || '1', 10);
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { theme } = useTheme();
    const colors = Colors[theme];

    // Translation toggle state (default off)
    const [showTranslation, setShowTranslation] = useState(false);
    // Auto Play state (default off)
    const [isAutoPlay, setIsAutoPlay] = useState(false);

    // Last played index for play/resume Surah
    const [lastPlayedIndex, setLastPlayedIndex] = useState<number>(0);

    // Audio Playback State
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [playingIndex, setPlayingIndex] = useState<number | null>(null);
    const [bufferingIndex, setBufferingIndex] = useState<number | null>(null);
    const soundRef = useRef<Audio.Sound | null>(null);
    const flatListRef = useRef<FlashListRef<any>>(null);

    // ── Reading preferences & features ──────────────────────────────────────
    const [fontSize, setFontSizeState] = useState<number>(FONT_SIZE_DEFAULT);
    const [settingsVisible, setSettingsVisible] = useState(false);
    const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
    const [actionIndex, setActionIndex] = useState<number | null>(null);
    const [actionsVisible, setActionsVisible] = useState(false);

    const shareCardRef = useRef<View>(null);
    const savedPosRef = useRef<number>(-1);
    const restoredRef = useRef(false);

    // Load persisted preferences + bookmarks once.
    useEffect(() => {
        (async () => {
            const [fs, bm] = await Promise.all([getFontSize(), getBookmarks()]);
            setFontSizeState(fs);
            setBookmarks(bm);
        })();
    }, []);

    const changeFontSize = useCallback((v: number) => {
        setFontSizeState(v);
        persistFontSize(v);
    }, []);


    const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;
    const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
        if (!viewableItems?.length) return;
        const top = viewableItems[0]?.index;
        if (typeof top === 'number' && top !== savedPosRef.current) {
            savedPosRef.current = top;
            setLastPosition(surahNumber, top);
        }
    }).current;

    // Fetch Surah details with 3 editions: Uthmani Arabic, English translation, and audio recitation
    const { data: response, isLoading, isError, refetch } = useQuery({
        queryKey: ['quran-surah', surahNumber],
        queryFn: () => getSurah(surahNumber, { edition: 'quran-uthmani,en.asad,ar.alafasy' }),
        enabled: !isNaN(surahNumber)
    });

    const editionsData = response?.data as any;

    // Extract the separate editions from response array
    const arabicEdition = editionsData?.[0];
    const englishEdition = editionsData?.[1];
    const audioEdition = editionsData?.[2];

    const surahInfo = arabicEdition;
    const headerTitle = surahInfo?.name || 'Loading...';
    const headerSubtitle = surahInfo
        ? `${surahInfo.englishName} · ${surahInfo.numberOfAyahs} verses`
        : 'Loading verses…';
    const ayahs = arabicEdition?.ayahs || [];

    // Reading progress: restore the last-read ayah once the verses are loaded.
    useEffect(() => {
        if (restoredRef.current || !ayahs.length) return;
        (async () => {
            // A bookmark deep-link (?ayah=) wins over the saved reading position.
            const deepLink = ayahParam ? parseInt(Array.isArray(ayahParam) ? ayahParam[0] : ayahParam, 10) : NaN;
            const target = Number.isFinite(deepLink) ? deepLink : await getLastPosition(surahNumber);
            savedPosRef.current = target;
            if (target > 0 && target < ayahs.length) {
                setTimeout(() => {
                    flatListRef.current?.scrollToIndex({ index: target, animated: false, viewPosition: 0 });
                }, 350);
            }
            restoredRef.current = true;
        })();
    }, [ayahs.length, surahNumber, ayahParam]);

    // Keep references updated for audio playback callback to avoid re-creating it
    const isAutoPlayRef = useRef(isAutoPlay);
    useEffect(() => {
        isAutoPlayRef.current = isAutoPlay;
    }, [isAutoPlay]);

    const ayahsRef = useRef(ayahs);
    useEffect(() => {
        ayahsRef.current = ayahs;
    }, [ayahs]);

    const audioEditionRef = useRef(audioEdition);
    useEffect(() => {
        audioEditionRef.current = audioEdition;
    }, [audioEdition]);

    const playingIndexRef = useRef(playingIndex);
    useEffect(() => {
        playingIndexRef.current = playingIndex;
    }, [playingIndex]);

    // Trigger background download and clean up expired cache on mount/load
    useEffect(() => {
        if (audioEdition?.ayahs && audioEdition.ayahs.length > 0) {
            startSurahDownload(surahNumber, audioEdition.ayahs);
            cleanupExpiredCache();
        }
    }, [audioEdition, surahNumber]);

    // Track analytics event when Surah is loaded
    useEffect(() => {
        if (surahInfo && surahInfo.name) {
            analyticsService.trackEvent(AnalyticsEvents.QURAN_SURAH_OPENED, {
                surahNumber,
                surahName: surahInfo.name,
                surahEnglishName: surahInfo.englishName
            });
        }
    }, [surahInfo?.name, surahNumber]);

    // Clean up sound on unmount
    useEffect(() => {
        return () => {
            if (soundRef.current) {
                soundRef.current.unloadAsync().catch(() => { });
            }
        };
    }, []);

    const stopAudio = useCallback(async () => {
        if (soundRef.current) {
            await soundRef.current.stopAsync().catch(() => { });
            await soundRef.current.unloadAsync().catch(() => { });
            soundRef.current = null;
            setSound(null);
        }
        setPlayingIndex(null);
        setBufferingIndex(null);
    }, []);

    const playAudio = useCallback(async (url: string, index: number) => {
        try {
            // If already playing this verse, pause/stop it
            if (playingIndexRef.current === index) {
                await stopAudio();
                return;
            }

            // Unload previous sound if any
            if (soundRef.current) {
                await soundRef.current.unloadAsync().catch(() => { });
                soundRef.current = null;
                setSound(null);
            }

            setBufferingIndex(index);
            setPlayingIndex(index);
            setLastPlayedIndex(index);

            // Scroll to the active verse
            flatListRef.current?.scrollToIndex({
                index: index,
                animated: true,
                viewPosition: 0.3
            });

            // Get playable URI (local cache if downloaded, remote otherwise)
            const playableUrl = await getPlayableAyahUri(surahNumber, index, url);

            // Configure audio session for playback
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
                playsInSilentModeIOS: true,
                shouldDuckAndroid: true,
                playThroughEarpieceAndroid: false,
                staysActiveInBackground: true
            });

            // Local status update callback helper
            const onPlaybackStatusUpdate = (status: any) => {
                if (!status.isLoaded) {
                    if (status.error) {
                        console.error(`Playback error: ${status.error}`);
                    }
                    return;
                }
                if (!status.isBuffering) {
                    setBufferingIndex(null);
                }
                if (status.didJustFinish) {
                    setPlayingIndex(null);

                    // If Auto Play is enabled, transition to next verse
                    if (isAutoPlayRef.current) {
                        const nextIndex = index + 1;
                        const totalAyahs = ayahsRef.current?.length || 0;
                        if (nextIndex < totalAyahs) {
                            const nextAudioUrl = audioEditionRef.current?.ayahs?.[nextIndex]?.audio || '';
                            if (nextAudioUrl) {
                                playAudioRef.current?.(nextAudioUrl, nextIndex);
                            }
                        }
                    }
                }
            };

            const { sound: newSound } = await Audio.Sound.createAsync(
                { uri: playableUrl },
                { shouldPlay: true },
                onPlaybackStatusUpdate
            );

            soundRef.current = newSound;
            setSound(newSound);
            setBufferingIndex(null);
        } catch (error) {
            console.error('Error playing verse audio:', error);
            setBufferingIndex(null);
            setPlayingIndex(null);
            Alert.alert('Audio Error', 'Failed to play audio. Please check your network connection.');
        }
    }, [surahNumber, stopAudio]);

    const playAudioRef = useRef<typeof playAudio | null>(null);
    useEffect(() => {
        playAudioRef.current = playAudio;
    }, [playAudio]);

    const handlePlaySurah = useCallback(async () => {
        if (playingIndex !== null) {
            await stopAudio();
        } else {
            // Play or resume from the last played index
            const startIndex = lastPlayedIndex;
            const audioUrl = audioEdition?.ayahs?.[startIndex]?.audio || '';
            if (audioUrl) {
                playAudio(audioUrl, startIndex);
            }
        }
    }, [playingIndex, lastPlayedIndex, audioEdition, playAudio, stopAudio]);

    const handleBack = useCallback(() => {
        stopAudio();
        router.back();
    }, [stopAudio, router]);

    // Auto-start playback when opened via the "Play" button on a Surah card.
    const autoplayTriggered = useRef(false);
    useEffect(() => {
        if (autoplay === '1' && !autoplayTriggered.current && audioEdition?.ayahs?.length) {
            autoplayTriggered.current = true;
            handlePlaySurah();
        }
    }, [autoplay, audioEdition, handlePlaySurah]);

    // ── Long-press actions: bookmark + share ────────────────────────────────
    const openAyahActions = useCallback((index: number) => {
        setActionIndex(index);
        setActionsVisible(true);
    }, []);

    const actionAyah = actionIndex != null ? ayahs[actionIndex] : null;
    const actionEnglish = actionIndex != null ? (englishEdition?.ayahs?.[actionIndex]?.text || '') : '';
    const actionVerseLabel = actionAyah && surahInfo
        ? `${surahInfo.englishName} · Verse ${actionAyah.numberInSurah ?? (actionIndex as number) + 1}`
        : '';
    const actionBookmarked = actionIndex != null && isBookmarkedIn(bookmarks, surahNumber, actionIndex);

    const handleToggleBookmark = useCallback(async () => {
        if (actionIndex == null || !surahInfo) return;
        const ayah = ayahs[actionIndex];
        const next = await toggleBookmarkStore({
            surah: surahNumber,
            surahName: surahInfo.name,
            surahEnglishName: surahInfo.englishName,
            ayahIndex: actionIndex,
            ayahNumberInSurah: ayah?.numberInSurah ?? actionIndex + 1,
            text: ayah?.text || '',
            createdAt: Date.now()
        });
        setBookmarks(next);
    }, [actionIndex, surahInfo, ayahs, surahNumber]);

    const handleShareText = useCallback(async () => {
        if (actionIndex == null || !surahInfo) return;
        const ayah = ayahs[actionIndex];
        const eng = englishEdition?.ayahs?.[actionIndex]?.text;
        const message =
            `${ayah?.text || ''}` +
            (eng ? `\n\n${eng}` : '') +
            `\n\n— ${surahInfo.englishName} (${surahInfo.name}) : ${ayah?.numberInSurah ?? actionIndex + 1}` +
            `\nShared via Rehbar`;
        try {
            await Share.share({ message });
        } catch { }
    }, [actionIndex, surahInfo, ayahs, englishEdition]);

    const handleShareImage = useCallback(async () => {
        if (actionIndex == null) return;
        try {
            const ViewShot = require('react-native-view-shot');
            const Sharing = require('expo-sharing');
            // Let the off-screen card finish laying out before capturing.
            await new Promise((r) => setTimeout(r, 80));
            const uri = await ViewShot.captureRef(shareCardRef, { format: 'png', quality: 1, result: 'tmpfile' });
            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Share Ayah' });
            } else {
                handleShareText();
            }
        } catch {
            // view-shot / expo-sharing unavailable (needs a native rebuild) → text.
            handleShareText();
        }
    }, [actionIndex, handleShareText]);

    const renderAyahItem = useCallback(({ item, index }: { item: any; index: number }) => {
        const arabicText = item.text;
        const englishText = englishEdition?.ayahs?.[index]?.text || '';

        // Strip the Bismillah prefix for display if it is the first verse and isn't Surah Fatiha or Surah Tawbah
        let cleanArabicText = arabicText;
        if (surahNumber !== 1 && surahNumber !== 9 && index === 0) {
            const bismillahPrefix = 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ';
            if (arabicText.startsWith(bismillahPrefix)) {
                cleanArabicText = arabicText.substring(bismillahPrefix.length).trim();
            }
        }

        const isVersePlaying = playingIndex === index;
        const isVerseBuffering = bufferingIndex === index;

        return (
            <AyahItem
                index={index}
                arabicText={cleanArabicText}
                englishText={englishText}
                showTranslation={showTranslation}
                isPlaying={isVersePlaying}
                isBuffering={isVerseBuffering}
                primaryColor={colors.primary}
                textSecondaryColor={colors.textSecondary}
                borderColor={colors.border}
                cardColor={colors.cardBg}
                fontSize={fontSize}
                isBookmarked={isBookmarkedIn(bookmarks, surahNumber, index)}
                onLongPress={openAyahActions}
            />
        );
    }, [englishEdition, surahNumber, playingIndex, bufferingIndex, colors, showTranslation, fontSize, bookmarks, openAyahActions]);

    const renderHeader = useCallback(() => {
        if (surahNumber !== 1 && surahNumber !== 9 && ayahs[0]?.text) {
            const firstAyahText = ayahs[0].text;
            const bismillahPrefix = 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ';
            if (firstAyahText.startsWith(bismillahPrefix)) {
                const exactBismillah = firstAyahText.substring(0, bismillahPrefix.length);
                return (
                    <View style={styles.bismillahContainer}>
                        <ThemedText style={[styles.bismillahText, { color: colors.text }]}>
                            {exactBismillah}
                        </ThemedText>
                    </View>
                );
            }
        }
        return null;
    }, [ayahs, surahNumber, colors]);

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Custom Header using QuranHeader */}
            <QuranHeader
                title={headerTitle}
                subtitle={headerSubtitle}
                arabicTitle
                paddingTop={insets.top + 16}
                onBack={handleBack}
                rightSlot={
                    <View style={styles.headerControlsContainer}>
                        {/* Bookmarks list */}
                        <TouchableOpacity
                            onPress={() => router.push('/quran/bookmarks')}
                            style={[styles.headerIconBtn, { marginRight: 8 }]}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="bookmark-outline" size={16} color="#FFFFFF" />
                        </TouchableOpacity>

                        {/* Reading settings (font size) */}
                        <TouchableOpacity
                            onPress={() => setSettingsVisible(true)}
                            style={[styles.headerIconBtn, { marginRight: 8 }]}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="options-outline" size={16} color="#FFFFFF" />
                        </TouchableOpacity>

                        {/* Play/Pause Surah Button */}
                        <TouchableOpacity
                            onPress={handlePlaySurah}
                            style={[
                                styles.headerToggle,
                                { backgroundColor: playingIndex !== null ? '#FFFFFF' : 'rgba(255,255,255,0.18)', marginRight: 8 }
                            ]}
                            activeOpacity={0.8}
                        >
                            <Ionicons
                                name={playingIndex !== null ? 'pause' : 'play'}
                                size={12}
                                color={playingIndex !== null ? colors.primary : '#FFFFFF'}
                                style={{ marginRight: 4 }}
                            />
                            <ThemedText style={[
                                styles.headerToggleText,
                                { color: playingIndex !== null ? colors.primary : '#FFFFFF' }
                            ]}>
                                {playingIndex !== null ? 'Pause' : 'Play'}
                            </ThemedText>
                        </TouchableOpacity>

                        {/* Auto Play Toggle */}
                        <TouchableOpacity
                            onPress={() => setIsAutoPlay(prev => !prev)}
                            style={[
                                styles.headerToggle,
                                { backgroundColor: isAutoPlay ? '#FFFFFF' : 'rgba(255,255,255,0.18)', marginRight: 8 }
                            ]}
                            activeOpacity={0.8}
                        >
                            <Ionicons
                                name={isAutoPlay ? 'play-circle' : 'play-circle-outline'}
                                size={14}
                                color={isAutoPlay ? colors.primary : '#FFFFFF'}
                                style={{ marginRight: 4 }}
                            />
                            <ThemedText style={[
                                styles.headerToggleText,
                                { color: isAutoPlay ? colors.primary : '#FFFFFF' }
                            ]}>
                                Auto
                            </ThemedText>
                        </TouchableOpacity>

                        {/* Translation Toggle */}
                        <TouchableOpacity
                            onPress={() => setShowTranslation(prev => !prev)}
                            style={[
                                styles.headerToggle,
                                { backgroundColor: showTranslation ? '#FFFFFF' : 'rgba(255,255,255,0.18)' }
                            ]}
                            activeOpacity={0.8}
                        >
                            <ThemedText style={[
                                styles.headerToggleText,
                                { color: showTranslation ? colors.primary : '#FFFFFF' }
                            ]}>
                                EN
                            </ThemedText>
                        </TouchableOpacity>
                    </View>
                }
            />

            {/* Main Content */}
            {isLoading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <ThemedText style={styles.loadingText}>Fetching verses...</ThemedText>
                </View>
            ) : isError ? (
                <View style={styles.centerContainer}>
                    <Ionicons name="warning-outline" size={48} color="#EF4444" />
                    <ThemedText style={styles.errorText}>Unable to load Surah verses</ThemedText>
                    <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.primary }]} onPress={() => refetch()}>
                        <ThemedText style={{ color: '#fff', fontWeight: 'bold' }}>Retry</ThemedText>
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={{ flex: 1 }}>
                    <View style={styles.readingContainer}>
                        <FlashList
                            ref={flatListRef}
                            data={ayahs}
                            keyExtractor={(_, index) => index.toString()}
                            renderItem={renderAyahItem}
                            ListHeaderComponent={renderHeader}
                            contentContainerStyle={styles.listContent}
                            showsVerticalScrollIndicator={false}
                            onViewableItemsChanged={onViewableItemsChanged}
                            viewabilityConfig={viewabilityConfig}
                        />
                    </View>
                </View>
            )}

            {/* Reading settings (font size) */}
            <QuranSettingsModal
                visible={settingsVisible}
                onClose={() => setSettingsVisible(false)}
                fontSize={fontSize}
                onFontSize={changeFontSize}
            />

            {/* Long-press ayah actions */}
            <AyahActionsModal
                visible={actionsVisible}
                onClose={() => setActionsVisible(false)}
                verseLabel={actionVerseLabel}
                arabicPreview={actionAyah?.text || ''}
                isBookmarked={actionBookmarked}
                onToggleBookmark={handleToggleBookmark}
                onShareText={handleShareText}
                onShareImage={handleShareImage}
            />

            {/* Off-screen card captured for "Share as Image" */}
            {actionAyah && surahInfo && (
                <View ref={shareCardRef} collapsable={false} style={styles.offscreen}>
                    <ShareAyahCard
                        arabic={actionAyah.text || ''}
                        translation={actionEnglish}
                        surahName={surahInfo.name}
                        surahEnglishName={surahInfo.englishName}
                        verseNumber={actionAyah.numberInSurah ?? (actionIndex as number) + 1}
                        primary={colors.primary}
                        lime={colors.lime}
                    />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1
    },
    backgroundImage: {
        flex: 1
    },
    readingContainer: {
        flex: 1,
        paddingHorizontal: 13,
        paddingTop: 8,
        paddingBottom: 5
    },
    listContent: {
        paddingVertical: 7
    },
    bismillahContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 13,
        marginBottom: 8
    },
    bismillahText: {
        fontSize: 18.5,
        lineHeight: 40,
        fontWeight: 'bold',
        textAlign: 'center'
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    loadingText: {
        marginTop: 12,
        fontSize: 12.5
    },
    errorText: {
        marginTop: 12,
        fontSize: 12.5,
        textAlign: 'center'
    },
    retryButton: {
        marginTop: 16,
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderRadius: Layout.borderRadius
    },
    headerControlsContainer: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    headerToggle: {
        flexDirection: 'row',
        paddingHorizontal: 7,
        borderRadius: Layout.borderRadius,
        justifyContent: 'center',
        alignItems: 'center',
        minWidth: 42,
        height: 30
    },
    headerToggleText: {
        fontSize: 10,
        fontWeight: '700',
        textAlign: 'center'
    },
    headerIconBtn: {
        width: 30,
        height: 30,
        borderRadius: Layout.borderRadius,
        backgroundColor: 'rgba(255,255,255,0.18)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    offscreen: {
        position: 'absolute',
        left: -9999,
        top: -9999
    },
    paginationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    pageButton: {
        width: 38,
        height: 38,
        borderRadius: Layout.borderRadius,
        justifyContent: 'center',
        alignItems: 'center'
    },
    disabledPageButton: {
        opacity: 0.4
    },
    pageIndicatorCapsule: {
        paddingHorizontal: 13,
        paddingVertical: 5,
        borderRadius: Layout.borderRadius
    },
    pageIndicatorText: {
        fontSize: 11.5,
        fontWeight: '700',
        textAlign: 'center'
    }
});
