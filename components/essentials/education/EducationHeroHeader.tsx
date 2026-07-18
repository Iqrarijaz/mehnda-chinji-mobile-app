import { Ionicons } from '@expo/vector-icons';
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

interface EducationHeroHeaderProps {
    place: any;
    placeName: string;
    isOwner: boolean;
    onBack: () => void;
    onReport: () => void;
    onEdit: () => void;
    primaryColor?: string;
}

/**
 * Compact education hero: brand primary surface with faint graduation-cap
 * and open-book decor, and a gently floating institution tile.
 * Presentation only — nav actions pass straight through.
 */
export function EducationHeroHeader({
    place,
    placeName,
    isOwner,
    onBack,
    onReport,
    onEdit,
    primaryColor,
}: EducationHeroHeaderProps) {
    const { theme } = useTheme();
    const colors = Colors[theme];
    const insets = useSafeAreaInsets();

    const typeLabel = place?.type ? capitalizeString(place.type) : 'Education';
    const timing = typeof place?.timing === 'string' ? place.timing.trim() : '';
    const area = [place?.village, place?.city].filter(Boolean).map(capitalizeString).join(', ');
    const placeImage = place?.images?.length > 0 ? place.images[0] : null;

    // The institution tile floats: a slow vertical bob with a hint of tilt,
    // like a drifting graduation cap.
    const float = useSharedValue(0);
    useEffect(() => {
        float.value = withRepeat(
            withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.sin) }),
            -1,
            true
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const floatStyle = useAnimatedStyle(() => ({
        transform: [
            { translateY: -3 + float.value * 6 },
            { rotate: `${-2 + float.value * 4}deg` },
        ],
    }));

    const BG = primaryColor || '#312e81';

    return (
        <Animated.View
            entering={FadeInUp.duration(450)}
            style={[styles.container, { backgroundColor: BG }]}
        >
            {/* Education decor: faint circles, graduation cap, open book */}
            <Svg
                style={StyleSheet.absoluteFill}
                viewBox="0 0 375 185"
                preserveAspectRatio="xMinYMin slice"
            >
                <Circle cx={350} cy={0} r={95} fill="rgba(255,255,255,0.06)" />
                <Circle cx={5} cy={185} r={70} fill="rgba(255,255,255,0.05)" />
                {/* graduation cap: mortarboard, band, tassel */}
                <Path
                    d="M296 74 l34 -13 l34 13 l-34 13 z"
                    stroke="rgba(255,255,255,0.11)"
                    strokeWidth={2}
                    strokeLinejoin="round"
                    fill="none"
                />
                <Path
                    d="M312 82 v14 c0 5 8 9 18 9 c10 0 18 -4 18 -9 v-14"
                    stroke="rgba(255,255,255,0.11)"
                    strokeWidth={2}
                    fill="none"
                />
                <Path
                    d="M364 74 v22"
                    stroke="rgba(255,255,255,0.11)"
                    strokeWidth={2}
                    strokeLinecap="round"
                    fill="none"
                />
                <Circle cx={364} cy={99} r={2.5} fill="rgba(255,255,255,0.14)" />
                {/* open book */}
                <Path
                    d="M40 118 c10 -7 22 -7 30 -2 c8 -5 20 -5 30 2 v26 c-10 -7 -22 -7 -30 -2 c-8 -5 -20 -5 -30 2 z M70 116 v26"
                    stroke="rgba(255,255,255,0.10)"
                    strokeWidth={2}
                    strokeLinejoin="round"
                    fill="none"
                />
                <Circle cx={140} cy={52} r={3.5} fill={colors.lime} opacity={0.55} />
                <Circle cx={248} cy={110} r={3.5} fill={colors.secondary} opacity={0.6} />
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
                            <Ionicons name="school" size={11} color="#1E293B" />
                            <ThemedText style={styles.typeChipText}>{typeLabel}</ThemedText>
                        </View>
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
                        <Ionicons name="book" size={12} color={colors.secondary} />
                        <ThemedText style={styles.subtitle} numberOfLines={1}>
                            {area ? `Inspiring minds in ${area}` : 'Learning, growth & opportunity'}
                        </ThemedText>
                    </View>
                </View>

                <Animated.View style={[styles.institutionTile, floatStyle]}>
                    {placeImage ? (
                        <Image source={{ uri: placeImage }} style={styles.institutionImage} contentFit="cover" />
                    ) : (
                        <Ionicons name="school" size={30} color="#FFFFFF" />
                    )}
                </Animated.View>
            </Animated.View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        paddingBottom: 20,
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
    timingChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 9,
        paddingVertical: 4,
        borderRadius: 999,
        backgroundColor: 'rgba(255,255,255,0.16)',
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
        color: 'rgba(255,255,255,0.85)',
        fontWeight: '600',
        flexShrink: 1,
    },
    institutionTile: {
        width: 58,
        height: 58,
        borderRadius: 29,
        backgroundColor: 'rgba(255,255,255,0.16)',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    institutionImage: {
        width: '100%',
        height: '100%',
    },
});
