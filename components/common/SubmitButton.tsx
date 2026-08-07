import React from 'react';
import { ActivityIndicator, TouchableOpacityProps, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming } from 'react-native-reanimated';
import { PressableScale } from '@/components/essentials/shared/PressableScale';
import { Ionicons } from '@expo/vector-icons';

interface SubmitButtonProps extends TouchableOpacityProps {
    title: string;
    isLoading?: boolean;
    icon?: keyof typeof Ionicons.glyphMap;
}

export function SubmitButton({ title, isLoading, disabled, style, icon, onPress, ...rest }: SubmitButtonProps) {
    const isDisabled = disabled || isLoading;
    const { theme } = useTheme();
    const colors = Colors[theme];

    // Gentle cross-fade whenever the label/spinner content swaps, instead of
    // an instant cut, without changing the row's normal (non-absolute) layout flow.
    const contentOpacity = useSharedValue(1);

    React.useEffect(() => {
        contentOpacity.value = 0.35;
        contentOpacity.value = withTiming(1, { duration: 180 });
    }, [isLoading]);

    const contentStyle = useAnimatedStyle(() => ({ opacity: contentOpacity.value }));

    return (
        <PressableScale
            intensity={0.04}
            disabled={isDisabled}
            onPress={onPress as (() => void) | undefined}
            style={[styles.updateButton, { backgroundColor: colors.lime }, isDisabled && { opacity: 0.6 }, style]}
            {...(rest as any)}
        >
            <Animated.View style={[styles.buttonContent, contentStyle]}>
                {isLoading && (
                    <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
                )}
                {icon && !isLoading && (
                    <Ionicons name={icon} size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                )}
                <ThemedText style={styles.updateButtonText}>
                    {isLoading ? 'Processing...' : title}
                </ThemedText>
            </Animated.View>
        </PressableScale>
    );
}

const styles = StyleSheet.create({
    updateButton: {
        height: 46,
        borderRadius: 30,
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
