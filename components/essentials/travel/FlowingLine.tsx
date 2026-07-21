import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Svg, { Line } from 'react-native-svg';
import Animated, {
    Easing,
    useAnimatedProps,
    useSharedValue,
    withRepeat,
    withTiming } from 'react-native-reanimated';

const AnimatedLine = Animated.createAnimatedComponent(Line);

const DASH = 1.5;
const GAP = 7;

interface FlowingLineProps {
    /** Draw vertically (top→bottom) instead of horizontally (left→right). */
    vertical?: boolean;
    color: string;
    thickness?: number;
    /** Stops the dash-flow loop and renders a static dashed line. */
    animated?: boolean;
    style?: ViewStyle;
}

/**
 * A dashed line whose dashes drift slowly along the travel direction,
 * suggesting movement along a route. Pure UI-thread animation: only
 * strokeDashoffset changes each frame.
 */
export function FlowingLine({
    vertical = false,
    color,
    thickness = 2,
    animated = true,
    style }: FlowingLineProps) {
    const [length, setLength] = useState(0);
    const offset = useSharedValue(0);

    useEffect(() => {
        if (!animated) return;
        offset.value = withRepeat(
            withTiming(-(DASH + GAP) * 4, { duration: 1600, easing: Easing.linear }),
            -1,
            false
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [animated]);

    const animatedProps = useAnimatedProps(() => ({
        strokeDashoffset: offset.value }));

    const half = thickness / 2;

    return (
        <View
            style={[vertical ? { width: thickness } : { height: thickness }, style]}
            onLayout={e =>
                setLength(vertical ? e.nativeEvent.layout.height : e.nativeEvent.layout.width)
            }
        >
            {length > 0 && (
                <Svg
                    width={vertical ? thickness : length}
                    height={vertical ? length : thickness}
                    style={StyleSheet.absoluteFill}
                >
                    <AnimatedLine
                        x1={vertical ? half : 0}
                        y1={vertical ? 0 : half}
                        x2={vertical ? half : length}
                        y2={vertical ? length : half}
                        stroke={color}
                        strokeWidth={thickness}
                        strokeLinecap="round"
                        strokeDasharray={`${DASH} ${GAP}`}
                        animatedProps={animatedProps}
                    />
                </Svg>
            )}
        </View>
    );
}
