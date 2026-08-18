import React, { useState } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Svg, { Line } from 'react-native-svg';

const DASH = 1.5;
const GAP = 7;

interface FlowingLineProps {
    /** Draw vertically (top→bottom) instead of horizontally (left→right). */
    vertical?: boolean;
    color: string;
    thickness?: number;
    /** Kept for API compatibility; the line always renders static now. */
    animated?: boolean;
    style?: ViewStyle;
}

/**
 * A static dashed line suggesting movement along a route.
 */
export const FlowingLine = React.memo(function FlowingLine({
    vertical = false,
    color,
    thickness = 2,
    style }: FlowingLineProps) {
    const [length, setLength] = useState(0);
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
                    <Line
                        x1={vertical ? half : 0}
                        y1={vertical ? 0 : half}
                        x2={vertical ? half : length}
                        y2={vertical ? length : half}
                        stroke={color}
                        strokeWidth={thickness}
                        strokeLinecap="round"
                        strokeDasharray={`${DASH} ${GAP}`}
                    />
                </Svg>
            )}
        </View>
    );
});
