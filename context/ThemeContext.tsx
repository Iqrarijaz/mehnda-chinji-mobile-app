import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
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
    const [theme, setTheme] = useState<ColorScheme>(systemColorScheme || 'light');

    useEffect(() => {
        const loadTheme = async () => {
            try {
                const storedTheme = await AsyncStorage.getItem('userTheme');
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
        if (themePreference === 'system') {
            setTheme(systemColorScheme || 'light');
        } else {
            setTheme(themePreference);
        }
    }, [themePreference, systemColorScheme]);

    const setThemePreference = async (pref: ThemePreference) => {
        setThemePreferenceState(pref);
        await AsyncStorage.setItem('userTheme', pref);
    };

    const toggleTheme = () => {
        const nextTheme = theme === 'light' ? 'dark' : 'light';
        setThemePreference(nextTheme);
    };

    const isDark = theme === 'dark';

    return (
        <ThemeContext.Provider value={{ theme, themePreference, setThemePreference, isDark, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => useContext(ThemeContext);
