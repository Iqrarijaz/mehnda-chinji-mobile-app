import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View, useWindowDimensions } from 'react-native';

import { PremiumModal } from '@/components/common/PremiumModal';
import { TrendChart } from '@/components/currency/TrendChart';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
import { BASE_METALS_META, METALS_META } from '@/constants/metals';
import { useTheme } from '@/context/ThemeContext';
import { useMetalTrends } from '@/hooks/useMetals';

interface MetalTrendsModalProps {
    /** Any metal key the backend recognizes — primary (gold/silver/…) or base (copper/…). */
    metal: string | null;
    onClose: () => void;
}

const SHEET_HORIZONTAL_PADDING = 20;

function resolveMeta(metal: string) {
    return (METALS_META as Record<string, { label: string; gradient: [string, string]; icon: any }>)[metal]
        ?? (BASE_METALS_META as Record<string, { label: string; gradient: [string, string]; icon: any }>)[metal]
        ?? null;
}

export function MetalTrendsModal({ metal, onClose }: MetalTrendsModalProps) {
    const { theme } = useTheme();
    const colors = Colors[theme];
    const { width: windowWidth } = useWindowDimensions();
    const { trendsData, isTrendsLoading, trendsError } = useMetalTrends(metal);

    const meta = metal ? resolveMeta(metal) : null;
    const chartWidth = windowWidth * 0.95 - SHEET_HORIZONTAL_PADDING * 2;

    const chartPoints = useMemo(() => {
        if (!trendsData?.trends) return [];
        return trendsData.trends.map((t) => ({ date: t.date, value: t.price }));
    }, [trendsData]);

    return (
        <PremiumModal visible={!!metal} onClose={onClose} type="bottom-sheet">
            {metal && meta && (
                <View>
                    <View style={styles.header}>
                        <View style={styles.headerLeft}>
                            <LinearGradient
                                colors={meta.gradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.iconWrap}
                            >
                                <MaterialCommunityIcons name={meta.icon} size={18} color="#FFFFFF" />
                            </LinearGradient>
                            <View style={styles.headerText}>
                                <ThemedText style={styles.title}>{meta.label} Trend</ThemedText>
                                <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>
                                    Per gram · last 30 days
                                </ThemedText>
                            </View>
                        </View>
                        <TouchableOpacity
                            onPress={onClose}
                            style={[styles.closeButton, { backgroundColor: colors.cardBg }]}
                        >
                            <Ionicons name="close" size={20} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    {isTrendsLoading ? (
                        <View style={styles.loadingWrap}>
                            <ActivityIndicator color={colors.primary} />
                        </View>
                    ) : trendsError ? (
                        <View style={styles.loadingWrap}>
                            <ThemedText style={{ color: colors.textSecondary }}>
                                Couldn&apos;t load trend data. Please try again later.
                            </ThemedText>
                        </View>
                    ) : (
                        <TrendChart points={chartPoints} width={chartWidth} />
                    )}
                </View>
            )}
        </PremiumModal>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 12,
    },
    iconWrap: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    headerText: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
    },
    subtitle: {
        fontSize: 12,
        marginTop: 2,
    },
    closeButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingWrap: {
        height: 170,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
