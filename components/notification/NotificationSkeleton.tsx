import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Layout } from '@/constants/layout';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import Skeleton from '@/components/common/Skeleton';

const SkeletonCard = React.memo(({ colors }: { colors: typeof Colors.light }) => (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Skeleton width={46} height={46} borderRadius={14} />
        <View style={styles.lines}>
            <Skeleton width="70%" height={14} borderRadius={6} />
            <View style={{ height: 6 }} />
            <Skeleton width="90%" height={12} borderRadius={5} />
            <View style={{ height: 4 }} />
            <Skeleton width="40%" height={12} borderRadius={5} />
            <View style={{ height: 6 }} />
            <Skeleton width="25%" height={10} borderRadius={4} />
        </View>
    </View>
));

const NotificationSkeleton = React.memo(() => {
    const { theme } = useTheme();
    const colors = Colors[theme];

    return (
        <View style={styles.container}>
            {[...Array(6)].map((_, i) => <SkeletonCard key={i} colors={colors} />)}
        </View>
    );
});

export default NotificationSkeleton;

const styles = StyleSheet.create({
    container: { paddingHorizontal: 16, paddingTop: 7 },
    card: {
        flexDirection: 'row',
        borderRadius: Layout.borderRadius,
        padding: 13,
        marginBottom: 10
    },
    lines: { flex: 1, marginLeft: 14 }
});
