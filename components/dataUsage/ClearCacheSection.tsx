import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ThemedText } from '../ThemedText';

export const ClearCacheSection = ({ onClear }: { onClear: () => Promise<void> }) => {
    const [clearing, setClearing] = useState(false);

    const handleClear = async () => {
        setClearing(true);
        await onClear();
        setClearing(false);
    };

    return (
        <Animated.View
            entering={FadeInDown.delay(600).duration(600).duration(300)}
            style={styles.container}
        >
            <View style={styles.card}>
                <View style={styles.iconBox}>
                    <Ionicons name="trash-outline" size={24} color="#FF5A5F" />
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
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    card: {
        backgroundColor: '#FFF1F2',
        borderRadius: 22,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        borderColor: '#FFE4E6',
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: '#FFE4E6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flex: 1,
        gap: 2,
    },
    label: {
        fontSize: 13,
        fontWeight: '800',
        color: '#9F1239',
    },
    description: {
        fontSize: 11,
        color: '#E11D48',
        fontWeight: '500',
        opacity: 0.8,
    },
    button: {
        backgroundColor: '#FF5A5F',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        minWidth: 90,
    },
    buttonLoading: {
        opacity: 0.8,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '800',
    },
});
