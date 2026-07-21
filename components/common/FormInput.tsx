import React from 'react';
import { View, TextInput, TextInputProps, Platform, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Layout } from '@/constants/layout';

export interface FormInputProps extends TextInputProps {
    label?: string;
    required?: boolean;
    icon?: keyof typeof Ionicons.glyphMap;
    delay?: number;
    maxLength?: number;
    currentLength?: number;
    showCharCount?: boolean;
    containerStyle?: any;
    inputBoxStyle?: any;
    labelStyle?: any;
    rightAccessory?: React.ReactNode;
    error?: string;
}

export const FormInput = React.forwardRef<TextInput, FormInputProps>(({
    label,
    required = false,
    icon,
    delay = 0,
    maxLength,
    currentLength,
    showCharCount = false,
    containerStyle,
    inputBoxStyle,
    labelStyle,
    multiline,
    rightAccessory,
    error,
    ...rest
}, ref) => {
    const { theme, isDark } = useTheme();
    const colors = Colors[theme];

    const AnimatedView = delay > 0 ? Animated.View : View;
    const animatedProps = delay > 0 ? { entering: FadeInDown.delay(delay) } : {};

    const valueLength = currentLength ?? (typeof rest.value === 'string' ? rest.value.length : 0);
    const isOverLimit = maxLength && valueLength > maxLength;

    return (
        <AnimatedView {...animatedProps} style={[styles.inputField, containerStyle]}>
            {label && (
                <View style={styles.labelContainer}>
                    <ThemedText style={[styles.label, { color: colors.text }, labelStyle]}>
                        {label} {required && <ThemedText style={styles.required}>*</ThemedText>}
                    </ThemedText>
                    {showCharCount && maxLength && (
                        <ThemedText style={[styles.charCount, isOverLimit ? { color: '#EF4444' } : { color: colors.icon }]}>
                            {valueLength}/{maxLength}
                        </ThemedText>
                    )}
                </View>
            )}
            <View
                style={[
                    styles.inputBox,
                    {
                        backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.035)',
                        minHeight: multiline ? 100 : (Platform.OS === 'android' ? 48 : 52)
                    },
                    multiline && { alignItems: 'flex-start', paddingVertical: 12 },
                    inputBoxStyle
                ]}
            >
                {icon && (
                    <Ionicons
                        name={icon}
                        size={18}
                        color={colors.icon}
                        style={[{ marginRight: 10 }, multiline && { marginTop: 2 }]}
                    />
                )}
                <TextInput
                    ref={ref}
                    placeholderTextColor={colors.icon}
                    style={[
                        styles.textInput,
                        { color: colors.text },
                        multiline && { minHeight: 80 }
                    ]}
                    maxLength={maxLength}
                    multiline={multiline}
                    textAlignVertical={multiline ? 'top' : 'center'}
                    {...rest}
                />
                {rightAccessory}
            </View>
            {error ? (
                <ThemedText style={styles.errorText}>
                    {error}
                </ThemedText>
            ) : null}
        </AnimatedView>
    );
});

const styles = StyleSheet.create({
    inputField: {
        gap: 6
    },
    labelContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingRight: 4
    },
    label: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.5,
        marginLeft: 2,
        textTransform: 'uppercase'
    },
    required: {
        color: '#EF4444'
    },
    charCount: {
        fontSize: 10,
        fontWeight: '600'
    },
    inputBox: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: Layout.borderRadius,
        paddingHorizontal: 14
    },
    textInput: {
        flex: 1,
        fontWeight: '500',
        fontSize: 14,
        padding: 0,
        margin: 0
    },
    errorText: {
        color: '#EF4444',
        fontSize: 11,
        marginLeft: 4,
        marginTop: 2
    }
});
