import { Ionicons } from '@expo/vector-icons';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { Image } from 'expo-image';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
import { getCurrencyFlagUrl } from '@/constants/currencies';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/context/ThemeContext';
import { CurrencyPickerSheet } from './CurrencyPickerSheet';

interface CurrencyConverterProps {
    /** 1 PKR expressed in each currency, as returned by the backend — undefined while loading. */
    rates: Record<string, number> | undefined;
    /** Non-PKR codes currently available to convert (respects the free/unlocked tier). */
    codes: string[];
    favorites: string[];
}

const DEFAULT_CODE_PRIORITY = ['USD', 'AED', 'SAR', 'MYR'];

function formatAmount(value: number): string {
    if (!Number.isFinite(value)) return '0';
    return value.toLocaleString('en-US', {
        maximumFractionDigits: value >= 1000 ? 0 : 2,
        minimumFractionDigits: 0,
    });
}

/**
 * Quick "amount in X = ? PKR (and vice-versa)" calculator pinned to the top
 * of the Currency screen. Uses the already-fetched rates in memory — no
 * extra network calls.
 */
export function CurrencyConverter({ rates, codes, favorites }: CurrencyConverterProps) {
    const { theme } = useTheme();
    const colors = Colors[theme];
    const pickerRef = useRef<BottomSheetModal>(null);

    const defaultCode = useMemo(() => {
        const favNonPkr = favorites.find((c) => c !== 'PKR' && codes.includes(c));
        if (favNonPkr) return favNonPkr;
        const priority = DEFAULT_CODE_PRIORITY.find((c) => codes.includes(c));
        return priority ?? codes[0];
    }, [codes, favorites]);

    const [selectedCode, setSelectedCode] = useState(defaultCode);
    const [direction, setDirection] = useState<'toPKR' | 'fromPKR'>('toPKR');
    const [amount, setAmount] = useState('1');

    // Keep the selection valid if the available list changes (e.g. the unlock ad just expired).
    useEffect(() => {
        if (defaultCode && !codes.includes(selectedCode)) setSelectedCode(defaultCode);
    }, [codes, defaultCode, selectedCode]);

    const rate = selectedCode ? rates?.[selectedCode] : undefined; // 1 PKR = `rate` units of selectedCode

    const { currencyValue, pkrValue } = useMemo(() => {
        const parsed = parseFloat(amount);
        const n = Number.isFinite(parsed) ? parsed : 0;
        if (!rate || rate <= 0) return { currencyValue: 0, pkrValue: 0 };
        return direction === 'toPKR'
            ? { currencyValue: n, pkrValue: n / rate }
            : { currencyValue: n * rate, pkrValue: n };
    }, [amount, direction, rate]);

    const handleSwap = useCallback(() => {
        setDirection((d) => (d === 'toPKR' ? 'fromPKR' : 'toPKR'));
    }, []);

    if (!selectedCode || !rate) return null; // nothing sensible to convert yet (still loading)

    const flagUrl = getCurrencyFlagUrl(selectedCode);

    return (
        <View style={[styles.card, { backgroundColor: colors.cardBg }]}>
            <View style={styles.headerRow}>
                <Ionicons name="calculator-outline" size={14} color={colors.primary} />
                <ThemedText style={[styles.headerLabel, { color: colors.textSecondary }]}>QUICK CONVERT</ThemedText>
            </View>

            <View style={styles.inputRow}>
                <TouchableOpacity
                    style={[styles.currencyChip, { backgroundColor: colors.primary + '12' }]}
                    onPress={() => pickerRef.current?.present()}
                    activeOpacity={0.75}
                >
                    {flagUrl ? (
                        <Image source={{ uri: flagUrl }} style={styles.flagImage} contentFit="cover" />
                    ) : (
                        <Ionicons name="globe-outline" size={14} color={colors.primary} />
                    )}
                    <ThemedText style={[styles.chipCode, { color: colors.primary }]}>{selectedCode}</ThemedText>
                    <Ionicons name="chevron-down" size={12} color={colors.primary} />
                </TouchableOpacity>

                {direction === 'toPKR' ? (
                    <TextInput
                        value={amount}
                        onChangeText={setAmount}
                        keyboardType="decimal-pad"
                        style={[styles.input, { color: colors.text }]}
                        placeholder="0"
                        placeholderTextColor={colors.textSecondary}
                        allowFontScaling={false}
                    />
                ) : (
                    <ThemedText style={styles.computedValue} numberOfLines={1}>
                        {formatAmount(currencyValue)}
                    </ThemedText>
                )}
            </View>

            <View style={styles.swapRow}>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <TouchableOpacity
                    onPress={handleSwap}
                    style={[styles.swapButton, { backgroundColor: colors.primary }]}
                    activeOpacity={0.8}
                    hitSlop={6}
                >
                    <Ionicons name="swap-vertical" size={16} color="#FFFFFF" />
                </TouchableOpacity>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
            </View>

            <View style={styles.inputRow}>
                <View style={[styles.currencyChip, { backgroundColor: colors.secondary + '18' }]}>
                    <ThemedText style={[styles.chipCode, { color: colors.secondary }]}>PKR</ThemedText>
                </View>

                {direction === 'fromPKR' ? (
                    <TextInput
                        value={amount}
                        onChangeText={setAmount}
                        keyboardType="decimal-pad"
                        style={[styles.input, { color: colors.text }]}
                        placeholder="0"
                        placeholderTextColor={colors.textSecondary}
                        allowFontScaling={false}
                    />
                ) : (
                    <ThemedText style={styles.computedValue} numberOfLines={1}>
                        {formatAmount(pkrValue)}
                    </ThemedText>
                )}
            </View>

            <CurrencyPickerSheet
                ref={pickerRef}
                codes={codes}
                favorites={favorites}
                excludeCode="PKR"
                onSelect={setSelectedCode}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: Layout.cardBorderRadius,
        paddingHorizontal: 14,
        paddingTop: 8,
        paddingBottom: 16,
        marginHorizontal: 20,
        marginTop: 14,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 10,
    },
    headerLabel: {
        fontSize: 10.5,
        fontWeight: '800',
        letterSpacing: 0.7,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    currencyChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 10,
        marginRight: 12,
        minWidth: 88,
    },
    flagImage: {
        width: 16,
        height: 16,
        borderRadius: 3,
    },
    chipCode: {
        fontSize: 13,
        fontWeight: '800',
    },
    input: {
        flex: 1,
        fontSize: 20,
        fontWeight: '700',
        padding: 0,
        textAlign: 'right',
    },
    computedValue: {
        flex: 1,
        fontSize: 20,
        fontWeight: '700',
        textAlign: 'right',
    },
    swapRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 10,
    },
    divider: {
        flex: 1,
        height: StyleSheet.hairlineWidth,
    },
    swapButton: {
        width: 30,
        height: 30,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 10,
    },
});
