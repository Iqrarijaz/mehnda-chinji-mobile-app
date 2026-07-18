import { useTheme } from '@/context/ThemeContext';
import { Image } from 'expo-image';
import * as ExpoSplashScreen from 'expo-splash-screen';
import React, { useCallback, useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
    Easing,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withRepeat,
    withTiming,
} from 'react-native-reanimated';

// Must match the native splash: imageWidth in app.json / app.config.js and the
// 128dp badge baked into android/.../drawable-*/splashscreen_logo.png.
const LOGO_SIZE = 128;
const logoImg = require('../../public/logo.png');

const BACKGROUND = { light: '#E6F4FE', dark: '#0F172A' };

// Concentric ambient circles behind the logo (innermost first).
const RING_SIZES = [200, 290, 390];
const RING_COLORS = {
    light: ['rgba(0,102,102,0.055)', 'rgba(0,102,102,0.038)', 'rgba(0,102,102,0.026)'],
    dark: ['rgba(45,212,191,0.055)', 'rgba(45,212,191,0.038)', 'rgba(45,212,191,0.026)'],
};
const RIPPLE_SIZE = 170;

const TRACK_WIDTH = 160;

type Props = {
    /** When true the splash fades out and calls onFinish. */
    isAppReady: boolean;
    /** Called after the fade-out completes so the overlay can unmount. */
    onFinish: () => void;
};

