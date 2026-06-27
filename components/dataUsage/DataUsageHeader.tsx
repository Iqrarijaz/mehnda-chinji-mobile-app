import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { SlideInLeft } from 'react-native-reanimated';
import { ThemedText } from '../ThemedText';

interface DataUsageHeaderProps {
    onReset: () => void;
    onBack: () => void;
}

export const DataUsageHeader = ({ onReset, onBack }: DataUsageHeaderProps) => {
    return (
        <Animated.View
            entering={SlideInLeft.duration(500)}
            style={styles.container}
        >
            <View style={styles.topRow}>
                <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#0F172A" />
                </TouchableOpacity>
                <TouchableOpacity onPress={onReset} style={styles.resetBtn}>
                    <Ionicons name="refresh-outline" size={20} color="#009688" />
                    <ThemedText style={styles.resetText}>Reset Stats</ThemedText>
                </TouchableOpacity>
            </View>

            <View style={styles.titleContainer}>
                <ThemedText style={styles.title}>Data Usage</ThemedText>
                <ThemedText style={styles.subtitle}>Manage how the app uses network data</ThemedText>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 12,
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    resetBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E6F4F2',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        gap: 6,
    },
    resetText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#009688',
    },
    titleContainer: {
        gap: 4,
    },
    title: {
        fontSize: 20,
        fontWeight: '800',
        color: '#0F172A',
    },
    subtitle: {
        fontSize: 11,
        color: '#64748B',
        fontWeight: '500',
    },
});
