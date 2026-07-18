import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { PressableScale } from './PressableScale';
import { SectionHeading } from './SectionHeading';

interface LocationSectionProps {
    place: any;
    address: string;
    /** Existing directions handler from the page, passed through unchanged. */
    onDirections?: () => void;
    hasDirections?: boolean;
    title?: string;
    /** Label for the place.timing row, e.g. "Availability" or "Working Hours". */
    timingLabel?: string;
    /** Pre-formatted distance string when the caller has one. */
    distance?: string;
}

/**
 * Reusable location card shared by every category detail page: address,
 * area, hours, optional distance, and the page's existing directions action.
 */
export const LocationSection = React.memo(({
    place,
    address,
    onDirections,
    hasDirections = false,
    title = 'Location & Directions',
    timingLabel = 'Working Hours',
    distance,
}: LocationSectionProps) => {
    const { theme, isDark } = useTheme();
    const colors = Colors[theme];

    const subArea = [place?.village, place?.city].filter(Boolean).join(', ');

    return (
        <View style={styles.section}>
            <SectionHeading icon="location" label={title} pill={distance} />

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
                        <ThemedText style={[styles.value, { color: colors.text }]} numberOfLines={2}>
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
                        <View style={[styles.iconTile, { backgroundColor: '#F59E0B14' }]}>
                            <Ionicons name="time" size={18} color="#F59E0B" />
                        </View>
                        <View style={styles.info}>
                            <ThemedText style={[styles.label, { color: colors.textSecondary }]}>
                                {timingLabel}
                            </ThemedText>
                            <ThemedText style={[styles.value, { color: colors.text }]}>
                                {place.timing}
                            </ThemedText>
                        </View>
                    </View>
                ) : null}

                {hasDirections && onDirections && (
                    <PressableScale
                        onPress={onDirections}
                        style={[styles.directionsBtn, { backgroundColor: colors.primary }]}
                    >
                        <Ionicons name="navigate" size={15} color="#FFFFFF" />
                        <ThemedText style={styles.directionsText}>Get Directions</ThemedText>
                    </PressableScale>
                )}
            </Animated.View>
        </View>
    );
});

LocationSection.displayName = 'LocationSection';

const styles = StyleSheet.create({
    section: {
        gap: 8,
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
