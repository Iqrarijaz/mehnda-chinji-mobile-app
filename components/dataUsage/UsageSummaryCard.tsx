import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedProps,
    withTiming,
    SlideInLeft
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { ThemedText } from '../themedText';
import { splitBytes } from '@/utils/dataUsageUtils';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const RADIUS = 70;
const STROKE = 12;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface UsageSummaryCardProps {
    totalBytes: number;
    resetDate: string;
}

export const UsageSummaryCard = ({ totalBytes, resetDate }: UsageSummaryCardProps) => {
    const { value, unit } = splitBytes(totalBytes);
    const progress = useSharedValue(0);

    useEffect(() => {
        // Simple animation to show it's "loading" or has data
        progress.value = withTiming(0.75, { duration: 1500 }); // Placeholder progress
    }, [totalBytes]);

    const animatedProps = useAnimatedProps(() => ({
        strokeDashoffset: CIRCUMFERENCE * (1 - progress.value),
    }));

    const dateStr = new Date(resetDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });

    return (
        <Animated.View
            entering={SlideInLeft.delay(100).duration(500)}
            style={styles.card}
        >
            <View style={styles.chartContainer}>
                <Svg width={RADIUS * 2 + STROKE} height={RADIUS * 2 + STROKE} style={styles.svg}>
                    <Circle
                        cx={RADIUS + STROKE / 2}
                        cy={RADIUS + STROKE / 2}
                        r={RADIUS}
                        stroke="#F1F5F9"
                        strokeWidth={STROKE}
                        fill="none"
                    />
                    <AnimatedCircle
                        cx={RADIUS + STROKE / 2}
                        cy={RADIUS + STROKE / 2}
                        r={RADIUS}
                        stroke="#009688"
                        strokeWidth={STROKE}
                        strokeDasharray={CIRCUMFERENCE}
                        animatedProps={animatedProps}
                        strokeLinecap="round"
                        fill="none"
                        rotation="-90"
                        originX={RADIUS + STROKE / 2}
                        originY={RADIUS + STROKE / 2}
                    />
                </Svg>
                <View style={styles.centerText}>
                    <ThemedText style={styles.value}>{value}</ThemedText>
                    <ThemedText style={styles.unit}>{unit}</ThemedText>
                </View>
            </View>

            <View style={styles.infoContainer}>
                <ThemedText style={styles.label}>Total App Usage</ThemedText>
                <ThemedText style={styles.dateLabel}>Since {dateStr}</ThemedText>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#FFFFFF',
        marginHorizontal: 20,
        borderRadius: 24,
        padding: 24,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        marginBottom: 20,
    },
    chartContainer: {
        width: 100,
        height: 100,
        justifyContent: 'center',
        alignItems: 'center',
    },
    svg: {
        position: 'absolute',
        transform: [{ scale: 0.65 }]
    },
    centerText: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    value: {
        fontSize: 22,
        fontWeight: '900',
        color: '#0F172A',
    },
    unit: {
        fontSize: 12,
        fontWeight: '700',
        color: '#64748B',
        textTransform: 'uppercase',
    },
    infoContainer: {
        flex: 1,
        gap: 4,
    },
    label: {
        fontSize: 16,
        fontWeight: '800',
        color: '#0F172A',
    },
    dateLabel: {
        fontSize: 13,
        color: '#94A3B8',
        fontWeight: '500',
    },
});
