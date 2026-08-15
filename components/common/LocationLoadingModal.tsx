import React, { useEffect, useState } from 'react';
import { Modal, View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    Easing,
    interpolate,
    cancelAnimation,
    FadeIn,
    ZoomIn,
    FadeInDown,
    FadeOutUp } from 'react-native-reanimated';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { Layout } from '@/constants/layout';

const DEFAULT_MESSAGES = [
    '📍 Getting your location...',
    '🛰️ Finding the best GPS signal...',
    '📡 Almost there...',
    '🌍 Preparing nearby places...',
    '🚀 Just a moment...',
    '✅ Finalizing your location...',
];

const BAR_WIDTH = 220;
const SHIMMER_WIDTH = 90;

interface LocationLoadingModalProps {
    visible: boolean;
    /** Optional custom status messages to rotate through. */
    messages?: string[];
    /** Optional heading shown above the progress bar. */
    title?: string;
}

/**
 * Premium, reusable full-screen loading modal for location fetching.
 *
 * Shows the Rahbar app icon with a pulsing glow + gentle breathing scale, an
 * indeterminate tri-color (primary → secondary → lime) progress bar with a
 * moving shimmer, friendly rotating status messages with smooth transitions,
 * and reassuring copy so users never feel the app is frozen.
 *
 * Drop it in anywhere location is being fetched:
 *   <LocationLoadingModal visible={isLocating} />
 */
export const LocationLoadingModal = React.memo(function LocationLoadingModal({ visible, messages = DEFAULT_MESSAGES, title = 'Finding your location' }: LocationLoadingModalProps) {
    const { theme, isDark } = useTheme();
    const colors = Colors[theme];

    const [msgIndex, setMsgIndex] = useState(0);

    const glow = useSharedValue(0);
    const breathe = useSharedValue(0);
    const shimmer = useSharedValue(0);

    useEffect(() => {
        if (!visible) return;

        setMsgIndex(0);
        glow.value = withRepeat(withTiming(1, { duration: 1900, easing: Easing.out(Easing.ease) }), -1, false);
        breathe.value = withRepeat(withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }), -1, true);
        shimmer.value = withRepeat(withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.ease) }), -1, false);

        const id = setInterval(() => {
            setMsgIndex((i) => (i + 1) % messages.length);
        }, 2200);
        return () => {
            clearInterval(id);
            cancelAnimation(glow);
            cancelAnimation(breathe);
            cancelAnimation(shimmer);
        };
    }, [visible, messages.length]);

    const glowStyle = useAnimatedStyle(() => ({
        transform: [{ scale: interpolate(glow.value, [0, 1], [0.8, 1.8]) }],
        opacity: interpolate(glow.value, [0, 1], [0.45, 0]) }));

    const iconStyle = useAnimatedStyle(() => ({
        transform: [{ scale: interpolate(breathe.value, [0, 1], [1, 1.06]) }] }));

    const shimmerStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: interpolate(shimmer.value, [0, 1], [-SHIMMER_WIDTH, BAR_WIDTH]) }] }));

    return (
        <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={() => { }}>
            <View style={[styles.backdrop, { backgroundColor: isDark ? 'rgba(2,6,23,0.78)' : 'rgba(15,23,42,0.55)' }]}>
                <Animated.View
                    entering={ZoomIn.duration(320)}
                    style={[styles.card, { backgroundColor: colors.background }]}
                >
                    {/* App icon with pulsing glow + breathing scale */}
                    <View style={styles.iconWrap}>
                        <Animated.View style={[styles.glow, { backgroundColor: colors.primary }, glowStyle]} />
                        <Animated.View
                            style={[
                                styles.iconCircle,
                                { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#FFFFFF' },
                                iconStyle,
                            ]}
                        >
                            <Image source={require('@/public/logo.png')} style={styles.icon} contentFit="contain" />
                        </Animated.View>
                    </View>

                    {title ? (
                        <Animated.View entering={FadeIn.delay(120).duration(400)}>
                            <ThemedText style={[styles.title, { color: colors.text }]}>{title}</ThemedText>
                        </Animated.View>
                    ) : null}

                    {/* Indeterminate tri-color progress bar with shimmer */}
                    <View style={[styles.track, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
                        <LinearGradient
                            colors={[colors.primary, colors.secondary, colors.lime]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={StyleSheet.absoluteFill}
                        />
                        <Animated.View style={[styles.shimmerWrap, shimmerStyle]}>
                            <LinearGradient
                                colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.6)', 'rgba(255,255,255,0)']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={{ flex: 1 }}
                            />
                        </Animated.View>
                    </View>

                    {/* Rotating status message with smooth transition */}
                    <View style={styles.msgWrap}>
                        <Animated.View
                            key={msgIndex}
                            entering={FadeInDown.duration(360)}
                            exiting={FadeOutUp.duration(280)}
                            style={styles.msgInner}
                        >
                            <ThemedText style={[styles.message, { color: colors.text }]}>
                                {messages[msgIndex]}
                            </ThemedText>
                        </Animated.View>
                    </View>

                    {/* Reassuring copy */}
                    <ThemedText style={[styles.reassure, { color: colors.icon }]}>
                        This usually takes only a few seconds.
                    </ThemedText>
                    <ThemedText style={[styles.reassure, { color: colors.icon, marginTop: 2 }]}>
                        Please keep the app open while we find your location.
                    </ThemedText>
                </Animated.View>
            </View>
        </Modal>
    );
});

const ICON_SIZE = 96;

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20 },
    card: {
        width: '100%',
        maxWidth: 340,
        borderRadius: Layout.borderRadius,
        paddingHorizontal: 20,
        paddingTop: 28,
        paddingBottom: 22,
        alignItems: 'center' },
    iconWrap: {
        width: ICON_SIZE + 40,
        height: ICON_SIZE + 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20 },
    glow: {
        position: 'absolute',
        width: ICON_SIZE,
        height: ICON_SIZE,
        borderRadius: ICON_SIZE / 2 },
    iconCircle: {
        width: ICON_SIZE,
        height: ICON_SIZE,
        borderRadius: ICON_SIZE / 2,
        alignItems: 'center',
        justifyContent: 'center' },
    icon: {
        width: ICON_SIZE * 0.62,
        height: ICON_SIZE * 0.62 },
    title: {
        fontSize: 15.5,
        fontWeight: '800',
        letterSpacing: 0.2,
        marginBottom: 18,
        textAlign: 'center' },
    track: {
        width: BAR_WIDTH,
        height: 8,
        borderRadius: Layout.borderRadius,
        overflow: 'hidden' },
    shimmerWrap: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: SHIMMER_WIDTH },
    msgWrap: {
        height: 30,
        marginTop: 22,
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'stretch' },
    msgInner: {
        position: 'absolute',
        left: 0,
        right: 0,
        alignItems: 'center' },
    message: {
        fontSize: 12.5,
        fontWeight: '700',
        textAlign: 'center' },
    reassure: {
        fontSize: 10.5,
        textAlign: 'center',
        lineHeight: 17,
        marginTop: 10 } });
