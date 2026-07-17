import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { PressableProps, StyleProp, ViewStyle } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/colors';
import { Radius } from '@/constants/layout';
import { PressableScale } from '@/components/ui/PressableScale';

import { Ionicons } from '@expo/vector-icons';

interface SubmitButtonProps extends PressableProps {
    title: string;
    isLoading?: boolean;
    icon?: keyof typeof Ionicons.glyphMap;
    /** 'primary' = forest pill, 'accent' = lime pill, 'ghost' = soft field pill. */
    variant?: 'primary' | 'accent' | 'ghost';
    style?: StyleProp<ViewStyle>;
}

export function SubmitButton({ title, isLoading, disabled, style, icon, variant = 'primary', ...rest }: SubmitButtonProps) {
    const isDisabled = disabled || isLoading;
    const { theme } = useTheme();
    const colors = Colors[theme];

    const background =
        variant === 'accent' ? colors.lime :
        variant === 'ghost' ? colors.field :
        colors.primary;
    const labelColor = variant === 'ghost' ? colors.primary : '#FFFFFF';

    return (
        <PressableScale
            style={[styles.updateButton, { backgroundColor: background }, isDisabled && { opacity: 0.5 }, style]}
            disabled={isDisabled}
            {...rest}
        >
            <View style={styles.buttonContent}>
                {isLoading ? (
                    <ActivityIndicator size="small" color={labelColor} style={{ marginRight: 8 }} />
                ) : icon ? (
                    <Ionicons name={icon} size={16} color={labelColor} style={{ marginRight: 6 }} />
                ) : null}
                <ThemedText style={[styles.updateButtonText, { color: labelColor }]}>
                    {isLoading ? 'Processing...' : title}
                </ThemedText>
            </View>
        </PressableScale>
    );
}

const styles = StyleSheet.create({
    updateButton: {
        minHeight: 46,
        borderRadius: Radius.pill,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 12,
    },
    updateButtonText: {
        fontSize: 15,
        fontWeight: '700',
        letterSpacing: 0.2,
    },
});
