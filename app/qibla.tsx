import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import * as Linking from 'expo-linking';
import * as Location from 'expo-location';
import { Stack } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Platform, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton } from '@/components/common/BackButton';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { CompassDial } from '@/components/qibla/CompassDial';
import { QiblaMessageState } from '@/components/qibla/QiblaMessageState';
import { QiblaStats } from '@/components/qibla/QiblaStats';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/context/ThemeContext';
import {
    ALIGNMENT_THRESHOLD_DEG,
    alignmentOffset,
    compassPoint,
    formatDistance,
    qiblaFrom,
    shortestAngleDelta,
} from '@/utils/qibla';

/**
 * Why these are separate states: `getCurrentCoords` returns null for four quite
 * different reasons, and the screen used to collapse them into one "couldn't
 * get your location" message with nothing to tap. Each of these needs a
 * different sentence and a different button, because the fix is different --
 * granting a permission, re-enabling a system service, or simply retrying.
 */
type ScreenStatus =
    | 'loading'
    | 'permission-denied'   // refused, but the OS will still let us ask
    | 'permission-blocked'  // refused permanently; only Settings can undo it
    | 'services-disabled'   // permission fine, device location switched off
    | 'location-failed'     // permitted and enabled, but no fix came back
    | 'no-compass'          // no magnetometer; bearing still shown numerically
    | 'ready';

const HEADING_TWEEN_MS = 110;

