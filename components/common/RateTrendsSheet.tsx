import { Ionicons } from '@expo/vector-icons';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import React, { forwardRef, useCallback } from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View, useWindowDimensions } from 'react-native';

import { TrendChart, TrendChartPoint } from '@/components/currency/TrendChart';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/context/ThemeContext';

export interface RateTrendsSheetProps {
    /** Flag tile / gradient icon rendered to the left of the title. */
    leading: React.ReactNode;
    title: string;
    subtitle: string;
    points: TrendChartPoint[];
    isLoading: boolean;
    isError: boolean;
    /** Fired once the sheet has fully closed (swipe-down, backdrop tap, or the close button). */
    onDismiss?: () => void;
}

const CONTENT_H_PADDING = 12;

/**
 * Shared `@gorhom/bottom-sheet` trend sheet used by both the Currency and
 * Metals screens. Sizes itself to its content (chart is a fixed height) so
 * there's no dead space or percentage-guessing snap point.
 */
export const RateTrendsSheet = forwardRef<BottomSheetModal, RateTrendsSheetProps>(
    ({ leading, title, subtitle, points, isLoading, isError, onDismiss }, ref) => {
        const { theme } = useTheme();
        const colors = Colors[theme];
        const { width: windowWidth } = useWindowDimensions();
        // Graph takes full card width from right to left (+16 accounts for chart-kit axis offset)
        const chartWidth = windowWidth - CONTENT_H_PADDING * 2 + 16;

        const handleClose = useCallback(() => {
            (ref as React.RefObject<BottomSheetModal>)?.current?.dismiss();
        }, [ref]);

        const renderBackdrop = useCallback(
            (props: any) => (
                <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.55} pressBehavior="close" />
            ),
            []
        );

        return (
            <BottomSheetModal
                ref={ref}
                index={0}
                enableDynamicSizing
                backdropComponent={renderBackdrop}
                backgroundStyle={{ backgroundColor: colors.background }}
                handleIndicatorStyle={{ backgroundColor: colors.secondary, width: 36 }}
                enablePanDownToClose
                onDismiss={onDismiss}
            >
                <BottomSheetView style={styles.content}>
                    <View style={styles.header}>
                        <View style={styles.headerLeft}>
                            {leading}
                            <View style={styles.headerText}>
                                <View style={styles.titleRow}>
                                    <ThemedText style={styles.title} numberOfLines={1}>{title}</ThemedText>
                                    <View style={[styles.liveBadge, { backgroundColor: colors.lime + '20' }]}>
                                        <View style={[styles.liveDot, { backgroundColor: colors.lime }]} />
                                        <ThemedText style={[styles.liveText, { color: colors.lime }]}>LIVE</ThemedText>
                                    </View>
                                </View>
                                <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={1}>
                                    {subtitle}
                                </ThemedText>
                            </View>
                        </View>
                        <TouchableOpacity
                            onPress={handleClose}
                            style={[styles.closeButton, { backgroundColor: colors.cardBg }]}
                            hitSlop={8}
                        >
                            <Ionicons name="close" size={18} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    <View style={[styles.chartCard, { backgroundColor: colors.cardBg }]}>
                        {isLoading ? (
                            <View style={styles.loadingWrap}>
                                <ActivityIndicator color={colors.primary} />
                            </View>
                        ) : isError ? (
                            <View style={styles.loadingWrap}>
                                <Ionicons name="cloud-offline-outline" size={24} color={colors.textSecondary} />
                                <ThemedText style={[styles.errorText, { color: colors.textSecondary }]}>
                                    Couldn&apos;t load trend data. Please try again later.
                                </ThemedText>
                            </View>
                        ) : (
                            <TrendChart points={points} width={chartWidth} />
                        )}
                    </View>
                </BottomSheetView>
            </BottomSheetModal>
        );
    }
);

RateTrendsSheet.displayName = 'RateTrendsSheet';

const styles = StyleSheet.create({
    content: {
        paddingHorizontal: CONTENT_H_PADDING,
        paddingTop: 4,
        paddingBottom: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 2,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 8,
    },
    headerText: {
        flex: 1,
        marginLeft: 10,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    title: {
        fontSize: 16,
        fontWeight: '800',
        flexShrink: 1,
    },
    liveBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 6,
        paddingVertical: 2.5,
        borderRadius: 20,
    },
    liveDot: {
        width: 4.5,
        height: 4.5,
        borderRadius: 2.5,
    },
    liveText: {
        fontSize: 8.5,
        fontWeight: '800',
        letterSpacing: 0.4,
    },
    subtitle: {
        fontSize: 11.5,
        marginTop: 2,
    },
    closeButton: {
        width: 30,
        height: 30,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
    },
    chartCard: {
        borderRadius: Layout.borderRadius,
        paddingVertical: 8,
        paddingHorizontal: 0,
        marginTop: 10,
        overflow: 'hidden',
    },
    loadingWrap: {
        height: 140,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6,
    },
    errorText: {
        fontSize: 11.5,
        textAlign: 'center',
    },
});
