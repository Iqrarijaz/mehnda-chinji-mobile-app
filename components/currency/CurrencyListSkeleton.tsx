import React from 'react';
import { StyleSheet, View } from 'react-native';

import Skeleton from '@/components/common/Skeleton';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/context/ThemeContext';

/** Shimmering placeholder rows shown while the first exchange-rate fetch is in flight. */
export function CurrencyListSkeleton({ rows = 6 }: { rows?: number }) {
    const { theme } = useTheme();
    const colors = Colors[theme];

    return (
        <View>
            {Array.from({ length: rows }).map((_, i) => (
                <View key={i} style={[styles.row, { backgroundColor: colors.cardBg }]}>
                    <Skeleton width={46} height={46} borderRadius={Layout.borderRadius} />
                    <View style={styles.textWrap}>
                        <Skeleton width="40%" height={14} borderRadius={4} style={{ marginBottom: 6 }} />
                        <Skeleton width="65%" height={11} borderRadius={4} />
                    </View>
                    <Skeleton width={60} height={14} borderRadius={4} />
                </View>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: Layout.cardBorderRadius - 2,
        paddingVertical: 10,
        paddingHorizontal: 12,
        marginHorizontal: 14,
        marginBottom: 10,
    },
    textWrap: {
        flex: 1,
        marginHorizontal: 12,
    },
});
