import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { getCurrencyFlagUrl, getCurrencyMeta } from '@/constants/currencies';
import { useTheme } from '@/context/ThemeContext';

interface CurrencyRowProps {
    code: string;
    /** 1 PKR expressed in this currency, as returned by the backend. */
    rate: number;
    onPress: () => void;
}

function formatRate(value: number) {
    return value.toLocaleString('en-US', {
        maximumFractionDigits: value >= 100 ? 0 : 2,
        minimumFractionDigits: 0,
    });
}

export const CurrencyRow = React.memo(function CurrencyRow({ code, rate, onPress }: CurrencyRowProps) {
    const { theme } = useTheme();
    const colors = Colors[theme];
    const meta = getCurrencyMeta(code);
    const flagUrl = getCurrencyFlagUrl(code);
    const isBaseCurrency = code === 'PKR';
    // rate = how many units of `code` equal 1 PKR; flip it so we can show
    // the far more useful "1 <code> = X PKR" for a Pakistan-based audience.
    const pkrPerUnit = isBaseCurrency ? 1 : rate > 0 ? 1 / rate : 0;

    return (
        <TouchableOpacity
            activeOpacity={0.7}
            onPress={onPress}
            style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
            {flagUrl ? (
                <Image source={{ uri: flagUrl }} style={styles.flag} contentFit="cover" transition={150} />
            ) : (
                <View style={[styles.flag, styles.flagFallback, { backgroundColor: colors.cardBg }]}>
                    <Ionicons name="globe-outline" size={18} color={colors.icon} />
                </View>
            )}

            <View style={styles.textWrap}>
                <ThemedText style={styles.code}>{code}</ThemedText>
                <ThemedText style={[styles.name, { color: colors.textSecondary }]} numberOfLines={1}>
                    {meta.name}
                </ThemedText>
            </View>

            <View style={styles.rateWrap}>
                {isBaseCurrency ? (
                    <View style={[styles.baseBadge, { backgroundColor: colors.primary + '18' }]}>
                        <ThemedText style={[styles.baseBadgeText, { color: colors.primary }]}>Base</ThemedText>
                    </View>
                ) : (
                    <>
                        <ThemedText style={styles.rateValue}>{formatRate(pkrPerUnit)} PKR</ThemedText>
                        <ThemedText style={[styles.ratePer, { color: colors.textSecondary }]}>per 1 {code}</ThemedText>
                    </>
                )}
            </View>

            {!isBaseCurrency && (
                <Ionicons name="stats-chart-outline" size={16} color={colors.icon} style={styles.trendIcon} />
            )}
        </TouchableOpacity>
    );
});

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: Layout.borderRadius,
        borderWidth: 1,
        paddingVertical: 12,
        paddingHorizontal: 14,
        marginHorizontal: 20,
        marginBottom: 10,
        minHeight: 44,
    },
    flag: {
        width: 38,
        height: 38,
        borderRadius: 19,
        marginRight: 12,
    },
    flagFallback: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    textWrap: {
        flex: 1,
        marginRight: 8,
    },
    code: {
        fontSize: 15,
        fontWeight: '700',
    },
    name: {
        fontSize: 12,
        fontWeight: '400',
        marginTop: 2,
    },
    rateWrap: {
        alignItems: 'flex-end',
        marginRight: 10,
    },
    rateValue: {
        fontSize: 14,
        fontWeight: '700',
    },
    ratePer: {
        fontSize: 11,
        fontWeight: '400',
        marginTop: 2,
    },
    baseBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    baseBadgeText: {
        fontSize: 11,
        fontWeight: '700',
    },
    trendIcon: {
        marginLeft: 2,
    },
});
