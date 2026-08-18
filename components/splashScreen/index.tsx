import { Colors } from '@/constants/colors';
import { Image } from 'expo-image';
import * as ExpoSplashScreen from 'expo-splash-screen';
import React, { useCallback, useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
    Easing,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';

// Must match the native splash: imageWidth in app.json / app.config.js and the
// 128dp badge baked into android/.../drawable-*/splashscreen_logo.png.
const LOGO_SIZE = 128;
const logoImg = require('../../public/logo.png');

const BACKGROUND = '#FFFFFF';

const TRACK_WIDTH = 160;

type Props = {
    /** When true the splash fades out and calls onFinish. */
    isAppReady: boolean;
    /** Called after the fade-out completes so the overlay can unmount. */
    onFinish: () => void;
};

function CustomSplashScreen({ isAppReady, onFinish }: Props) {
    // Splash screen background is forced to white, so we always use light colors
    const colors = Colors.light;

    // First frame renders the logo exactly where the native splash draws it,
    // so hiding the native splash is imperceptible. The intro only starts
    // after the handoff.
    const progress = useSharedValue(0);
    const containerOpacity = useSharedValue(1);
    const logoScale = useSharedValue(0.8);
    const logoOpacity = useSharedValue(0);

    const handoffDone = useRef(false);

    const startHandoff = useCallback(() => {
        if (handoffDone.current) return;
        handoffDone.current = true;

        ExpoSplashScreen.hideAsync().catch(() => { });

        // Ease toward 90% while the app initializes; jumps to 100% on ready.
        progress.value = withTiming(0.9, { duration: 1600, easing: Easing.bezier(0.25, 1, 0.5, 1) });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        // Fallback in case the image onLoad never fires.
        const timer = setTimeout(startHandoff, 400);

        logoScale.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.back(1.5)) });
        logoOpacity.value = withTiming(1, { duration: 600 });

        return () => clearTimeout(timer);
    }, [startHandoff, logoScale, logoOpacity]);

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

    // The fill slides in from the left so each frame is a pure transform —
    // no layout pass, keeps the bar at 60fps.
    const progressStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: -TRACK_WIDTH * (1 - progress.value) }],
    }));

    return (
        <Animated.View
            pointerEvents="none"
            style={[
                styles.container,
                { backgroundColor: BACKGROUND },
                containerStyle,
            ]}
        >
            {/* Animated logo */}
            <Animated.View style={[styles.group, { transform: [{ scale: logoScale }], opacity: logoOpacity }]}>
                <Image
                    source={logoImg}
                    style={styles.logo}
                    contentFit="contain"
                    transition={0}
                    onLoad={startHandoff}
                />
            </Animated.View>

            <View style={styles.wordmarkContainer}>
                <Animated.Text style={[styles.wordmark, { color: colors.text }]}>
                    Rehbar
                </Animated.Text>
                <Animated.Text style={[styles.tagline, { color: colors.secondary }]}>
                    Everything Local
                </Animated.Text>
                <View
                    style={[
                        styles.progressBarContainer,
                        { backgroundColor: `${colors.lime}20` },
                    ]}
                >
                    <Animated.View
                        style={[
                            styles.progressBar,
                            { backgroundColor: colors.lime },
                            progressStyle,
                        ]}
                    />
                </View>
            </View>
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
    group: {
        width: LOGO_SIZE,
        height: LOGO_SIZE,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logo: {
        width: LOGO_SIZE,
        height: LOGO_SIZE,
    },
    wordmarkContainer: {
        position: 'absolute',
        top: '50%',
        marginTop: LOGO_SIZE / 2 + 60,
        alignItems: 'center',
    },
    wordmark: {
        fontSize: 22,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    tagline: {
        fontSize: 10.5,
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

export default React.memo(CustomSplashScreen);
