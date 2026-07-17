import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import * as ExpoSplashScreen from 'expo-splash-screen';
import Animated, {
    Easing,
    SharedValue,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withRepeat,
    withTiming
} from 'react-native-reanimated';

const LOGO_WIDTH = 240;
const LOGO_HEIGHT = 58;
const logoImg = require('../../public/white_logo.png');

/** Brand colors — matches the app's forest/lime design system. */
const FOREST = '#003D36';
const LIME = '#7BC043';

/** One typed-in wordmark character, driven by the shared title progress. */
const TypedChar = React.memo(function TypedChar({
    char,
    index,
    total,
    progress,
}: {
    char: string;
    index: number;
    total: number;
    progress: SharedValue<number>;
}) {
    const charStyle = useAnimatedStyle(() => {
        const start = index / total;
        const end = (index + 1.5) / total;
        const opacity = Math.min(Math.max((progress.value - start) / (end - start), 0), 1);
        return {
            opacity,
            transform: [{ translateY: (1 - opacity) * 6 }]
        };
    });
    return (
        <Animated.Text style={[styles.footerText, charStyle]}>
            {char}
        </Animated.Text>
    );
});

/**
 * Splash — continues the native splash seamlessly (same forest background,
 * same white logo at the same width), then brings the screen alive with a
 * soft lime glow, a filling progress line and a typed-in wordmark.
 */
const CustomSplashScreen = React.memo(function CustomSplashScreen() {
    // Split words into character arrays for staggered typewriter animation
    const titleText = "RAHBAR";
    const titleChars = titleText.split("");

    const glowScale = useSharedValue(0.85);
    const glowOpacity = useSharedValue(0);

    const progressWidth = useSharedValue(0);

    // Stagger progress animation controllers
    const titleProgress = useSharedValue(0);
    const belowOpacity = useSharedValue(0);

    useEffect(() => {
        // Repeating breathing glow halo behind the logo (smooth, no bounce)
        glowScale.value = withRepeat(
            withTiming(1.25, { duration: 2400, easing: Easing.bezier(0.4, 0, 0.2, 1) }),
            -1,
            true
        );
        glowOpacity.value = withRepeat(
            withTiming(0.5, { duration: 2400, easing: Easing.bezier(0.4, 0, 0.2, 1) }),
            -1,
            true
        );

        // Progress line + footer content ease in after the native handoff
        belowOpacity.value = withDelay(150, withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) }));
        progressWidth.value = withDelay(200, withTiming(1, {
            duration: 1800,
            easing: Easing.bezier(0.2, 0.8, 0.2, 1)
        }));

        // Staggered character typing
        titleProgress.value = withDelay(300, withTiming(1, { duration: 800, easing: Easing.out(Easing.quad) }));
    }, []);

    const glowStyle = useAnimatedStyle(() => ({
        transform: [{ scale: glowScale.value }],
        opacity: glowOpacity.value,
    }));

    const progressStyle = useAnimatedStyle(() => ({
        width: `${progressWidth.value * 100}%`,
    }));

    const belowStyle = useAnimatedStyle(() => ({
        opacity: belowOpacity.value,
    }));

    useEffect(() => {
        // Fallback in case onLoad doesn't fire
        const timer = setTimeout(() => {
            ExpoSplashScreen.hideAsync().catch(() => { });
        }, 800);
        return () => clearTimeout(timer);
    }, []);

    return (
        <View style={styles.container}>
            {/* Soft lime aura behind the logo */}
            <Animated.View style={[styles.glowAura, glowStyle]} />

            {/* Logo — same asset and width as the native splash for a seamless handoff */}
            <View style={styles.logoContainer}>
                <Image
                    source={logoImg}
                    style={styles.logo}
                    contentFit="contain"
                    onLoad={async () => {
                        try {
                            await ExpoSplashScreen.hideAsync();
                        } catch (e) {
                            console.warn(e);
                        }
                    }}
                />
            </View>

            {/* Loading line — translucent track, lime fill */}
            <Animated.View style={[styles.progressBarContainer, belowStyle]}>
                <Animated.View style={[styles.progressBarActive, progressStyle]} />
            </Animated.View>

            {/* Branded footer with typed-in characters */}
            <View style={styles.footer}>
                <View style={styles.charRow}>
                    {titleChars.map((char, index) => (
                        <TypedChar
                            key={`t-${index}`}
                            char={char}
                            index={index}
                            total={titleChars.length}
                            progress={titleProgress}
                        />
                    ))}
                </View>
            </View>
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: FOREST,
    },
    glowAura: {
        position: 'absolute',
        width: 260,
        height: 260,
        borderRadius: 130,
        backgroundColor: 'rgba(123,192,67,0.14)',
    },
    logoContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2,
    },
    logo: {
        width: LOGO_WIDTH,
        height: LOGO_HEIGHT,
    },
    progressBarContainer: {
        position: 'absolute',
        bottom: 110,
        width: '50%',
        height: 5,
        borderRadius: 999,
        overflow: 'hidden',
        backgroundColor: 'rgba(255,255,255,0.12)',
    },
    progressBarActive: {
        height: '100%',
        borderRadius: 999,
        backgroundColor: LIME,
    },
    footer: {
        position: 'absolute',
        bottom: 50,
        alignItems: 'center',
    },
    charRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    footerText: {
        fontSize: 18,
        fontWeight: '900',
        marginHorizontal: 1,
        letterSpacing: 4,
        color: '#FFFFFF',
    },
});

export default CustomSplashScreen;
