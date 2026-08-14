import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Animated, {
    SlideInLeft,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';
import { Pressable } from 'react-native-gesture-handler';

import { ThemedText } from '@/components/themedText';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/context/ThemeContext';

interface CurrencyHomeCardProps {
    onPress: () => void;
    delay?: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Quick Access card for the Currency Exchange screen — a step up from the
 * plain ContentCard rows: a dual-tone gradient icon badge and a spring
 * press animation, to read as the "premium" entry point the ad-unlock
 * flow behind it deserves.
 */
export function CurrencyHomeCard({ onPress, delay = 0 }: CurrencyHomeCardProps) {
    const { theme } = useTheme();
    const colors = Colors[theme];
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    return (
        <Animated.View entering={SlideInLeft.delay(delay).duration(400)}>
            <AnimatedPressable
                onPress={onPress}
                onPressIn={() => {
                    scale.value = withTiming(0.97, { duration: 100 });
                }}
                onPressOut={() => {
                    scale.value = withTiming(1, { duration: 150 });
                }}
                style={[styles.card, { backgroundColor: colors.card }, animatedStyle]}
            >
                <LinearGradient
                    colors={['#0EA5E9', '#0D9488']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.iconWrap}
                >
                    <Ionicons name="swap-horizontal" size={22} color="#FFFFFF" />
                </LinearGradient>
                <View style={styles.textWrap}>
                    <ThemedText style={styles.title}>Currency Exchange</ThemedText>
                    <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>
                        Live daily rates for 160+ currencies
                    </ThemedText>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
            </AnimatedPressable>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: Layout.borderRadius,
        padding: Platform.OS === 'android' ? 12 : 16,
        marginHorizontal: 20,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 44,
    },
    iconWrap: {
        width: 42,
        height: 42,
        borderRadius: Layout.borderRadius,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    textWrap: {
        flex: 1,
    },
    title: {
        fontSize: 15,
        fontWeight: '600',
    },
    subtitle: {
        fontSize: 12,
        fontWeight: '400',
        marginTop: 2,
    },
});
