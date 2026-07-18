import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
    FadeInDown,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';

interface EmergencyQuickActionsProps {
    /** Existing call handler from the page; receives the primary number. */
    onCall: () => void;
    /** Existing directions handler from the page. */
    onDirections: () => void;
    hasContact: boolean;
    hasDirections: boolean;
}

function PressScale({
    onPress,
    disabled,
    style,
    children,
}: {
    onPress?: () => void;
    disabled?: boolean;
    style: any;
    children: React.ReactNode;
}) {
    const pressed = useSharedValue(0);
    const animStyle = useAnimatedStyle(() => ({
        transform: [{ scale: 1 - pressed.value * 0.04 }],
    }));
    return (
        <Animated.View style={[{ flex: 1 }, animStyle]}>
            <Pressable
                onPress={disabled ? undefined : onPress}
                onPressIn={() => !disabled && (pressed.value = withTiming(1, { duration: 100 }))}
                onPressOut={() => (pressed.value = withTiming(0, { duration: 160 }))}
                style={style}
            >
                {children}
            </Pressable>
        </Animated.View>
    );
}

/**
 * Redesigned presentation of the page's existing actions (call + directions).
 * No new functionality — the handlers come from the screen unchanged.
 */
export function EmergencyQuickActions({
    onCall,
    onDirections,
    hasContact,
    hasDirections,
}: EmergencyQuickActionsProps) {
    const { theme } = useTheme();
    const colors = Colors[theme];

    return (
        <Animated.View entering={FadeInDown.duration(400)} style={styles.row}>
            {hasContact && (
                <PressScale onPress={onCall} style={[styles.primaryBtn, { backgroundColor: colors.primary }]}>
                    <View style={[styles.primaryIcon, { backgroundColor: colors.lime }]}>
                        <Ionicons name="call" size={15} color="#FFFFFF" />
                    </View>
                    <ThemedText style={styles.primaryText}>Call Now</ThemedText>
                </PressScale>
            )}
            <PressScale
                onPress={onDirections}
                disabled={!hasDirections}
                style={[
                    styles.secondaryBtn,
                    { backgroundColor: `${colors.primary}10`, opacity: hasDirections ? 1 : 0.5 },
                ]}
            >
                <Ionicons
                    name={hasDirections ? 'navigate' : 'navigate-outline'}
                    size={16}
                    color={colors.primary}
                />
                <ThemedText style={[styles.secondaryText, { color: colors.primary }]}>
                    {hasDirections ? 'Directions' : 'No Directions'}
                </ThemedText>
            </PressScale>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 12,
    },
    primaryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        height: 52,
        borderRadius: 26,
    },
    primaryIcon: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    primaryText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '800',
        letterSpacing: 0.3,
    },
    secondaryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 7,
        height: 52,
        borderRadius: 26,
    },
    secondaryText: {
        fontSize: 14,
        fontWeight: '700',
    },
});
