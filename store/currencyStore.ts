import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { clientStorage } from '@/utils/storage';

/** How long a rewarded-ad unlock lasts before the currency list locks back down. */
export const CURRENCY_UNLOCK_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

/** Pinned currencies show at the top of the Currency screen and the Home widget. */
export const MAX_FAVORITE_CURRENCIES = 4;

interface CurrencyState {
    /** Epoch ms the current unlock expires at, or null if never unlocked / expired. */
    unlockedUntil: number | null;
    unlockPremium: () => void;
    lockPremium: () => void;
    /** Pinned currency codes, in the order the user pinned them. Capped at MAX_FAVORITE_CURRENCIES. */
    favoriteCurrencies: string[];
    /** Adds/removes `code`; a no-op once MAX_FAVORITE_CURRENCIES is already pinned. */
    toggleFavoriteCurrency: (code: string) => void;
}

export const useCurrencyStore = create<CurrencyState>()(
    persist(
        (set) => ({
            unlockedUntil: null,
            unlockPremium: () => set({ unlockedUntil: Date.now() + CURRENCY_UNLOCK_DURATION_MS }),
            lockPremium: () => set({ unlockedUntil: null }),
            favoriteCurrencies: [],
            toggleFavoriteCurrency: (code) => set((state) => {
                if (state.favoriteCurrencies.includes(code)) {
                    return { favoriteCurrencies: state.favoriteCurrencies.filter((c) => c !== code) };
                }
                if (state.favoriteCurrencies.length >= MAX_FAVORITE_CURRENCIES) {
                    return state; // cap reached — ignore until the user unpins one
                }
                return { favoriteCurrencies: [...state.favoriteCurrencies, code] };
            }),
        }),
        {
            name: 'currency-storage',
            storage: createJSONStorage(() => clientStorage),
            partialize: (state) => ({ unlockedUntil: state.unlockedUntil, favoriteCurrencies: state.favoriteCurrencies }),
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

/** Pinned currency codes, in pin order — reactive, re-renders on change. */
export function useFavoriteCurrencies(): string[] {
    return useCurrencyStore((s) => s.favoriteCurrencies);
}
