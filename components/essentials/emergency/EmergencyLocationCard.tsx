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

interface EmergencyLocationCardProps {
    place: any;
    address: string;
    /** Existing directions handler from the page, passed through unchanged. */
    onDirections: () => void;
    hasDirections: boolean;
}

/**
 * Location, availability hours, and the existing directions action as one
 * calm, scannable card.
 */
export function EmergencyLocationCard({
    place,
    address,
    onDirections,
    hasDirections,
}: EmergencyLocationCardProps) {
    const { theme, isDark } = useTheme();
    const colors = Colors[theme];
    const pressed = useSharedValue(0);

    const pressStyle = useAnimatedStyle(() => ({
        transform: [{ scale: 1 - pressed.value * 0.03 }],
    }));

    const subArea = [place?.village, place?.city].filter(Boolean).join(', ');

    return (
        <View style={styles.section}>
            <View style={styles.headingRow}>
                <Ionicons name="location" size={12} color={colors.secondary} />
                <ThemedText style={[styles.heading, { color: colors.textSecondary }]}>
                    Location & Directions
                </ThemedText>
            </View>

            <Animated.View
                entering={FadeInDown.delay(80).duration(400)}
                style={[
                    styles.card,
                    { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : colors.background },
                ]}
            >
                <View style={styles.infoRow}>
                    <View style={[styles.iconTile, { backgroundColor: `${colors.secondary}16` }]}>
                        <Ionicons name="location" size={18} color={colors.secondary} />
                    </View>
                    <View style={styles.info}>
                        <ThemedText style={[styles.label, { color: colors.textSecondary }]}>
                            Address
                        </ThemedText>
                        <ThemedText style={[styles.value, { color: colors.text }]}>
                            {address}
                        </ThemedText>
                        {subArea ? (
                            <ThemedText style={[styles.sub, { color: colors.textSecondary }]}>
                                {subArea}
                            </ThemedText>
                        ) : null}
                    </View>
                </View>

                {place?.timing ? (
                    <View style={styles.infoRow}>
                        <View style={[styles.iconTile, { backgroundColor: `${colors.lime}1E` }]}>
                            <Ionicons name="time" size={18} color={colors.lime} />
                        </View>
                        <View style={styles.info}>
                            <ThemedText style={[styles.label, { color: colors.textSecondary }]}>
                                Availability
                            </ThemedText>
                            <ThemedText style={[styles.value, { color: colors.text }]}>
                                {place.timing}
                            </ThemedText>
                        </View>
                    </View>
                ) : null}

                {hasDirections && (
                    <Animated.View style={pressStyle}>
                        <Pressable
                            onPress={onDirections}
                            onPressIn={() => (pressed.value = withTiming(1, { duration: 100 }))}
                            onPressOut={() => (pressed.value = withTiming(0, { duration: 160 }))}
                            style={[styles.directionsBtn, { backgroundColor: colors.primary }]}
                        >
                            <Ionicons name="navigate" size={15} color="#FFFFFF" />
                            <ThemedText style={styles.directionsText}>Get Directions</ThemedText>
                        </Pressable>
                    </Animated.View>
                )}
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    section: {
        gap: 8,
    },
    headingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    heading: {
        fontSize: 10,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    card: {
        borderRadius: 18,
        padding: 12,
        gap: 12,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconTile: {
        width: 40,
        height: 40,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    info: {
        flex: 1,
    },
    label: {
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.4,
        marginBottom: 2,
    },
    value: {
        fontSize: 13.5,
        fontWeight: '700',
    },
    sub: {
        fontSize: 11.5,
        marginTop: 1,
    },
    directionsBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 7,
        height: 46,
        borderRadius: 23,
        marginTop: 2,
    },
    directionsText: {
        color: '#FFFFFF',
        fontSize: 13.5,
        fontWeight: '800',
        letterSpacing: 0.3,
    },
});
