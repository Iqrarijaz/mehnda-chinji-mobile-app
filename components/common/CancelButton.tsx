import React from 'react';
import { TouchableOpacity, TouchableOpacityProps, View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/colors';

import { Ionicons } from '@expo/vector-icons';
import { Layout } from '@/constants/layout';

interface CancelButtonProps extends TouchableOpacityProps {
    title?: string;
    icon?: keyof typeof Ionicons.glyphMap;
}

export function CancelButton({ title = 'Cancel', disabled, style, icon, ...rest }: CancelButtonProps) {
    const { theme } = useTheme();
    const colors = Colors[theme];

    return (
        <TouchableOpacity
            style={[styles.cancelButton, disabled && { opacity: 0.6 }, style]}
            disabled={disabled}
            activeOpacity={0.7}
            {...rest}
        >
            <View style={styles.buttonContent}>
                {icon && (
                    <Ionicons name={icon} size={16} color={colors.textSecondary} style={{ marginRight: 6 }} />
                )}
                <ThemedText style={[styles.cancelButtonText, { color: colors.textSecondary }]}>
                    {title}
                </ThemedText>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    cancelButton: {
        height: 46,
        borderRadius: Layout.borderRadius,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: 24,
        backgroundColor: 'transparent' },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 8 },
    cancelButtonText: {
        fontSize: 14,
        fontWeight: '600' } });
