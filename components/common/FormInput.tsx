import React from 'react';
import { View, TextInput, TextInputProps, Platform, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import Animated, {
    FadeInDown,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
    interpolateColor } from 'react-native-reanimated';
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

export const FormInput = React.memo(React.forwardRef<TextInput, FormInputProps>(({
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
    onFocus,
    onBlur,
    ...rest
}, ref) => {
    const { theme, isDark } = useTheme();
    const colors = Colors[theme];

    const AnimatedView = delay > 0 ? Animated.View : View;
    const animatedProps = delay > 0 ? { entering: FadeInDown.delay(delay) } : {};

    const valueLength = currentLength ?? (typeof rest.value === 'string' ? rest.value.length : 0);
    const isOverLimit = maxLength && valueLength > maxLength;

    // Focus/blur border animation. Interpolates from whatever border color the
    // box already has at rest (usually none) up to the brand primary color, so
    // there's no visual change unless a field is actually focused.
    const focusProgress = useSharedValue(0);

    const handleFocus = (e: any) => {
        focusProgress.value = withTiming(1, { duration: 180 });
        onFocus?.(e);
    };
    const handleBlur = (e: any) => {
        focusProgress.value = withTiming(0, { duration: 180 });
        onBlur?.(e);
    };

    const animatedBoxStyle = useAnimatedStyle(() => {
        const restBorder = isDark ? 'rgba(255,255,255,0.06)' : colors.border;
        return {
            borderColor: interpolateColor(
                focusProgress.value,
                [0, 1],
                [restBorder, colors.primary]
            ),
        };
    });

    return (
        <AnimatedView {...animatedProps} style={[styles.inputField, containerStyle]}>
            {label && (
                <View style={styles.labelContainer}>
                    <ThemedText style={[styles.label, { color: colors.text }, labelStyle]}>
                        {label} {required && <ThemedText style={styles.required}>*</ThemedText>}
                    </ThemedText>
                    {showCharCount && maxLength ? (
                        <ThemedText style={[styles.charCount, isOverLimit && styles.overLimit]}>
                            {valueLength}/{maxLength}
                        </ThemedText>
                    ) : null}
                </View>
            )}
            <Animated.View
                style={[
                    styles.inputBox,
                    {
                        backgroundColor: colors.card,
                        height: multiline ? (Platform.OS === 'android' ? 90 : 100) : (Platform.OS === 'android' ? 48 : 52),
                        alignItems: multiline ? 'flex-start' : 'center',
                        paddingTop: multiline ? 12 : 0,
                    },
                    animatedBoxStyle,
                    error ? { borderColor: colors.danger } : null,
                    inputBoxStyle,
                ]}
            >
                {icon && (
                    <Ionicons
                        name={icon}
                        size={18}
                        color={colors.primary}
                        style={[
                            styles.icon,
                            multiline && { marginTop: 2 }
                        ]}
                    />
                )}
                <TextInput
                    ref={ref}
                    allowFontScaling={false}
                    placeholderTextColor={colors.placeholder}
                    style={[
                        styles.textInput,
                        { color: colors.text },
                        multiline && styles.multilineInput
                    ]}
                    maxLength={maxLength}
                    multiline={multiline}
                    textAlignVertical={multiline ? 'top' : 'center'}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    {...rest}
                />
                {rightAccessory}
            </Animated.View>
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
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.5,
        marginLeft: 2,
        textTransform: 'uppercase'
    },
    required: {
        color: '#EF4444'
    },
    charCount: {
        fontSize: 9,
        fontWeight: '600'
    },
    inputBox: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: Layout.borderRadius,
        paddingHorizontal: 11
    },
    textInput: {
        flex: 1,
        fontWeight: '500',
        fontSize: 12.5,
        padding: 0,
        margin: 0
    },
    errorText: {
        color: '#EF4444',
        fontSize: 10,
        marginLeft: 4,
        marginTop: 2
    }
});
