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
    toggleTheme: () => void; // Keep for backward compatibility
}

const ThemeContext = createContext<ThemeContextType>({
    theme: 'light',
    themePreference: 'system',
    setThemePreference: async () => { },
    isDark: false,
    toggleTheme: () => { },
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const systemColorScheme = _useColorScheme() as ColorScheme;
    const [themePreference, setThemePreferenceState] = useState<ThemePreference>('system');
    const [theme, setTheme] = useState<ColorScheme>('light');

    useEffect(() => {
        const loadTheme = async () => {
            try {
                const storedTheme = await clientStorage.getItem('userTheme');
                if (storedTheme) {
                    setThemePreferenceState(storedTheme as ThemePreference);
                }
            } catch (e) {
                console.error('Failed to load theme preference', e);
            }
        };
        loadTheme();
    }, []);

    useEffect(() => {
        // TEMPORARY: Force Light Mode for v1 release
        setTheme('light');
        /*
        if (themePreference === 'system') {
            setTheme(systemColorScheme || 'light');
        } else {
            setTheme(themePreference);
        }
        */
    }, [themePreference, systemColorScheme]);

    const setThemePreference = useCallback(async (pref: ThemePreference) => {
        setThemePreferenceState(pref);
        await clientStorage.setItem('userTheme', pref);
    }, []);

    const toggleTheme = useCallback(() => {
        const nextTheme = theme === 'light' ? 'dark' : 'light';
        setThemePreference(nextTheme);
    }, [theme, setThemePreference]);

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
