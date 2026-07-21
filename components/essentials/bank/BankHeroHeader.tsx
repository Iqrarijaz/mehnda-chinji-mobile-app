import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
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

interface BankHeroHeaderProps {
    place: any;
    placeName: string;
    isOwner: boolean;
    onBack: () => void;
    onReport: () => void;
    onEdit: () => void;
    primaryColor?: string;
}

/**
 * Premium bank hero header: deep navy/slate surface, faint financial-
 * pattern decor (coin rings, bar chart lines, card outline), a slow-
 * shimmer icon tile — all presentation-only, actions pass through.
 */
export const BankHeroHeader = React.memo(function BankHeroHeader({
    place,
    placeName,
    isOwner,
    onBack,
    onReport,
    onEdit,
    primaryColor,
}: BankHeroHeaderProps) {
    const { theme } = useTheme();
    const colors = Colors[theme];
    const insets = useSafeAreaInsets();

    const typeLabel = place?.type ? capitalizeString(place.type) : 'Bank';
    const timing = typeof place?.timing === 'string' ? place.timing.trim() : '';
    const area = [place?.village, place?.city].filter(Boolean).map(capitalizeString).join(', ');
    const placeImage = place?.images?.length > 0 ? place.images[0] : null;

    // Slow shimmer on icon tile
    const shimmer = useSharedValue(0);

    useEffect(() => {
        shimmer.value = withRepeat(
            withTiming(1, { duration: 2800, easing: Easing.inOut(Easing.sin) }),
            -1,
            true
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const shimmerStyle = useAnimatedStyle(() => ({
        opacity: 0.18 + shimmer.value * 0.14,
        transform: [{ scale: 1.06 + shimmer.value * 0.1 }],
    }));

    const tileStyle = useAnimatedStyle(() => ({
        transform: [{ scale: 1 + shimmer.value * 0.022 }],
    }));

    const BG = primaryColor || '#1a2d4a'; // deep navy

    return (
        <Animated.View
            entering={FadeInUp.duration(450)}
            style={[styles.container, { backgroundColor: BG }]}
        >
            {/* Financial decor */}
            <BankBackgroundDecor limeColor={colors.lime} />

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
                        <View style={[styles.typeChip, { backgroundColor: colors.lime }]}>
                            <MaterialCommunityIcons name="bank" size={11} color="#1E293B" />
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
                        <MaterialCommunityIcons name="bank-outline" size={12} color="rgba(255,255,255,0.65)" />
                        <ThemedText style={styles.subtitle} numberOfLines={1}>
                            {area ? `Serving ${area}` : 'Financial Services'}
                        </ThemedText>
                    </View>
                </View>

                <View style={styles.tileWrap}>
                    <Animated.View style={[styles.halo, shimmerStyle]} />
                    <Animated.View style={[styles.serviceTile, tileStyle]}>
                        {placeImage ? (
                            <Image source={{ uri: placeImage }} style={styles.serviceImage} contentFit="cover" />
                        ) : (
                            <MaterialCommunityIcons name="bank" size={28} color="#FFFFFF" />
                        )}
                    </Animated.View>
                </View>
            </Animated.View>

            {/* Bottom accent line */}
            <Animated.View entering={FadeInDown.delay(200).duration(450)} style={styles.accentLine}>
                <Svg width="100%" height={12} viewBox="0 0 375 12" preserveAspectRatio="none">
                    <Path
                        d="M0 6 Q94 0 187 6 Q281 12 375 6"
                        stroke="rgba(255,255,255,0.12)"
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
    navActions: { flexDirection: 'row', gap: 8 },
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
    identityText: { flex: 1 },
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
    timingDot: { width: 6, height: 6, borderRadius: 3 },
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
        color: 'rgba(255,255,255,0.78)',
        fontWeight: '600',
        flexShrink: 1,
    },
    tileWrap: { width: 58, height: 58, justifyContent: 'center', alignItems: 'center' },
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
    serviceImage: { width: '100%', height: '100%' },
    accentLine: { marginTop: 12, paddingHorizontal: 20 },
});

const BankBackgroundDecor = React.memo(({ limeColor }: { limeColor: string }) => (
    <Svg
        style={StyleSheet.absoluteFill}
        viewBox="0 0 375 185"
        preserveAspectRatio="xMinYMin slice"
    >
        <Circle cx={355} cy={-15} r={90} fill="rgba(255,255,255,0.05)" />
        <Circle cx={355} cy={-15} r={60} fill="rgba(255,255,255,0.04)" />
        <Circle cx={10} cy={185} r={70} fill="rgba(255,255,255,0.04)" />

        <Rect x={290} y={110} width={8} height={55} rx={3} fill="rgba(255,255,255,0.07)" />
        <Rect x={304} y={90} width={8} height={75} rx={3} fill="rgba(255,255,255,0.09)" />
        <Rect x={318} y={105} width={8} height={60} rx={3} fill="rgba(255,255,255,0.06)" />
        <Rect x={332} y={75} width={8} height={90} rx={3} fill="rgba(255,255,255,0.08)" />

        <Rect x={20} y={115} width={68} height={45} rx={6} stroke="rgba(255,255,255,0.09)" strokeWidth={1.5} fill="none" />
        <Rect x={20} y={127} width={68} height={8} fill="rgba(255,255,255,0.06)" />
        <Rect x={26} y={143} width={18} height={6} rx={2} fill="rgba(255,255,255,0.09)" />

        <Circle cx={155} cy={38} r={3} fill={limeColor} opacity={0.5} />
        <Circle cx={225} cy={60} r={2.5} fill="rgba(255,255,255,0.22)" />
        <Circle cx={260} cy={28} r={2} fill="rgba(255,255,255,0.15)" />
    </Svg>
));
