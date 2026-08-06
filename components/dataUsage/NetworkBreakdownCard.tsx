import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { SlideInLeft, useAnimatedStyle, withTiming, withSpring } from 'react-native-reanimated';
import { ThemedText } from '../ThemedText';
import { formatBytes } from '@/utils/dataUsageUtils';
import { Layout } from '@/constants/layout';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';

interface NetworkRowProps {
    icon: string;
    label: string;
    bytes: number;
    totalBytes: number;
    delay: number;
    colors: typeof Colors.light;
}

const NetworkRow = ({ icon, label, bytes, totalBytes, delay, colors }: NetworkRowProps) => {
    const percentage = totalBytes > 0 ? (bytes / totalBytes) : 0;

    const barStyle = useAnimatedStyle(() => ({
        width: withSpring(`${percentage * 100}%`, { damping: 20 }) }));

    return (
        <Animated.View entering={SlideInLeft.delay(delay).duration(450)} style={styles.row}>
            <View style={[styles.iconBox, { backgroundColor: colors.inputBackground }]}>
                <Ionicons name={icon as any} size={20} color={colors.textSecondary} />
            </View>
            <View style={styles.content}>
                <View style={styles.rowTop}>
                    <ThemedText style={[styles.rowLabel, { color: colors.text }]}>{label}</ThemedText>
                    <ThemedText style={[styles.rowValue, { color: colors.text }]}>{formatBytes(bytes)}</ThemedText>
                </View>
                <View style={[styles.track, { backgroundColor: colors.inputBackground }]}>
                    <Animated.View style={[styles.bar, { backgroundColor: colors.primary }, barStyle]} />
                </View>
            </View>
        </Animated.View>
    );
};

export const NetworkBreakdownCard = React.memo(({ wifi, mobile, total }: { wifi: number, mobile: number, total: number }) => {
    const { theme } = useTheme();
    const colors = Colors[theme];
    return (
        <Animated.View
            entering={SlideInLeft.delay(200).duration(500)}
            style={styles.container}
        >
            <ThemedText style={[styles.sectionTitle, { color: colors.textSecondary }]}>Network Breakdown</ThemedText>
            <View style={[styles.card, { backgroundColor: colors.card }]}>
                <NetworkRow
                    icon="wifi"
                    label="Wi-Fi Usage"
                    bytes={wifi}
                    totalBytes={total}
                    delay={300}
                    colors={colors}
                />
                <View style={[styles.divider, { backgroundColor: colors.divider }]} />
                <NetworkRow
                    icon="cellular"
                    label="Mobile Data"
                    bytes={mobile}
                    totalBytes={total}
                    delay={400}
                    colors={colors}
                />
            </View>
        </Animated.View>
    );
});

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 16,
        marginBottom: 12 },
    sectionTitle: {
        fontSize: 10,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 8,
        marginLeft: 4 },
    card: {
        borderRadius: Layout.borderRadius,
        padding: 10 },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 7,
        gap: 16 },
    iconBox: {
        width: 42,
        height: 42,
        borderRadius: Layout.borderRadius,
        justifyContent: 'center',
        alignItems: 'center' },
    content: {
        flex: 1,
        gap: 8 },
    rowTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center' },
    rowLabel: {
        fontSize: 10.5,
        fontWeight: '700' },
    rowValue: {
        fontSize: 10,
        fontWeight: '800' },
    track: {
        height: 6,
        borderRadius: Layout.borderRadius,
        overflow: 'hidden' },
    bar: {
        height: '100%',
        borderRadius: Layout.borderRadius },
    divider: {
        height: 1,
        marginHorizontal: 4 } });
