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

const CONTENT_H_PADDING = 20;
const CARD_PADDING = 14;

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
        const chartWidth = windowWidth - CONTENT_H_PADDING * 2 - CARD_PADDING * 2;

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
                handleIndicatorStyle={{ backgroundColor: colors.secondary, width: 40 }}
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
                            <Ionicons name="close" size={20} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    <View style={[styles.chartCard, { backgroundColor: colors.cardBg }]}>
                        {isLoading ? (
                            <View style={styles.loadingWrap}>
                                <ActivityIndicator color={colors.primary} />
                            </View>
                        ) : isError ? (
                            <View style={styles.loadingWrap}>
                                <Ionicons name="cloud-offline-outline" size={26} color={colors.textSecondary} />
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
        paddingTop: 12,
        paddingBottom: 28,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 12,
    },
    headerText: {
        flex: 1,
        marginLeft: 12,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    title: {
        fontSize: 17,
        fontWeight: '800',
        flexShrink: 1,
    },
    liveBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 7,
        paddingVertical: 3,
        borderRadius: 20,
    },
    liveDot: {
        width: 5,
        height: 5,
        borderRadius: 2.5,
    },
    liveText: {
        fontSize: 9,
        fontWeight: '800',
        letterSpacing: 0.4,
    },
    subtitle: {
        fontSize: 12.5,
        marginTop: 3,
    },
    closeButton: {
        width: 34,
        height: 34,
        borderRadius: 17,
        justifyContent: 'center',
        alignItems: 'center',
    },
    chartCard: {
        borderRadius: Layout.cardBorderRadius,
        padding: CARD_PADDING,
        marginTop: 18,
    },
    loadingWrap: {
        height: 170,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    errorText: {
        fontSize: 12.5,
        textAlign: 'center',
    },
});
