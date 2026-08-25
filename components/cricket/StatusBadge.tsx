import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';

interface StatusBadgeProps {
    status: 'UPCOMING' | 'LIVE' | 'COMPLETED' | 'ABANDONED';
    size?: 'small' | 'medium';
}

function PulsingDot() {
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.parallel([
                    Animated.timing(pulseAnim, {
                        toValue: 0.3,
                        duration: 650,
                        useNativeDriver: true,
                    }),
                    Animated.timing(scaleAnim, {
                        toValue: 1.4,
                        duration: 650,
                        useNativeDriver: true,
                    }),
                ]),
                Animated.parallel([
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 650,
                        useNativeDriver: true,
                    }),
                    Animated.timing(scaleAnim, {
                        toValue: 1,
                        duration: 650,
                        useNativeDriver: true,
                    }),
                ]),
            ])
        );
        pulse.start();
        return () => pulse.stop();
    }, [pulseAnim, scaleAnim]);

    return (
        <View style={styles.dotWrapper}>
            <Animated.View
                style={[
                    styles.outerGlowDot,
                    {
                        opacity: pulseAnim,
                        transform: [{ scale: scaleAnim }],
                    },
                ]}
            />
            <View style={styles.coreDot} />
        </View>
    );
}

export const StatusBadge = React.memo(function StatusBadge({ status, size = 'small' }: StatusBadgeProps) {
    const { theme } = useTheme();
    const colors = Colors[theme];

    const getStatusColor = () => {
        switch (status) {
            case 'LIVE': return '#EF4444';
            case 'UPCOMING': return colors.primary;
            case 'COMPLETED': return colors.textSecondary;
            case 'ABANDONED': return colors.danger;
            default: return colors.textSecondary;
        }
    };

    const statusColor = getStatusColor();
    const isMedium = size === 'medium';

    return (
        <View style={styles.badge}>
            {status === 'LIVE' && <PulsingDot />}
            <ThemedText style={[styles.text, { color: statusColor }, isMedium && styles.textMedium]}>
                {status}
            </ThemedText>
        </View>
    );
});

const styles = StyleSheet.create({
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        alignSelf: 'flex-start',
        backgroundColor: 'transparent'
    },
    dotWrapper: {
        width: 10,
        height: 10,
        alignItems: 'center',
        justifyContent: 'center'
    },
    outerGlowDot: {
        position: 'absolute',
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#EF444480'
    },
    coreDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#EF4444'
    },
    text: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.4
    },
    textMedium: {
        fontSize: 11.5
    }
});
