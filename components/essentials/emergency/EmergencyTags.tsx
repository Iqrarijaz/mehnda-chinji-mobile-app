import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { capitalizeString } from '@/utils/string';

interface EmergencyTagsProps {
    tags: any[];
}

const tagText = (tag: any): string => {
    if (typeof tag === 'string') return capitalizeString(tag);
    const en = tag?.eng || tag?.en;
    const ur = tag?.ur;
    if (en && ur) return `${capitalizeString(en)} | ${ur}`;
    if (en) return capitalizeString(en);
    if (ur) return ur;
    return '';
};

// Tags that signal availability get the lime "positive status" treatment.
const isAvailabilityTag = (text: string) => /24|hour|available|open/i.test(text);

export function EmergencyTags({ tags }: EmergencyTagsProps) {
    const { theme } = useTheme();
    const colors = Colors[theme];

    if (!Array.isArray(tags) || tags.length === 0) return null;

    return (
        <View style={styles.section}>
            <View style={styles.headingRow}>
                <Ionicons name="pricetags" size={12} color={colors.secondary} />
                <ThemedText style={[styles.heading, { color: colors.textSecondary }]}>
                    Tags
                </ThemedText>
            </View>
            <View style={styles.chipWrap}>
                {tags.map((tag, index) => {
                    const text = tagText(tag);
                    if (!text) return null;
                    const highlight = isAvailabilityTag(text);
                    return (
                        <Animated.View
                            key={index}
                            entering={FadeInDown.delay(60 + index * 45)
                                .duration(350)
                                .springify()
                                .damping(16)}
                            style={[
                                styles.chip,
                                { backgroundColor: highlight ? `${colors.lime}1E` : `${colors.primary}10` },
                            ]}
                        >
                            {highlight && (
                                <View style={[styles.chipDot, { backgroundColor: colors.lime }]} />
                            )}
                            <ThemedText
                                style={[styles.chipText, { color: colors.primary }]}
                            >
                                {text}
                            </ThemedText>
                        </Animated.View>
                    );
                })}
            </View>
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
    chipWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999,
    },
    chipDot: {
        width: 5,
        height: 5,
        borderRadius: 2.5,
    },
    chipText: {
        fontSize: 11.5,
        fontWeight: '600',
        letterSpacing: 0.2,
    },
});
