import { ThemedText } from '@/components/themedText';
import React from 'react';
import { StyleSheet } from 'react-native';
import Animated, { SlideInLeft } from 'react-native-reanimated';

interface SectionCardProps {
    title?: string;
    children: React.ReactNode;
    delay?: number;
}

export const SectionCard: React.FC<SectionCardProps> = ({ title, children, delay = 0 }) => (
    <Animated.View entering={SlideInLeft.delay(delay).duration(450)} style={styles.sectionCard}>
        {title ? <ThemedText style={styles.sectionTitle}>{title}</ThemedText> : null}
        {children}
    </Animated.View>
);

const styles = StyleSheet.create({
    sectionCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 4,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#94A3B8',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginLeft: 16,
        marginTop: 14,
        marginBottom: 6,
    },
});
