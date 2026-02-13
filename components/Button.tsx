import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import React from 'react';
import { ActivityIndicator, StyleSheet, TextStyle, TouchableOpacity, ViewStyle } from 'react-native';
import { ThemedText } from './themed-text';

interface ButtonProps {
    title: string;
    onPress: () => void;
    loading?: boolean;
    variant?: 'primary' | 'secondary' | 'outline';
    style?: ViewStyle;
    textStyle?: TextStyle;
}

export default function Button({ title, onPress, loading, variant = 'primary', style, textStyle }: ButtonProps) {
    const { theme } = useTheme();
    const colors = Colors[theme];

    const getBackgroundColor = () => {
        if (variant === 'secondary') return colors.secondary;
        if (variant === 'outline') return 'transparent';
        return colors.primary;
    };

    const getTextColor = () => {
        if (variant === 'outline') return colors.primary;
        return colors.white;
    };

    return (
        <TouchableOpacity
            style={[
                styles.button,
                { backgroundColor: getBackgroundColor() },
                variant === 'outline' && { borderColor: colors.primary, borderWidth: 1 },
                style,
            ]}
            onPress={onPress}
            disabled={loading}
            activeOpacity={0.8}
        >
            {loading ? (
                <ActivityIndicator color={getTextColor()} />
            ) : (
                <ThemedText style={[styles.text, { color: getTextColor() }, textStyle]}>{title}</ThemedText>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        height: 50,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginVertical: 10,
    },
    text: {
        fontSize: 16,
        fontWeight: '600',
    },
});
