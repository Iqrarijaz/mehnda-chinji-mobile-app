import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import { ThemedText } from '@/components/themedText';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';

export interface TrendChartPoint {
    date: string;
    value: number;
}

interface TrendChartProps {
    points: TrendChartPoint[];
    width: number;
    height?: number;
}

const CHART_PADDING_Y = 16;

function formatAxisDate(dateStr: string) {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Lightweight SVG line chart for the 30-day trend view — deliberately built
 * on react-native-svg (already a dependency) instead of pulling in a full
 * charting library, matching how the flags avoid a heavy image package.
 */
export function TrendChart({ points, width, height = 150 }: TrendChartProps) {
    const { theme } = useTheme();
    const colors = Colors[theme];

    const chart = useMemo(() => {
        if (points.length < 2 || width <= 0) return null;

        const values = points.map((p) => p.value);
        const min = Math.min(...values);
        const max = Math.max(...values);
        const range = max - min || 1;

        const stepX = width / (points.length - 1);
        const usableHeight = height - CHART_PADDING_Y * 2;

        const coords = points.map((p, i) => ({
            x: i * stepX,
            y: CHART_PADDING_Y + usableHeight - ((p.value - min) / range) * usableHeight,
        }));

        const linePath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(2)} ${c.y.toFixed(2)}`).join(' ');
        const areaPath = `${linePath} L ${coords[coords.length - 1].x.toFixed(2)} ${height} L 0 ${height} Z`;

        const first = values[0];
        const last = values[values.length - 1];
        const changePct = first !== 0 ? ((last - first) / first) * 100 : 0;

        return { linePath, areaPath, min, max, changePct, lastPoint: coords[coords.length - 1] };
    }, [points, width, height]);

    if (!chart) {
        return (
            <View style={[styles.emptyWrap, { height }]}>
                <ThemedText style={{ color: colors.textSecondary, fontSize: 13 }}>
                    Not enough history yet — check back tomorrow.
                </ThemedText>
            </View>
        );
    }

    const { linePath, areaPath, min, max, changePct, lastPoint } = chart;
    const isPositive = changePct >= 0;
    const lineColor = isPositive ? '#10B981' : '#EF4444';
    const gradientId = 'trendFillGradient';

    return (
        <View>
            <View style={styles.headerRow}>
                <View>
                    <ThemedText style={[styles.rangeLabel, { color: colors.textSecondary }]}>30-day range (PKR)</ThemedText>
                    <ThemedText style={styles.rangeValue}>
                        {min.toLocaleString('en-US', { maximumFractionDigits: 2 })} – {max.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                    </ThemedText>
                </View>
                <View style={[styles.changeBadge, { backgroundColor: lineColor + '18' }]}>
                    <Ionicons name={isPositive ? 'trending-up' : 'trending-down'} size={14} color={lineColor} />
                    <ThemedText style={[styles.changeText, { color: lineColor }]}>
                        {isPositive ? '+' : ''}{changePct.toFixed(2)}%
                    </ThemedText>
                </View>
            </View>

            <Svg width={width} height={height}>
                <Defs>
                    <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor={lineColor} stopOpacity={0.28} />
                        <Stop offset="1" stopColor={lineColor} stopOpacity={0} />
                    </LinearGradient>
                </Defs>
                <Path d={areaPath} fill={`url(#${gradientId})`} stroke="none" />
                <Path d={linePath} fill="none" stroke={lineColor} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
                <Circle cx={lastPoint.x} cy={lastPoint.y} r={4} fill={lineColor} stroke="#FFFFFF" strokeWidth={1.5} />
            </Svg>

            <View style={styles.axisRow}>
                <ThemedText style={[styles.axisLabel, { color: colors.textSecondary }]}>
                    {formatAxisDate(points[0].date)}
                </ThemedText>
                <ThemedText style={[styles.axisLabel, { color: colors.textSecondary }]}>
                    {formatAxisDate(points[points.length - 1].date)}
                </ThemedText>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    emptyWrap: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    rangeLabel: {
        fontSize: 11,
        fontWeight: '500',
        marginBottom: 2,
    },
    rangeValue: {
        fontSize: 14,
        fontWeight: '700',
    },
    changeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 4,
    },
    changeText: {
        fontSize: 13,
        fontWeight: '700',
    },
    axisRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 6,
    },
    axisLabel: {
        fontSize: 11,
        fontWeight: '500',
    },
});
