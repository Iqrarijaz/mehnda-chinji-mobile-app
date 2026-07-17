import React from 'react';
import { Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';

const PRESS_IN = { duration: 110, easing: Easing.out(Easing.quad) };
const PRESS_OUT = { duration: 180, easing: Easing.out(Easing.cubic) };

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface PressableScaleProps extends PressableProps {
    /** Scale applied while pressed. Defaults to 0.96. */
    pressedScale?: number;
    style?: StyleProp<ViewStyle>;
    children?: React.ReactNode;
}

/**
 * Shared press micro-interaction: eases down on press-in and back on
 * release, with a subtle opacity dip. Smooth timing curves (no bounce),
 * running entirely on the UI thread.
 */
export const PressableScale = React.memo(function PressableScale({
    pressedScale = 0.96,
    style,
    children,
    onPressIn,
    onPressOut,
    ...rest
}: PressableScaleProps) {
    const scale = useSharedValue(1);
    const opacity = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: opacity.value,
    }));

    return (
        <AnimatedPressable
            {...rest}
            onPressIn={(e) => {
                scale.value = withTiming(pressedScale, PRESS_IN);
                opacity.value = withTiming(0.92, PRESS_IN);
                onPressIn?.(e);
            }}
            onPressOut={(e) => {
                scale.value = withTiming(1, PRESS_OUT);
                opacity.value = withTiming(1, PRESS_OUT);
                onPressOut?.(e);
            }}
            style={[animatedStyle, style]}
        >
            {children}
        </AnimatedPressable>
    );
});

export default PressableScale;
