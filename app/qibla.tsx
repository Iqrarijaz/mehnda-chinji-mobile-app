import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, Easing } from 'react-native-reanimated';

import { BackButton } from '@/components/common/BackButton';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/context/ThemeContext';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { getCurrentCoords } from '@/utils/locationService';

// The Kaaba, Masjid al-Haram, Mecca.
const KAABA = { latitude: 21.4225, longitude: 39.8262 };

const DIAL_SIZE = 280;

function toRad(deg: number) { return (deg * Math.PI) / 180; }
function toDeg(rad: number) { return (rad * 180) / Math.PI; }

/** Great-circle initial bearing from (lat1,lon1) to (lat2,lon2) — 0-360°, 0 = true north. */
function calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const phi1 = toRad(lat1);
    const phi2 = toRad(lat2);
    const deltaLambda = toRad(lon2 - lon1);
    const y = Math.sin(deltaLambda) * Math.cos(phi2);
    const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);
    return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

/** Great-circle distance in km between two coordinates (haversine). */
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const phi1 = toRad(lat1);
    const phi2 = toRad(lat2);
    const deltaPhi = toRad(lat2 - lat1);
    const deltaLambda = toRad(lon2 - lon1);
    const a = Math.sin(deltaPhi / 2) ** 2 + Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Shortest signed angular delta from `current` to `target`, in (-180, 180]. */
function shortestAngleDelta(target: number, current: number): number {
    return (((target - current) % 360) + 540) % 360 - 180;
}

type ScreenStatus = 'loading' | 'no-permission' | 'no-location' | 'no-compass' | 'ready';

