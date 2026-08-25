import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, SlideInUp } from 'react-native-reanimated';
import { ThemedText } from '../ThemedText';
import { Layout } from '@/constants/layout';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';

export const DataUsageEmptyState = React.memo(() => {
    const { theme } = useTheme();
    const colors = Colors[theme];
    return (
        <Animated.View entering={FadeIn.delay(300)} style={styles.container}>
            <Animated.View entering={SlideInUp.delay(400).springify()} style={[styles.iconWrapper, { backgroundColor: colors.surface }]}>
                <Ionicons name="stats-chart" size={60} color={colors.disabled} />
            </Animated.View>
            <ThemedText style={[styles.title, { color: colors.textSecondary }]}>No data recorded yet</ThemedText>
            <ThemedText style={[styles.subtitle, { color: colors.placeholder }]}>
                Keep using the app to see your network statistics here
            </ThemedText>
        </Animated.View>
    );
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 36,
        paddingTop: 76 },
    iconWrapper: {
        width: 120,
        height: 120,
        borderRadius: Layout.borderRadius,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24 },
    title: {
        fontSize: 12.5,
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: 8 },
    subtitle: {
        fontSize: 10,
        textAlign: 'center',
        lineHeight: 22,
        fontWeight: '500' } });
