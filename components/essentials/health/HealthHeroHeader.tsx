import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import Svg, { Circle, Path } from 'react-native-svg';
import Animated, {
    Easing,
    FadeInDown,
    FadeInUp,
    useAnimatedProps,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { capitalizeString } from '@/utils/string';

const AnimatedPath = Animated.createAnimatedComponent(Path);

// Single calm heartbeat in an otherwise flat line.
const ECG_PATH = 'M0 16 H132 L144 16 L152 4 L162 27 L170 16 H340';
const ECG_SWEEP = 520;

interface HealthHeroHeaderProps {
    place: any;
    placeName: string;
    isOwner: boolean;
    onBack: () => void;
    onReport: () => void;
    onEdit: () => void;
}

/**
 * Compact healthcare hero: calm primary surface, faint medical decor, a
 * gently breathing service tile, and a slow single-heartbeat line.
 * Presentation only — nav actions pass straight through.
 */
export function HealthHeroHeader({
    place,
    placeName,
    isOwner,
    onBack,
    onReport,
    onEdit,
}: HealthHeroHeaderProps) {
    const { theme } = useTheme();
    const colors = Colors[theme];
    const insets = useSafeAreaInsets();

    const typeLabel = place?.type ? capitalizeString(place.type) : 'Healthcare';
    const timing = typeof place?.timing === 'string' ? place.timing.trim() : '';
    const area = [place?.village, place?.city].filter(Boolean).map(capitalizeString).join(', ');
    const placeImage = place?.images?.length > 0 ? place.images[0] : null;

    // The service tile "breathes": a slow, small scale oscillation.
    const breathe = useSharedValue(0);
    // A slow pulse sweeping along the heartbeat line.
    const sweep = useSharedValue(0);

    useEffect(() => {
        breathe.value = withRepeat(
            withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
            -1,
            true
        );
        sweep.value = withRepeat(
            withTiming(1, { duration: 3200, easing: Easing.inOut(Easing.quad) }),
            -1,
            false
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const breatheStyle = useAnimatedStyle(() => ({
        transform: [{ scale: 1 + breathe.value * 0.035 }],
    }));

    const haloStyle = useAnimatedStyle(() => ({
        opacity: 0.3 - breathe.value * 0.12,
        transform: [{ scale: 1.12 + breathe.value * 0.1 }],
    }));

    const sweepProps = useAnimatedProps(() => ({
        strokeDashoffset: -ECG_SWEEP * sweep.value,
    }));

    return (
        <Animated.View
            entering={FadeInUp.duration(450)}
            style={[styles.container, { backgroundColor: colors.primary }]}
        >
            {/* Healthcare decor: faint circles, cross, stethoscope curve */}
            <Svg
                style={StyleSheet.absoluteFill}
                viewBox="0 0 375 185"
                preserveAspectRatio="xMinYMin slice"
            >
                <Circle cx={350} cy={0} r={95} fill="rgba(255,255,255,0.06)" />
                <Circle cx={5} cy={185} r={70} fill="rgba(255,255,255,0.05)" />
                {/* stethoscope: tube curve ending in a chest piece */}
                <Path
                    d="M296 40 c0 26 -20 40 -20 62 c0 18 14 28 30 28 c16 0 30 -10 30 -28"
                    stroke="rgba(255,255,255,0.10)"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    fill="none"
                />
                <Circle cx={336} cy={96} r={7} stroke="rgba(255,255,255,0.10)" strokeWidth={2.5} fill="none" />
                {/* small medical cross */}
                <Path
                    d="M48 96 h8 v-8 h8 v8 h8 v8 h-8 v8 h-8 v-8 h-8 z"
                    fill="rgba(255,255,255,0.10)"
                />
                <Circle cx={128} cy={48} r={3.5} fill={colors.lime} opacity={0.55} />
                <Circle cx={236} cy={64} r={3.5} fill={colors.secondary} opacity={0.6} />
            </Svg>

            {/* Nav row */}
            <View
                style={[
                    styles.navRow,
                    { paddingTop: insets.top + (Platform.OS === 'android' ? 16 : 8) },
                ]}
            >
                <TouchableOpacity onPress={onBack} style={styles.navButton} activeOpacity={0.8}>
                    <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
                </TouchableOpacity>
                <View style={styles.navActions}>
                    <TouchableOpacity
                        style={[styles.navButton, { backgroundColor: '#FFFFFF' }]}
                        onPress={onReport}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="flag" size={18} color="#EF4444" />
                    </TouchableOpacity>
                    {isOwner && (
                        <TouchableOpacity
                            style={[styles.navButton, { backgroundColor: '#FFFFFF' }]}
                            onPress={onEdit}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="pencil" size={18} color={colors.primary} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Identity row */}
            <Animated.View entering={FadeInDown.delay(100).duration(450)} style={styles.identityRow}>
                <View style={styles.identityText}>
                    <View style={styles.chipRow}>
                        <View style={[styles.typeChip, { backgroundColor: colors.lime }]}>
                            <MaterialCommunityIcons name="stethoscope" size={11} color="#1E293B" />
                            <ThemedText style={styles.typeChipText}>{typeLabel}</ThemedText>
                        </View>
                        {timing ? (
                            <View style={styles.availabilityChip}>
                                <View style={[styles.availabilityDot, { backgroundColor: colors.lime }]} />
                                <ThemedText style={styles.availabilityText} numberOfLines={1}>
                                    {timing}
                                </ThemedText>
                            </View>
                        ) : null}
                    </View>
                    <ThemedText style={styles.title} numberOfLines={2}>
                        {placeName}
                    </ThemedText>
                    <View style={styles.subtitleRow}>
                        <Ionicons name="heart" size={12} color={colors.secondary} />
                        <ThemedText style={styles.subtitle} numberOfLines={1}>
                            {area ? `Caring for ${area}` : 'Trusted local healthcare'}
                        </ThemedText>
                    </View>
                </View>

                <View style={styles.tileWrap}>
                    <Animated.View style={[styles.halo, haloStyle]} />
                    <Animated.View style={[styles.serviceTile, breatheStyle]}>
                        {placeImage ? (
                            <Image source={{ uri: placeImage }} style={styles.serviceImage} contentFit="cover" />
                        ) : (
                            <Ionicons name="medical" size={28} color="#FFFFFF" />
                        )}
                    </Animated.View>
                </View>
            </Animated.View>

            {/* Calm heartbeat line */}
            <Animated.View entering={FadeInDown.delay(220).duration(450)} style={styles.ecgWrap}>
                <Svg width="100%" height={32} viewBox="0 0 340 32" preserveAspectRatio="none">
                    <Path
                        d={ECG_PATH}
                        stroke="rgba(255,255,255,0.20)"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                    />
                    <AnimatedPath
                        d={ECG_PATH}
                        stroke={colors.lime}
                        strokeWidth={2.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                        strokeDasharray={`60 ${ECG_SWEEP - 60}`}
                        animatedProps={sweepProps}
                    />
                </Svg>
            </Animated.View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        paddingBottom: 10,
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
        overflow: 'hidden',
    },
    navRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 4,
    },
    navActions: {
        flexDirection: 'row',
        gap: 8,
    },
    navButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(0,0,0,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    identityRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginTop: 8,
        gap: 14,
    },
    identityText: {
        flex: 1,
    },
    chipRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    typeChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
    },
    typeChipText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#1E293B',
        textTransform: 'uppercase',
        letterSpacing: 0.6,
    },
    availabilityChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 9,
        paddingVertical: 4,
        borderRadius: 999,
        backgroundColor: 'rgba(255,255,255,0.16)',
        flexShrink: 1,
    },
    availabilityDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    availabilityText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: 0.4,
        textTransform: 'uppercase',
        flexShrink: 1,
    },
    title: {
        fontSize: 21,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 0.2,
        lineHeight: 26,
    },
    subtitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        marginTop: 5,
    },
    subtitle: {
        fontSize: 12.5,
        color: 'rgba(255,255,255,0.85)',
        fontWeight: '600',
        flexShrink: 1,
    },
    tileWrap: {
        width: 58,
        height: 58,
        justifyContent: 'center',
        alignItems: 'center',
    },
    halo: {
        position: 'absolute',
        width: 58,
        height: 58,
        borderRadius: 29,
        backgroundColor: 'rgba(255,255,255,0.3)',
    },
    serviceTile: {
        width: 58,
        height: 58,
        borderRadius: 29,
        backgroundColor: 'rgba(255,255,255,0.16)',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    serviceImage: {
        width: '100%',
        height: '100%',
    },
    ecgWrap: {
        marginTop: 10,
        paddingHorizontal: 20,
    },
});
