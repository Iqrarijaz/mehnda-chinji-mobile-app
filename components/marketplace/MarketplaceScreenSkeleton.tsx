import React from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Skeleton from '@/components/common/Skeleton';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/context/ThemeContext';

export const MarketplaceListSkeleton = React.memo(function MarketplaceListSkeleton() {
    const { theme } = useTheme();
    const colors = Colors[theme];
    return (
        <View style={styles.listContent}>
            {[1, 2, 3].map((rowKey) => (
                <View key={rowKey} style={styles.gridRow}>
                    {[1, 2].map((cardKey) => (
                        <View key={cardKey} style={[styles.card, { backgroundColor: colors.cardBg }]}>
                            {/* Image Container */}
                            <Skeleton width="100%" height={130} borderRadius={Layout.borderRadius} />
                            {/* Details Container */}
                            <View style={styles.cardDetails}>
                                <Skeleton width="70%" height={14} borderRadius={4} style={{ marginBottom: 6 }} />
                                <Skeleton width="90%" height={14} borderRadius={4} style={{ marginBottom: 4 }} />
                            </View>
                        </View>
                    ))}
                </View>
            ))}
        </View>
    );
});
MarketplaceListSkeleton.displayName = 'MarketplaceListSkeleton';

export const MarketplaceScreenSkeleton = React.memo(function MarketplaceScreenSkeleton() {
    const { theme } = useTheme();
    const colors = Colors[theme];
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Screen Header Skeleton */}
            <View
                style={[
                    styles.header,
                    {
                        backgroundColor: colors.primary,
                        paddingTop: insets.top + (Platform.OS === 'android' ? 16 : 20)
                    }
                ]}
            >
                {/* Top Icon Row */}
                <View style={styles.iconRow}>
                    <Skeleton width={38} height={38} borderRadius={Layout.borderRadius} />
                    <View style={styles.rightIcons}>
                        <Skeleton width={38} height={38} borderRadius={Layout.borderRadius} />
                        <Skeleton width={38} height={38} borderRadius={Layout.borderRadius} />
                        <Skeleton width={38} height={38} borderRadius={19} />
                    </View>
                </View>

                {/* Search Section */}
                <View style={styles.searchSection}>
                    <View style={styles.searchRow}>
                        <View style={{ flex: 1 }}>
                            <Skeleton width="100%" height={42} borderRadius={Layout.borderRadius} />
                        </View>
                        <Skeleton width={42} height={42} borderRadius={Layout.borderRadius} />
                        <Skeleton width={42} height={42} borderRadius={Layout.borderRadius} />
                    </View>
                </View>
            </View>

            {/* Category Pills Skeleton Row */}
            <View style={styles.pillsRow}>
                {[80, 95, 75, 110, 85].map((w, idx) => (
                    <Skeleton key={idx} width={w} height={32} borderRadius={20} style={{ marginRight: 8 }} />
                ))}
            </View>

            {/* 2-Column Grid Content Skeleton matching MarketplaceScreen */}
            <MarketplaceListSkeleton />
        </View>
    );
});

MarketplaceScreenSkeleton.displayName = 'MarketplaceScreenSkeleton';

const styles = StyleSheet.create({
    container: {
        flex: 1
    },
    header: {
        borderBottomLeftRadius: Layout.headerBorderRadius,
        borderBottomRightRadius: Layout.headerBorderRadius,
        paddingHorizontal: 14,
        paddingBottom: 0
    },
    iconRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: Platform.OS === 'android' ? 10 : 12
    },
    rightIcons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12
    },
    searchSection: {
        paddingTop: Platform.OS === 'android' ? 2 : 4,
        paddingBottom: 14
    },
    searchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8
    },
    pillsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 13,
        paddingVertical: 10
    },
    listContent: {
        flex: 1,
        paddingHorizontal: 13,
        paddingTop: 4
    },
    gridRow: {
        flexDirection: 'row',
        gap: 14,
        marginBottom: 14
    },
    card: {
        flex: 1,
        borderRadius: Layout.borderRadius,
        overflow: 'hidden'
    },
    cardDetails: {
        paddingHorizontal: 8,
        paddingTop: 8,
        paddingBottom: 10
    }
});
