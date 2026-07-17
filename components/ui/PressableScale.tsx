import React from 'react';
import { Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface PressableScaleProps extends PressableProps {
    /** Scale applied while pressed. Defaults to 0.96. */
    pressedScale?: number;
    style?: StyleProp<ViewStyle>;
    children?: React.ReactNode;
}

/**
 * Shared press micro-interaction: springs down on press-in and back on
 * release, with a subtle opacity dip. Runs entirely on the UI thread.
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
                scale.value = withSpring(pressedScale, { damping: 15, stiffness: 300 });
                opacity.value = withTiming(0.9, { duration: 90 });
                onPressIn?.(e);
            }}
            onPressOut={(e) => {
                scale.value = withSpring(1, { damping: 15, stiffness: 300 });
                opacity.value = withTiming(1, { duration: 120 });
                onPressOut?.(e);
            }}
            style={[animatedStyle, style]}
        >
            {children}
        </AnimatedPressable>
    );
});

export default PressableScale;
