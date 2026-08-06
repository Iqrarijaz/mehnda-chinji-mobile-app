import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { SlideInLeft } from 'react-native-reanimated';
import { ThemedText } from '../ThemedText';
import { Layout } from '@/constants/layout';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';

interface DataUsageHeaderProps {
    onReset: () => void;
    onBack: () => void;
}

export const DataUsageHeader = ({ onReset, onBack }: DataUsageHeaderProps) => {
    const { theme } = useTheme();
    const colors = Colors[theme];
    return (
        <Animated.View
            entering={SlideInLeft.duration(500)}
            style={styles.container}
        >
            <View style={styles.topRow}>
                <TouchableOpacity onPress={onBack} style={[styles.backBtn, { backgroundColor: colors.inputBackground }]}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <TouchableOpacity onPress={onReset} style={[styles.resetBtn, { backgroundColor: `${colors.primary}18` }]}>
                    <Ionicons name="refresh-outline" size={20} color={colors.primary} />
                    <ThemedText style={[styles.resetText, { color: colors.primary }]}>Reset Stats</ThemedText>
                </TouchableOpacity>
            </View>

            <View style={styles.titleContainer}>
                <ThemedText style={[styles.title, { color: colors.text }]}>Data Usage</ThemedText>
                <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>Manage how the app uses network data</ThemedText>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 10 },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12 },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: Layout.borderRadius,
        justifyContent: 'center',
        alignItems: 'center' },
    resetBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 7,
        borderRadius: Layout.borderRadius,
        gap: 6 },
    resetText: {
        fontSize: 10,
        fontWeight: '700' },
    titleContainer: {
        gap: 4 },
    title: {
        fontSize: 16.5,
        fontWeight: '800' },
    subtitle: {
        fontSize: 10,
        fontWeight: '500' } });
