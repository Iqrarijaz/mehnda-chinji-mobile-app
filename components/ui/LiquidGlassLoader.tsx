import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming
} from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';

export const LiquidGlassLoader = () => {
    const { isDark } = useTheme();
    const progress = useSharedValue(0);

    useEffect(() => {
        progress.value = withRepeat(
            withTiming(1, { duration: 1500 }),
            -1,
            false
        );
    }, []);

    const waveStyle = useAnimatedStyle(() => {
        const translateY = interpolate(progress.value, [0, 1], [40, -40]);
        const rotate = interpolate(progress.value, [0, 1], [0, 360]);
        return {
            transform: [
                { translateY },
                { rotate: `${rotate}deg` }
            ],
        };
    });

    const pulseStyle = useAnimatedStyle(() => {
        const scale = interpolate(progress.value, [0, 0.5, 1], [1, 1.05, 1]);
        const opacity = interpolate(progress.value, [0, 0.5, 1], [0.8, 1, 0.8]);
        return {
            transform: [{ scale }],
            opacity,
        };
    });

    return (
        <View style={styles.container}>
            <Animated.View style={[styles.loaderWrapper, pulseStyle]}>
                {/* Outer Glass Container */}
                <LinearGradient
                    colors={isDark
                        ? ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.02)']
                        : ['rgba(15, 23, 42, 0.08)', 'rgba(15, 23, 42, 0.03)']}
                    style={styles.glassContainer}
                >
                    {/* Inner Content Area */}
                    <View style={styles.innerContent}>
                        {/* Animated Liquid Wave */}
                        <Animated.View style={[styles.wave, waveStyle]}>
                            <LinearGradient
                                colors={['#ef4444', '#b91c1c']}
                                style={StyleSheet.absoluteFill}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 0, y: 1 }}
                            />
                        </Animated.View>

                        {/* Gloss Highlight Overlay */}
                        <View style={styles.glossOverlay}>
                            <LinearGradient
                                colors={['rgba(255, 255, 255, 0.4)', 'transparent']}
                                style={styles.specular}
                            />
                        </View>
                    </View>
                </LinearGradient>

                {/* Subtle outer glow */}
                <View style={[styles.glow, { backgroundColor: '#ef4444' }]} />
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    loaderWrapper: {
        width: 80,
        height: 80,
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
    },
    glassContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        overflow: 'hidden',
        zIndex: 2,
    },
    innerContent: {
        flex: 1,
        justifyContent: 'flex-end',
        alignItems: 'center',
        position: 'relative',
    },
    wave: {
        position: 'absolute',
        width: 120, // Wider for rotation effect
        height: 120,
        borderRadius: 45,
        bottom: -50,
    },
    glossOverlay: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 3,
    },
    specular: {
        width: '70%',
        height: '30%',
        borderRadius: 15,
        marginTop: 6,
        marginLeft: '15%',
    },
    glow: {
        position: 'absolute',
        width: 70,
        height: 70,
        borderRadius: 35,
        opacity: 0.15,
        filter: 'blur(15px)',
        zIndex: 1,
    },
});
