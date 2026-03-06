import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

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
    // Fallback light bg if none provided (tintColor at very low opacity)
    const background = bgColor || tintColor + '10';

    return (
        <View style={[
            styles.card,
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
        borderRadius: 16,
        backgroundColor: '#FFFFFF',
        overflow: 'hidden',
        shadowColor: '#000',
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
