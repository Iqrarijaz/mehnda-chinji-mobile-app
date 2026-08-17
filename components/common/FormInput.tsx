import React from 'react';
import { View, TextInput, TextInputProps, Platform, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
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

    const valueLength = currentLength ?? (typeof rest.value === 'string' ? rest.value.length : 0);
    const isOverLimit = !!maxLength && valueLength > maxLength;

    // Focus/blur border color. Switches from whatever border color the box
    // already has at rest (usually none) to the brand primary color when a
    // field is actually focused.
    const [isFocused, setIsFocused] = React.useState(false);
    const restBorder = isDark ? 'rgba(255,255,255,0.06)' : colors.border;

    const handleFocus = (e: any) => {
        setIsFocused(true);
        onFocus?.(e);
    };
    const handleBlur = (e: any) => {
        setIsFocused(false);
        onBlur?.(e);
    };

    return (
        <View style={[styles.inputField, containerStyle]}>
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
            <View
                style={[
                    styles.inputBox,
                    {
                        backgroundColor: colors.cardBg,
                        height: multiline ? (Platform.OS === 'android' ? 90 : 100) : (Platform.OS === 'android' ? 46 : 50),
                        alignItems: multiline ? 'flex-start' : 'center',
                        paddingTop: multiline ? 12 : 0,
                        borderColor: isFocused ? colors.primary : restBorder,
                    },
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
            </View>
            {error ? (
                <ThemedText style={styles.errorText}>
                    {error}
                </ThemedText>
            ) : null}
        </View>
    );
}));

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
    overLimit: {
        color: '#EF4444'
    },
    inputBox: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: Layout.borderRadius - 2,
        paddingHorizontal: 11
    },
    icon: {
        marginRight: 8
    },
    textInput: {
        flex: 1,
        fontWeight: '500',
        fontSize: 12.5,
        padding: 0,
        margin: 0
    },
    multilineInput: {
        paddingTop: 2,
        lineHeight: 18
    },
    errorText: {
        color: '#EF4444',
        fontSize: 10,
        marginLeft: 4,
        marginTop: 2
    }
});
