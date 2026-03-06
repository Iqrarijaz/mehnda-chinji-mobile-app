import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Platform, StyleSheet, TextInput, View, ViewStyle } from 'react-native';

import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';

interface SearchBarProps {
    placeholder?: string;
    onSearch?: (query: string) => void;
    onFocus?: () => void;
    onBlur?: () => void;
    style?: ViewStyle;
}

export function SearchBar({ placeholder = "Search...", onSearch, onFocus, onBlur, style }: SearchBarProps) {

    const { theme } = useTheme();
    const colors = Colors[theme];
    const isDark = theme === 'dark';

    return (
        <View style={[
            styles.container,
            style
        ]}>
            <Ionicons
                name="search"
                size={20}
                color="#94A3B8"
                style={styles.icon}
            />
            <TextInput
                placeholder={placeholder}
                placeholderTextColor="#94A3B8"
                style={[styles.input, { color: '#0F172A' }]}
                onChangeText={onSearch}
                onFocus={onFocus}
                onBlur={onBlur}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Platform.OS === 'android' ? 14 : 16,
        borderRadius: 24,
        borderWidth: 1,
        backgroundColor: '#FFFFFF',
        borderColor: 'transparent',
    },
    icon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        fontSize: Platform.OS === 'android' ? 13 : 15,
        padding: 0,
    }
});
