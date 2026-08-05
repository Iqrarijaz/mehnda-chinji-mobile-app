import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, View } from 'react-native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { Text as SvgText } from 'react-native-svg';
import { ThemedText } from '../ThemedText';
import { getIconName } from './weatherUtils';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';

const RAIN_BLUE = '#3B82F6';
const HOUR_WIDTH = 52;
const TEMP_CHART_HEIGHT = 150;
const RAIN_CHART_HEIGHT = 100;

function hexToRgba(hex: string, opacity: number): string {
    const clean = hex.replace('#', '');
    const bigint = parseInt(clean, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

interface HourlyPoint { time: string; icon: string; temp: number; pop: number; }
interface WeatherHourlyProps { data: HourlyPoint[]; }

const WeatherHourly = React.memo(({ data }: WeatherHourlyProps) => {
    const { theme, isDark } = useTheme();
    const colors = Colors[theme];
    const [selectedIndex, setSelectedIndex] = useState(0);

    const chartWidth = useMemo(
        () => Math.max(Dimensions.get('window').width - 64, data.length * HOUR_WIDTH),
        [data.length]
    );

    const tempChartData = useMemo(() => ({
        labels: data.map(h => h.time),
        datasets: [{
            data: data.map(h => h.temp),
            color: (opacity = 1) => hexToRgba(colors.primary, opacity),
            strokeWidth: 3
        }]
    }), [data, colors.primary]);

    const rainChartData = useMemo(() => ({
        labels: data.map(h => h.time),
        datasets: [{ data: data.map(h => h.pop) }]
    }), [data]);

    if (!data.length) return null;

    const selected = data[selectedIndex] || data[0];

    const sharedChartConfig = {
        // Fully transparent chart background so the wrapping card's own
        // background shows through instead of the chart painting its own.
        backgroundGradientFrom: colors.card,
        backgroundGradientFromOpacity: 0,
        backgroundGradientTo: colors.card,
        backgroundGradientToOpacity: 0,
        decimalPlaces: 0,
        labelColor: (opacity = 1) => hexToRgba(colors.textSecondary, opacity),
        propsForBackgroundLines: {
            stroke: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
            strokeDasharray: '4' },
        propsForLabels: { fontSize: 10 }
    };

    return (
        <View style={[styles.wrapper, { backgroundColor: colors.cardBg }]}>
            <View style={styles.headerRow}>
                <ThemedText style={[styles.title, { color: colors.text }]}>Hourly Forecast</ThemedText>
                <ThemedText style={[styles.selectedSummary, { color: colors.textSecondary }]}>
                    {selected.time} · {selected.temp}° · {selected.pop}% rain
                </ThemedText>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View>
                    {/* Condition icons — quick at-a-glance strip above the curve */}
                    <View style={[styles.iconRow, { width: chartWidth }]}>
                        {data.map((h, i) => (
                            <View key={i} style={[styles.iconCell, { width: chartWidth / data.length }]}>
                                <Ionicons
                                    name={getIconName(h.icon) as any}
                                    size={16}
                                    color={i === selectedIndex ? colors.primary : colors.textSecondary}
                                />
                            </View>
                        ))}
                    </View>

                    {/* Temperature curve — tap any point to see its details above */}
                    <LineChart
                        data={tempChartData}
                        width={chartWidth}
                        height={TEMP_CHART_HEIGHT}
                        chartConfig={{
                            ...sharedChartConfig,
                            color: (opacity = 1) => hexToRgba(colors.primary, opacity),
                            fillShadowGradientFrom: colors.primary,
                            fillShadowGradientFromOpacity: 0.25,
                            fillShadowGradientTo: colors.primary,
                            fillShadowGradientToOpacity: 0,
                            propsForDots: { r: '3.5', strokeWidth: '2', stroke: colors.primary }
                        }}
                        bezier
                        withShadow
                        withInnerLines
                        withOuterLines={false}
                        withVerticalLines={false}
                        yAxisLabel=""
                        yAxisSuffix="°"
                        yLabelsOffset={8}
                        segments={3}
                        getDotColor={(_, i) => i === selectedIndex ? colors.secondary : colors.primary}
                        onDataPointClick={({ index }) => setSelectedIndex(index)}
                        renderDotContent={({ x, y, index }) => (
                            <SvgText
                                key={index}
                                x={x}
                                y={y - 10}
                                fontSize={9.5}
                                fontWeight="700"
                                fill={colors.text}
                                textAnchor="middle"
                            >
                                {data[index].temp}°
                            </SvgText>
                        )}
                        style={styles.chart}
                    />

                    {/* Precipitation chance */}
                    <View style={styles.rainHeaderRow}>
                        <Ionicons name="rainy" size={12} color={RAIN_BLUE} />
                        <ThemedText style={[styles.rainLabel, { color: colors.textSecondary }]}>Chance of rain</ThemedText>
                    </View>
                    <BarChart
                        data={rainChartData}
                        width={chartWidth}
                        height={RAIN_CHART_HEIGHT}
                        chartConfig={{
                            ...sharedChartConfig,
                            color: (opacity = 1) => hexToRgba(RAIN_BLUE, opacity),
                            fillShadowGradient: RAIN_BLUE,
                            fillShadowGradientOpacity: 0.85,
                            barPercentage: 0.5
                        }}
                        fromZero
                        withInnerLines={false}
                        withHorizontalLabels={false}
                        showValuesOnTopOfBars
                        yAxisLabel=""
                        yAxisSuffix="%"
                        style={styles.chart}
                    />
                </View>
            </ScrollView>
        </View>
    );
});

export default WeatherHourly;

const styles = StyleSheet.create({
    wrapper: {
        borderRadius: Layout.borderRadius, padding: 14, marginBottom: 14 },
    headerRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 8, flexWrap: 'wrap', gap: 4 },
    title: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },
    selectedSummary: { fontSize: 10, fontWeight: '600' },
    iconRow: { flexDirection: 'row', marginBottom: 2 },
    iconCell: { alignItems: 'center' },
    rainHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4, marginBottom: 2 },
    rainLabel: { fontSize: 9.5, fontWeight: '600' },
    chart: { marginVertical: 2 } });
