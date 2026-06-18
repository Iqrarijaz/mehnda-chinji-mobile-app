import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { ThemedText } from '@/components/themedText';

// ── Progress Ring Component (SVG) ──
interface ProgressRingProps {
    size?: number;
    strokeWidth?: number;
    progress: number;
    color: string;
    trackColor?: string;
    children?: React.ReactNode;
}

export const ProgressRing = React.memo(({
    size = 120,
    strokeWidth = 10,
    progress,
    color,
    trackColor = 'rgba(255,255,255,0.1)',
    children
}: ProgressRingProps) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - Math.max(0, Math.min(progress, 1)) * circumference;

    return (
        <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
            <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
                <Circle
                    stroke={trackColor}
                    fill="none"
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    strokeWidth={strokeWidth}
                />
                <Circle
                    stroke={color}
                    fill="none"
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    strokeWidth={strokeWidth}
                    strokeDasharray={`${circumference} ${circumference}`}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    transform={`rotate(-90 ${size / 2} ${size / 2})`}
                />
            </Svg>
            {children}
        </View>
    );
});

ProgressRing.displayName = 'ProgressRing';


// ── Weekly Bar Chart Component (Custom Pure Views) ──
interface ChartDayData {
    dayLabel: string; // "Mo", "Tu", etc.
    percentage: number; // 0 to 1
    count: number; // count of completed prayers e.g. 3
}

interface WeeklyBarChartProps {
    colors: any;
    accentColor: string;
    data: ChartDayData[];
}

export const WeeklyBarChart = React.memo(({
    colors,
    accentColor,
    data
}: WeeklyBarChartProps) => {
    return (
        <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
            <ThemedText style={styles.chartTitle}>Weekly Consistency</ThemedText>
            <ThemedText style={[styles.chartSub, { color: colors.textSecondary }]}>Percentage of completed daily prayers</ThemedText>
            
            <View style={styles.barsContainer}>
                {data.map((item, idx) => {
                    const fillHeight = `${Math.round(item.percentage * 100)}%`;
                    
                    return (
                        <View key={idx} style={styles.barColumn}>
                            {/* Bar Track */}
                            <View style={[styles.barTrack, { backgroundColor: colors.border }]}>
                                {/* Bar Fill */}
                                <View 
                                    style={[
                                        styles.barFill, 
                                        { 
                                            height: fillHeight, 
                                            backgroundColor: item.percentage > 0.8 ? accentColor : (item.percentage > 0.4 ? '#F59E0B' : '#EF4444') 
                                        }
                                    ]} 
                                />
                            </View>
                            {/* Day Label */}
                            <ThemedText style={[styles.barLabel, { color: colors.textSecondary }]}>
                                {item.dayLabel}
                            </ThemedText>
                            {/* Small count */}
                            <ThemedText style={[styles.barCount, { color: colors.textSecondary }]}>
                                {item.count}/5
                            </ThemedText>
                        </View>
                    );
                })}
            </View>
        </View>
    );
});

WeeklyBarChart.displayName = 'WeeklyBarChart';

const styles = StyleSheet.create({
    chartCard: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
    },
    chartTitle: {
        fontSize: 16,
        fontWeight: '700',
    },
    chartSub: {
        fontSize: 11,
        marginTop: 2,
        marginBottom: 20,
    },
    barsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        height: 140,
        paddingHorizontal: 4,
    },
    barColumn: {
        alignItems: 'center',
        height: '100%',
        width: '12%',
    },
    barTrack: {
        width: 8,
        flex: 1,
        borderRadius: 4,
        overflow: 'hidden',
        justifyContent: 'flex-end',
    },
    barFill: {
        width: '100%',
        borderRadius: 4,
    },
    barLabel: {
        fontSize: 11,
        fontWeight: '700',
        marginTop: 8,
    },
    barCount: {
        fontSize: 8,
        marginTop: 1,
    },
});
