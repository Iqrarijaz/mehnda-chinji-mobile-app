import React, { useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';

interface SparklineProps {
    values: number[];
    width: number;
    height: number;
    color: string;
    /** Fills under the line with a fade of `color`. */
    filled?: boolean;
    strokeWidth?: number;
}

/**
 * Small trend line for a price series.
 *
 * Drawn with a Catmull-Rom spline converted to cubic beziers rather than
 * straight segments: a week of daily prices is only seven points, and joining
 * them with corners reads as noise where a smooth line reads as a trend. The
 * conversion is exact, so the curve still passes through every real datum -- no
 * invented values between them.
 */
function SparklineComponent({ values, width, height, color, filled = true, strokeWidth = 2 }: SparklineProps) {
    const { line, area, lastX, lastY } = useMemo(() => {
        const pad = strokeWidth + 1;
        const n = values.length;
        if (n === 0) return { line: '', area: '', lastX: 0, lastY: 0 };

        const min = Math.min(...values);
        const max = Math.max(...values);
        // A flat series would divide by zero; centre it instead of collapsing
        // it onto the baseline, which would read as a crash to nothing.
        const span = max - min || 1;
        const usableH = height - pad * 2;

        const pts = values.map((v, i) => ({
            x: n === 1 ? width / 2 : (i / (n - 1)) * (width - pad * 2) + pad,
            y: max === min ? height / 2 : pad + (1 - (v - min) / span) * usableH,
        }));

        if (n === 1) {
            return { line: '', area: '', lastX: pts[0].x, lastY: pts[0].y };
        }

        let d = `M ${pts[0].x} ${pts[0].y}`;
        for (let i = 0; i < n - 1; i++) {
            const p0 = pts[i - 1] || pts[i];
            const p1 = pts[i];
            const p2 = pts[i + 1];
            const p3 = pts[i + 2] || p2;
            // Catmull-Rom -> bezier control points (tension 1/6).
            const c1x = p1.x + (p2.x - p0.x) / 6;
            const c1y = p1.y + (p2.y - p0.y) / 6;
            const c2x = p2.x - (p3.x - p1.x) / 6;
            const c2y = p2.y - (p3.y - p1.y) / 6;
            d += ` C ${c1x} ${c1y} ${c2x} ${c2y} ${p2.x} ${p2.y}`;
        }

        const last = pts[n - 1];
        return {
            line: d,
            area: `${d} L ${last.x} ${height} L ${pts[0].x} ${height} Z`,
            lastX: last.x,
            lastY: last.y,
        };
    }, [values, width, height, strokeWidth]);

    if (!values.length) return <View style={{ width, height }} />;

    return (
        <Svg width={width} height={height}>
            <Defs>
                <LinearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor={color} stopOpacity={0.30} />
                    <Stop offset="1" stopColor={color} stopOpacity={0} />
                </LinearGradient>
            </Defs>
            {filled && area ? <Path d={area} fill="url(#sparkFill)" /> : null}
            {line ? (
                <Path d={line} stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            ) : null}
            {/* Latest reading, so the eye lands on today rather than the curve. */}
            <Circle cx={lastX} cy={lastY} r={strokeWidth + 1.2} fill={color} />
            <Circle cx={lastX} cy={lastY} r={strokeWidth + 3.2} fill={color} fillOpacity={0.25} />
        </Svg>
    );
}

export const Sparkline = React.memo(SparklineComponent);
Sparkline.displayName = 'Sparkline';
