import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/colors';

interface TintedCardProps {
    children: React.ReactNode;
    tintColor: string;
    bgColor?: string;
    style?: StyleProp<ViewStyle>;
}

export const TintedCard = React.memo(({
    children,
    tintColor,
    bgColor,
    style
}: TintedCardProps) => {
    const { theme, isDark } = useTheme();
    const colors = Colors[theme];

    // Fallback light bg if none provided (tintColor at very low opacity)
    const background = bgColor || (isDark ? 'rgba(255,255,255,0.03)' : (tintColor + '10'));

    return (
        <View style={[
            styles.card,
            {
                backgroundColor: background || colors.card,
                shadowColor: isDark ? 'transparent' : '#000',
            },
            style
        ]}>
            <View style={styles.content}>
                {children}
            </View>
        </View>
    );
});

const styles = StyleSheet.create({
    card: {
        borderRadius: Layout.borderRadius,
        overflow: 'hidden',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
    },
    blob: {
        position: 'absolute',
        borderRadius: 100,
        opacity: 0.1,
    },
    blob1: {
        top: -30,
        left: -30,
        width: 100,
        height: 100,
    },
    blob2: {
        bottom: -20,
        right: '10%',
        width: 80,
        height: 80,
        opacity: 0.05,
    },
    content: {
        zIndex: 1,
    }
});
