import { ThemedText } from '@/components/themedText';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/context/ThemeContext';
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
    interpolateColor,
    useAnimatedStyle,
    useSharedValue,
    withSpring
} from 'react-native-reanimated';

interface ProfileProgressProps {
    percentage: number;
    remainingFields: number;
}

export const ProfileProgress: React.FC<ProfileProgressProps> = ({ percentage, remainingFields }) => {
    const { theme } = useTheme();
    const colors = Colors[theme];
    const progress = useSharedValue(0);

    useEffect(() => {
        progress.value = withSpring(percentage / 100, { damping: 15 });
    }, [percentage]);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            width: `${progress.value * 100}%`,
            backgroundColor: interpolateColor(
                progress.value,
                [0.5, 0.75, 1],
                ['#F59E0B', '#10B981', '#059669']
            )
        };
    });

    return (
        <View style={[styles.card, { backgroundColor: theme === 'dark' ? colors.card : '#FFFFFF' }]}>
            <View style={styles.header}>
                <View>
                    <ThemedText style={[styles.percentageText, { color: theme === 'dark' ? colors.text : '#1E293B' }]}>{percentage}%</ThemedText>
                    <ThemedText style={[styles.label, { color: theme === 'dark' ? colors.textSecondary : '#64748B' }]}>Profile Completion</ThemedText>
                </View>
                {remainingFields > 0 && (
                    <View style={[styles.badge, { backgroundColor: theme === 'dark' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)' }]}>
                        <ThemedText style={styles.badgeText}>{remainingFields} fields left</ThemedText>
                    </View>
                )}
            </View>

            <View style={styles.progressContainer}>
                <View style={[styles.progressBarBase, { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.08)' : '#E2E8F0' }]}>
                    <Animated.View style={[styles.progressBarFill, animatedStyle]} />
                </View>
            </View>

            <ThemedText style={[styles.subtitle, { color: theme === 'dark' ? colors.textSecondary : '#94A3B8' }]}>
                Improve your profile to unlock a better experience
            </ThemedText>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: Layout.borderRadius,
        padding: 20,
        marginHorizontal: 18,
        marginTop: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    percentageText: {
        fontSize: 32,
        paddingVertical: 4,
        fontWeight: '900',
        color: '#1E293B',
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: '#64748B',
    },
    badge: {
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: Layout.borderRadius,
    },
    badgeText: {
        color: '#10B981',
        fontSize: 12,
        fontWeight: '700',
    },
    progressContainer: {
        height: 12,
        width: '100%',
        marginBottom: 12,
    },
    progressBarBase: {
        height: '100%',
        width: '100%',
        borderRadius: 6,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 6,
    },
    subtitle: {
        fontSize: 12,
        color: '#94A3B8',
        fontWeight: '500',
    }
});
