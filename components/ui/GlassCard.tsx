import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { useTheme } from '@/context/ThemeContext';

interface GlassCardProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    contentContainerStyle?: StyleProp<ViewStyle>;
}

export const GlassCard = React.memo(({ children, style, contentContainerStyle }: GlassCardProps) => {
    const { isDark } = useTheme();

    return (
        <View style={styles.cardWrapper}>
            <LinearGradient
                colors={isDark
                    ? ['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.02)']
                    : ['rgba(15, 23, 42, 0.05)', 'rgba(15, 23, 42, 0.02)']}
                style={[
                    styles.card,
                    { borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(15, 23, 42, 0.1)' }
                ]}
            >
                {/* Specular Highlight */}
                <View style={[styles.specularHandle, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.4)' }]} />

                {children}
            </LinearGradient>
        </View>
    );
});

const styles = StyleSheet.create({
    cardWrapper: {
        marginVertical: 4,
        marginBottom: 8,
        borderRadius: 24,
        overflow: 'hidden',
    },
    card: {
        borderRadius: 24,
        padding: 12,
        borderWidth: 1,
        position: 'relative',
    },
    specularHandle: {
        position: 'absolute',
        top: 0,
        left: '15%',
        right: '15%',
        height: 1,
    },
});
