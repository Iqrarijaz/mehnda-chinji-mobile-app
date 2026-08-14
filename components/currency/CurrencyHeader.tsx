import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton } from '@/components/common/BackButton';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/context/ThemeContext';

interface CurrencyHeaderProps {
    lastUpdatedLabel: string | null;
    currencyCount?: number;
    isUnlocked: boolean;
}

/**
 * Custom hero header for the Currency Exchange screen — primary-colored
 * rounded-bottom band, same visual language as the Manage Cities / ticket
 * screens — replacing the plain card-background header the screen
 * launched with.
 */
export function CurrencyHeader({ lastUpdatedLabel, currencyCount, isUnlocked }: CurrencyHeaderProps) {
    const insets = useSafeAreaInsets();
    const { theme } = useTheme();
    const colors = Colors[theme];

    return (
        <View style={[styles.header, { paddingTop: insets.top + 14, backgroundColor: colors.primary }]}>
            <View style={styles.topRow}>
                <BackButton backgroundColor="rgba(255,255,255,0.18)" color="#FFFFFF" size={20} />
                <View style={styles.titleWrap}>
                    <View style={styles.titleRow}>
                        <ThemedText style={styles.title}>Currency Exchange</ThemedText>
                        {isUnlocked && (
                            <View style={[styles.livePill, { backgroundColor: colors.lime }]}>
                                <ThemedText style={styles.livePillText}>ALL UNLOCKED</ThemedText>
                            </View>
                        )}
                    </View>
                    <ThemedText style={styles.subtitle} numberOfLines={1}>
                        {lastUpdatedLabel
                            ? `Updated ${lastUpdatedLabel}${currencyCount ? ` · ${currencyCount} currencies` : ''}`
                            : 'Fetching latest rates…'}
                    </ThemedText>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        paddingHorizontal: 16,
        paddingBottom: 18,
        borderBottomLeftRadius: Layout.headerBorderRadius,
        borderBottomRightRadius: Layout.headerBorderRadius,
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    titleWrap: {
        flex: 1,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flexWrap: 'wrap',
    },
    title: {
        fontSize: 17,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    livePill: {
        paddingHorizontal: 7,
        paddingVertical: 2,
        borderRadius: 10,
    },
    livePillText: {
        fontSize: 8.5,
        fontWeight: '800',
        color: '#1E293B',
        letterSpacing: 0.3,
    },
    subtitle: {
        fontSize: 11,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.85)',
        marginTop: 3,
    },
});
