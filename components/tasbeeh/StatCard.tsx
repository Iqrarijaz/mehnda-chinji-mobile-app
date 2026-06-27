import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';

interface StatCardProps {
    iconName: React.ComponentProps<typeof Ionicons>['name'];
    value: string | number;
    label: string;
    accentColor: string;
    cardColor: string;
    textSecondaryColor: string;
}

export const StatCard = React.memo(({
    iconName,
    value,
    label,
    accentColor,
    cardColor,
    textSecondaryColor,
}: StatCardProps) => (
    <View style={[styles.statCard, { backgroundColor: cardColor }]}>
        <Ionicons name={iconName as any} size={18} color={accentColor} />
        <ThemedText style={styles.statNum}>{value}</ThemedText>
        <ThemedText style={[styles.statLabel, { color: textSecondaryColor }]}>
            {label}
        </ThemedText>
    </View>
));

StatCard.displayName = 'StatCard';

const styles = StyleSheet.create({
    statCard: {
        flex: 1,
        borderRadius: 14,
        paddingVertical: 14,
        alignItems: 'center',
        gap: 4,
    },
    statNum: {
        fontSize: 20,
        fontWeight: '700',
    },
    statLabel: {
        fontSize: 10,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
});
