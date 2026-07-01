import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import * as ExpoSplashScreen from 'expo-splash-screen';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withRepeat,
    withSpring,
    withTiming
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const LOGO_SIZE = width * 0.6;

const logoImg = require('../../public/logo_with_text.png');

const CustomSplashScreen = React.memo(function CustomSplashScreen() {
    const { theme } = useTheme();
    const colors = Colors[theme];
    const isDark = theme === 'dark';

    // Split words into character arrays for staggered typewriter animation
    const titleText = "RAHBAR";
    const subtitleText = "YOUR LOCAL GUIDE";

    const titleChars = titleText.split("");
    const subtitleChars = subtitleText.split("");

    // Shared values for animations
    const logoScale = useSharedValue(1); // Start fully scaled
    const logoOpacity = useSharedValue(1); // Start fully visible
    const logoTranslateY = useSharedValue(0); // Start at rest

    const glowScale = useSharedValue(0.85);
    const glowOpacity = useSharedValue(0);

    const progressWidth = useSharedValue(0);

    // Stagger progress animation controllers
    const titleProgress = useSharedValue(0);
    const subtitleProgress = useSharedValue(0);

    useEffect(() => {
        // 1. Elastic Spring logo entrance (Commented out for seamless transition from OS Splash)
        // logoScale.value = withSpring(1, { damping: 14, stiffness: 85 });
        // logoOpacity.value = withTiming(1, { duration: 600 });
        // logoTranslateY.value = withSpring(0, { damping: 14, stiffness: 85 });

        // 2. Repeating breathing glow halo behind the logo
        glowScale.value = withRepeat(
            withTiming(1.3, { duration: 2400, easing: Easing.bezier(0.4, 0, 0.2, 1) }),
            -1,
            true
        );
        glowOpacity.value = withRepeat(
            withTiming(0.4, { duration: 2400, easing: Easing.bezier(0.4, 0, 0.2, 1) }),
            -1,
            true
        );

        // 3. Fill loading progress bar
        progressWidth.value = withTiming(1, {
            duration: 1800,
            easing: Easing.bezier(0.2, 0.8, 0.2, 1)
        });

        // 4. Staggered character typing start
        titleProgress.value = withDelay(400, withTiming(1, { duration: 800, easing: Easing.out(Easing.quad) }));
        subtitleProgress.value = withDelay(1000, withTiming(1, { duration: 1100, easing: Easing.out(Easing.quad) }));
    }, []);

    // Animated Styles
    const logoStyle = useAnimatedStyle(() => ({
        transform: [
            { scale: logoScale.value },
            { translateY: logoTranslateY.value }
        ],
        opacity: logoOpacity.value,
    }));

    const glowStyle = useAnimatedStyle(() => ({
        transform: [{ scale: glowScale.value }],
        opacity: glowOpacity.value,
    }));

    const progressStyle = useAnimatedStyle(() => ({
        width: `${progressWidth.value * 100}%`,
    }));

    return (
        <View style={styles.container}>
            {/* Background premium gradient */}
            <LinearGradient
                colors={isDark ? ['#020617', '#0F172A'] : ['#FFFFFF', '#ECFDF5']}
                style={StyleSheet.absoluteFill}
            />

            {/* Glowing Aura/Halo behind logo */}
            <Animated.View
                style={[
                    styles.glowAura,
                    { backgroundColor: isDark ? 'rgba(16,185,129,0.12)' : 'rgba(16,185,129,0.06)' },
                    glowStyle
                ]}
            />

            {/* Logo Emblem */}
            <Animated.View style={[styles.logoContainer, logoStyle]}>
                <Image
                    source={logoImg}
                    style={styles.logo}
                    contentFit="contain"
                />
            </Animated.View>

            {/* Glowing active loading line */}
            <View style={[styles.progressBarContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)' }]}>
                <Animated.View style={[styles.progressBarActive, { backgroundColor: colors.primary }, progressStyle]} />
            </View>

            {/* Branded Footer with Character Animations */}
            <View style={styles.footer}>
                {/* RAHBAR Title */}
                <View style={styles.charRow}>
                    {titleChars.map((char, index) => {
                        const charStyle = useAnimatedStyle(() => {
                            const start = index / titleChars.length;
                            const end = (index + 1.5) / titleChars.length;
                            const opacity = Math.min(Math.max((titleProgress.value - start) / (end - start), 0), 1);
                            return {
                                opacity,
                                transform: [{ translateY: (1 - opacity) * 6 }]
                            };
                        });
                        return (
                            <Animated.Text
                                key={`t-${index}`}
                                style={[
                                    styles.footerText,
                                    { color: isDark ? '#FFFFFF' : '#0F172A' },
                                    charStyle
                                ]}
                            >
                                {char}
                            </Animated.Text>
                        );
                    })}
                </View>

                {/* Subtitle */}
                <View style={[styles.charRow, { marginTop: 6 }]}>
                    {subtitleChars.map((char, index) => {
                        const charStyle = useAnimatedStyle(() => {
                            const start = index / subtitleChars.length;
                            const end = (index + 1.5) / subtitleChars.length;
                            const opacity = Math.min(Math.max((subtitleProgress.value - start) / (end - start), 0), 1);
                            return {
                                opacity,
                                transform: [{ translateY: (1 - opacity) * 4 }]
                            };
                        });
                        return (
                            <Animated.Text
                                key={`s-${index}`}
                                style={[
                                    styles.footerSubText,
                                    { color: colors.primary },
                                    charStyle
                                ]}
                            >
                                {char}
                            </Animated.Text>
                        );
                    })}
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
    },
    glowAura: {
        position: 'absolute',
        width: LOGO_SIZE * 0.9,
        height: LOGO_SIZE * 0.9,
        borderRadius: (LOGO_SIZE * 0.9) / 2,
    },
    logoContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
        zIndex: 2,
    },
    logo: {
        width: LOGO_SIZE,
        height: LOGO_SIZE,
    },
    progressBarContainer: {
        position: 'absolute',
        bottom: 110,
        width: '55%',
        height: 3,
        borderRadius: 1.5,
        overflow: 'hidden',
    },
    progressBarActive: {
        height: '100%',
        borderRadius: 1.5,
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
        letterSpacing: 2,
    },
    footerSubText: {
        fontSize: 9,
        fontWeight: '700',
        marginHorizontal: 0.5,
        letterSpacing: 1.5,
    },
});

export default CustomSplashScreen;