function CustomSplashScreen({ isAppReady, onFinish }: Props) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    // First frame renders the logo exactly where the native splash draws it,
    // so hiding the native splash is imperceptible. The intro only starts
    // after the handoff.
    const logoTranslateY = useSharedValue(0);
    const logoScale = useSharedValue(1);
    const ringsOpacity = useSharedValue(0);
    const breathe1 = useSharedValue(0);
    const breathe2 = useSharedValue(0);
    const breathe3 = useSharedValue(0);
    const ripple = useSharedValue(0);
    const wordmarkOpacity = useSharedValue(0);
    const wordmarkTranslateY = useSharedValue(12);
    const taglineOpacity = useSharedValue(0);
    const taglineTranslateY = useSharedValue(10);
    const barOpacity = useSharedValue(0);
    const progress = useSharedValue(0);
    const containerOpacity = useSharedValue(1);

    const handoffDone = useRef(false);

    const startHandoff = useCallback(() => {
        if (handoffDone.current) return;
        handoffDone.current = true;

        ExpoSplashScreen.hideAsync().catch(() => { });

        const settle = Easing.bezier(0.22, 1, 0.36, 1);

        // Logo settles upward.
        logoTranslateY.value = withDelay(100, withTiming(-40, { duration: 400, easing: settle }));
        logoScale.value = withDelay(100, withTiming(1.04, { duration: 400, easing: settle }));

        // Ambient circles fade in behind the logo, then breathe slowly.
        // Staggered durations keep the rings out of phase with each other.
        ringsOpacity.value = withDelay(250, withTiming(1, { duration: 600, easing: Easing.out(Easing.quad) }));
        const breatheEasing = Easing.inOut(Easing.sin);
        breathe1.value = withRepeat(withTiming(1, { duration: 2600, easing: breatheEasing }), -1, true);
        breathe2.value = withRepeat(withTiming(1, { duration: 3200, easing: breatheEasing }), -1, true);
        breathe3.value = withRepeat(withTiming(1, { duration: 3800, easing: breatheEasing }), -1, true);
        // A soft ring ripples outward from the logo and dissolves.
        ripple.value = withDelay(
            600,
            withRepeat(withTiming(1, { duration: 2400, easing: Easing.out(Easing.quad) }), -1, false)
        );

        // Staggered reveal: wordmark, tagline, then progress bar.
        wordmarkOpacity.value = withDelay(250, withTiming(1, { duration: 300, easing: Easing.out(Easing.cubic) }));
        wordmarkTranslateY.value = withDelay(250, withTiming(0, { duration: 300, easing: settle }));
        taglineOpacity.value = withDelay(400, withTiming(1, { duration: 300, easing: Easing.out(Easing.cubic) }));
        taglineTranslateY.value = withDelay(400, withTiming(0, { duration: 300, easing: settle }));
        barOpacity.value = withDelay(550, withTiming(1, { duration: 250, easing: Easing.out(Easing.quad) }));

        // Ease toward 90% while the app initializes; jumps to 100% on ready.
        progress.value = withDelay(
            300,
            withTiming(0.9, { duration: 1600, easing: Easing.bezier(0.25, 1, 0.5, 1) })
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        // Fallback in case the image onLoad never fires.
        const timer = setTimeout(startHandoff, 400);
        return () => clearTimeout(timer);
    }, [startHandoff]);

    useEffect(() => {
        if (!isAppReady) return;
        progress.value = withTiming(1, { duration: 200, easing: Easing.out(Easing.quad) });
        containerOpacity.value = withTiming(
            0,
            { duration: 250, easing: Easing.out(Easing.quad) },
            () => {
                runOnJS(onFinish)();
            }
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAppReady]);

    const containerStyle = useAnimatedStyle(() => ({
        opacity: containerOpacity.value,
    }));

    const logoStyle = useAnimatedStyle(() => ({
        transform: [
            { translateY: logoTranslateY.value },
            { scale: logoScale.value },
        ],
    }));

    // Rings follow the logo's settle and gently breathe around it.
    const ring1Style = useAnimatedStyle(() => ({
        opacity: ringsOpacity.value,
        transform: [{ translateY: logoTranslateY.value }, { scale: 1 + breathe1.value * 0.05 }],
    }));
    const ring2Style = useAnimatedStyle(() => ({
        opacity: ringsOpacity.value,
        transform: [{ translateY: logoTranslateY.value }, { scale: 1 + breathe2.value * 0.06 }],
    }));
    const ring3Style = useAnimatedStyle(() => ({
        opacity: ringsOpacity.value,
        transform: [{ translateY: logoTranslateY.value }, { scale: 1 + breathe3.value * 0.07 }],
    }));
    const rippleStyle = useAnimatedStyle(() => ({
        opacity: ringsOpacity.value * (1 - ripple.value) * 0.35,
        transform: [{ translateY: logoTranslateY.value }, { scale: 0.75 + ripple.value * 0.85 }],
    }));

    const wordmarkStyle = useAnimatedStyle(() => ({
        opacity: wordmarkOpacity.value,
        transform: [{ translateY: wordmarkTranslateY.value }],
    }));

    const taglineStyle = useAnimatedStyle(() => ({
        opacity: taglineOpacity.value,
        transform: [{ translateY: taglineTranslateY.value }],
    }));

    const barContainerStyle = useAnimatedStyle(() => ({
        opacity: barOpacity.value,
    }));

    // The fill slides in from the left so each frame is a pure transform —
    // no layout pass, keeps the bar at 60fps.
    const progressStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: -TRACK_WIDTH * (1 - progress.value) }],
    }));

    const ringColors = isDark ? RING_COLORS.dark : RING_COLORS.light;

    return (
        <Animated.View
            pointerEvents="none"
            style={[
                styles.container,
                { backgroundColor: isDark ? BACKGROUND.dark : BACKGROUND.light },
                containerStyle,
            ]}
        >
            {[ring3Style, ring2Style, ring1Style].map((style, i) => {
                const size = RING_SIZES[2 - i];
                return (
                    <Animated.View
                        key={size}
                        style={[
                            styles.circle,
                            centered(size),
                            { backgroundColor: ringColors[2 - i] },
                            style,
                        ]}
                    />
                );
            })}
            <Animated.View
                style={[
                    styles.circle,
                    styles.rippleRing,
                    centered(RIPPLE_SIZE),
                    { borderColor: isDark ? '#2DD4BF' : '#006666' },
                    rippleStyle,
                ]}
            />

            <Animated.View style={logoStyle}>
                <Image
                    source={logoImg}
                    style={styles.logo}
                    contentFit="contain"
                    transition={0}
                    onLoad={startHandoff}
                />
            </Animated.View>

            <View style={styles.wordmarkContainer}>
                <Animated.Text
                    style={[styles.wordmark, { color: isDark ? '#F8FAFC' : '#0F172A' }, wordmarkStyle]}
                >
                    Rehbar
                </Animated.Text>
                <Animated.Text
                    style={[styles.tagline, { color: isDark ? '#94A3B8' : '#64748B' }, taglineStyle]}
                >
                    Everything Local
                </Animated.Text>
                <Animated.View
                    style={[
                        styles.progressBarContainer,
                        { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,102,102,0.10)' },
                        barContainerStyle,
                    ]}
                >
                    <Animated.View
                        style={[
                            styles.progressBar,
                            { backgroundColor: isDark ? '#2DD4BF' : '#006666' },
                            progressStyle,
                        ]}
                    />
                </Animated.View>
            </View>
        </Animated.View>
    );
}

// Deterministic centering for the absolutely-positioned circles.
const centered = (size: number) => ({
    width: size,
    height: size,
    borderRadius: size / 2,
    left: '50%' as const,
    top: '50%' as const,
    marginLeft: -size / 2,
    marginTop: -size / 2,
});

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    circle: {
        position: 'absolute',
    },
    rippleRing: {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
    },
    logo: {
        width: LOGO_SIZE,
        height: LOGO_SIZE,
    },
    wordmarkContainer: {
        position: 'absolute',
        top: '50%',
        marginTop: LOGO_SIZE / 2 + 6,
        alignItems: 'center',
    },
    wordmark: {
        fontSize: 26,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    tagline: {
        fontSize: 12,
        marginTop: 6,
        fontWeight: '600',
        letterSpacing: 3,
        textTransform: 'uppercase',
    },
    progressBarContainer: {
        width: TRACK_WIDTH,
        height: 4,
        borderRadius: 999,
        marginTop: 18,
        overflow: 'hidden',
    },
    progressBar: {
        width: '100%',
        height: '100%',
        borderRadius: 999,
    },
});

export default CustomSplashScreen;
