import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { PressableScale } from '@/components/essentials/shared/PressableScale';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { getCurrencyFlagUrl, getCurrencyMeta } from '@/constants/currencies';
import { useTheme } from '@/context/ThemeContext';

interface CurrencyRowProps {
    code: string;
    /** 1 unit of `baseCode` expressed in this currency. */
    rate: number;
    /** Currency the whole list is currently shown relative to (defaults to PKR). */
    baseCode: string;
    onPress: () => void;
    /** Star/pin toggle — omitted (no star shown) for the base currency, which can't be pinned. */
    isFavorite?: boolean;
    onToggleFavorite?: () => void;
}

const TILE_SIZE = 46;

function formatRate(value: number) {
    return value.toLocaleString('en-US', {
        maximumFractionDigits: value >= 100 ? 0 : 2,
        minimumFractionDigits: 0,
    });
}

export const CurrencyRow = React.memo(function CurrencyRow({ code, rate, baseCode, onPress, isFavorite, onToggleFavorite }: CurrencyRowProps) {
    const { theme } = useTheme();
    const colors = Colors[theme];
    const meta = getCurrencyMeta(code);
    const flagUrl = getCurrencyFlagUrl(code);
    const isBaseCurrency = code === baseCode;
    // rate = how many units of `code` equal 1 unit of `baseCode`; flip it so
    // we can show the far more useful "1 <code> = X <baseCode>".
    const basePerUnit = isBaseCurrency ? 1 : rate > 0 ? 1 / rate : 0;

    return (
        <PressableScale intensity={0.02} onPress={onPress} containerStyle={styles.pressWrap}>
            <View style={[styles.row, { backgroundColor: colors.cardBg }]}>
                {/* Flag tile — a framed rounded-square, not a bare circular thumbnail */}
                <View style={[styles.flagTile, { backgroundColor: colors.primary + '12' }]}>
                    {flagUrl ? (
                        <Image source={{ uri: flagUrl }} style={styles.flagImage} contentFit="cover" transition={150} />
                    ) : (
                        <ThemedText style={[styles.flagFallbackText, { color: colors.primary }]}>{code.slice(0, 2)}</ThemedText>
                    )}
                </View>

                <View style={styles.textWrap}>
                    <View style={styles.codeRow}>
                        <ThemedText style={styles.code}>{code}</ThemedText>
                        {meta.symbol ? (
                            <View style={[styles.symbolBadge, { backgroundColor: colors.primary + '14' }]}>
                                <ThemedText style={[styles.symbolText, { color: colors.primary }]}>
                                    {meta.symbol}
                                </ThemedText>
                            </View>
                        ) : null}
                    </View>
                    <ThemedText style={[styles.name, { color: colors.textSecondary }]} numberOfLines={1}>
                        {meta.countryName ? `${meta.countryName} · ${meta.name}` : meta.name}
                    </ThemedText>
                </View>

                <View style={styles.rateWrap}>
                    {isBaseCurrency ? (
                        <View style={[styles.baseBadge, { backgroundColor: colors.secondary }]}>
                            <ThemedText style={styles.baseBadgeText}>Base</ThemedText>
                        </View>
                    ) : (
                        <>
                            <ThemedText style={styles.rateValue}>{formatRate(basePerUnit)} {baseCode}</ThemedText>
                            <ThemedText style={[styles.ratePer, { color: colors.textSecondary }]}>per 1 {code}</ThemedText>
                        </>
                    )}
                </View>

                {!isBaseCurrency && onToggleFavorite && (
                    <TouchableOpacity
                        onPress={onToggleFavorite}
                        hitSlop={8}
                        style={styles.favoriteButton}
                    >
                        <Ionicons
                            name={isFavorite ? 'star' : 'star-outline'}
                            size={18}
                            color={isFavorite ? colors.secondary : colors.icon}
                        />
                    </TouchableOpacity>
                )}

                {!isBaseCurrency && (
                    <Ionicons name="stats-chart-outline" size={16} color={colors.icon} style={styles.trendIcon} />
                )}
            </View>
        </PressableScale>
    );
});

const styles = StyleSheet.create({
    pressWrap: {
        marginHorizontal: 14,
        marginBottom: 10,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: Layout.cardBorderRadius - 2,
        paddingVertical: 10,
        paddingHorizontal: 12,
        minHeight: 44,
    },
    flagTile: {
        width: TILE_SIZE,
        height: TILE_SIZE,
        borderRadius: Layout.borderRadius,
        marginRight: 12,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    flagImage: {
        width: '100%',
        height: '100%',
    },
    flagFallbackText: {
        fontSize: 13,
        fontWeight: '800',
        letterSpacing: 0.3,
    },
    textWrap: {
        flex: 1,
        marginRight: 8,
    },
    codeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    symbolBadge: {
        paddingHorizontal: 6,
        paddingVertical: 1,
        borderRadius: 6,
    },
    symbolText: {
        fontSize: 11,
        fontWeight: '700',
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
        color: '#FFFFFF',
    },
    trendIcon: {
        marginLeft: 2,
    },
    favoriteButton: {
        padding: 2,
        marginLeft: 4,
    },
});
