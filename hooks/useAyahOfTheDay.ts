import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAyah } from '@/apis/quran';

// Standard alquran.cloud global ayah numbering (1-6236, across the whole Quran).
const TOTAL_AYAHS = 6236;
const ARABIC_EDITION = 'quran-uthmani';
const URDU_EDITION = 'ur.jalandhry';

/**
 * Deterministic "ayah of the day" reference — same ayah for every user on a
 * given calendar day (in their own local time), rotating automatically at
 * midnight with no server-side scheduling needed. day-of-year is stable
 * within a day and wraps every ~17 years across the ayah range, which is
 * more than enough variety for a daily rotation.
 */
function getTodaysAyahReference(): number {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 0);
    const dayOfYear = Math.floor((now.getTime() - startOfYear.getTime()) / 86400000);
    return (dayOfYear % TOTAL_AYAHS) + 1;
}

export interface AyahOfTheDay {
    reference: number;
    arabicText: string;
    urduText: string;
    surahNumber: number;
    surahName: string;
    surahEnglishName: string;
    numberInSurah: number;
}

/**
 * Fetches today's ayah (Arabic + Urdu translation) via the existing
 * multi-edition getAyah endpoint. Cached per calendar date, so it's fetched
 * once a day and otherwise served from the query cache / the backend's own
 * 24h Redis cache (shared across every user requesting the same reference).
 */
export function useAyahOfTheDay() {
    const reference = useMemo(() => getTodaysAyahReference(), []);
    const dateKey = useMemo(() => new Date().toDateString(), []);

    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['ayah-of-the-day', dateKey],
        queryFn: () => getAyah(reference, `${ARABIC_EDITION},${URDU_EDITION}`),
        staleTime: 1000 * 60 * 60 * 12,
        gcTime: 1000 * 60 * 60 * 24 * 2,
    });

    const ayah: AyahOfTheDay | null = useMemo(() => {
        const editions = (data as any)?.data;
        if (!Array.isArray(editions) || editions.length < 2) return null;
        const [arabic, urdu] = editions;
        if (!arabic) return null;
        return {
            reference,
            arabicText: arabic.text ?? '',
            urduText: urdu?.text ?? '',
            surahNumber: arabic.surah?.number ?? 0,
            surahName: arabic.surah?.name ?? '',
            surahEnglishName: arabic.surah?.englishName ?? '',
            numberInSurah: arabic.numberInSurah ?? 0,
        };
    }, [data, reference]);

    return { ayah, isLoading, error, refetch };
}
