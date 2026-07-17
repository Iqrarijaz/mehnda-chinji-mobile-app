import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, SlideInUp } from 'react-native-reanimated';
import { ThemedText } from '../ThemedText';

export const DataUsageEmptyState = () => {
    return (
        <Animated.View entering={FadeIn.delay(300)} style={styles.container}>
            <Animated.View entering={SlideInUp.delay(400).springify()} style={styles.iconWrapper}>
                <Ionicons name="stats-chart" size={60} color="#CBD5E1" />
            </Animated.View>
            <ThemedText style={styles.title}>No data recorded yet</ThemedText>
            <ThemedText style={styles.subtitle}>
                Keep using the app to see your network statistics here
            </ThemedText>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
        paddingTop: 80,
    },
    iconWrapper: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#F8FAFC',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 14,
        fontWeight: '800',
        color: '#4F5F57',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 11,
        color: '#8FA79E',
        textAlign: 'center',
        lineHeight: 22,
        fontWeight: '500',
    },
});
