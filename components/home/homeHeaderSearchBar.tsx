import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { SearchBar } from '../common/searchBar';

interface HomeHeaderSearchBarProps {
    searchQuery: string;
    onSearchChange: (q: string) => void;
    setIsSearchActive: (active: boolean) => void;
    isDark: boolean;
    colors: any;
}

export function HomeHeaderSearchBar({
    onSearchChange,
    setIsSearchActive,
    isDark,
    colors,
}: HomeHeaderSearchBarProps) {
    return (
        <View style={styles.searchContainer}>
            <SearchBar
                placeholder="What service are you looking for?"
                onSearch={onSearchChange}
                onFocus={() => setIsSearchActive(true)}
                style={{
                    backgroundColor: isDark ? colors.card : '#FFFFFF',
                    borderColor: 'transparent',
                    height: Platform.OS === 'android' ? 40 : 48,
                    borderRadius: 24,
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    searchContainer: {
        width: '100%',
    },
});
