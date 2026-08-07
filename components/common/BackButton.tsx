import React from 'react';
import { StyleSheet, TouchableOpacity, ViewStyle, StyleProp } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/colors';

interface BackButtonProps {
    onPress?: () => void;
    color?: string;
    backgroundColor?: string;
    style?: StyleProp<ViewStyle>;
    size?: number;
}

export const BackButton = React.memo(function BackButton({
    onPress,
    color,
    backgroundColor,
    style,
    size = 18,
}: BackButtonProps) {
    const router = useRouter();
    const { theme } = useTheme();
    const colors = Colors[theme];

    const handlePress = () => {
        if (onPress) {
            onPress();
        } else if (router.canGoBack()) {
            router.back();
        } else {
            router.replace('/(drawer)/(tabs)' as any);
        }
    };

    return (
        <TouchableOpacity
            onPress={handlePress}
            style={[
                styles.button,
                { backgroundColor: backgroundColor || 'rgba(0,0,0,0.05)' },
                style,
            ]}
            activeOpacity={0.8}
        >
            <Ionicons name="arrow-back" size={size} color={color || colors.primary} />
        </TouchableOpacity>
    );
});

const styles = StyleSheet.create({
    button: {
        width: 32,
        height: 32,
        borderRadius: 16, // fully circular
        justifyContent: 'center',
        alignItems: 'center',
    },
});
