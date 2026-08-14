import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themedText';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { GOLD_KARAT_LABELS, MetalMeta } from '@/constants/metals';
import { useTheme } from '@/context/ThemeContext';
import { GoldKarats } from '@/apis/metals';

interface MetalCardProps {
    meta: MetalMeta;
    price: number;
    unit: string;
    karats?: GoldKarats;
    onPress: () => void;
}

function formatPrice(value: number) {
    return value.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

export const MetalCard = React.memo(function MetalCard({ meta, price, unit, karats, onPress }: MetalCardProps) {
    const { theme } = useTheme();
    const colors = Colors[theme];

    return (
        <TouchableOpacity
            activeOpacity={0.7}
            onPress={onPress}
            style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
            <View style={styles.mainRow}>
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
                    <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>
                        Per {unit === 'g' ? 'gram' : unit} · 24K
                    </ThemedText>
                </View>

                <View style={styles.priceWrap}>
                    <ThemedText style={styles.priceValue}>{formatPrice(price)}</ThemedText>
                    <ThemedText style={[styles.priceUnit, { color: colors.textSecondary }]}>PKR</ThemedText>
                </View>

                <MaterialCommunityIcons name="chart-line" size={16} color={colors.icon} style={styles.trendIcon} />
            </View>

            {karats && (
                <View style={[styles.karatRow, { borderTopColor: colors.border }]}>
                    {(['k22', 'k21', 'k18'] as const).map((karat) => (
                        <View key={karat} style={[styles.karatChip, { backgroundColor: colors.background }]}>
                            <ThemedText style={[styles.karatLabel, { color: colors.textSecondary }]}>
                                {GOLD_KARAT_LABELS[karat]}
                            </ThemedText>
                            <ThemedText style={styles.karatValue}>{formatPrice(karats[karat])}</ThemedText>
                        </View>
                    ))}
                </View>
            )}
        </TouchableOpacity>
    );
});

const styles = StyleSheet.create({
    card: {
        borderRadius: Layout.borderRadius,
        borderWidth: 1,
        marginHorizontal: 20,
        marginBottom: 10,
        overflow: 'hidden',
    },
    mainRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 14,
        minHeight: 44,
    },
    iconWrap: {
        width: 42,
        height: 42,
        borderRadius: Layout.borderRadius,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    textWrap: {
        flex: 1,
    },
    label: {
        fontSize: 15,
        fontWeight: '700',
    },
    subtitle: {
        fontSize: 12,
        fontWeight: '400',
        marginTop: 2,
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
    trendIcon: {
        marginLeft: 2,
    },
    karatRow: {
        flexDirection: 'row',
        borderTopWidth: StyleSheet.hairlineWidth,
        paddingHorizontal: 14,
        paddingVertical: 10,
        gap: 8,
    },
    karatChip: {
        flex: 1,
        borderRadius: 10,
        paddingVertical: 6,
        alignItems: 'center',
    },
    karatLabel: {
        fontSize: 10,
        fontWeight: '600',
        marginBottom: 2,
    },
    karatValue: {
        fontSize: 12,
        fontWeight: '700',
    },
});
