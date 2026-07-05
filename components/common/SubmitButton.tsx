import React from 'react';
import { TouchableOpacity, TouchableOpacityProps, View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/colors';

import { Ionicons } from '@expo/vector-icons';

interface SubmitButtonProps extends TouchableOpacityProps {
    title: string;
    isLoading?: boolean;
    icon?: keyof typeof Ionicons.glyphMap;
}

export function SubmitButton({ title, isLoading, disabled, style, icon, ...rest }: SubmitButtonProps) {
    const isDisabled = disabled || isLoading;
    const { theme } = useTheme();
    const colors = Colors[theme];

    return (
        <TouchableOpacity
            style={[styles.updateButton, { backgroundColor: colors.primary }, isDisabled && { opacity: 0.6 }, style]}
            disabled={isDisabled}
            activeOpacity={0.8}
            {...rest}
        >
            <View style={styles.buttonContent}>
                {icon && !isLoading && (
                    <Ionicons name={icon} size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                )}
                <ThemedText style={styles.updateButtonText}>
                    {isLoading ? 'Processing...' : title}
                </ThemedText>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    updateButton: {
        height: 40,
        borderRadius: 20,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 8,
    },
    updateButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
});
