import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';

interface MonthSelectorProps {
    colors: any;
    accentColor: string;
    gregorianLabel: string;
    hijriLabel: string;
    onPrev: () => void;
    onNext: () => void;
}

export const MonthSelector = React.memo(({
    colors,
    accentColor,
    gregorianLabel,
    hijriLabel,
    onPrev,
    onNext
}: MonthSelectorProps) => (
    <View style={[styles.selectorContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <TouchableOpacity
            activeOpacity={0.7}
            onPress={onPrev}
            style={[styles.arrowBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
        >
            <Ionicons name="chevron-back" size={18} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.monthLabelWrapper}>
            <ThemedText style={styles.gregorianLabel}>{gregorianLabel}</ThemedText>
            {hijriLabel ? (
                <ThemedText style={[styles.hijriLabel, { color: accentColor }]}>
                    {hijriLabel}
                </ThemedText>
            ) : null}
        </View>

        <TouchableOpacity
            activeOpacity={0.7}
            onPress={onNext}
            style={[styles.arrowBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
        >
            <Ionicons name="chevron-forward" size={18} color={colors.text} />
        </TouchableOpacity>
    </View>
));

MonthSelector.displayName = 'MonthSelector';

const styles = StyleSheet.create({
    selectorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginHorizontal: 20,
        marginTop: 20,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 16,
    },
    arrowBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    monthLabelWrapper: {
        alignItems: 'center',
        flex: 1,
        paddingHorizontal: 8,
    },
    gregorianLabel: {
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: -0.2,
    },
    hijriLabel: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.5,
        marginTop: 2,
        textTransform: 'uppercase',
    },
});
