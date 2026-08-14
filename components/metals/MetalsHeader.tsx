import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton } from '@/components/common/BackButton';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/context/ThemeContext';

interface MetalsHeaderProps {
    lastUpdatedLabel: string | null;
}

/**
 * Custom hero header for the Metals & Gold screen — mirrors CurrencyHeader's
 * primary-colored rounded-bottom band so the two "rates" screens read as a
 * matched pair, with a secondary-tinted "24K" badge as this screen's own accent.
 */
export function MetalsHeader({ lastUpdatedLabel }: MetalsHeaderProps) {
    const insets = useSafeAreaInsets();
    const { theme } = useTheme();
    const colors = Colors[theme];

    return (
        <View style={[styles.header, { paddingTop: insets.top + 14, backgroundColor: colors.primary }]}>
            <View style={styles.topRow}>
                <BackButton backgroundColor="rgba(255,255,255,0.18)" color="#FFFFFF" size={20} />
                <View style={styles.titleWrap}>
                    <View style={styles.titleRow}>
                        <ThemedText style={styles.title}>Metals & Gold</ThemedText>
                        <View style={[styles.badge, { backgroundColor: colors.secondary }]}>
                            <ThemedText style={styles.badgeText}>24K SPOT</ThemedText>
                        </View>
                    </View>
                    <ThemedText style={styles.subtitle} numberOfLines={1}>
                        {lastUpdatedLabel ? `Updated ${lastUpdatedLabel} · per gram in PKR` : 'Fetching latest rates…'}
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
    badge: {
        paddingHorizontal: 7,
        paddingVertical: 2,
        borderRadius: 10,
    },
    badgeText: {
        fontSize: 8.5,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 0.3,
    },
    subtitle: {
        fontSize: 11,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.85)',
        marginTop: 3,
    },
});
