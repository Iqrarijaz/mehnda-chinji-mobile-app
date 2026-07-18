import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
    FadeInDown,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { FlowingLine } from './travel/FlowingLine';
import { SectionHeading } from './shared/SectionHeading';

interface TravelRouteProps {
    route: any[];
    primaryColor?: string;
}

const capitalize = (str: string) => {
    if (!str || typeof str !== 'string') return '';
    const words = str.toLowerCase().split(' ');
    return words.map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

function StopNode({ kind }: { kind: 'origin' | 'stop' | 'destination' }) {
    const { theme } = useTheme();
    const colors = Colors[theme];

    if (kind === 'origin') {
        return (
            <View style={[styles.terminalNode, { backgroundColor: colors.primary }]}>
                <Ionicons name="bus" size={14} color="#FFFFFF" />
            </View>
        );
    }
    if (kind === 'destination') {
        return (
            <View style={[styles.terminalNode, { backgroundColor: colors.secondary }]}>
                <Ionicons name="location" size={14} color="#FFFFFF" />
            </View>
        );
    }
    return (
        <View style={[styles.stopNodeOuter, { backgroundColor: `${colors.lime}30` }]}>
            <View style={[styles.stopNodeInner, { backgroundColor: colors.lime }]} />
        </View>
    );
}

function RouteStop({
    stop,
    index,
    isFirst,
    isLast,
}: {
    stop: any;
    index: number;
    isFirst: boolean;
    isLast: boolean;
}) {
    const { theme, isDark } = useTheme();
    const colors = Colors[theme];
    const pressed = useSharedValue(0);

    const pressStyle = useAnimatedStyle(() => ({
        transform: [{ scale: 1 - pressed.value * 0.02 }],
    }));

    const kind = isFirst ? 'origin' : isLast ? 'destination' : 'stop';

    return (
        <Animated.View entering={FadeInDown.delay(120 + index * 70).duration(400)}>
            <View style={styles.stopRow}>
                {/* Timeline column */}
                <View style={styles.timelineColumn}>
                    <StopNode kind={kind} />
                    {!isLast && (
                        <FlowingLine
                            vertical
                            color={`${colors.primary}55`}
                            style={styles.connector}
                        />
                    )}
                </View>

                {/* Stop card */}
                <Animated.View style={[styles.stopCardWrap, pressStyle]}>
                    <Pressable
                        onPressIn={() => (pressed.value = withTiming(1, { duration: 110 }))}
                        onPressOut={() => (pressed.value = withTiming(0, { duration: 160 }))}
                        style={[
                            styles.stopCard,
                            { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : colors.background },
                        ]}
                    >
                        <View style={styles.stopInfo}>
                            <ThemedText style={[styles.stopKind, { color: colors.textSecondary }]}>
                                {kind === 'origin' ? 'Departure' : kind === 'destination' ? 'Arrival Stop' : `Stop ${index + 1}`}
                            </ThemedText>
                            <ThemedText style={[styles.stopCity, { color: colors.text }]} numberOfLines={1}>
                                {capitalize(stop.city)}
                            </ThemedText>
                        </View>
                        {stop.time ? (
                            <View style={[styles.timeBadge, { backgroundColor: `${colors.lime}1E` }]}>
                                <Ionicons name="time-outline" size={12} color={colors.lime} />
                                <ThemedText style={[styles.timeText, { color: colors.text }]}>
                                    {stop.time}
                                </ThemedText>
                            </View>
                        ) : null}
                    </Pressable>
                </Animated.View>
            </View>
        </Animated.View>
    );
}

export function TravelRoute({ route }: TravelRouteProps) {
    if (!Array.isArray(route) || route.length === 0) return null;

    return (
        <View style={styles.section}>
            <SectionHeading
                icon="bus"
                label="Travel Schedule"
                pill={`${route.length} ${route.length === 1 ? 'Stop' : 'Stops'}`}
            />

            <View style={styles.timeline}>
                {route.map((stop: any, idx: number) => (
                    <RouteStop
                        key={idx}
                        stop={stop}
                        index={idx}
                        isFirst={idx === 0}
                        isLast={idx === route.length - 1}
                    />
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    section: {
        gap: 10,
    },
    timeline: {
        marginTop: 2,
    },
    stopRow: {
        flexDirection: 'row',
        gap: 12,
    },
    timelineColumn: {
        width: 28,
        alignItems: 'center',
    },
    terminalNode: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    stopNodeOuter: {
        width: 20,
        height: 20,
        borderRadius: 10,
        marginVertical: 4,
        justifyContent: 'center',
        alignItems: 'center',
    },
    stopNodeInner: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    connector: {
        flex: 1,
        marginVertical: 3,
    },
    stopCardWrap: {
        flex: 1,
        paddingBottom: 12,
    },
    stopCard: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 14,
        paddingHorizontal: 12,
        paddingVertical: 9,
        gap: 10,
    },
    stopInfo: {
        flex: 1,
    },
    stopKind: {
        fontSize: 9,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.6,
        marginBottom: 2,
    },
    stopCity: {
        fontSize: 13.5,
        fontWeight: '700',
        letterSpacing: 0.2,
    },
    timeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 9,
        paddingVertical: 5,
        borderRadius: 999,
    },
    timeText: {
        fontSize: 11.5,
        fontWeight: '700',
    },
});
