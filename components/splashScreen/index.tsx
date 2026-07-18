import { Colors } from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ExpoSplashScreen from 'expo-splash-screen';
import React, { useCallback, useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
    Easing,
    runOnJS,
    useAnimatedProps,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withRepeat,
    withTiming,
    ZoomIn,
} from 'react-native-reanimated';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// Must match the native splash: imageWidth in app.json / app.config.js and the
// 128dp badge baked into android/.../drawable-*/splashscreen_logo.png.
const LOGO_SIZE = 128;
const logoImg = require('../../public/logo.png');

const BACKGROUND = '#FFFFFF';

const TRACK_WIDTH = 160;

// Connected-community illustration: local services orbit the Rehbar logo on
// a dashed ring — everything local, linked through one place.
const RING_BOX = 264;
const RING_RADIUS = 118;
const RING_DASH = 3;
const RING_GAP = 9;
const NODE_SIZE = 34;

type ServiceNode = {
    icon: keyof typeof Ionicons.glyphMap;
    angle: number; // degrees, 0 = right, -90 = top
};

const SERVICE_NODES: ServiceNode[] = [
    { icon: 'home', angle: -90 },
    { icon: 'medkit', angle: -30 },
    { icon: 'school', angle: 30 },
    { icon: 'bus', angle: 90 },
    { icon: 'storefront', angle: 150 },
    { icon: 'pricetag', angle: 210 },
];

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
    const groupTranslateY = useSharedValue(0);
    const logoScale = useSharedValue(1);
    const ringOpacity = useSharedValue(0);
    const ringFlow = useSharedValue(0);

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

        // Logo + service ring settle upward together.
        groupTranslateY.value = withDelay(100, withTiming(-40, { duration: 400, easing: settle }));
        logoScale.value = withDelay(100, withTiming(1.04, { duration: 400, easing: settle }));

        // The community ring fades in and its dashes drift slowly — services
        // connected through Rehbar, gently in motion.
        ringOpacity.value = withDelay(300, withTiming(1, { duration: 600, easing: Easing.out(Easing.quad) }));
        ringFlow.value = withRepeat(
            withTiming(1, { duration: 6000, easing: Easing.linear }),
            -1,
            false
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

    const groupStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: groupTranslateY.value }],
    }));

    const logoStyle = useAnimatedStyle(() => ({
        transform: [{ scale: logoScale.value }],
    }));

    const ringStyle = useAnimatedStyle(() => ({
        opacity: ringOpacity.value,
    }));

    const ringProps = useAnimatedProps(() => ({
        strokeDashoffset: -ringFlow.value * (RING_DASH + RING_GAP) * 6,
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

    const nodeAccents = [colors.primary, colors.secondary, colors.lime];

    return (
        <Animated.View
            pointerEvents="none"
            style={[
                styles.container,
                { backgroundColor: BACKGROUND },
                containerStyle,
            ]}
        >
            {/* Logo + connected-community ring settle together */}
            <Animated.View style={[styles.group, groupStyle]}>
                {/* Dashed orbit ring with slowly drifting dashes */}
                <Animated.View style={[StyleSheet.absoluteFill, styles.ringWrap, ringStyle]}>
                    <Svg width={RING_BOX} height={RING_BOX} viewBox={`0 0 ${RING_BOX} ${RING_BOX}`}>
                        <AnimatedCircle
                            cx={RING_BOX / 2}
                            cy={RING_BOX / 2}
                            r={RING_RADIUS}
                            stroke={`${colors.primary}30`}
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeDasharray={`${RING_DASH} ${RING_GAP}`}
                            fill="none"
                            animatedProps={ringProps}
                        />
                    </Svg>

                    {/* Service nodes on the ring */}
                    {SERVICE_NODES.map((node, i) => {
                        const rad = (node.angle * Math.PI) / 180;
                        const cx = RING_BOX / 2 + RING_RADIUS * Math.cos(rad) - NODE_SIZE / 2;
                        const cy = RING_BOX / 2 + RING_RADIUS * Math.sin(rad) - NODE_SIZE / 2;
                        const accent = nodeAccents[i % nodeAccents.length];
                        return (
                            <Animated.View
                                key={node.icon}
                                entering={ZoomIn.delay(500 + i * 90).duration(350)}
                                style={[
                                    styles.node,
                                    { left: cx, top: cy, backgroundColor: accent },
                                ]}
                            >
                                <Ionicons name={node.icon} size={16} color="#FFFFFF" />
                            </Animated.View>
                        );
                    })}
                </Animated.View>

                <Animated.View style={logoStyle}>
                    <Image
                        source={logoImg}
                        style={styles.logo}
                        contentFit="contain"
                        transition={0}
                        onLoad={startHandoff}
                    />
                </Animated.View>
            </Animated.View>

            <View style={styles.wordmarkContainer}>
                <Animated.Text
                    style={[styles.wordmark, { color: colors.text }, wordmarkStyle]}
                >
                    Rehbar
                </Animated.Text>
                <Animated.Text
                    style={[styles.tagline, { color: colors.secondary }, taglineStyle]}
                >
                    Everything Local
                </Animated.Text>
                <Animated.View
                    style={[
                        styles.progressBarContainer,
                        { backgroundColor: `${colors.lime}20` },
                        barContainerStyle,
                    ]}
                >
                    <Animated.View
                        style={[
                            styles.progressBar,
                            { backgroundColor: colors.lime },
                            progressStyle,
                        ]}
                    />
                </Animated.View>
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
        width: RING_BOX,
        height: RING_BOX,
        justifyContent: 'center',
        alignItems: 'center',
    },
    ringWrap: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    node: {
        position: 'absolute',
        width: NODE_SIZE,
        height: NODE_SIZE,
        borderRadius: NODE_SIZE / 2,
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
