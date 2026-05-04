import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Layout } from '@/constants/layout';

import { ThemedText } from '@/components/themedText';

interface SectionHeaderProps {
    title: string;
    icon: keyof typeof Ionicons.glyphMap;
}

export const SectionHeader: React.FC<SectionHeaderProps> = React.memo(({ title, icon }) => (
    <View style={styles.sectionHeader}>
        <View style={[styles.headerIconBox, { backgroundColor: '#004030' + '15' }]}>
            <Ionicons name={icon} size={18} color="#004030" />
        </View>
        <ThemedText style={styles.sectionTitle}>{title}</ThemedText>
    </View>
));

const styles = StyleSheet.create({
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
        marginTop: 10,
    },
    headerIconBox: {
        width: 32,
        height: 32,
        borderRadius: Layout.borderRadius,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '800',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
        opacity: 0.7,
    },
});
