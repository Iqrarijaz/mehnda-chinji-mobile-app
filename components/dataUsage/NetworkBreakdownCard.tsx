import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { SlideInLeft, useAnimatedStyle, withTiming, withSpring } from 'react-native-reanimated';
import { ThemedText } from '../ThemedText';
import { formatBytes } from '@/utils/dataUsageUtils';

interface NetworkRowProps {
    icon: string;
    label: string;
    bytes: number;
    totalBytes: number;
    delay: number;
}

const NetworkRow = ({ icon, label, bytes, totalBytes, delay }: NetworkRowProps) => {
    const percentage = totalBytes > 0 ? (bytes / totalBytes) : 0;

    const barStyle = useAnimatedStyle(() => ({
        width: withSpring(`${percentage * 100}%`, { damping: 20 }),
    }));

    return (
        <Animated.View entering={SlideInLeft.delay(delay).duration(450)} style={styles.row}>
            <View style={styles.iconBox}>
                <Ionicons name={icon as any} size={20} color="#64748B" />
            </View>
            <View style={styles.content}>
                <View style={styles.rowTop}>
                    <ThemedText style={styles.rowLabel}>{label}</ThemedText>
                    <ThemedText style={styles.rowValue}>{formatBytes(bytes)}</ThemedText>
                </View>
                <View style={styles.track}>
                    <Animated.View style={[styles.bar, barStyle]} />
                </View>
            </View>
        </Animated.View>
    );
};

export const NetworkBreakdownCard = React.memo(({ wifi, mobile, total }: { wifi: number, mobile: number, total: number }) => {
    return (
        <Animated.View
            entering={SlideInLeft.delay(200).duration(500)}
            style={styles.container}
        >
            <ThemedText style={styles.sectionTitle}>Network Breakdown</ThemedText>
            <View style={styles.card}>
                <NetworkRow
                    icon="wifi"
                    label="Wi-Fi Usage"
                    bytes={wifi}
                    totalBytes={total}
                    delay={300}
                />
                <View style={styles.divider} />
                <NetworkRow
                    icon="cellular"
                    label="Mobile Data"
                    bytes={mobile}
                    totalBytes={total}
                    delay={400}
                />
            </View>
        </Animated.View>
    );
});

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 20,
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: '800',
        color: '#94A3B8',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 8,
        marginLeft: 4,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 22,
        padding: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        gap: 16,
    },
    iconBox: {
        width: 42,
        height: 42,
        borderRadius: 14,
        backgroundColor: '#F8FAFC',
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flex: 1,
        gap: 8,
    },
    rowTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    rowLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#1E293B',
    },
    rowValue: {
        fontSize: 11,
        fontWeight: '800',
        color: '#0F172A',
    },
    track: {
        height: 6,
        backgroundColor: '#F1F5F9',
        borderRadius: 3,
        overflow: 'hidden',
    },
    bar: {
        height: '100%',
        backgroundColor: '#009688',
        borderRadius: 3,
    },
    divider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginHorizontal: 4,
    },
});
