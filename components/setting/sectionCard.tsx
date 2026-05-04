import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/context/ThemeContext';
import { ThemedText } from '@/components/themedText';
import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import Animated, { SlideInLeft } from 'react-native-reanimated';

interface SectionCardProps {
    title?: string;
    children: React.ReactNode;
    delay?: number;
}

export const SectionCard: React.FC<SectionCardProps> = ({ title, children, delay = 0 }) => {
    const { theme } = useTheme();
    const colors = Colors[theme];

    return (
        <Animated.View entering={SlideInLeft.delay(delay).duration(450)} style={[styles.sectionCard, { backgroundColor: colors.card }]}>
            {title ? <ThemedText style={[styles.sectionTitle, { color: colors.textSecondary }]}>{title}</ThemedText> : null}
            {children}
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    sectionCard: {
        borderRadius: Layout.borderRadius,
        padding: Platform.OS === 'android' ? 0 : 4,
        marginBottom: Platform.OS === 'android' ? 12 : 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginLeft: Platform.OS === 'android' ? 12 : 16,
        marginTop: Platform.OS === 'android' ? 10 : 14,
        marginBottom: 6,
    },
});