export default function QiblaScreen() {
    const insets = useSafeAreaInsets();
    const { theme } = useTheme();
    const colors = Colors[theme];
    const { width, height } = useWindowDimensions();

    const [status, setStatus] = useState<ScreenStatus>('loading');
    const [busy, setBusy] = useState(false);
    const [qiblaBearing, setQiblaBearing] = useState<number | null>(null);
    const [distanceKm, setDistanceKm] = useState<number | null>(null);
    const [offsetDeg, setOffsetDeg] = useState<number | null>(null);
    const [aligned, setAligned] = useState(false);
    const [lowAccuracy, setLowAccuracy] = useState(false);

    // The dial is sized from the viewport and clamped: wide enough to read on a
    // small phone, never so tall that the stats card is pushed off a short one.
    const dialSize = Math.round(
        Math.max(200, Math.min(320, width - 72, (height - insets.top - insets.bottom) * 0.42)),
    );

    // One continuous, unbounded rotation drives both dial layers. The rose sits
    // at -heading and the marker at rose + bearing, so deriving one from the
    // other is what guarantees they can never drift apart. Unbounded means the
    // dial always turns the short way instead of unwinding through 0°/360°.
    const rose = useSharedValue(0);
    const bearingSV = useSharedValue(0);
    const continuous = useRef(0);
    const fade = useSharedValue(0);
    const pulse = useSharedValue(1);

    const headingSub = useRef<Location.LocationSubscription | null>(null);
    const mounted = useRef(true);
    const statusRef = useRef<ScreenStatus>(status);
    const bearingRef = useRef<number | null>(null);
    const lastOffsetRef = useRef<number | null>(null);
    const lowAccuracyRef = useRef(false);
    const alignedRef = useRef(false);

    const roseStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${rose.value}deg` }] }));
    const markerStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${rose.value + bearingSV.value}deg` }],
    }));
    const contentStyle = useAnimatedStyle(() => ({
        opacity: fade.value,
        transform: [{ scale: 0.96 + fade.value * 0.04 }],
    }));
    const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

    const stopHeading = useCallback(() => {
        headingSub.current?.remove();
        headingSub.current = null;
    }, []);

    const startHeading = useCallback(async (bearing: number) => {
        stopHeading();
        try {
            headingSub.current = await Location.watchHeadingAsync((heading) => {
                if (!mounted.current) return;

                // trueHeading is -1 until the device has a geomagnetic model;
                // magHeading is the honest fallback until then.
                const deviceHeading = heading.trueHeading >= 0 ? heading.trueHeading : heading.magHeading;
                if (!Number.isFinite(deviceHeading)) return;

                // Android reports 0-3; anything under 2 is worth a calibration
                // nudge. Guarded like the readout below: this fires on every
                // sensor sample, and the value changes very rarely.
                const noisy = heading.accuracy > 0 && heading.accuracy < 2;
                if (noisy !== lowAccuracyRef.current) {
                    lowAccuracyRef.current = noisy;
                    setLowAccuracy(noisy);
                }

                const target = -deviceHeading;
                continuous.current += shortestAngleDelta(target, continuous.current % 360);
                rose.value = withTiming(continuous.current, {
                    duration: HEADING_TWEEN_MS,
                    easing: Easing.out(Easing.quad),
                });

                // Re-render only when the whole degree changes, so a device held
                // still does not re-render the tree on every sensor sample.
                const offset = alignmentOffset(bearing, deviceHeading);
                const rounded = Math.round(offset);
                if (rounded !== lastOffsetRef.current) {
                    lastOffsetRef.current = rounded;
                    setOffsetDeg(offset);
                }

                const nowAligned = offset <= ALIGNMENT_THRESHOLD_DEG;
                if (nowAligned !== alignedRef.current) {
                    alignedRef.current = nowAligned;
                    setAligned(nowAligned);
                    if (nowAligned) {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => { });
                    }
                }
            });
            return true;
        } catch (error) {
            if (__DEV__) console.warn('Qibla: compass/heading unavailable', error);
            return false;
        }
    }, [rose, stopHeading]);

    /**
     * Resolves location and decides which state to show. `interactive` is true
     * when the user tapped a button: only then may we raise the system
     * permission prompt, so arriving on the screen never fires a dialog the
     * user did not ask for.
     */
    const resolve = useCallback(async (interactive: boolean) => {
        if (!mounted.current) return;
        setBusy(true);

        try {
            let perm = await Location.getForegroundPermissionsAsync();

            if (perm.status !== Location.PermissionStatus.GRANTED && interactive && perm.canAskAgain) {
                perm = await Location.requestForegroundPermissionsAsync();
            }

            if (!mounted.current) return;

            if (perm.status !== Location.PermissionStatus.GRANTED) {
                setStatus(perm.canAskAgain ? 'permission-denied' : 'permission-blocked');
                return;
            }

            const servicesOn = await Location.hasServicesEnabledAsync();
            if (!mounted.current) return;
            if (!servicesOn) {
                setStatus('services-disabled');
                return;
            }

            const position = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            });
            if (!mounted.current) return;

            const { latitude, longitude } = position.coords;
            if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
                setStatus('location-failed');
                return;
            }

            const { bearing, distanceKm: dist } = qiblaFrom(latitude, longitude);
            setQiblaBearing(bearing);
            setDistanceKm(dist);
            bearingSV.value = bearing;
            bearingRef.current = bearing;

            const hasCompass = await startHeading(bearing);
            if (!mounted.current) return;

            setStatus(hasCompass ? 'ready' : 'no-compass');
            fade.value = withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) });
        } catch (error) {
            if (__DEV__) console.warn('Qibla: location lookup failed', error);
            if (mounted.current) setStatus('location-failed');
        } finally {
            if (mounted.current) setBusy(false);
        }
    }, [bearingSV, fade, startHeading]);

    useEffect(() => { statusRef.current = status; }, [status]);

    useEffect(() => {
        mounted.current = true;
        resolve(false);
        return () => {
            mounted.current = false;
            stopHeading();
        };
    }, [resolve, stopHeading]);

    // Coming back from Settings is the whole point of sending someone there, so
    // re-check on foreground rather than leaving a stale error on screen.
    useEffect(() => {
        const sub = AppState.addEventListener('change', (next) => {
            if (next !== 'active') return;
            if (statusRef.current === 'ready') {
                // The heading stream stops while backgrounded and does not
                // resume on its own, which would leave a dial frozen at
                // whatever angle it held when the user left.
                if (bearingRef.current !== null) startHeading(bearingRef.current);
                return;
            }
            resolve(false);
        });
        return () => sub.remove();
    }, [resolve, startHeading]);

    // A soft breathing pulse only while aligned — motion that means something,
    // rather than motion for its own sake.
    useEffect(() => {
        if (aligned) {
            pulse.value = withRepeat(
                withSequence(
                    withTiming(1.03, { duration: 900, easing: Easing.inOut(Easing.quad) }),
                    withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) }),
                ),
                -1,
                true,
            );
        } else {
            pulse.value = withTiming(1, { duration: 220 });
        }
    }, [aligned, pulse]);

    /** App permission page — where a blocked location permission is re-granted. */
    const openAppSettings = useCallback(() => {
        Linking.openSettings().catch(() => { });
    }, []);

    /**
     * System location toggle. Android exposes it as an intent, so we can land
     * the user on the exact switch. iOS has no such deep link, so the app's own
     * settings page is the closest reachable destination.
     */
    const openLocationSettings = useCallback(() => {
        if (Platform.OS === 'android') {
            Linking.sendIntent('android.settings.LOCATION_SOURCE_SETTINGS')
                .catch(() => { Linking.openSettings().catch(() => { }); });
            return;
        }
        Linking.openSettings().catch(() => { });
    }, []);

    const renderBody = () => {
        if (status === 'loading') {
            return (
                <QiblaMessageState
                    colors={colors}
                    icon="compass-outline"
                    title="Finding your position"
                    message="Just a moment while we work out which way the Kaaba is from here."
                    busy
                />
            );
        }

        if (status === 'permission-denied') {
            return (
                <QiblaMessageState
                    colors={colors}
                    icon="location-outline"
                    title="Location access needed"
                    message="The Qibla direction depends on where you are, so the compass needs your location to point the right way. It is only used on your device to work out the direction."
                    actionLabel="Allow Location Access"
                    actionIcon="navigate-circle-outline"
                    onAction={() => resolve(true)}
                    busy={busy}
                />
            );
        }

        if (status === 'permission-blocked') {
            return (
                <QiblaMessageState
                    colors={colors}
                    tone="warning"
                    icon="lock-closed-outline"
                    title="Location is turned off for this app"
                    message="Location permission was declined earlier, so we can no longer ask from inside the app. You can turn it back on in Settings, then come straight back here."
                    actionLabel="Open Settings"
                    actionIcon="settings-outline"
                    onAction={openAppSettings}
                    footnote="This screen refreshes on its own when you return."
                />
            );
        }

        if (status === 'services-disabled') {
            return (
                <QiblaMessageState
                    colors={colors}
                    tone="warning"
                    icon="navigate-outline"
                    title="Location services are off"
                    message="Your device's location is switched off, so we cannot work out your position. Turn it on and the compass will start straight away."
                    actionLabel="Turn On Location"
                    actionIcon="settings-outline"
                    onAction={openLocationSettings}
                    footnote="This screen refreshes on its own when you return."
                />
            );
        }

        if (status === 'location-failed') {
            return (
                <QiblaMessageState
                    colors={colors}
                    icon="cloud-offline-outline"
                    title="Couldn't get a location fix"
                    message="We have permission, but no position came back. This usually clears up outdoors or near a window."
                    actionLabel="Try Again"
                    actionIcon="refresh-outline"
                    onAction={() => resolve(true)}
                    busy={busy}
                />
            );
        }

        if (status === 'no-compass') {
            return (
                <QiblaMessageState
                    colors={colors}
                    icon="compass-outline"
                    title="No compass on this device"
                    message="This device has no magnetometer, so the dial cannot follow which way you are facing. The bearing below is still accurate for your location."
                    footnote={
                        qiblaBearing !== null
                            ? `Qibla is ${Math.round(qiblaBearing)}° (${compassPoint(qiblaBearing)}) from true north.`
                            : undefined
                    }
                />
            );
        }

        return (
            <Animated.View style={[styles.body, contentStyle]}>
                <View
                    style={[
                        styles.banner,
                        {
                            backgroundColor: aligned ? `${colors.success}1A` : lowAccuracy ? `${colors.warning}1A` : colors.cardBg,
                        },
                    ]}
                >
                    <Ionicons
                        name={aligned ? 'checkmark-circle' : lowAccuracy ? 'sync-outline' : 'information-circle-outline'}
                        size={15}
                        color={aligned ? colors.success : lowAccuracy ? colors.warning : colors.textSecondary}
                    />
                    <ThemedText
                        style={[
                            styles.bannerText,
                            { color: aligned ? colors.success : lowAccuracy ? colors.warning : colors.textSecondary },
                        ]}
                        numberOfLines={2}
                    >
                        {aligned
                            ? 'You are facing the Qibla'
                            : lowAccuracy
                                ? 'Move your phone in a figure-8 to calibrate'
                                : 'Turn slowly until the marker meets the pointer'}
                    </ThemedText>
                </View>

                <View style={styles.dialArea}>
                    <Animated.View style={[{ width: dialSize, height: dialSize }, pulseStyle]}>
                        <CompassDial
                            size={dialSize}
                            colors={colors}
                            roseStyle={roseStyle}
                            markerStyle={markerStyle}
                            aligned={aligned}
                            offsetDeg={offsetDeg}
                        />

                        {/* Fixed reference pointer: the direction the phone is
                            facing. Anchored to the dial itself, so it stays on
                            the rim whatever size the dial resolves to. */}
                        <View style={styles.pointer} pointerEvents="none">
                            <Ionicons
                                name="caret-down"
                                size={22}
                                color={aligned ? colors.success : colors.secondary}
                            />
                        </View>
                    </Animated.View>
                </View>

                <QiblaStats
                    colors={colors}
                    bearing={qiblaBearing !== null ? `${Math.round(qiblaBearing)}°` : '—'}
                    bearingHint={qiblaBearing !== null ? compassPoint(qiblaBearing) : undefined}
                    distance={distanceKm !== null ? formatDistance(distanceKm) : '—'}
                />
            </Animated.View>
        );
    };

    return (
        <ErrorBoundary>
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <Stack.Screen options={{ headerShown: false }} />

                <LinearGradient
                    colors={[colors.primary, theme === 'dark' ? '#0E4A4A' : '#004C4C']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.header, { paddingTop: insets.top + 14 }]}
                >
                    <View style={styles.headerRow}>
                        <BackButton backgroundColor="rgba(255,255,255,0.18)" color="#FFFFFF" size={20} />
                        <View style={styles.headerText}>
                            <ThemedText style={styles.title}>Qibla Compass</ThemedText>
                            <ThemedText style={styles.subtitle}>Find the direction of the Kaaba</ThemedText>
                        </View>
                    </View>
                </LinearGradient>

                {renderBody()}
            </View>
        </ErrorBoundary>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        paddingHorizontal: 16,
        paddingBottom: 18,
        borderBottomLeftRadius: Layout.headerBorderRadius,
        borderBottomRightRadius: Layout.headerBorderRadius,
    },
    headerRow: { flexDirection: 'row', alignItems: 'center' },
    headerText: { flex: 1, marginLeft: 12 },
    title: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
    subtitle: { fontSize: 11.5, fontWeight: '600', color: 'rgba(255,255,255,0.85)', marginTop: 2 },

    body: { flex: 1, alignItems: 'center', paddingHorizontal: 20, paddingTop: 18, paddingBottom: 20 },

    banner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        borderRadius: Layout.borderRadius,
        paddingHorizontal: 14,
        paddingVertical: 10,
        maxWidth: 340,
    },
    bannerText: { fontSize: 11.5, fontWeight: '700', flexShrink: 1 },

    dialArea: { flex: 1, alignItems: 'center', justifyContent: 'center', width: '100%' },
    pointer: {
        position: 'absolute',
        top: -20,
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 2,
    },
});
