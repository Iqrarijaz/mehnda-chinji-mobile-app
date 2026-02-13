import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
    Easing,
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withRepeat,
    withTiming
} from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
    const { isDark } = useTheme();

    // Animation shared values
    const dropScale = useSharedValue(0.8);
    const dropOpacity = useSharedValue(0);
    const connectionProgress = useSharedValue(0);
    const figuresOpacity = useSharedValue(0);
    const glowScale = useSharedValue(1);

    useEffect(() => {
        // Drop entrance
        dropScale.value = withDelay(300, withTiming(1, {
            duration: 1000,
            easing: Easing.out(Easing.back(1.5))
        }));
        dropOpacity.value = withDelay(300, withTiming(1, { duration: 800 }));

        // Figures and connections
        figuresOpacity.value = withDelay(800, withTiming(1, { duration: 1000 }));
        connectionProgress.value = withDelay(1000, withTiming(1, {
            duration: 1500,
            easing: Easing.inOut(Easing.quad)
        }));

        // Subtle idle glow pulse
        glowScale.value = withRepeat(
            withTiming(1.15, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
            -1,
            true
        );
    }, []);

    const dropAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: dropScale.value }],
        opacity: dropOpacity.value,
    }));

    const glowAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: glowScale.value }],
        opacity: interpolate(glowScale.value, [1, 1.15], [0.15, 0.3]),
    }));

    const figuresAnimatedStyle = useAnimatedStyle(() => ({
        opacity: figuresOpacity.value,
    }));

    return (
        <View style={styles.container}>
            {/* Base Background Gradient */}
            <LinearGradient
                colors={isDark ? ['#0F172A', '#1E293B', '#0F172A'] : ['#F8FAFC', '#F1F5F9', '#F8FAFC']}
                style={StyleSheet.absoluteFill}
            />

            {/* Dynamic Background Blur Layers */}
            <View style={[styles.blurOrb, { top: '20%', left: '10%', backgroundColor: '#ef444433' }]} />
            <View style={[styles.blurOrb, { bottom: '20%', right: '10%', backgroundColor: '#3b82f633' }]} />

            <BlurView intensity={isDark ? 40 : 60} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />

            {/* Content Wrapper */}
            <View style={styles.content}>
                {/* Premium Glass Card */}
                <BlurView intensity={80} tint={isDark ? "dark" : "light"} style={styles.glassCard}>
                    <LinearGradient
                        colors={isDark
                            ? ['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.02)']
                            : ['rgba(255, 255, 255, 0.6)', 'rgba(255, 255, 255, 0.2)']}
                        style={StyleSheet.absoluteFill}
                    />

                    {/* Shadow/Glow under the card */}
                    <Animated.View style={[styles.cardGlow, glowAnimatedStyle]} />

                    {/* Central Iconography */}
                    <View style={styles.iconContainer}>
                        {/* Connecting Lines (Simulated with static/animated elements) */}
                        <Animated.View style={[styles.connectionsWrapper, figuresAnimatedStyle]}>
                            <View style={[styles.connectionLine, { transform: [{ rotate: '0deg' }], height: 60 * connectionProgress.value }]} />
                            <View style={[styles.connectionLine, { transform: [{ rotate: '120deg' }], height: 60 * connectionProgress.value }]} />
                            <View style={[styles.connectionLine, { transform: [{ rotate: '240deg' }], height: 60 * connectionProgress.value }]} />
                        </Animated.View>

                        {/* Humanity Figures (Simplified connected nodes) */}
                        <Animated.View style={[styles.figuresWrapper, figuresAnimatedStyle]}>
                            <View style={styles.figureNode} />
                            <View style={[styles.figureNode, { transform: [{ rotate: '120deg' }, { translateY: -60 }] }]} />
                            <View style={[styles.figureNode, { transform: [{ rotate: '240deg' }, { translateY: -60 }] }]} />
                            <View style={[styles.figureNode, { transform: [{ translateY: -60 }] }]} />
                        </Animated.View>

                        {/* Central Blood Drop */}
                        <Animated.View style={[styles.dropWrapper, dropAnimatedStyle]}>
                            <LinearGradient
                                colors={['#ef4444', '#991b1b']}
                                style={styles.drop}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                <View style={styles.dropSpecular} />
                                <View style={styles.dropReflect} />
                            </LinearGradient>
                        </Animated.View>
                    </View>
                </BlurView>

                {/* Subtle Specular Highlights on Card Edges */}
                <View style={[styles.edgeHighlight, { top: 0, left: '20%', right: '20%', height: 1, opacity: 0.5 }]} />
                <View style={[styles.edgeHighlight, { bottom: 0, left: '20%', right: '20%', height: 1, opacity: 0.2 }]} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    blurOrb: {
        position: 'absolute',
        width: width * 0.8,
        height: width * 0.8,
        borderRadius: width * 0.4,
        opacity: 0.3,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    glassCard: {
        width: 280,
        height: 280,
        borderRadius: 50,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    cardGlow: {
        position: 'absolute',
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: '#ef4444',
        zIndex: -1,
    },
    iconContainer: {
        width: 200,
        height: 200,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    dropWrapper: {
        width: 70,
        height: 100,
        zIndex: 5,
    },
    drop: {
        flex: 1,
        borderRadius: 35,
        borderTopLeftRadius: 5, // Tapered top
        transform: [{ rotate: '45deg' }],
        position: 'relative',
        overflow: 'hidden',
    },
    dropSpecular: {
        position: 'absolute',
        top: 10,
        left: 10,
        width: 15,
        height: 15,
        borderRadius: 7.5,
        backgroundColor: 'rgba(255,255,255,0.4)',
    },
    dropReflect: {
        position: 'absolute',
        bottom: 5,
        right: 5,
        width: '60%',
        height: '30%',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 20,
    },
    figuresWrapper: {
        position: 'absolute',
        width: 120,
        height: 120,
        alignItems: 'center',
        justifyContent: 'center',
    },
    figureNode: {
        position: 'absolute',
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#FFFFFF',
        borderWidth: 2,
        borderColor: '#ef4444',
        shadowColor: '#ef4444',
        shadowOpacity: 0.5,
        shadowRadius: 5,
        elevation: 5,
    },
    connectionsWrapper: {
        position: 'absolute',
        width: 120,
        height: 120,
        alignItems: 'center',
        justifyContent: 'center',
    },
    connectionLine: {
        position: 'absolute',
        width: 2,
        backgroundColor: 'rgba(239, 68, 68, 0.4)',
        bottom: '50%',
        transformOrigin: 'bottom',
    },
    edgeHighlight: {
        position: 'absolute',
        backgroundColor: '#FFFFFF',
    }
});
