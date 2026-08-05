import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { capitalizeString } from '@/utils/string';
import { SectionHeading } from './SectionHeading';
import { Layout } from '@/constants/layout';

interface TagChipsProps {
    tags: any[];
    title?: string;
    /** Cycle brand-color accent dots through the chips. */
    accentDots?: boolean;
    /** Give availability-style tags (24 hours, open, available) the lime treatment. */
    highlightAvailability?: boolean;
}

/** Handles both string tags and {eng/en, ur} bilingual tag objects. */
const tagText = (tag: any): string => {
    if (typeof tag === 'string') return capitalizeString(tag);
    const en = tag?.eng || tag?.en;
    const ur = tag?.ur;
    if (en && ur) return `${capitalizeString(en)} | ${ur}`;
    if (en) return capitalizeString(en);
    if (ur) return ur;
    return '';
};

const isAvailabilityTag = (text: string) => /24|hour|available|open|emergency/i.test(text);

/**
 * Reusable animated tag chips shared by every category detail page.
 */
export const TagChips = React.memo(({
    tags,
    title = 'Tags',
    accentDots = false,
    highlightAvailability = false }: TagChipsProps) => {
    const { theme } = useTheme();
    const colors = Colors[theme];

    if (!Array.isArray(tags) || tags.length === 0) return null;

    const accents = [colors.primary, colors.secondary, colors.lime];

    return (
        <View style={styles.section}>
            <SectionHeading icon="pricetags" label={title} />
            <View style={styles.chipWrap}>
                {tags.map((tag, index) => {
                    const text = tagText(tag);
                    if (!text) return null;
                    const highlight = highlightAvailability && isAvailabilityTag(text);
                    const showDot = highlight || accentDots;
                    const dotColor = highlight
                        ? colors.lime
                        : accents[index % accents.length];
                    return (
                        <Animated.View
                            key={index}
                            entering={FadeInDown.delay(60 + index * 45)
                                .duration(350)
                                .springify()
                                .damping(16)}
                            style={[
                                styles.chip,
                                {
                                    backgroundColor: highlight
                                        ? `${colors.lime}1E`
                                        : `${colors.primary}10` },
                            ]}
                        >
                            {showDot && (
                                <View style={[styles.chipDot, { backgroundColor: dotColor }]} />
                            )}
                            <ThemedText style={[styles.chipText, { color: colors.primary }]}>
                                {text}
                            </ThemedText>
                        </Animated.View>
                    );
                })}
            </View>
        </View>
    );
});

TagChips.displayName = 'TagChips';

const styles = StyleSheet.create({
    section: {
        gap: 8 },
    chipWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8 },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: Layout.borderRadius },
    chipDot: {
        width: 5,
        height: 5,
        borderRadius: Layout.borderRadius },
    chipText: {
        fontSize: 10,
        fontWeight: '600',
        letterSpacing: 0.2 } });
