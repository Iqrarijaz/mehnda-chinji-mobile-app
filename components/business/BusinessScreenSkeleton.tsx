import React from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Skeleton from '@/components/common/Skeleton';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/context/ThemeContext';

export const BusinessListSkeleton = React.memo(function BusinessListSkeleton() {
    const { theme } = useTheme();
    const colors = Colors[theme];
    return (
        <View style={styles.listContent}>
            {[1, 2, 3, 4, 5].map((key) => (
                <View key={key} style={[styles.businessCard, { backgroundColor: colors.card }]}>
                    <View style={styles.cardRow}>
                        <Skeleton width={60} height={60} borderRadius={14} />
                        <View style={styles.cardInfo}>
                            <Skeleton width="60%" height={18} borderRadius={4} style={{ marginBottom: 8 }} />
                            <Skeleton width="30%" height={22} borderRadius={8} style={{ marginBottom: 8 }} />
                            <Skeleton width="80%" height={14} borderRadius={4} />
                        </View>
                        <Skeleton width={42} height={42} borderRadius={21} style={{ marginLeft: 10 }} />
                    </View>
                </View>
            ))}
        </View>
    );
});
BusinessListSkeleton.displayName = 'BusinessListSkeleton';

export const BusinessScreenSkeleton = React.memo(function BusinessScreenSkeleton() {
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

            {/* List Content Skeleton matching BusinessScreen padding */}
            <BusinessListSkeleton />
        </View>
    );
});

BusinessScreenSkeleton.displayName = 'BusinessScreenSkeleton';

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
    listContent: {
        flex: 1,
        paddingHorizontal: Platform.OS === 'android' ? 18 : 20,
        paddingTop: 14
    },
    businessCard: {
        borderRadius: Layout.borderRadius,
        padding: 11,
        marginBottom: 12
    },
    cardRow: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    cardInfo: {
        flex: 1,
        marginLeft: 12
    }
});
