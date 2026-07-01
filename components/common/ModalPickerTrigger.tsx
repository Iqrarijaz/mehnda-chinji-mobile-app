import React from 'react';
import { View, TouchableOpacity, Platform, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface ModalPickerTriggerProps {
    label: string;
    required?: boolean;
    icon: keyof typeof Ionicons.glyphMap;
    value?: string | null;
    placeholder: string;
    onPress: () => void;
    delay?: number;
}

export function ModalPickerTrigger({
    label,
    required = false,
    icon,
    value,
    placeholder,
    onPress,
    delay = 0,
}: ModalPickerTriggerProps) {
    const { theme, isDark } = useTheme();
    const colors = Colors[theme];

    // If delay > 0, we animate the view
    const AnimatedView = delay > 0 ? Animated.View : View;
    const animatedProps = delay > 0 ? { entering: FadeInDown.delay(delay) } : {};

    return (
        <AnimatedView {...animatedProps} style={styles.inputField}>
            <View style={styles.labelContainer}>
                <ThemedText style={[styles.label, { color: colors.text }]}>
                    {label} {required && <ThemedText style={styles.required}>*</ThemedText>}
                </ThemedText>
            </View>
            <TouchableOpacity
                style={[
                    styles.dropdownTrigger, 
                    { 
                        backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.035)', 
                        height: Platform.OS === 'android' ? 48 : 52 
                    }
                ]}
                onPress={onPress}
                activeOpacity={0.7}
            >
                <View style={styles.triggerContent}>
                    <Ionicons 
                        name={icon} 
                        size={18} 
                        color={value ? colors.primary : colors.icon} 
                        style={{ marginRight: 10 }} 
                    />
                    <ThemedText 
                        style={[
                            styles.triggerText, 
                            !value ? { color: colors.icon } : { color: colors.text, textTransform: 'capitalize' }, 
                            { fontSize: 14 }
                        ]}
                        numberOfLines={1}
                    >
                        {value || placeholder}
                    </ThemedText>
                </View>
                <Ionicons name="chevron-down" size={16} color={colors.icon} />
            </TouchableOpacity>
        </AnimatedView>
    );
}

const styles = StyleSheet.create({
    inputField: {
        gap: 6,
    },
    labelContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingRight: 4,
    },
    label: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.5,
        marginLeft: 2,
    },
    required: {
        color: '#EF4444',
    },
    dropdownTrigger: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: 12,
        paddingHorizontal: 14,
    },
    triggerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 10,
    },
    triggerText: {
        fontWeight: '500',
        flex: 1,
    },
});
