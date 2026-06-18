import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/themedText';

interface DhikrChipProps {
    roman: string;
    isActive: boolean;
    accentColor: string;
    cardColor: string;
    textColor: string;
    onPress: () => void;
}

export const DhikrChip = React.memo(({
    roman,
    isActive,
    accentColor,
    cardColor,
    textColor,
    onPress,
}: DhikrChipProps) => (
    <TouchableOpacity
        onPress={onPress}
        style={[
            styles.chip,
            {
                backgroundColor: isActive ? accentColor : cardColor,
            }
        ]}
    >
        <ThemedText style={[styles.chipText, { color: isActive ? '#fff' : textColor }]}>
            {roman}
        </ThemedText>
    </TouchableOpacity>
));

DhikrChip.displayName = 'DhikrChip';

const styles = StyleSheet.create({
    chip: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
    },
    chipText: {
        fontSize: 13,
        fontWeight: '600',
    },
});
