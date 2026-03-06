import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, {
    Easing,
    FadeInUp,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming
} from 'react-native-reanimated';

import { WeatherResponse } from '@/apis/weather';
import { ThemedText } from '@/components/themedText';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';

interface WeatherWidgetProps {
    data?: WeatherResponse;
    isLoading: boolean;
    onPress: () => void;
}

export function WeatherWidget({ data, isLoading, onPress }: WeatherWidgetProps) {
    const { theme } = useTheme();
    const colors = Colors[theme];
    const isDark = theme === 'dark';
    const floatValue = useSharedValue(0);

    useEffect(() => {
        floatValue.value = withRepeat(
            withSequence(
                withTiming(-5, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
                withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.sin) })
            ),
            -1,
            true
        );
    }, []);

    const animatedIconStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: floatValue.value }],
    }));

    if (isLoading && !data) {
        return (
            <View style={styles.loaderContainer}>
                <ActivityIndicator color={colors.primary} />
            </View>
        );
    }

    if (!data) return null;

    const weather = data.weather[0];
    const temp = Math.round(data.main.temp);
    const feelsLike = Math.round(data.main.feels_like);
    const humidity = data.main.humidity;
    const name = data.name;
    const isNight = weather.icon.endsWith('n');

    // Map OpenWeather icons to Ionicons or custom ones if available
    const getIconName = (icon: string) => {
        if (icon.startsWith('01')) return isNight ? 'moon' : 'sunny';
        if (icon.startsWith('02')) return isNight ? 'cloudy-night' : 'partly-sunny';
        if (icon.startsWith('03') || icon.startsWith('04')) return 'cloudy';
        if (icon.startsWith('09') || icon.startsWith('10')) return 'rainy';
        if (icon.startsWith('11')) return 'thunderstorm';
        if (icon.startsWith('13')) return 'snow';
        if (icon.startsWith('50')) return 'cloud';
        return isNight ? 'moon' : 'sunny';
    };

    const dayColors = ['#4DA0B0', '#D39D38'] as const; // Sunrise/Day feel
    const nightColors = ['#0F2027', '#203A43', '#2C5364'] as const; // Deep Blue Night

    return (
        <Animated.View entering={FadeInUp.delay(200).duration(500)}>
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={onPress}
                style={styles.container}
            >
                <LinearGradient
                    colors={isNight ? nightColors : dayColors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[StyleSheet.absoluteFill, { opacity: 0.8 }]}
                />
                <BlurView
                    intensity={isDark ? 20 : 30}
                    tint={isNight ? 'dark' : 'light'}
                    style={StyleSheet.absoluteFill}
                />

                <View style={styles.content}>
                    <View style={styles.leftInfo}>
                        <ThemedText style={[styles.location, { color: '#FFFFFF' }]}>
                            <Ionicons name="location" size={12} color="#FFFFFF" /> {name}
                        </ThemedText>
                        <ThemedText style={[styles.temp, { color: '#FFFFFF' }]}>{temp}°</ThemedText>
                        <ThemedText style={[styles.condition, { color: '#FFFFFF' }]}>{weather.main}</ThemedText>
                    </View>

                    <View style={styles.rightInfo}>
                        <Animated.View style={[styles.iconCircle, animatedIconStyle, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                            <Ionicons
                                name={getIconName(weather.icon) as any}
                                size={44}
                                color={isNight ? '#E0E0E0' : '#FFD700'}
                            />
                        </Animated.View>
                        <View style={styles.detailsRow}>
                            <ThemedText style={[styles.detailText, { color: '#FFFFFF', opacity: 0.8 }]}>Feels like {feelsLike}°</ThemedText>
                            <View style={[styles.dot, { backgroundColor: '#FFFFFF', opacity: 0.4 }]} />
                            <ThemedText style={[styles.detailText, { color: '#FFFFFF', opacity: 0.8 }]}>Humidity {humidity}%</ThemedText>
                        </View>
                    </View>

                    <View style={styles.searchIcon}>
                        <Ionicons name="search" size={16} color="#FFFFFF" style={{ opacity: 0.5 }} />
                    </View>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    loaderContainer: {
        height: 100,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 20,
    },
    container: {
        marginHorizontal: 16,
        marginTop: 10,
        borderRadius: 24,
        overflow: 'hidden',
    },
    content: {
        flexDirection: 'row',
        padding: 24, // Increased padding
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    leftInfo: {
        flex: 1,
    },
    location: {
        fontSize: 13,
        fontWeight: '700',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    temp: {
        fontSize: 52, // Increased size but with better padding
        fontWeight: '800',
        letterSpacing: -1,
        lineHeight: 52, // Explicit line height to prevent cutting
    },
    condition: {
        fontSize: 16,
        fontWeight: '600',
        marginTop: 4,
    },
    rightInfo: {
        alignItems: 'flex-end',
    },
    iconCircle: {
        width: 68, // Slightly larger
        height: 68,
        borderRadius: 34,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    detailsRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    detailText: {
        fontSize: 12,
        fontWeight: '600',
    },
    dot: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
        marginHorizontal: 6,
    },
    searchIcon: {
        position: 'absolute',
        top: 15,
        right: 15,
    }
});

