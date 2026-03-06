import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HomeHeaderSearchBar } from './homeHeaderSearchBar';
import { HomeHeaderTopNav } from './homeHeaderTopNav';
import HomeHeaderWeatherWidget from './homeHeaderWeatherWidget';
import { useRouter } from 'expo-router';

interface HomeHeaderProps {
    searchQuery: string;
    onSearchChange: (q: string) => void;
    setIsSearchActive: (active: boolean) => void;
}

export const HomeHeader = React.memo(({ searchQuery, onSearchChange, setIsSearchActive }: HomeHeaderProps) => {
    const { theme } = useTheme();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const colors = Colors[theme];
    const isDark = theme === 'dark';

    return (
        <View style={styles.headerWrapper}>
            <View style={[styles.container, { paddingTop: insets.top + (Platform.OS === 'android' ? 16 : 20), backgroundColor: colors.primary }]}>
                <HomeHeaderTopNav />

                <HomeHeaderWeatherWidget onPress={() => router.push('/weather')} />

                <HomeHeaderSearchBar
                    searchQuery={searchQuery}
                    onSearchChange={onSearchChange}
                    setIsSearchActive={setIsSearchActive}
                    isDark={isDark}
                    colors={colors}
                />
            </View>
        </View>
    );
});

const styles = StyleSheet.create({
    headerWrapper: {
        zIndex: 10,
    },
    container: {
        paddingHorizontal: Platform.OS === 'android' ? 18 : 20,
        paddingBottom: Platform.OS === 'android' ? 18 : 20,
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
        zIndex: 10,
    },
});
