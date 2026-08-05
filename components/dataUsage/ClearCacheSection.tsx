import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ThemedText } from '../ThemedText';
import { Layout } from '@/constants/layout';

export const ClearCacheSection = ({ onClear }: { onClear: () => Promise<void> }) => {
    const [clearing, setClearing] = useState(false);

    const handleClear = async () => {
        setClearing(true);
        await onClear();
        setClearing(false);
    };

    return (
        <Animated.View
            entering={FadeInDown.delay(600).duration(600).springify()}
            style={styles.container}
        >
            <View style={styles.card}>
                <View style={styles.iconBox}>
                    <Ionicons name="trash-outline" size={24} color="#EF4444" />
                </View>
                <View style={styles.content}>
                    <ThemedText style={styles.label}>Cached Media</ThemedText>
                    <ThemedText style={styles.description}>Free up space by clearing cached images and files</ThemedText>
                </View>
                <TouchableOpacity
                    style={[styles.button, clearing && styles.buttonLoading]}
                    onPress={handleClear}
                    disabled={clearing}
                    activeOpacity={0.7}
                >
                    {clearing ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                        <ThemedText style={styles.buttonText}>Clear Now</ThemedText>
                    )}
                </TouchableOpacity>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 16,
        marginBottom: 16 },
    card: {
        backgroundColor: '#FFF1F2',
        borderRadius: Layout.borderRadius,
        padding: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16 },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: Layout.borderRadius,
        backgroundColor: '#FFE4E6',
        justifyContent: 'center',
        alignItems: 'center' },
    content: {
        flex: 1,
        gap: 2 },
    label: {
        fontSize: 11.5,
        fontWeight: '800',
        color: '#9F1239' },
    description: {
        fontSize: 10,
        color: '#E11D48',
        fontWeight: '500',
        opacity: 0.8 },
    button: {
        backgroundColor: '#EF4444',
        paddingHorizontal: 11,
        paddingVertical: 8,
        borderRadius: Layout.borderRadius,
        justifyContent: 'center',
        alignItems: 'center',
        minWidth: 90 },
    buttonLoading: {
        opacity: 0.8 },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '800' } });
