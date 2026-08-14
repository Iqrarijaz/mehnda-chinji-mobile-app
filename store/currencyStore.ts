import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { clientStorage } from '@/utils/storage';

/** How long a rewarded-ad unlock lasts before the currency list locks back down. */
export const CURRENCY_UNLOCK_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

interface CurrencyState {
    /** Epoch ms the current unlock expires at, or null if never unlocked / expired. */
    unlockedUntil: number | null;
    unlockPremium: () => void;
    lockPremium: () => void;
}

export const useCurrencyStore = create<CurrencyState>()(
    persist(
        (set) => ({
            unlockedUntil: null,
            unlockPremium: () => set({ unlockedUntil: Date.now() + CURRENCY_UNLOCK_DURATION_MS }),
            lockPremium: () => set({ unlockedUntil: null }),
        }),
        {
            name: 'currency-storage',
            storage: createJSONStorage(() => clientStorage),
            partialize: (state) => ({ unlockedUntil: state.unlockedUntil }),
        }
    )
);

/**
 * Reactive "is the 160+ currency list currently unlocked" selector.
 * Re-evaluates against Date.now() on every render that reads `unlockedUntil`.
 */
export function useIsPremiumUnlocked(): boolean {
    const unlockedUntil = useCurrencyStore((s) => s.unlockedUntil);
    return !!unlockedUntil && unlockedUntil > Date.now();
}
