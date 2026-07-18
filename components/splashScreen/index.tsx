import { useTheme } from '@/context/ThemeContext';
import { Image } from 'expo-image';
import * as ExpoSplashScreen from 'expo-splash-screen';
import React, { useCallback, useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
    Easing,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withTiming,
} from 'react-native-reanimated';

// Must match the native splash: imageWidth in app.json / app.config.js and the
// 128dp badge baked into android/.../drawable-*/splashscreen_logo.png.
const LOGO_SIZE = 128;
const logoImg = require('../../public/logo.png');

const BACKGROUND = { light: '#E6F4FE', dark: '#0F172A' };

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
    const wordmarkOpacity = useSharedValue(0);
    const wordmarkTranslateY = useSharedValue(12);
    const containerOpacity = useSharedValue(1);
    const progressWidth = useSharedValue(0);

    const handoffDone = useRef(false);

    const startHandoff = useCallback(() => {
        if (handoffDone.current) return;
        handoffDone.current = true;

        ExpoSplashScreen.hideAsync().catch(() => { });

        const settle = Easing.bezier(0.22, 1, 0.36, 1);
        logoTranslateY.value = withDelay(100, withTiming(-40, { duration: 400, easing: settle }));
        logoScale.value = withDelay(100, withTiming(1.04, { duration: 400, easing: settle }));
        wordmarkOpacity.value = withDelay(250, withTiming(1, { duration: 300, easing: Easing.out(Easing.cubic) }));
        wordmarkTranslateY.value = withDelay(250, withTiming(0, { duration: 300, easing: settle }));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        // Fallback in case the image onLoad never fires.
        const timer = setTimeout(startHandoff, 400);

        // Start progress bar animation
        progressWidth.value = withTiming(85, { duration: 1500, easing: Easing.out(Easing.cubic) });

        return () => clearTimeout(timer);
    }, [startHandoff]);

    useEffect(() => {
        if (!isAppReady) return;
        progressWidth.value = withTiming(100, { duration: 200 });
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

    const wordmarkStyle = useAnimatedStyle(() => ({
        opacity: wordmarkOpacity.value,
        transform: [{ translateY: wordmarkTranslateY.value }],
    }));

    const progressStyle = useAnimatedStyle(() => ({
        width: `${progressWidth.value}%`,
    }));

    return (
        <Animated.View
            pointerEvents="none"
            style={[
                styles.container,
                { backgroundColor: isDark ? BACKGROUND.dark : BACKGROUND.light },
                containerStyle,
            ]}
        >
            <Animated.View style={logoStyle}>
                <Image
                    source={logoImg}
                    style={styles.logo}
                    contentFit="contain"
                    transition={0}
                    onLoad={startHandoff}
                />
            </Animated.View>

            <Animated.View style={[styles.wordmarkContainer, wordmarkStyle]}>
                <Text style={[styles.wordmark, { color: isDark ? '#F8FAFC' : '#0F172A' }]}>
                    Rehbar
                </Text>
                <Text style={[styles.tagline, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                    Every thing local
                </Text>
                <View style={[styles.progressBarContainer, { backgroundColor: isDark ? '#1E293B' : '#E2E8F0' }]}>
                    <Animated.View style={[styles.progressBar, { backgroundColor: isDark ? '#38BDF8' : '#0284C7' }, progressStyle]} />
                </View>
            </Animated.View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
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
        fontSize: 14,
        marginTop: 4,
        fontWeight: '500',
    },
    progressBarContainer: {
        width: 150,
        height: 4,
        borderRadius: 2,
        marginTop: 16,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        borderRadius: 2,
    },
});

export default CustomSplashScreen;
