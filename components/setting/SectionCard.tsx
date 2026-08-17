import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/context/ThemeContext';
import { ThemedText } from '@/components/ThemedText';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';

interface SectionCardProps {
    title?: string;
    children: React.ReactNode;
    delay?: number;
}

export const SectionCard: React.FC<SectionCardProps> = React.memo(({ title, children, delay = 0 }) => {
    const { theme } = useTheme();
    const colors = Colors[theme];

    return (
        <View style={[styles.sectionCard, { backgroundColor: colors.card }]}>
            {title ? <ThemedText style={[styles.sectionTitle, { color: colors.textSecondary }]}>{title}</ThemedText> : null}
            {children}
        </View>
    );
});

const styles = StyleSheet.create({
    sectionCard: {
        borderRadius: Layout.borderRadius,
        padding: Platform.OS === 'android' ? 0 : 4,
        marginBottom: Platform.OS === 'android' ? 12 : 16 },
    sectionTitle: {
        fontSize: 11.5,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginLeft: Platform.OS === 'android' ? 12 : 16,
        marginTop: Platform.OS === 'android' ? 10 : 14,
        marginBottom: 6 } });
