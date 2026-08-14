import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { PressableScale } from '@/components/essentials/shared/PressableScale';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { FuelProductMeta } from '@/constants/fuel';
import { useTheme } from '@/context/ThemeContext';

interface FuelCardProps {
    meta: FuelProductMeta;
    price: number;
    /** Overrides meta.unitLabel, e.g. "12 cities · tap for breakdown" on the Octane Plus card. */
    subtitle?: string;
    /** Right-side trailing icon — "chart-line" for a trend-able national product, "chevron-right" for a breakdown. */
    trailingIcon?: keyof typeof MaterialCommunityIcons.glyphMap;
    onPress: () => void;
}

const TILE_SIZE = 46;

function formatPrice(value: number) {
    return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export const FuelCard = React.memo(function FuelCard({ meta, price, subtitle, trailingIcon = 'chart-line', onPress }: FuelCardProps) {
    const { theme } = useTheme();
    const colors = Colors[theme];

    return (
        <PressableScale intensity={0.02} onPress={onPress} containerStyle={styles.pressWrap}>
            <View style={[styles.card, { backgroundColor: colors.cardBg }]}>
                <LinearGradient
                    colors={meta.gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.iconWrap}
                >
                    <MaterialCommunityIcons name={meta.icon} size={22} color="#FFFFFF" />
                </LinearGradient>

                <View style={styles.textWrap}>
                    <ThemedText style={styles.label}>{meta.label}</ThemedText>
                    <View style={styles.subtitleRow}>
                        <View style={[styles.unitDot, { backgroundColor: colors.lime }]} />
                        <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={1}>
                            {subtitle ?? meta.unitLabel}
                        </ThemedText>
                    </View>
                </View>

                <View style={styles.priceWrap}>
                    <ThemedText style={styles.priceValue}>{formatPrice(price)}</ThemedText>
                    <ThemedText style={[styles.priceUnit, { color: colors.textSecondary }]}>PKR</ThemedText>
                </View>

                <MaterialCommunityIcons name={trailingIcon} size={16} color={colors.icon} style={styles.trailingIcon} />
            </View>
        </PressableScale>
    );
});

const styles = StyleSheet.create({
    pressWrap: {
        marginHorizontal: 20,
        marginBottom: 10,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: Layout.cardBorderRadius,
        paddingVertical: 10,
        paddingHorizontal: 12,
        minHeight: 44,
    },
    iconWrap: {
        width: TILE_SIZE,
        height: TILE_SIZE,
        borderRadius: Layout.borderRadius,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    textWrap: {
        flex: 1,
    },
    label: {
        fontSize: 15,
        fontWeight: '700',
    },
    subtitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 3,
        gap: 5,
    },
    unitDot: {
        width: 5,
        height: 5,
        borderRadius: 2.5,
    },
    subtitle: {
        fontSize: 12,
        fontWeight: '400',
        flexShrink: 1,
    },
    priceWrap: {
        alignItems: 'flex-end',
        marginRight: 10,
    },
    priceValue: {
        fontSize: 15,
        fontWeight: '700',
    },
    priceUnit: {
        fontSize: 11,
        fontWeight: '400',
        marginTop: 2,
    },
    trailingIcon: {
        marginLeft: 2,
    },
});
