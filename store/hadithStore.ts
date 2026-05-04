import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { clientStorage } from '@/utils/storage';
import type { Hadith } from '@/apis/hadith';

// Re-export so consumers can import the type from one place
export type { Hadith };

interface HadithState {
    hadith: Hadith | null;
    /** ISO date string for the day this hadith was fetched (YYYY-MM-DD) */
    fetchedDate: string | null;
    isLoading: boolean;
    error: string | null;

    // Actions
    setHadith: (hadith: Hadith) => void;
    setFetchedDate: (date: string) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
}

/** Returns today's date as YYYY-MM-DD (local time) */
export function todayDateString(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ─── Store ────────────────────────────────────────────────────────────────────
export const useHadithStore = create<HadithState>()(
    persist(
        (set) => ({
            hadith: null,
            fetchedDate: null,
            isLoading: false,
            error: null,

            setHadith: (hadith) => set({ hadith }),
            setFetchedDate: (date) => set({ fetchedDate: date }),
            setLoading: (loading) => set({ isLoading: loading }),
            setError: (error) => set({ error }),
        }),
        {
            name: 'daily-hadith-storage-api-v1',
            storage: createJSONStorage(() => clientStorage),
            // Only persist the cached hadith & date; skip ephemeral state
            partialize: (state) => ({
                hadith: state.hadith,
                fetchedDate: state.fetchedDate,
            }),
        }
    )
);
