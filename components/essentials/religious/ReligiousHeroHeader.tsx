import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import Svg, { Circle, Path } from 'react-native-svg';
import Animated, {
    Easing,
    FadeInDown,
    FadeInUp,
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

interface ReligiousHeroHeaderProps {
    place: any;
    placeName: string;
    isOwner: boolean;
    onBack: () => void;
    onReport: () => void;
    onEdit: () => void;
    primaryColor?: string;
}

/**
 * Serene religious / mosque hero header: deep teal/green surface with
 * faint geometric islamic-pattern decor, a gently glowing crescent tile,
 * and soft ambient arcs — all presentation-only, actions pass through.
 */
export const ReligiousHeroHeader = React.memo(function ReligiousHeroHeader({
    place,
    placeName,
    isOwner,
    onBack,
    onReport,
    onEdit,
    primaryColor,
}: ReligiousHeroHeaderProps) {
    const { theme } = useTheme();
    const colors = Colors[theme];
    const insets = useSafeAreaInsets();

    const typeLabel = place?.type ? capitalizeString(place.type) : 'Mosque';
    const timing = typeof place?.timing === 'string' ? place.timing.trim() : '';
    const area = [place?.village, place?.city].filter(Boolean).map(capitalizeString).join(', ');
    const placeImage = place?.images?.length > 0 ? place.images[0] : null;

    // Slow ambient glow on the icon tile
    const glow = useSharedValue(0);

    useEffect(() => {
        glow.value = withRepeat(
            withTiming(1, { duration: 2600, easing: Easing.inOut(Easing.sin) }),
            -1,
            true
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const glowStyle = useAnimatedStyle(() => ({
        opacity: 0.18 + glow.value * 0.12,
        transform: [{ scale: 1.08 + glow.value * 0.12 }],
    }));

    const tileStyle = useAnimatedStyle(() => ({
        transform: [{ scale: 1 + glow.value * 0.025 }],
    }));

    // Hero bg: deep Islamic green
    const BG = primaryColor || '#1a5c3a';

    return (
        <Animated.View
            entering={FadeInUp.duration(450)}
            style={[styles.container, { backgroundColor: BG }]}
        >
            {/* Geometric islamic-inspired decor */}
            <ReligiousBackgroundDecor limeColor={colors.lime} />

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
                            <Ionicons name="pencil" size={18} color={BG} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Identity row */}
            <Animated.View entering={FadeInDown.delay(100).duration(450)} style={styles.identityRow}>
                <View style={styles.identityText}>
                    <View style={styles.chipRow}>
                        {/* Type pill */}
                        <View style={[styles.typeChip, { backgroundColor: colors.lime }]}>
                            <MaterialCommunityIcons name="mosque" size={11} color="#1E293B" />
                            <ThemedText style={styles.typeChipText}>{typeLabel}</ThemedText>
                        </View>

                        {/* Prayer times pill */}
                        {timing ? (
                            <View style={styles.timingChip}>
                                <View style={[styles.timingDot, { backgroundColor: colors.lime }]} />
                                <ThemedText style={styles.timingText} numberOfLines={1}>
                                    {timing}
                                </ThemedText>
                            </View>
                        ) : null}
                    </View>

                    <ThemedText style={styles.title} numberOfLines={2}>
                        {placeName}
                    </ThemedText>

                    <View style={styles.subtitleRow}>
                        <MaterialCommunityIcons name="star-crescent" size={12} color="rgba(255,255,255,0.7)" />
                        <ThemedText style={styles.subtitle} numberOfLines={1}>
                            {area ? `Serving ${area}` : 'Community place of worship'}
                        </ThemedText>
                    </View>
                </View>

                {/* Glowing icon tile */}
                <View style={styles.tileWrap}>
                    <Animated.View style={[styles.halo, glowStyle]} />
                    <Animated.View style={[styles.serviceTile, tileStyle]}>
                        {placeImage ? (
                            <Image source={{ uri: placeImage }} style={styles.serviceImage} contentFit="cover" />
                        ) : (
                            <MaterialCommunityIcons name="mosque" size={28} color="#FFFFFF" />
                        )}
                    </Animated.View>
                </View>
            </Animated.View>

            {/* Subtle bottom wave */}
            <Animated.View entering={FadeInDown.delay(200).duration(450)} style={styles.waveWrap}>
                <Svg width="100%" height={20} viewBox="0 0 375 20" preserveAspectRatio="none">
                    <Path
                        d="M0 10 Q94 0 187 10 Q281 20 375 10"
                        stroke="rgba(255,255,255,0.14)"
                        strokeWidth={1.5}
                        fill="none"
                    />
                </Svg>
            </Animated.View>
        </Animated.View>
    );
});

const styles = StyleSheet.create({
    container: {
        width: '100%',
        paddingBottom: 12,
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
        marginTop: 10,
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
        flexWrap: 'wrap',
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
    timingChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 9,
        paddingVertical: 4,
        borderRadius: 999,
        backgroundColor: 'rgba(255,255,255,0.14)',
        flexShrink: 1,
    },
    timingDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    timingText: {
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
        color: 'rgba(255,255,255,0.80)',
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
        backgroundColor: 'rgba(255,255,255,0.25)',
    },
    serviceTile: {
        width: 58,
        height: 58,
        borderRadius: 29,
        backgroundColor: 'rgba(255,255,255,0.14)',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    serviceImage: {
        width: '100%',
        height: '100%',
    },
    waveWrap: {
        marginTop: 12,
        paddingHorizontal: 20,
    },
});

const ReligiousBackgroundDecor = React.memo(({ limeColor }: { limeColor: string }) => (
    <Svg
        style={StyleSheet.absoluteFill}
        viewBox="0 0 375 185"
        preserveAspectRatio="xMinYMin slice"
    >
        <Circle cx={360} cy={-10} r={100} fill="rgba(255,255,255,0.05)" />
        <Circle cx={0} cy={185} r={80} fill="rgba(255,255,255,0.04)" />

        <Path
            d="M340 185 L340 90 Q340 55 360 55 Q380 55 380 90 L380 185"
            fill="rgba(255,255,255,0.06)"
        />
        <Path
            d="M350 90 Q360 72 370 90"
            fill="rgba(255,255,255,0.08)"
        />

        <Path
            d="M52 30 a22 22 0 1 1 0 44 a14 14 0 1 0 0 -44"
            fill="rgba(255,255,255,0.09)"
        />

        <Circle cx={120} cy={52} r={3} fill="rgba(255,255,255,0.18)" />
        <Circle cx={200} cy={28} r={2} fill="rgba(255,255,255,0.14)" />
        <Circle cx={250} cy={70} r={2.5} fill={limeColor} opacity={0.4} />

        <Path
            d="M0 175 Q187 165 375 175"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={1}
            fill="none"
        />
    </Svg>
));
