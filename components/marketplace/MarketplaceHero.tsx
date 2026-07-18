import { Ionicons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
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

interface MarketplaceHeroProps {
    title: string;
    subtitle?: string;
    /** Optional lime pill, e.g. "240 items". */
    countLabel?: string;
    /** Renders a back/close button and respects the top safe-area inset. */
    onBack?: () => void;
    /** Icon for the back button, e.g. "close" on the sell form. */
    backIcon?: keyof typeof Ionicons.glyphMap;
    /** Band mode: rendered below an existing screen header, no inset padding. */
    band?: boolean;
}

/**
 * The Marketplace module's shared hero — one component reused by the
 * Marketplace Home screen (as a compact band) and the Sell/Edit Item screen
 * (as the full page header), so both screens read as the same place.
 */
function MarketplaceHeroComponent({
    title,
    subtitle,
    countLabel,
    onBack,
    backIcon = 'arrow-back',
    band = false,
}: MarketplaceHeroProps) {
    const { theme } = useTheme();
    const colors = Colors[theme];
    const insets = useSafeAreaInsets();

    const pulse = useSharedValue(0);
    useEffect(() => {
        pulse.value = withRepeat(
            withTiming(1, { duration: 2500, easing: Easing.inOut(Easing.sin) }),
            -1,
            true
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const haloStyle = useAnimatedStyle(() => ({
        opacity: 0.15 + pulse.value * 0.12,
        transform: [{ scale: 1.05 + pulse.value * 0.08 }],
    }));
    const iconStyle = useAnimatedStyle(() => ({
        transform: [{ scale: 1 + pulse.value * 0.03 }, { rotate: `${-4 + pulse.value * 8}deg` }],
    }));

    return (
        <Animated.View
            entering={FadeInUp.duration(450)}
            style={[styles.container, { backgroundColor: colors.primary }]}
        >
            {/* Buy & sell decor: bags, boxes, price tag */}
            <Svg
                style={StyleSheet.absoluteFill}
                viewBox="0 0 375 160"
                preserveAspectRatio="xMinYMin slice"
            >
                <Circle cx={360} cy={10} r={80} fill="rgba(255,255,255,0.04)" />
                <Circle cx={360} cy={10} r={55} fill="rgba(255,255,255,0.03)" />
                <Circle cx={20} cy={140} r={60} fill="rgba(255,255,255,0.03)" />
                {/* shopping bag */}
                <Path
                    d="M36 78 h36 l4 40 h-44 z"
                    fill="none"
                    stroke="rgba(255,255,255,0.08)"
                    strokeWidth={2}
                    strokeLinejoin="round"
                />
                <Path
                    d="M44 78 c0 -10 20 -10 20 0"
                    fill="none"
                    stroke="rgba(255,255,255,0.08)"
                    strokeWidth={2}
                />
                {/* product box */}
                <Rect x={300} y={92} width={34} height={28} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={2} rx={3} />
                <Path d="M300 102 h34 M317 92 v10" stroke="rgba(255,255,255,0.08)" strokeWidth={2} />
                {/* price tag */}
                <Path
                    d="M258 40 l22 0 l10 10 l-22 22 l-22 -22 z"
                    fill="rgba(255,255,255,0.06)"
                    transform="rotate(20 268 56)"
                />
                <Circle cx={150} cy={40} r={3} fill={colors.lime} opacity={0.5} />
                <Circle cx={230} cy={120} r={2.5} fill={colors.secondary} opacity={0.5} />
            </Svg>

            {onBack && (
                <View style={[styles.navRow, { paddingTop: insets.top + 4 }]}>
                    <TouchableOpacity onPress={onBack} style={styles.navButton} activeOpacity={0.8}>
                        <Ionicons name={backIcon} size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>
            )}

            <Animated.View
                entering={FadeInDown.delay(120).duration(450)}
                style={[
                    styles.heroContent,
                    !band && { paddingTop: insets.top + 4 },
                    band && styles.heroContentBand,
                ]}
            >
                <View style={styles.iconWrap}>
                    <Animated.View style={[styles.halo, haloStyle]} />
                    <Animated.View style={[styles.iconTile, iconStyle]}>
                        <Ionicons name="pricetag" size={20} color={colors.primary} />
                    </Animated.View>
                </View>
                <View style={styles.titleRow}>
                    <ThemedText style={styles.heroTitle}>{title}</ThemedText>
                    {countLabel ? (
                        <View style={[styles.countPill, { backgroundColor: colors.lime }]}>
                            <ThemedText style={styles.countPillText}>{countLabel}</ThemedText>
                        </View>
                    ) : null}
                </View>
                {subtitle ? (
                    <ThemedText style={styles.heroSubtitle}>{subtitle}</ThemedText>
                ) : null}
            </Animated.View>

            {/* Wave accent line */}
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
}

export const MarketplaceHero = React.memo(MarketplaceHeroComponent);
MarketplaceHero.displayName = 'MarketplaceHero';

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
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
    },
    navButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    heroContent: {
        alignItems: 'center',
        paddingHorizontal: 24,
        marginTop: 2,
    },
    heroContentBand: {
        paddingTop: 14,
    },
    iconWrap: {
        width: 52,
        height: 52,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    halo: {
        position: 'absolute',
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.4)',
    },
    iconTile: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    heroTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#FFFFFF',
        textAlign: 'center',
        letterSpacing: 0.2,
    },
    countPill: {
        paddingHorizontal: 9,
        paddingVertical: 3,
        borderRadius: 999,
    },
    countPillText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#1E293B',
        letterSpacing: 0.4,
        textTransform: 'uppercase',
    },
    heroSubtitle: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.8)',
        textAlign: 'center',
        marginTop: 6,
        lineHeight: 18,
    },
    accentLine: {
        width: '100%',
        height: 12,
        marginTop: 4,
    },
});
