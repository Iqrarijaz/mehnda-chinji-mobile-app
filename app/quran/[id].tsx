import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StyleSheet, View, TouchableOpacity, ActivityIndicator, Alert, ImageBackground } from 'react-native';
import { FlashList, FlashListRef } from '@shopify/flash-list';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';

import { getSurah } from '@/apis/quran';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { analyticsService, AnalyticsEvents } from '@/analytics';

// Import memoized components
import { AyahItem } from '@/components/quran/AyahItem';
import { QuranHeader } from '@/components/quran/QuranHeader';
import { startSurahDownload, getPlayableAyahUri, cleanupExpiredCache } from '@/utils/quranAudioCache';

export default function SurahDetailScreen() {
    const { id } = useLocalSearchParams();
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

    // Fetch Surah details with 3 editions: Uthmani Arabic, English translation, and audio recitation
    const { data: response, isLoading, isError, refetch } = useQuery({
        queryKey: ['quran-surah', surahNumber],
        queryFn: () => getSurah(surahNumber, { edition: 'quran-uthmani,en.asad,ar.alafasy' }),
        enabled: !isNaN(surahNumber),
    });

    const editionsData = response?.data as any;

    // Extract the separate editions from response array
    const arabicEdition = editionsData?.[0];
    const englishEdition = editionsData?.[1];
    const audioEdition = editionsData?.[2];

    const surahInfo = arabicEdition;
    const headerTitle = surahInfo?.name || 'Loading...';
    const headerSubtitle = '';
    const ayahs = arabicEdition?.ayahs || [];

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
                staysActiveInBackground: true,
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
                cardColor={colors.card}
            />
        );
    }, [englishEdition, surahNumber, playingIndex, bufferingIndex, colors, showTranslation]);

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
                paddingTop={insets.top + 16}
                borderColor={colors.border}
                cardColor={colors.card}
                textColor={colors.text}
                textSecondaryColor={colors.textSecondary}
                onBack={handleBack}
                rightSlot={
                    <View style={styles.headerControlsContainer}>
                        {/* Play/Pause Surah Button */}
                        <TouchableOpacity
                            onPress={handlePlaySurah}
                            style={[
                                styles.headerToggle,
                                {
                                    backgroundColor: playingIndex !== null ? colors.primary : colors.card,
                                    borderColor: playingIndex !== null ? colors.primary : colors.border,
                                    marginRight: 8
                                }
                            ]}
                            activeOpacity={0.7}
                        >
                            <Ionicons
                                name={playingIndex !== null ? "pause" : "play"}
                                size={12}
                                color={playingIndex !== null ? '#FFFFFF' : colors.text}
                                style={{ marginRight: 4 }}
                            />
                            <ThemedText style={[
                                styles.headerToggleText,
                                { color: playingIndex !== null ? '#FFFFFF' : colors.text }
                            ]}>
                                {playingIndex !== null ? "Pause" : "Play"}
                            </ThemedText>
                        </TouchableOpacity>

                        {/* Auto Play Toggle */}
                        <TouchableOpacity
                            onPress={() => setIsAutoPlay(prev => !prev)}
                            style={[
                                styles.headerToggle,
                                {
                                    backgroundColor: isAutoPlay ? colors.primary : colors.card,
                                    borderColor: isAutoPlay ? colors.primary : colors.border,
                                    marginRight: 8
                                }
                            ]}
                            activeOpacity={0.7}
                        >
                            <Ionicons
                                name={isAutoPlay ? "play-circle" : "play-circle-outline"}
                                size={14}
                                color={isAutoPlay ? '#FFFFFF' : colors.text}
                                style={{ marginRight: 4 }}
                            />
                            <ThemedText style={[
                                styles.headerToggleText,
                                { color: isAutoPlay ? '#FFFFFF' : colors.text }
                            ]}>
                                Auto
                            </ThemedText>
                        </TouchableOpacity>

                        {/* Translation Toggle */}
                        <TouchableOpacity
                            onPress={() => setShowTranslation(prev => !prev)}
                            style={[
                                styles.headerToggle,
                                {
                                    backgroundColor: showTranslation ? colors.primary : colors.card,
                                    borderColor: showTranslation ? colors.primary : colors.border
                                }
                            ]}
                            activeOpacity={0.7}
                        >
                            <ThemedText style={[
                                styles.headerToggleText,
                                { color: showTranslation ? '#FFFFFF' : colors.text }
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
                    <Ionicons name="warning-outline" size={48} color="#FF5A5F" />
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
                        />
                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    backgroundImage: {
        flex: 1,
    },
    readingContainer: {
        flex: 1,
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 6,
    },
    listContent: {
        paddingVertical: 8,
    },
    bismillahContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        marginBottom: 8,
    },
    bismillahText: {
        fontSize: 22,
        lineHeight: 40,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
    },
    errorText: {
        marginTop: 12,
        fontSize: 15,
        textAlign: 'center',
    },
    retryButton: {
        marginTop: 16,
        paddingVertical: 10,
        paddingHorizontal: 24,
        borderRadius: 20,
    },
    headerControlsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerToggle: {
        flexDirection: 'row',
        paddingHorizontal: 8,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        minWidth: 42,
        height: 30,
    },
    headerToggleText: {
        fontSize: 11,
        fontWeight: '700',
        textAlign: 'center',
    },
    paginationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderTopWidth: StyleSheet.hairlineWidth,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0,
        shadowRadius: 3,
    },
    pageButton: {
        width: 38,
        height: 38,
        borderRadius: 19,
        justifyContent: 'center',
        alignItems: 'center',
        borderColor: 'rgba(0,0,0,0.03)',
    },
    disabledPageButton: {
        opacity: 0.4,
    },
    pageIndicatorCapsule: {
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
    },
    pageIndicatorText: {
        fontSize: 13,
        fontWeight: '700',
        textAlign: 'center',
    },
});
