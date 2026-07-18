import React from 'react';
import { Pressable, StyleProp, ViewStyle } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';

interface PressableScaleProps {
    onPress?: () => void;
    disabled?: boolean;
    /** How far the element shrinks while pressed (0.03 = 3%). */
    intensity?: number;
    /** Style for the outer animated wrapper (flex sizing lives here). */
    containerStyle?: StyleProp<ViewStyle>;
    /** Style for the pressable surface itself. */
    style?: StyleProp<ViewStyle>;
    children: React.ReactNode;
}

/**
 * Press-feedback wrapper shared by all category detail pages: the surface
 * gently scales down while pressed. Pure transform, runs on the UI thread.
 */
function PressableScaleComponent({
    onPress,
    disabled,
    intensity = 0.03,
    containerStyle,
    style,
    children,
}: PressableScaleProps) {
    const pressed = useSharedValue(0);

    const animStyle = useAnimatedStyle(() => ({
        transform: [{ scale: 1 - pressed.value * intensity }],
    }));

    return (
        <Animated.View style={[containerStyle, animStyle]}>
            <Pressable
                onPress={disabled ? undefined : onPress}
                onPressIn={() => !disabled && (pressed.value = withTiming(1, { duration: 100 }))}
                onPressOut={() => (pressed.value = withTiming(0, { duration: 160 }))}
                style={style}
            >
                {children}
            </Pressable>
        </Animated.View>
    );
}

export const PressableScale = React.memo(PressableScaleComponent);
PressableScale.displayName = 'PressableScale';
