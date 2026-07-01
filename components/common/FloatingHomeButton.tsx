import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';

interface FloatingHomeButtonProps {
    onPress: () => void;
    style?: any;
    isChatActive: boolean;
}

export const FloatingHomeButton = React.memo(({ onPress, style, isChatActive }: FloatingHomeButtonProps) => {
    const { theme } = useTheme();
    const colors = Colors[theme];

    return (
        <Animated.View
            style={[
                styles.fabContainer,
                { backgroundColor: colors.primary },
                style,
            ]}
            pointerEvents={isChatActive ? 'auto' : 'none'}
        >
            <Pressable
                onPress={onPress}
                style={({ pressed }) => [
                    styles.fabButton,
                    { opacity: pressed ? 0.8 : 1 }
                ]}
                accessibilityRole="button"
                accessibilityLabel="Home"
            >
                <Ionicons
                    name="home"
                    size={26}
                    color={colors.white}
                />
            </Pressable>
        </Animated.View>
    );
});

const styles = StyleSheet.create({
    fabContainer: {
        position: 'absolute',
        right: 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    fabButton: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
