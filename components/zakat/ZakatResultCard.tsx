import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';

interface ZakatResultCardProps {
    colors: any;
    accentColor: string;
    isEligible: boolean;
    zakatDue: number;
    totalAssets: number;
    netWealth: number;
    formatCurrency: (val: number) => string;
}

export const ZakatResultCard = React.memo(({
    colors,
    accentColor,
    isEligible,
    zakatDue,
    totalAssets,
    netWealth,
    formatCurrency
}: ZakatResultCardProps) => (
    <View style={[styles.resultCard, { backgroundColor: colors.card }]}>
        <ThemedText style={[styles.resultLabel, { color: colors.textSecondary }]}>
            {isEligible ? 'ZAKAT PAYABLE (2.5%)' : 'NET WEALTH BELOW NISAB'}
        </ThemedText>
        <ThemedText style={[styles.resultAmount, { color: isEligible ? accentColor : colors.text }]}>
            {isEligible ? `${formatCurrency(zakatDue)}` : '0'}
        </ThemedText>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.resultDetails}>
            <View style={styles.detailRow}>
                <ThemedText style={{ fontSize: 13, color: colors.textSecondary }}>Total Assets:</ThemedText>
                <ThemedText style={{ fontSize: 13, fontWeight: '600' }}>{formatCurrency(totalAssets)}</ThemedText>
            </View>
            <View style={styles.detailRow}>
                <ThemedText style={{ fontSize: 13, color: colors.textSecondary }}>Net Wealth:</ThemedText>
                <ThemedText style={{ fontSize: 13, fontWeight: '600' }}>{formatCurrency(netWealth)}</ThemedText>
            </View>
        </View>
    </View>
));

ZakatResultCard.displayName = 'ZakatResultCard';

const styles = StyleSheet.create({
    resultCard: {
        borderRadius: 16,
        padding: 18,
        alignItems: 'center',
        marginBottom: 20,
    },
    resultLabel: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 1,
    },
    resultAmount: {
        fontSize: 34,
        fontWeight: 'bold',
        marginVertical: 10,
    },
    divider: {
        width: '100%',
        height: 1,
        marginVertical: 12,
    },
    resultDetails: {
        width: '100%',
        gap: 6,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
});
