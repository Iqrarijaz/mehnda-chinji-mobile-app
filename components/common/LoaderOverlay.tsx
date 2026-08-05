import React, { memo, useEffect } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import Animated, {
    Easing,
    interpolate,
    type SharedValue,
    useAnimatedStyle,
    useReducedMotion,
    useSharedValue,
    withRepeat,
    withTiming } from 'react-native-reanimated';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/colors';

interface LoaderOverlayProps {
    visible: boolean;
    text?: string;
}

/**
 * Brand orbit — three dots (primary / lime / secondary) orbit a soft
 * breathing halo, gently floating. Runs entirely on the UI thread, is
 * reduce-motion aware, and uses no shadows/elevation (flat, matching the
 * app's existing convention).
 */
const ORBIT = 110;
const R = 38;
const DOT = 24;
const CENTER = ORBIT / 2;

const OrbitDot = memo(function OrbitDot({
    spin,
    color,
    angle,
    phase }: {
    spin: SharedValue<number>;
    color: string;
    angle: number;
    phase: number;
}) {
    const rad = (angle * Math.PI) / 180;
    const left = CENTER + R * Math.cos(rad) - DOT / 2;
    const top = CENTER + R * Math.sin(rad) - DOT / 2;

    const style = useAnimatedStyle(() => {
        // A wave travels around the ring so dots "float", the leading one largest.
        const t = spin.value * Math.PI * 2 + phase;
        const wave = 0.5 + 0.5 * Math.sin(t);
        return {
            transform: [{ scale: 0.62 + 0.38 * wave }],
            opacity: 0.55 + 0.45 * wave };
    });

    return (
        <Animated.View
            style={[
                { position: 'absolute', left, top, width: DOT, height: DOT, borderRadius: DOT / 2, backgroundColor: color },
                style,
            ]}
        />
    );
});

const BrandOrbit = memo(function BrandOrbit({ colors }: { colors: typeof Colors.light }) {
    const reduced = useReducedMotion();
    const spin = useSharedValue(0);
    const breath = useSharedValue(0);
    const float = useSharedValue(0);

    const dots = [
        { color: colors.primary, angle: -90 },
        { color: colors.lime, angle: 30 },
        { color: colors.secondary, angle: 150 },
    ] as const;

    useEffect(() => {
        if (reduced) {
            spin.value = 0.5;
            breath.value = 0.5;
            return;
        }
        spin.value = withRepeat(withTiming(1, { duration: 1600, easing: Easing.linear }), -1, false);
        breath.value = withRepeat(withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.quad) }), -1, true);
        float.value = withRepeat(withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.sin) }), -1, true);
    }, [reduced]);

    const groupStyle = useAnimatedStyle(() => ({
        transform: [
            { translateY: interpolate(float.value, [0, 1], [-3, 3]) },
            { rotate: `${spin.value * 360}deg` },
        ] }));
    const haloStyle = useAnimatedStyle(() => ({
        transform: [{ scale: interpolate(breath.value, [0, 1], [0.82, 1.12]) }],
        opacity: interpolate(breath.value, [0, 1], [0.18, 0.42]) }));
    const coreStyle = useAnimatedStyle(() => ({
        transform: [{ scale: interpolate(breath.value, [0, 1], [0.9, 1.08]) }] }));

    return (
        <View style={styles.orbitBox}>
            <Animated.View style={[styles.halo, { backgroundColor: colors.lime }, haloStyle]} />
            <Animated.View style={[StyleSheet.absoluteFill, groupStyle]}>
                {dots.map((d, i) => (
                    <OrbitDot key={i} spin={spin} color={d.color} angle={d.angle} phase={(i * 2 * Math.PI) / 3} />
                ))}
            </Animated.View>
            <Animated.View style={[styles.core, { backgroundColor: colors.primary }, coreStyle]} />
        </View>
    );
});

export const LoaderOverlay: React.FC<LoaderOverlayProps> = ({ visible, text }) => {
    const { theme } = useTheme();
    const colors = Colors[theme];

    if (!visible) return null;

    return (
        <Modal
            transparent
            animationType="fade"
            visible={visible}
            onRequestClose={() => {}}
        >
            <View style={styles.overlay}>
                <BrandOrbit colors={colors} />
                {text ? (
                    <ThemedText style={styles.text} numberOfLines={2}>
                        {text}
                    </ThemedText>
                ) : null}
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999 },
    orbitBox: {
        width: ORBIT,
        height: ORBIT,
        alignItems: 'center',
        justifyContent: 'center' },
    halo: {
        position: 'absolute',
        width: ORBIT,
        height: ORBIT,
        borderRadius: ORBIT / 2 },
    core: {
        width: 20,
        height: 20,
        borderRadius: 10 },
    text: {
        marginTop: 18,
        color: '#FFFFFF',
        fontSize: 12.5,
        fontWeight: '700',
        textAlign: 'center',
        letterSpacing: 0.2 } });
