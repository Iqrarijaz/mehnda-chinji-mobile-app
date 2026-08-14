import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useMemo } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
import { getCurrencyFlagUrl } from '@/constants/currencies';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/context/ThemeContext';
import { useExchangeRates } from '@/hooks/useCurrency';
import { useFavoriteCurrencies } from '@/store/currencyStore';

interface HomeHeaderCurrencyWidgetProps {
    onPress?: () => void;
}

// Shown until the user pins their own favorites.
const DEFAULT_CODES = ['USD', 'AED', 'SAR', 'MYR'];

function formatRate(value: number) {
    return value.toLocaleString('en-US', { maximumFractionDigits: value >= 100 ? 0 : 2 });
}

/**
 * Compact currency-rates card in the Home header — mirrors
 * HomeHeaderWeatherWidget's translucent-card language. Shows the user's
 * pinned favorites (or a sensible default set) with their PKR rate; tapping
 * the whole card opens the full Currency screen.
 */
const HomeHeaderCurrencyWidget = React.memo(({ onPress }: HomeHeaderCurrencyWidgetProps) => {
    const { theme } = useTheme();
    const colors = Colors[theme];
    const favorites = useFavoriteCurrencies();
    const { ratesData, isRatesLoading } = useExchangeRates(false);

    const codes = favorites.length > 0 ? favorites : DEFAULT_CODES;

    const rows = useMemo(() => {
        if (!ratesData?.rates) return [];
        return codes
            .map((code) => {
                const rate = ratesData.rates[code];
                if (typeof rate !== 'number' || rate <= 0) return null;
                return { code, pkrPerUnit: 1 / rate };
            })
            .filter((r): r is NonNullable<typeof r> => !!r)
            .slice(0, 4);
    }, [codes, ratesData]);

    if (isRatesLoading || rows.length === 0) return null;

    return (
        <TouchableOpacity
            activeOpacity={0.85}
            onPress={onPress}
            style={[styles.card, { backgroundColor: colors.primary }]}
        >
            <View style={styles.headerRow}>
                <View style={styles.headerLeft}>
                    <Ionicons name="cash-outline" size={13} color="rgba(255,255,255,0.85)" />
                    <ThemedText style={styles.headerLabel}>
                        {favorites.length > 0 ? 'YOUR RATES' : 'CURRENCY RATES'}
                    </ThemedText>
                </View>
                <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.7)" />
            </View>

            <View style={styles.row}>
                {rows.map(({ code, pkrPerUnit }) => {
                    const flagUrl = getCurrencyFlagUrl(code);
                    return (
                        <View key={code} style={styles.chip}>
                            {flagUrl ? (
                                <Image source={{ uri: flagUrl }} style={styles.flag} contentFit="cover" />
                            ) : (
                                <View style={[styles.flag, styles.flagFallback]}>
                                    <ThemedText style={styles.flagFallbackText}>{code.slice(0, 2)}</ThemedText>
                                </View>
                            )}
                            <ThemedText style={styles.chipCode}>{code}</ThemedText>
                            <ThemedText style={styles.chipRate} numberOfLines={1}>
                                {formatRate(pkrPerUnit)}
                            </ThemedText>
                        </View>
                    );
                })}
            </View>
        </TouchableOpacity>
    );
});

HomeHeaderCurrencyWidget.displayName = 'HomeHeaderCurrencyWidget';
export default HomeHeaderCurrencyWidget;

const styles = StyleSheet.create({
    card: {
        borderRadius: Layout.borderRadius,
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.18)',
        marginTop: 10,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    headerLabel: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.5,
        color: 'rgba(255,255,255,0.85)',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    chip: {
        alignItems: 'center',
        flex: 1,
    },
    flag: {
        width: 20,
        height: 20,
        borderRadius: 10,
        marginBottom: 4,
    },
    flagFallback: {
        backgroundColor: 'rgba(255,255,255,0.18)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    flagFallbackText: {
        fontSize: 8,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    chipCode: {
        fontSize: 11,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    chipRate: {
        fontSize: 10,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.75)',
        marginTop: 1,
    },
});
