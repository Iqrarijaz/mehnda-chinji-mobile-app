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
                <View
                    key={i}
                    style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}
                >
                    <Skeleton width={38} height={38} borderRadius={19} />
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
        borderRadius: Layout.borderRadius,
        borderWidth: 1,
        paddingVertical: 12,
        paddingHorizontal: 14,
        marginHorizontal: 20,
        marginBottom: 10,
    },
    textWrap: {
        flex: 1,
        marginHorizontal: 12,
    },
});
