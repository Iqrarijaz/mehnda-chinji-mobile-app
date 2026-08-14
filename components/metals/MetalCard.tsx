import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { PressableScale } from '@/components/essentials/shared/PressableScale';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { GOLD_KARAT_LABELS } from '@/constants/metals';
import { useTheme } from '@/context/ThemeContext';
import { GoldKarats } from '@/apis/metals';

interface MetalCardProps {
    /** Structurally typed so both precious (MetalMeta) and base (BaseMetalMeta) metas fit. */
    meta: {
        label: string;
        gradient: [string, string];
        icon: keyof typeof MaterialCommunityIcons.glyphMap;
    };
    price: number;
    unit: string;
    karats?: GoldKarats;
    onPress: () => void;
}

const TILE_SIZE = 46;

function formatPrice(value: number) {
    return value.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

export const MetalCard = React.memo(function MetalCard({ meta, price, unit, karats, onPress }: MetalCardProps) {
    const { theme } = useTheme();
    const colors = Colors[theme];

    return (
        <PressableScale intensity={0.02} onPress={onPress} containerStyle={styles.pressWrap}>
            <View style={[styles.card, { backgroundColor: colors.cardBg }]}>
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
                        <View style={styles.subtitleRow}>
                            <View style={[styles.unitDot, { backgroundColor: colors.lime }]} />
                            <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>
                                Per {unit === 'g' ? 'gram' : unit}{karats ? ' · 24K' : ''}
                            </ThemedText>
                        </View>
                    </View>

                    <View style={styles.priceWrap}>
                        <ThemedText style={styles.priceValue}>{formatPrice(price)}</ThemedText>
                        <ThemedText style={[styles.priceUnit, { color: colors.textSecondary }]}>PKR</ThemedText>
                    </View>

                    <MaterialCommunityIcons name="chart-line" size={16} color={colors.icon} style={styles.trendIcon} />
                </View>

                {karats && (
                    <View style={styles.karatRow}>
                        {(['k22', 'k21', 'k18'] as const).map((karat) => (
                            <View key={karat} style={[styles.karatChip, { backgroundColor: colors.primary + '10' }]}>
                                <ThemedText style={[styles.karatLabel, { color: colors.secondary }]}>
                                    {GOLD_KARAT_LABELS[karat]}
                                </ThemedText>
                                <ThemedText style={styles.karatValue}>{formatPrice(karats[karat])}</ThemedText>
                            </View>
                        ))}
                    </View>
                )}
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
        borderRadius: Layout.cardBorderRadius,
        overflow: 'hidden',
    },
    mainRow: {
        flexDirection: 'row',
        alignItems: 'center',
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
        paddingHorizontal: 12,
        paddingBottom: 12,
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
        fontWeight: '700',
        marginBottom: 2,
    },
    karatValue: {
        fontSize: 12,
        fontWeight: '700',
    },
});
