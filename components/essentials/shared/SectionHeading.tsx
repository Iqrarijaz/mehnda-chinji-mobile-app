import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { Layout } from '@/constants/layout';

interface SectionHeadingProps {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    /** Optional trailing pill, e.g. "4 Stops" or "Tap to call". */
    pill?: string;
}

/**
 * Uppercase section heading with a secondary-accent icon, shared by all
 * category detail sections.
 */
export const SectionHeading = React.memo(({ icon, label, pill }: SectionHeadingProps) => {
    const { theme } = useTheme();
    const colors = Colors[theme];

    return (
        <View style={styles.row}>
            <Ionicons name={icon} size={12} color={colors.secondary} />
            <ThemedText style={[styles.label, { color: colors.textSecondary }]}>
                {label}
            </ThemedText>
            {pill ? (
                <View style={[styles.pill, { backgroundColor: `${colors.lime}22` }]}>
                    <ThemedText style={[styles.pillText, { color: colors.primary }]}>
                        {pill}
                    </ThemedText>
                </View>
            ) : null}
        </View>
    );
});

SectionHeading.displayName = 'SectionHeading';

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5 },
    label: {
        fontSize: 10,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.8 },
    pill: {
        marginLeft: 'auto',
        paddingHorizontal: 9,
        paddingVertical: 3,
        borderRadius: Layout.borderRadius },
    pillText: {
        fontSize: 9.5,
        fontWeight: '800',
        letterSpacing: 0.3,
        textTransform: 'uppercase' } });
