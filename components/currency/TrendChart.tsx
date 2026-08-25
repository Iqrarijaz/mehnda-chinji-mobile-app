import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

import { ThemedText } from '@/components/ThemedText';
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

function hexToRgba(hex: string, opacity: number): string {
    const clean = hex.replace('#', '');
    const bigint = parseInt(clean, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

function formatAxisDate(dateStr: string) {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * 30-day trend line chart shared by the Currency and Metals trend modals.
 * Built on react-native-chart-kit (already used for WeatherHourly) rather
 * than a bespoke chart, to match this app's established charting approach.
 */
export const TrendChart: React.FC<TrendChartProps> = React.memo(({ points, width, height = 140 }: TrendChartProps) => {
    const { theme, isDark } = useTheme();
    const colors = Colors[theme];

    const stats = useMemo(() => {
        if (points.length < 2) return null;
        const values = points.map((p) => p.value);
        const min = Math.min(...values);
        const max = Math.max(...values);
        const first = values[0];
        const last = values[values.length - 1];
        const changePct = first !== 0 ? ((last - first) / first) * 100 : 0;
        return { min, max, changePct };
    }, [points]);

    if (!stats) {
        return (
            <View style={[styles.emptyWrap, { height }]}>
                <ThemedText style={{ color: colors.textSecondary, fontSize: 12.5 }}>
                    Not enough history yet — check back tomorrow.
                </ThemedText>
            </View>
        );
    }

    const isPositive = stats.changePct >= 0;
    const lineColor = isPositive ? colors.success : colors.danger;

    const chartData = {
        labels: points.map(() => ''), // dates rendered separately below to avoid label clutter at 30 points
        datasets: [{
            data: points.map((p) => p.value),
            color: (opacity = 1) => hexToRgba(lineColor, opacity),
            strokeWidth: 2.5,
        }],
    };

    return (
        <View>
            <View style={styles.headerRow}>
                <View>
                    <ThemedText style={[styles.rangeLabel, { color: colors.textSecondary }]}>30-day range (PKR)</ThemedText>
                    <ThemedText style={styles.rangeValue}>
                        {stats.min.toLocaleString('en-US', { maximumFractionDigits: 2 })} – {stats.max.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                    </ThemedText>
                </View>
                <View style={[styles.changeBadge, { backgroundColor: lineColor + '18' }]}>
                    <Ionicons name={isPositive ? 'trending-up' : 'trending-down'} size={13} color={lineColor} />
                    <ThemedText style={[styles.changeText, { color: lineColor }]}>
                        {isPositive ? '+' : ''}{stats.changePct.toFixed(2)}%
                    </ThemedText>
                </View>
            </View>

            <LineChart
                data={chartData}
                width={width}
                height={height}
                withDots={false}
                withShadow
                withInnerLines
                withOuterLines={false}
                withVerticalLines={false}
                withHorizontalLabels
                withVerticalLabels={false}
                bezier
                chartConfig={{
                    backgroundGradientFrom: colors.card,
                    backgroundGradientFromOpacity: 0,
                    backgroundGradientTo: colors.card,
                    backgroundGradientToOpacity: 0,
                    decimalPlaces: 0,
                    color: (opacity = 1) => hexToRgba(lineColor, opacity),
                    labelColor: (opacity = 1) => hexToRgba(colors.textSecondary, opacity),
                    fillShadowGradientFrom: lineColor,
                    fillShadowGradientFromOpacity: 0.25,
                    fillShadowGradientTo: lineColor,
                    fillShadowGradientToOpacity: 0,
                    propsForBackgroundLines: {
                        stroke: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                        strokeDasharray: '4',
                    },
                    propsForLabels: { fontSize: 9.5 },
                }}
                segments={3}
                style={styles.chart}
            />

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
});

const styles = StyleSheet.create({
    emptyWrap: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 12,
        marginBottom: 2,
    },
    rangeLabel: {
        fontSize: 10.5,
        fontWeight: '500',
        marginBottom: 1,
    },
    rangeValue: {
        fontSize: 13,
        fontWeight: '700',
    },
    changeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 20,
        gap: 3,
    },
    changeText: {
        fontSize: 11.5,
        fontWeight: '700',
    },
    chart: {
        marginLeft: -16, // pull flush with card left edge so graph spans full width
        paddingRight: 0,
        paddingTop: 0,
        paddingBottom: 0,
    },
    axisRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 2,
        paddingHorizontal: 12,
    },
    axisLabel: {
        fontSize: 10,
        fontWeight: '500',
    },
});
