import React from 'react';
import { ActivityIndicator, TouchableOpacity, TouchableOpacityProps, View, StyleSheet, Platform } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { Ionicons } from '@expo/vector-icons';

interface SubmitButtonProps extends TouchableOpacityProps {
    title: string;
    isLoading?: boolean;
    icon?: keyof typeof Ionicons.glyphMap;
}

export const SubmitButton = React.memo(function SubmitButton({ title, isLoading, disabled, style, icon, onPress, ...rest }: SubmitButtonProps) {
    const isDisabled = disabled || isLoading;
    const { theme } = useTheme();
    const colors = Colors[theme];

    return (
        <TouchableOpacity
            activeOpacity={0.7}
            disabled={isDisabled}
            onPress={onPress}
            style={[styles.updateButton, { backgroundColor: colors.lime }, isDisabled && { opacity: 0.6 }, style]}
            {...rest}
        >
            <View style={[styles.buttonContent, { opacity: isLoading ? 0.6 : 1 }]}>
                {isLoading && (
                    <ActivityIndicator color="#FFFFFF" size="small" style={{ marginRight: 8 }} />
                )}
                {!isLoading && icon && (
                    <Ionicons name={icon} size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                )}
                <ThemedText style={styles.updateButtonText}>
                    {isLoading ? 'Processing...' : title}
                </ThemedText>
            </View>
        </TouchableOpacity>
    );
});

const styles = StyleSheet.create({
    updateButton: {
        height: Platform.OS === 'android' ? 46 : 50,
        borderRadius: 28,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: 20 },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 7 },
    updateButtonText: {
        color: '#FFFFFF',
        fontSize: 12.5,
        fontWeight: '600' } });
