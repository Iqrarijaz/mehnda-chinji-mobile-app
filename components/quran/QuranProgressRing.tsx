import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

interface QuranProgressRingProps {
    /** 0-1 */
    progress: number;
    size?: number;
    strokeWidth?: number;
    color: string;
    trackColor: string;
    children?: React.ReactNode;
}

/**
 * A plain circular progress ring (SVG) with arbitrary center content —
 * used for the Quran completion tracker's "X% complete" display.
 */
export function QuranProgressRing({
    progress,
    size = 84,
    strokeWidth = 8,
    color,
    trackColor,
    children,
}: QuranProgressRingProps) {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const clamped = Math.max(0, Math.min(1, progress));
    const strokeDashoffset = circumference * (1 - clamped);

    return (
        <View style={{ width: size, height: size }}>
            <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
                <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={trackColor}
                    strokeWidth={strokeWidth}
                    fill="none"
                />
                <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={color}
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    rotation={-90}
                    origin={`${size / 2}, ${size / 2}`}
                />
            </Svg>
            <View style={styles.center}>{children}</View>
        </View>
    );
}

const styles = StyleSheet.create({
    center: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
