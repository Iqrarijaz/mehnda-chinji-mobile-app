import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Platform, StyleSheet, TextInput, View, ViewStyle } from 'react-native';

import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
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
            { backgroundColor: colors.card, borderColor: colors.border },
            style
        ]}>
            <Ionicons
                name="search"
                size={20}
                color={colors.icon}
                style={styles.icon}
            />
            <TextInput
                placeholder={placeholder}
                placeholderTextColor={colors.textSecondary || "#94A3B8"}
                style={[styles.input, { color: colors.text }]}
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
        borderRadius: Layout.borderRadius,
        height: 50,
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
