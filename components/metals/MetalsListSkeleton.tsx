import React from 'react';
import { StyleSheet, View } from 'react-native';

import Skeleton from '@/components/common/Skeleton';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/context/ThemeContext';

/** Shimmering placeholder cards shown while the first metals fetch is in flight. */
export function MetalsListSkeleton({ rows = 4 }: { rows?: number }) {
    const { theme } = useTheme();
    const colors = Colors[theme];

    return (
        <View>
            {Array.from({ length: rows }).map((_, i) => (
                <View key={i} style={[styles.row, { backgroundColor: colors.cardBg }]}>
                    <Skeleton width={46} height={46} borderRadius={Layout.borderRadius} />
                    <View style={styles.textWrap}>
                        <Skeleton width="35%" height={14} borderRadius={4} style={{ marginBottom: 6 }} />
                        <Skeleton width="55%" height={11} borderRadius={4} />
                    </View>
                    <Skeleton width={64} height={14} borderRadius={4} />
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
