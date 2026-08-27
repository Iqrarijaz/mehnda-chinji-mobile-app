import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';

import { ThemedText } from '@/components/ThemedText';
import { ThemeColors } from '@/constants/colors';

interface CompassDialProps {
    size: number;
    colors: ThemeColors;
    /** Rotation of the rose (ticks + cardinals), driven on the UI thread. */
    roseStyle: any;
    /** Rotation of the Kaaba marker, same driver. */
    markerStyle: any;
    /** True while the device points at the Qibla. */
    aligned: boolean;
    /** Degrees the device is currently off Qibla, for the hub readout. */
    offsetDeg: number | null;
}

/**
 * The compass face.
 *
 * Drawn as SVG rather than nested Views: sixty tick marks positioned by
 * transform strings would be sixty native views to lay out, where here they are
 * one line each inside a single canvas. It also lets the ticks carry real
 * graduation -- long every 30°, short every 6° -- which is what makes the dial
 * read as an instrument rather than a decorated circle.
 *
 * The two moving parts are separate layers rotated by plain view transforms.
 * Animating SVG's own `rotation` prop would work, but a transform on a wrapping
 * Animated.View is the better-trodden path across reanimated/svg versions and
 * costs nothing here, since each layer is a single flat canvas.
 */
function CompassDialComponent({ size, colors, roseStyle, markerStyle, aligned, offsetDeg }: CompassDialProps) {
    const c = size / 2;
    const outerR = c - 2;
    const ringR = c - 15;
    const tickOuterR = ringR - 9;
    const labelR = tickOuterR - 28;
    const hubR = Math.max(28, size * 0.115);

    const accent = aligned ? colors.success : colors.primary;

    // Tick geometry depends only on size, so build it once per size.
    const ticks = useMemo(() => {
        const out: { x1: number; y1: number; x2: number; y2: number; major: boolean }[] = [];
        for (let deg = 0; deg < 360; deg += 6) {
            const major = deg % 30 === 0;
            const len = major ? 13 : 6;
            // -90 so 0° points up; SVG angles start on the positive x-axis.
            const rad = ((deg - 90) * Math.PI) / 180;
            const cos = Math.cos(rad);
            const sin = Math.sin(rad);
            out.push({
                x1: c + cos * tickOuterR,
                y1: c + sin * tickOuterR,
                x2: c + cos * (tickOuterR - len),
                y2: c + sin * (tickOuterR - len),
                major,
            });
        }
        return out;
    }, [c, tickOuterR]);

    const cardinals = useMemo(() => (
        [{ label: 'N', deg: 0 }, { label: 'E', deg: 90 }, { label: 'S', deg: 180 }, { label: 'W', deg: 270 }]
            .map(({ label, deg }) => {
                const rad = ((deg - 90) * Math.PI) / 180;
                return { label, x: c + Math.cos(rad) * labelR, y: c + Math.sin(rad) * labelR };
            })
    ), [c, labelR]);

    return (
        <View style={{ width: size, height: size }}>
            {/* Static face */}
            <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
                <Circle cx={c} cy={c} r={outerR} fill={colors.card} />
                <Circle cx={c} cy={c} r={outerR} stroke={colors.border} strokeWidth={1} fill="none" />
                <Circle cx={c} cy={c} r={ringR} stroke={accent} strokeOpacity={0.22} strokeWidth={1.5} fill="none" />
            </Svg>

            {/* Rose — rotates opposite the device so north stays true. */}
            <Animated.View style={[StyleSheet.absoluteFill, roseStyle]}>
                <Svg width={size} height={size}>
                    {ticks.map((t, i) => (
                        <Line
                            key={i}
                            x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
                            stroke={t.major ? colors.text : colors.textSecondary}
                            strokeOpacity={t.major ? 0.7 : 0.3}
                            strokeWidth={t.major ? 2 : 1}
                            strokeLinecap="round"
                        />
                    ))}
                    {cardinals.map(({ label, x, y }) => (
                        <SvgText
                            key={label}
                            x={x}
                            y={y}
                            dy={label === 'N' ? 6 : 5}
                            fill={label === 'N' ? colors.danger : colors.textSecondary}
                            fontSize={label === 'N' ? 17 : 14}
                            fontWeight={label === 'N' ? 'bold' : 'normal'}
                            textAnchor="middle"
                        >
                            {label}
                        </SvgText>
                    ))}
                </Svg>
            </Animated.View>

            {/* Kaaba marker — a wedge on the ring at the Qibla bearing. */}
            <Animated.View style={[StyleSheet.absoluteFill, markerStyle]}>
                <Svg width={size} height={size}>
                    <Line
                        x1={c} y1={c - ringR + 18} x2={c} y2={c - hubR - 4}
                        stroke={accent}
                        strokeOpacity={0.4}
                        strokeWidth={2}
                        strokeDasharray="5 6"
                        strokeLinecap="round"
                    />
                    <Path
                        d={`M ${c} ${c - ringR - 7} L ${c - 11} ${c - ringR + 15} L ${c + 11} ${c - ringR + 15} Z`}
                        fill={accent}
                    />
                </Svg>
            </Animated.View>

            {/* Hub */}
            <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
                <Circle cx={c} cy={c} r={hubR} fill={colors.background} />
                <Circle cx={c} cy={c} r={hubR} stroke={accent} strokeOpacity={0.3} strokeWidth={1.5} fill="none" />
            </Svg>

            {/* Live readout. Plain text rather than SVG text so it inherits the
                app font and respects the user's text-size setting. */}
            <View style={styles.hub} pointerEvents="none">
                <ThemedText style={[styles.hubValue, { color: aligned ? colors.success : colors.text }]}>
                    {offsetDeg === null ? '—' : `${Math.round(offsetDeg)}°`}
                </ThemedText>
                <ThemedText style={[styles.hubLabel, { color: aligned ? colors.success : colors.textSecondary }]}>
                    {aligned ? 'FACING' : 'OFF'}
                </ThemedText>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    hub: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
    hubValue: { fontSize: 19, fontWeight: '900', lineHeight: 23 },
    hubLabel: { fontSize: 8.5, fontWeight: '800', letterSpacing: 1.2, marginTop: 1 },
});

export const CompassDial = React.memo(CompassDialComponent);
CompassDial.displayName = 'CompassDial';
