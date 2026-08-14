import React from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Skeleton from '@/components/common/Skeleton';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/context/ThemeContext';

export const HomeScreenSkeleton = React.memo(function HomeScreenSkeleton() {
    const { theme } = useTheme();
    const colors = Colors[theme];
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header Skeleton matching ScreenHeader */}
            <View
                style={[
                    styles.header,
                    {
                        backgroundColor: colors.primary,
                        paddingTop: insets.top + 16
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

                {/* Weather Widget Skeleton in Header */}
                <View style={styles.weatherWidgetSkeleton}>
                    <View style={styles.weatherRow}>
                        <View style={{ flex: 1 }}>
                            <Skeleton width="55%" height={18} borderRadius={4} />
                            <Skeleton width="40%" height={14} borderRadius={4} style={{ marginTop: 6 }} />
                            <View style={styles.hiLoRow}>
                                <Skeleton width={45} height={18} borderRadius={4} />
                                <Skeleton width={45} height={18} borderRadius={4} style={{ marginLeft: 6 }} />
                                <Skeleton width={55} height={18} borderRadius={6} style={{ marginLeft: 6 }} />
                            </View>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <Skeleton width={38} height={38} borderRadius={19} />
                                <Skeleton width={42} height={30} borderRadius={6} />
                            </View>
                            <Skeleton width={68} height={20} borderRadius={10} style={{ marginTop: 6 }} />
                        </View>
                    </View>
                    <View style={styles.pagerFooter}>
                        <Skeleton width={36} height={6} borderRadius={3} />
                        <Skeleton width={90} height={12} borderRadius={4} />
                    </View>
                </View>
            </View>

            {/* Content Scroll View */}
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
            >
                {/* Banner Ad Skeleton */}
                <View style={styles.bannerAdWrapper}>
                    <Skeleton width="100%" height={52} borderRadius={Layout.borderRadius} />
                </View>

                {/* Categories Section Skeleton */}
                <View style={styles.sectionContainer}>
                    <Skeleton width={150} height={18} borderRadius={4} style={styles.sectionTitle} />
                    <View style={styles.categoryGrid}>
                        {[1, 2, 3, 4, 5, 6].map((key) => (
                            <View key={key} style={styles.categoryGridItem}>
                                <View style={[styles.categoryCard, { backgroundColor: colors.cardBg }]}>
                                    <Skeleton width={42} height={42} borderRadius={Layout.borderRadius} style={{ marginBottom: 8 }} />
                                    <Skeleton width="60%" height={12} borderRadius={4} />
                                </View>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Utilities Section Skeleton */}
                <View style={styles.sectionContainer}>
                    <Skeleton width={130} height={16} borderRadius={4} style={styles.sectionTitle} />
                    <View style={styles.utilsGrid}>
                        {[1, 2].map((key) => (
                            <View key={key} style={styles.utilsGridItem}>
                                <View style={[styles.utilsCard, { backgroundColor: colors.cardBg }]}>
                                    <Skeleton width={50} height={50} borderRadius={Layout.borderRadius} style={{ marginBottom: 6 }} />
                                    <Skeleton width="70%" height={12} borderRadius={4} />
                                </View>
                            </View>
                        ))}
                    </View>
                </View>
            </ScrollView>
        </View>
    );
});

HomeScreenSkeleton.displayName = 'HomeScreenSkeleton';

const styles = StyleSheet.create({
    container: {
        flex: 1
    },
    header: {
        borderBottomLeftRadius: Layout.headerBorderRadius,
        borderBottomRightRadius: Layout.headerBorderRadius,
        paddingHorizontal: 14,
        paddingBottom: 12
    },
    iconRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12
    },
    rightIcons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12
    },
    weatherWidgetSkeleton: {
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginTop: 4,
        marginBottom: 14,
        borderRadius: Layout.borderRadius,
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.18)',
        minHeight: 112
    },
    weatherRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    hiLoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8
    },
    pagerFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 10,
        paddingTop: 6,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)'
    },
    scrollContent: {
        paddingTop: 0
    },
    bannerAdWrapper: {
        paddingHorizontal: 14,
        marginVertical: 10
    },
    sectionContainer: {
        paddingHorizontal: 14,
        paddingBottom: 8
    },
    sectionTitle: {
        marginLeft: 6,
        marginTop: 10,
        marginBottom: 14
    },
    categoryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap'
    },
    categoryGridItem: {
        width: '33.33%'
    },
    categoryCard: {
        borderRadius: Layout.borderRadius - 2,
        padding: 12,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 80,
        margin: 6
    },
    utilsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap'
    },
    utilsGridItem: {
        width: '25%'
    },
    utilsCard: {
        borderRadius: Layout.borderRadius - 4,
        padding: 8,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 90,
        margin: 6
    }
});
