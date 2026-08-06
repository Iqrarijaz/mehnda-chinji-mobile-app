import { clientStorage } from '@/utils/storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme as _useColorScheme } from 'react-native';

type ColorScheme = 'light' | 'dark';
type ThemePreference = 'light' | 'dark' | 'system';

interface ThemeContextType {
    theme: ColorScheme;
    themePreference: ThemePreference;
    setThemePreference: (pref: ThemePreference) => Promise<void>;
    isDark: boolean;
    /** Cycles light → dark → light. Kept for older call sites; prefer setThemePreference. */
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
    theme: 'light',
    themePreference: 'system',
    setThemePreference: async () => { },
    isDark: false,
    toggleTheme: () => { },
});

const STORAGE_KEY = 'userTheme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    // RN's useColorScheme reacts live to OS-level appearance changes (both
    // Android and iOS), so 'system' preference stays in sync automatically —
    // no manual Appearance listener needed.
    const systemColorScheme = _useColorScheme();
    const [themePreference, setThemePreferenceState] = useState<ThemePreference>('system');
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        const loadTheme = async () => {
            try {
                const storedTheme = await clientStorage.getItem(STORAGE_KEY);
                if (storedTheme === 'light' || storedTheme === 'dark' || storedTheme === 'system') {
                    setThemePreferenceState(storedTheme);
                }
            } catch (e) {
                console.error('Failed to load theme preference', e);
            } finally {
                setHydrated(true);
            }
        };
        loadTheme();
    }, []);

    const setThemePreference = useCallback(async (pref: ThemePreference) => {
        setThemePreferenceState(pref);
        try {
            await clientStorage.setItem(STORAGE_KEY, pref);
        } catch (e) {
            console.error('Failed to persist theme preference', e);
        }
    }, []);

    const toggleTheme = useCallback(() => {
        const current = themePreference === 'system' ? (systemColorScheme ?? 'light') : themePreference;
        setThemePreference(current === 'dark' ? 'light' : 'dark');
    }, [themePreference, systemColorScheme, setThemePreference]);

    // Priority: 1) explicit user choice, 2) system theme, 3) Light Mode default.
    // Default to light until AsyncStorage has been read once, so we never
    // flash dark before we know the user hasn't chosen it.
    const theme: ColorScheme = useMemo(() => {
        if (!hydrated) return 'light';
        if (themePreference === 'light' || themePreference === 'dark') return themePreference;
        return systemColorScheme === 'dark' ? 'dark' : 'light';
    }, [hydrated, themePreference, systemColorScheme]);

    const isDark = theme === 'dark';

    const themeValue = useMemo(() => ({
        theme,
        themePreference,
        setThemePreference,
        isDark,
        toggleTheme
    }), [theme, themePreference, setThemePreference, isDark, toggleTheme]);

    return (
        <ThemeContext.Provider value={themeValue}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => useContext(ThemeContext);
