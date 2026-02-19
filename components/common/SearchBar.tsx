import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TextInput, View, ViewStyle } from 'react-native';

import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';

interface SearchBarProps {
    placeholder?: string;
    onSearch?: (query: string) => void;
    style?: ViewStyle;
}

export function SearchBar({ placeholder = "Search...", onSearch, style }: SearchBarProps) {
    const { theme } = useTheme();
    const colors = Colors[theme];
    const isDark = theme === 'dark';

    return (
        <View style={[
            styles.container,
            {
                backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
            },
            style
        ]}>
            <Ionicons
                name="search"
                size={20}
                color={isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'}
                style={styles.icon}
            />
            <TextInput
                placeholder={placeholder}
                placeholderTextColor={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'}
                style={[styles.input, { color: colors.text }]}
                onChangeText={onSearch} // Basic implementation, might need debounce for API calls
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 16,
        borderWidth: 1,
    },
    icon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        fontSize: 16,
        padding: 0, // Reset padding for consistency
    }
});
