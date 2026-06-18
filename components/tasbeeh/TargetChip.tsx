import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/themedText';

interface TargetChipProps {
    value: number;
    isActive: boolean;
    accentColor: string;
    cardColor: string;
    textColor: string;
    onPress: () => void;
}

export const TargetChip = React.memo(({
    value,
    isActive,
    accentColor,
    cardColor,
    textColor,
    onPress,
}: TargetChipProps) => (
    <TouchableOpacity
        onPress={onPress}
        style={[
            styles.targetChip,
            {
                backgroundColor: isActive ? accentColor : cardColor,
            }
        ]}
    >
        <ThemedText style={[styles.targetChipText, { color: isActive ? '#fff' : textColor }]}>
            {value === 0 ? '∞' : value}
        </ThemedText>
    </TouchableOpacity>
));

TargetChip.displayName = 'TargetChip';

const styles = StyleSheet.create({
    targetChip: {
        flex: 1,
        height: 42,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    targetChipText: {
        fontSize: 15,
        fontWeight: '700',
    },
});
