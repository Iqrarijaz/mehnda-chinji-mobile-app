import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton } from '@/components/common/BackButton';
import { SearchBar } from '@/components/common/SearchBar';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/context/ThemeContext';

interface CurrencyHeaderProps {
    lastUpdatedLabel: string | null;
    currencyCount?: number;
    isUnlocked: boolean;
    searchQuery: string;
    onSearchChange: (text: string) => void;
    /** True when the device has no connectivity — rates shown are the last cached fetch. */
    isOffline?: boolean;
}

/**
 * Custom hero header for the Currency Exchange screen — primary-colored
 * rounded-bottom band with integrated SearchBar input.
 */
export const CurrencyHeader = React.memo(function CurrencyHeader({
    lastUpdatedLabel,
    currencyCount,
    isUnlocked,
    searchQuery,
    onSearchChange,
    isOffline,
}: CurrencyHeaderProps) {
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
                        {isOffline && (
                            <View style={styles.offlinePill}>
                                <Ionicons name="cloud-offline-outline" size={9} color="#FFFFFF" />
                                <ThemedText style={styles.offlinePillText}>OFFLINE</ThemedText>
                            </View>
                        )}
                    </View>
                    <ThemedText style={styles.subtitle} numberOfLines={1}>
                        {lastUpdatedLabel
                            ? `${isOffline ? 'Last known' : 'Updated'} ${lastUpdatedLabel}${currencyCount ? ` · ${currencyCount} currencies` : ''}`
                            : 'Fetching latest rates…'}
                    </ThemedText>
                </View>
            </View>

            <View style={styles.searchRow}>
                <SearchBar
                    value={searchQuery}
                    onChangeText={onSearchChange}
                    placeholder="Search country, symbol, code (e.g. $, USA, USD)"
                    style={[styles.searchBar, { backgroundColor: theme === 'dark' ? colors.cardBg : '#FFFFFF' }]}
                />
            </View>
        </View>
    );
});

const styles = StyleSheet.create({
    header: {
        paddingHorizontal: 16,
        paddingBottom: 8,
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
    offlinePill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        paddingHorizontal: 7,
        paddingVertical: 2,
        borderRadius: 10,
        backgroundColor: 'rgba(0,0,0,0.22)',
    },
    offlinePillText: {
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
    searchRow: {
        marginTop: 14,
        height: 44,
    },
    searchBar: {
        height: 44,
    },
});
