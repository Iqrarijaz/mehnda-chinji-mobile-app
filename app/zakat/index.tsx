import React, { useState, useMemo, useCallback } from 'react';
import { StyleSheet, View, ScrollView, TextInput } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themedText';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';

// Import refactored components
import { ZakatHeader } from '@/components/zakat/ZakatHeader';
import { ZakatResultCard } from '@/components/zakat/ZakatResultCard';
import { ZakatInputField } from '@/components/zakat/ZakatInputField';

const ACCENT = '#059669'; // Emerald green

export default function ZakatCalculatorScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { theme } = useTheme();
    const colors = Colors[theme];

    // Inputs state
    const [cash, setCash] = useState('');
    const [goldSilver, setGoldSilver] = useState('');
    const [investments, setInvestments] = useState('');
    const [receivables, setReceivables] = useState('');
    const [debts, setDebts] = useState('');
    const [nisab, setNisab] = useState('120000'); // Default Nisab value

    // Parse input values helper
    const parseVal = useCallback((val: string) => {
        const num = parseFloat(val);
        return isNaN(num) || num < 0 ? 0 : num;
    }, []);

    // Calculate Zakat details in real-time
    const calculation = useMemo(() => {
        const totalCash = parseVal(cash);
        const totalGoldSilver = parseVal(goldSilver);
        const totalInvestments = parseVal(investments);
        const totalReceivables = parseVal(receivables);
        const totalDebts = parseVal(debts);
        const currentNisab = parseVal(nisab);

        const totalAssets = totalCash + totalGoldSilver + totalInvestments + totalReceivables;
        const netWealth = Math.max(totalAssets - totalDebts, 0);
        const isEligible = netWealth >= currentNisab;
        const zakatDue = isEligible ? netWealth * 0.025 : 0;

        return {
            totalAssets,
            netWealth,
            zakatDue,
            isEligible
        };
    }, [cash, goldSilver, investments, receivables, debts, nisab, parseVal]);

    const handleBack = useCallback(() => {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace('/');
        }
    }, [router]);

    const handleReset = useCallback(() => {
        setCash('');
        setGoldSilver('');
        setInvestments('');
        setReceivables('');
        setDebts('');
    }, []);

    // Format currency numbers nicely
    const formatCurrency = useCallback((val: number) => {
        return val.toLocaleString(undefined, { maximumFractionDigits: 0 });
    }, []);

    return (
        <View style={[styles.root, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header Component */}
            <ZakatHeader 
                insetsTop={insets.top} 
                colors={colors} 
                onBack={handleBack} 
                onReset={handleReset} 
            />

            <ScrollView 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
            >
                {/* Result Card Component */}
                <ZakatResultCard 
                    colors={colors}
                    accentColor={ACCENT}
                    isEligible={calculation.isEligible}
                    zakatDue={calculation.zakatDue}
                    totalAssets={calculation.totalAssets}
                    netWealth={calculation.netWealth}
                    formatCurrency={formatCurrency}
                />

                {/* Nisab Setting */}
                <ThemedText style={[styles.sectionLabel, { color: colors.textSecondary }]}>NISAB THRESHOLD</ThemedText>
                <View style={[styles.cardInputRow, { backgroundColor: colors.card }]}>
                    <Ionicons name="options-outline" size={18} color={colors.textSecondary} style={{ marginRight: 10 }} />
                    <TextInput
                        value={nisab}
                        onChangeText={setNisab}
                        keyboardType="numeric"
                        placeholder="Nisab threshold value..."
                        placeholderTextColor={colors.textSecondary}
                        style={[styles.input, { color: colors.text }]}
                    />
                </View>
                <ThemedText style={styles.hintText}>
                    Enter the current market value of 87.48g of gold or 612.36g of silver in your local currency.
                </ThemedText>

                {/* Asset Inputs */}
                <ThemedText style={[styles.sectionLabel, { color: colors.textSecondary }]}>ASSETS & SAVINGS</ThemedText>
                
                <View style={[styles.inputGroup, { backgroundColor: colors.card }]}>
                    <ZakatInputField 
                        label="Cash & Bank Savings"
                        value={cash}
                        onChangeText={setCash}
                        colors={colors}
                    />

                    <ZakatInputField 
                        label="Value of Gold & Silver Owned"
                        value={goldSilver}
                        onChangeText={setGoldSilver}
                        colors={colors}
                    />

                    <ZakatInputField 
                        label="Value of Stocks, Funds & Business Assets"
                        value={investments}
                        onChangeText={setInvestments}
                        colors={colors}
                    />

                    <ZakatInputField 
                        label="Money Owed to You (Receivables)"
                        value={receivables}
                        onChangeText={setReceivables}
                        colors={colors}
                    />
                </View>

                {/* Liabilities */}
                <View style={{ height: 10 }} />
                <ThemedText style={[styles.sectionLabel, { color: colors.textSecondary }]}>LIABILITIES & DEBTS</ThemedText>
                <View style={[styles.inputGroup, { backgroundColor: colors.card }]}>
                    <ZakatInputField 
                        label="Immediate Debts & Bills Due"
                        value={debts}
                        onChangeText={setDebts}
                        colors={colors}
                    />
                </View>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
    },
    scroll: {
        paddingHorizontal: 20,
        paddingTop: 16,
    },
    sectionLabel: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 1,
        marginBottom: 8,
        marginTop: 10,
    },
    cardInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 44,
        borderRadius: 12,
        paddingHorizontal: 12,
    },
    input: {
        flex: 1,
        fontSize: 14,
        fontWeight: '600',
    },
    hintText: {
        fontSize: 11,
        color: '#888',
        marginTop: 6,
        marginBottom: 16,
        paddingHorizontal: 2,
        lineHeight: 14,
    },
    inputGroup: {
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
});
