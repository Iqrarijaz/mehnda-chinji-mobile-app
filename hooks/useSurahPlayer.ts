import { useCallback, useEffect, useRef, useState } from 'react';
import { Audio } from 'expo-av';

import { getSurah, SurahListItem } from '@/apis/quran';
import { getPlayableAyahUri } from '@/utils/quranAudioCache';

/**
 * A single, screen-level Quran audio player. Fetches a surah's recitation
 * edition on demand, plays its ayahs sequentially (auto-advancing), and
 * prefers the locally-cached file when a surah has been downloaded. Used by
 * the Surah list so "Play" works inline without navigating to the reader.
 */
export function useSurahPlayer() {
    const [surah, setSurah] = useState<SurahListItem | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [ayahIndex, setAyahIndex] = useState(0);
    const [total, setTotal] = useState(0);
    const [position, setPosition] = useState(0);
    const [duration, setDuration] = useState(0);

    const soundRef = useRef<Audio.Sound | null>(null);
    const audioAyahsRef = useRef<any[]>([]);
    const ayahIndexRef = useRef(0);
    const surahRef = useRef<SurahListItem | null>(null);
    const playIndexRef = useRef<((index: number) => Promise<void>) | null>(null);

    useEffect(() => { ayahIndexRef.current = ayahIndex; }, [ayahIndex]);
    useEffect(() => { surahRef.current = surah; }, [surah]);

    const unload = useCallback(async () => {
        if (soundRef.current) {
            await soundRef.current.unloadAsync().catch(() => { });
            soundRef.current = null;
        }
    }, []);

    const onStatus = useCallback((status: any) => {
        if (!status.isLoaded) return;
        setIsPlaying(status.isPlaying);
        setPosition(status.positionMillis || 0);
        setDuration(status.durationMillis || 0);
        if (status.didJustFinish) {
            const next = ayahIndexRef.current + 1;
            if (next < audioAyahsRef.current.length) {
                playIndexRef.current?.(next);
            } else {
                setIsPlaying(false);
            }
        }
    }, []);

    const playIndex = useCallback(async (index: number) => {
        const ayahs = audioAyahsRef.current;
        const remoteUrl = ayahs[index]?.audio;
        const sNum = surahRef.current?.number;
        if (!remoteUrl || sNum == null) return;

        setAyahIndex(index);
        await unload();

        const playable = await getPlayableAyahUri(sNum, index, remoteUrl);
        await Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
            playsInSilentModeIOS: true,
            shouldDuckAndroid: true,
            playThroughEarpieceAndroid: false,
            staysActiveInBackground: true,
        });
        const { sound } = await Audio.Sound.createAsync(
            { uri: playable },
            { shouldPlay: true },
            onStatus
        );
        soundRef.current = sound;
    }, [unload, onStatus]);

    useEffect(() => { playIndexRef.current = playIndex; }, [playIndex]);

    const playSurah = useCallback(async (item: SurahListItem) => {
        try {
            // Same surah already loaded → just resume.
            if (surahRef.current?.number === item.number && soundRef.current) {
                await soundRef.current.playAsync().catch(() => { });
                return;
            }
            setIsLoading(true);
            setSurah(item);
            surahRef.current = item;
            setAyahIndex(0);
            setPosition(0);
            setDuration(0);

            const res = await getSurah(item.number, { edition: 'ar.alafasy' });
            const d: any = res?.data;
            const audioSurah = Array.isArray(d) ? d[0] : d;
            const ayahs = audioSurah?.ayahs || [];
            audioAyahsRef.current = ayahs;
            setTotal(ayahs.length);

            if (!ayahs.length) {
                setIsLoading(false);
                return;
            }
            await playIndex(0);
            setIsLoading(false);
        } catch (e) {
            console.error('Surah playback failed', e);
            setIsLoading(false);
        }
    }, [playIndex]);

    const toggle = useCallback(async () => {
        if (!soundRef.current) return;
        if (isPlaying) {
            await soundRef.current.pauseAsync().catch(() => { });
        } else {
            await soundRef.current.playAsync().catch(() => { });
        }
    }, [isPlaying]);

    const stop = useCallback(async () => {
        await unload();
        setSurah(null);
        surahRef.current = null;
        setIsPlaying(false);
        setIsLoading(false);
        setAyahIndex(0);
        setTotal(0);
        setPosition(0);
        setDuration(0);
        audioAyahsRef.current = [];
    }, [unload]);

    const seek = useCallback(async (ratio: number) => {
        if (soundRef.current && duration) {
            const clamped = Math.max(0, Math.min(1, ratio));
            await soundRef.current.setPositionAsync(clamped * duration).catch(() => { });
        }
    }, [duration]);

    const next = useCallback(() => {
        const n = ayahIndexRef.current + 1;
        if (n < audioAyahsRef.current.length) playIndex(n);
    }, [playIndex]);

    const prev = useCallback(() => {
        const p = ayahIndexRef.current - 1;
        if (p >= 0) playIndex(p);
    }, [playIndex]);

    // Unload on unmount.
    useEffect(() => () => { unload(); }, [unload]);

    return {
        surah,
        isPlaying,
        isLoading,
        ayahIndex,
        total,
        position,
        duration,
        playSurah,
        toggle,
        stop,
        seek,
        next,
        prev,
    };
}
