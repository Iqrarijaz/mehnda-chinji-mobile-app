import { useEffect } from 'react';
import { getHadithById, HADITH_TOTAL } from '@/apis/hadith';
import { useHadithStore, todayDateString } from '@/store/hadithStore';

/** Pick a stable hadith number for a given date so every device shows the same one. */
function getDayHadithNumber(dateStr: string): number {
    let hash = 0;
    for (let i = 0; i < dateStr.length; i++) {
        const char = dateStr.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash |= 0; // 32-bit integer
    }
    // Ensure 1-indexed and within bounds (40,465)
    return (Math.abs(hash) % HADITH_TOTAL) + 1;
}

/**
 * useDailyHadith
 *
 * Returns one random hadith per calendar day from hadithapi.com.
 * The hadith is stored in Zustand + AsyncStorage so the network call only
 * happens once per day, even across app restarts.
 */
export function useDailyHadith() {
    const {
        hadith, fetchedDate,
        isLoading, error,
        setHadith, setFetchedDate, setLoading, setError,
    } = useHadithStore();

    useEffect(() => {
        const today = todayDateString();

        // Skip if we already have today's hadith cached
        if (fetchedDate === today && hadith !== null) return;

        const fetchHadith = async () => {
            setLoading(true);
            setError(null);

            try {
                const number = getDayHadithNumber(today);
                const result = await getHadithById(number);
                setHadith(result);
                setFetchedDate(today);
            } catch (err: any) {
                console.warn('[useDailyHadith] fetch failed:', err.message);
                setError(err.message ?? 'Failed to load hadith');
            } finally {
                setLoading(false);
            }
        };

        fetchHadith();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run only on mount; date comparison handles cache staleness

    return { hadith, isLoading, error };
}
