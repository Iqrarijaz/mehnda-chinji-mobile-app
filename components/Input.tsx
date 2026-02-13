import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import React from 'react';
import { StyleSheet, TextInput, TextInputProps, View } from 'react-native';
import { ThemedText } from './themed-text';

interface InputProps extends TextInputProps {
    label?: string;
    error?: string;
}

const GRAY_FALLBACK = {
    300: '#BFC9D1',
    400: '#94A3B8',
    700: '#334155',
};

export default function Input({ label, error, style, ...props }: InputProps) {
    const { theme } = useTheme();
    const colors = Colors[theme];

    return (
        <View style={styles.container}>
            {label && <ThemedText style={[styles.label, { color: colors.text }]}>{label}</ThemedText>}
            <TextInput
                style={[
                    styles.input,
                    {
                        borderColor: colors.border,
                        backgroundColor: colors.card,
                        color: colors.text
                    },
                    error ? styles.inputError : null,
                    style
                ]}
                placeholderTextColor={GRAY_FALLBACK[400]}
                {...props}
            />
            {error && <ThemedText style={styles.errorText}>{error}</ThemedText>}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 6,
    },
    input: {
        height: 50,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
    },
    inputError: {
        borderColor: 'red',
    },
    errorText: {
        color: 'red',
        fontSize: 12,
        marginTop: 4,
    },
});