export default function QiblaScreen() {
    const insets = useSafeAreaInsets();
    const { theme } = useTheme();
    const colors = Colors[theme];

    const [status, setStatus] = useState<ScreenStatus>('loading');
    const [qiblaBearing, setQiblaBearing] = useState<number | null>(null);
    const [distanceKm, setDistanceKm] = useState<number | null>(null);
    const [accuracy, setAccuracy] = useState<number>(0);

    // Continuous (unbounded) rotation so the dial always animates the short
    // way round instead of snapping back through 0°/360° every full turn.
    const rotation = useSharedValue(0);
    const continuousRotation = useRef(0);

    useEffect(() => {
        let headingSubscription: Location.LocationSubscription | null = null;
        let isMounted = true;

        const start = async () => {
            const coords = await getCurrentCoords({ requestPermission: true });
            if (!isMounted) return;

            if (!coords) {
                const { status: permStatus } = await Location.getForegroundPermissionsAsync();
                setStatus(permStatus === Location.PermissionStatus.GRANTED ? 'no-location' : 'no-permission');
                return;
            }

            const bearing = calculateBearing(coords.latitude, coords.longitude, KAABA.latitude, KAABA.longitude);
            const distance = calculateDistanceKm(coords.latitude, coords.longitude, KAABA.latitude, KAABA.longitude);
            setQiblaBearing(bearing);
            setDistanceKm(distance);

            try {
                headingSubscription = await Location.watchHeadingAsync((heading) => {
                    if (!isMounted) return;
                    setAccuracy(heading.accuracy);

                    const deviceHeading = heading.trueHeading >= 0 ? heading.trueHeading : heading.magHeading;
                    // Dial rotates so its fixed Kaaba marker (drawn at the dial's top)
                    // points at the real-world bearing to Mecca as the phone turns.
                    const target = bearing - deviceHeading;
                    const delta = shortestAngleDelta(target, continuousRotation.current % 360);
                    continuousRotation.current += delta;

                    rotation.value = withTiming(continuousRotation.current, {
                        duration: 120,
                        easing: Easing.out(Easing.quad),
                    });
                });
                setStatus('ready');
            } catch (error) {
                if (__DEV__) console.warn('Qibla: compass/heading unavailable', error);
                setStatus('no-compass');
            }
        };

        start();

        return () => {
            isMounted = false;
            headingSubscription?.remove();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const dialAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${rotation.value}deg` }],
    }));

    const renderBody = useCallback(() => {
        if (status === 'loading') {
            return (
                <View style={styles.centerWrap}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <ThemedText style={[styles.centerText, { color: colors.textSecondary }]}>
                        Getting your location…
                    </ThemedText>
                </View>
            );
        }

        if (status === 'no-permission' || status === 'no-location') {
            return (
                <View style={styles.centerWrap}>
                    <Ionicons name="location-outline" size={48} color={colors.textSecondary} />
                    <ThemedText style={[styles.centerTitle, { color: colors.text }]}>Location needed</ThemedText>
                    <ThemedText style={[styles.centerText, { color: colors.textSecondary }]}>
                        {status === 'no-permission'
                            ? 'Allow location access so the Qibla direction can be calculated for where you are.'
                            : "Couldn't get your current location. Make sure location services are turned on and try again."}
                    </ThemedText>
                </View>
            );
        }

        if (status === 'no-compass') {
            return (
                <View style={styles.centerWrap}>
                    <Ionicons name="compass-outline" size={48} color={colors.textSecondary} />
                    <ThemedText style={[styles.centerTitle, { color: colors.text }]}>Compass unavailable</ThemedText>
                    <ThemedText style={[styles.centerText, { color: colors.textSecondary }]}>
                        This device doesn&apos;t have a working magnetometer, so a live compass isn&apos;t possible here.
                        {qiblaBearing !== null && ` Qibla is ${Math.round(qiblaBearing)}° from true north.`}
                    </ThemedText>
                </View>
            );
        }

        return (
            <View style={styles.compassWrap}>
                {accuracy > 0 && accuracy < 2 && (
                    <View style={[styles.calibrateBanner, { backgroundColor: `${colors.primary}14` }]}>
                        <Ionicons name="refresh-outline" size={14} color={colors.primary} />
                        <ThemedText style={[styles.calibrateText, { color: colors.primary }]}>
                            Move your phone in a figure-8 to calibrate the compass
                        </ThemedText>
                    </View>
                )}

                <View style={styles.dialOuter}>
                    {/* Fixed pointer representing the top of the phone / direction it's facing. */}
                    <View style={[styles.facingPointer, { borderBottomColor: colors.secondary }]} />

                    <Animated.View style={[styles.dial, { backgroundColor: colors.cardBg, borderColor: colors.border }, dialAnimatedStyle]}>
                        <View style={styles.tick_N}><ThemedText style={[styles.tickLabel, { color: colors.text }]}>N</ThemedText></View>
                        <View style={styles.tick_E}><ThemedText style={[styles.tickLabel, { color: colors.textSecondary }]}>E</ThemedText></View>
                        <View style={styles.tick_S}><ThemedText style={[styles.tickLabel, { color: colors.textSecondary }]}>S</ThemedText></View>
                        <View style={styles.tick_W}><ThemedText style={[styles.tickLabel, { color: colors.textSecondary }]}>W</ThemedText></View>

                        <View style={styles.kaabaMarker}>
                            <View style={[styles.kaabaIconCircle, { backgroundColor: colors.primary }]}>
                                <Ionicons name="triangle" size={14} color="#FFFFFF" />
                            </View>
                        </View>

                        <View style={[styles.dialCenterDot, { backgroundColor: colors.secondary }]} />
                    </Animated.View>
                </View>

                <ThemedText style={[styles.helperText, { color: colors.textSecondary }]}>
                    Line up the marker with the pointer at the top — that&apos;s the direction of the Qibla.
                </ThemedText>

                <View style={[styles.statsRow, { backgroundColor: colors.cardBg }]}>
                    <View style={styles.statItem}>
                        <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>BEARING</ThemedText>
                        <ThemedText style={[styles.statValue, { color: colors.text }]}>
                            {qiblaBearing !== null ? `${Math.round(qiblaBearing)}°` : '—'}
                        </ThemedText>
                    </View>
                    <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                    <View style={styles.statItem}>
                        <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>DISTANCE TO MECCA</ThemedText>
                        <ThemedText style={[styles.statValue, { color: colors.text }]}>
                            {distanceKm !== null ? `${Math.round(distanceKm).toLocaleString()} km` : '—'}
                        </ThemedText>
                    </View>
                </View>
            </View>
        );
    }, [status, accuracy, qiblaBearing, distanceKm, colors, dialAnimatedStyle]);

    return (
        <ErrorBoundary>
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <Stack.Screen options={{ headerShown: false }} />

                <View style={[styles.header, { paddingTop: insets.top + 14, backgroundColor: colors.primary }]}>
                    <View style={styles.headerRow}>
                        <BackButton backgroundColor="rgba(255,255,255,0.18)" color="#FFFFFF" size={20} />
                        <View style={{ flex: 1, marginLeft: 12 }}>
                            <ThemedText style={styles.title}>Qibla Compass</ThemedText>
                            <ThemedText style={styles.subtitle}>Find the direction of the Kaaba</ThemedText>
                        </View>
                    </View>
                </View>

                {renderBody()}
            </View>
        </ErrorBoundary>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        paddingHorizontal: 16,
        paddingBottom: 16,
        borderBottomLeftRadius: Layout.headerBorderRadius,
        borderBottomRightRadius: Layout.headerBorderRadius,
    },
    headerRow: { flexDirection: 'row', alignItems: 'center' },
    title: { fontSize: 17, fontWeight: '800', color: '#FFFFFF' },
    subtitle: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.85)', marginTop: 2 },

    centerWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: 10 },
    centerTitle: { fontSize: 15.5, fontWeight: '800', marginTop: 4 },
    centerText: { fontSize: 12.5, textAlign: 'center', lineHeight: 20 },

    compassWrap: { flex: 1, alignItems: 'center', paddingTop: 28, paddingHorizontal: 20 },
    calibrateBanner: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        borderRadius: Layout.borderRadius, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 20,
    },
    calibrateText: { fontSize: 11, fontWeight: '700', flexShrink: 1 },

    dialOuter: { width: DIAL_SIZE, height: DIAL_SIZE, alignItems: 'center', justifyContent: 'center' },
    facingPointer: {
        position: 'absolute',
        top: -4,
        width: 0,
        height: 0,
        borderLeftWidth: 8,
        borderRightWidth: 8,
        borderBottomWidth: 14,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        zIndex: 2,
    },
    dial: {
        width: DIAL_SIZE,
        height: DIAL_SIZE,
        borderRadius: DIAL_SIZE / 2,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tick_N: { position: 'absolute', top: 14 },
    tick_E: { position: 'absolute', right: 16 },
    tick_S: { position: 'absolute', bottom: 14 },
    tick_W: { position: 'absolute', left: 16 },
    tickLabel: { fontSize: 13, fontWeight: '800' },
    kaabaMarker: { position: 'absolute', top: 22, alignItems: 'center' },
    kaabaIconCircle: {
        width: 30, height: 30, borderRadius: 15,
        alignItems: 'center', justifyContent: 'center',
    },
    dialCenterDot: { width: 8, height: 8, borderRadius: 4 },

    helperText: { fontSize: 11.5, textAlign: 'center', marginTop: 24, paddingHorizontal: 20, lineHeight: 18 },

    statsRow: {
        flexDirection: 'row', width: '100%', borderRadius: Layout.borderRadius,
        marginTop: 24, paddingVertical: 14,
    },
    statItem: { flex: 1, alignItems: 'center', gap: 4 },
    statDivider: { width: StyleSheet.hairlineWidth },
    statLabel: { fontSize: 9.5, fontWeight: '800', letterSpacing: 0.5 },
    statValue: { fontSize: 15.5, fontWeight: '800' },
});
