import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { DrawerActions } from '@react-navigation/native';
import { useNavigation, useRouter } from 'expo-router';
import React, { useCallback, useEffect } from 'react';
import {
    Platform,
    StyleSheet,
    TouchableOpacity,
    View,
    ViewStyle,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import Animated, {
    Easing,
    FadeInDown,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Avatar from '../ui/avatar';
import { NotificationIcon } from '../common/NotificationIcon';
import { ThemedText } from '../ThemedText';

// ─── Types ────────────────────────────────────────────────────────────────────

/** Module-specific decor themes rendered as a faint layer behind the header. */
export type ScreenHeaderDecor = 'community' | 'business' | 'marketplace';

export interface ScreenHeaderHero {
    title: string;
    subtitle?: string;
    /** Optional lime pill next to the title, e.g. a result count. */
    countLabel?: string;
    /** Icon in the pulsing tile; defaults per decor theme. */
    icon?: keyof typeof Ionicons.glyphMap;
}

export interface ScreenHeaderProps {
    /** Extra icon(s) inserted between the menu button and the right action group. */
    leftActions?: React.ReactNode;
    /** Extra icon(s) inserted before NotificationIcon in the right group. */
    rightActions?: React.ReactNode;
    /** Content rendered below the icon row (search bars, toggles, etc.). */
    children?: React.ReactNode;
    /** Override the outer container style if needed. */
    containerStyle?: ViewStyle;
    /** If true, show the drawer menu icon. If false, show a back button. Defaults to true. */
    showMenuIcon?: boolean;
    /** Custom handler for the back button (when showMenuIcon is false). */
    onBackPress?: () => void;
    /** Icon for the back button, e.g. "close" on form screens. */
    backIcon?: keyof typeof Ionicons.glyphMap;
    /** Hide the notification/avatar group (for focused form screens). */
    hideAccountActions?: boolean;
    /** Module decor theme drawn faintly behind the header. */
    decor?: ScreenHeaderDecor;
    /** Optional hero band (pulsing tile, title, subtitle) below the children. */
    hero?: ScreenHeaderHero;
}

const DECOR_ICON: Record<ScreenHeaderDecor, keyof typeof Ionicons.glyphMap> = {
    community: 'people',
    business: 'storefront',
    marketplace: 'pricetag',
};

// ─── Decor layer ──────────────────────────────────────────────────────────────

const DecorLayer = React.memo(function DecorLayer({ decor, lime, secondary }: { decor: ScreenHeaderDecor; lime: string; secondary: string }) {
    // The whole layer drifts very slowly sideways — subtle background motion.
    const drift = useSharedValue(0);
    useEffect(() => {
        drift.value = withRepeat(
            withTiming(1, { duration: 6000, easing: Easing.inOut(Easing.sin) }),
            -1,
            true
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    const driftStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: -3 + drift.value * 6 }],
    }));

    return (
        <Animated.View style={[StyleSheet.absoluteFill, driftStyle]} pointerEvents="none">
            <Svg style={StyleSheet.absoluteFill} viewBox="0 0 375 190" preserveAspectRatio="xMinYMin slice">
                <Circle cx={360} cy={5} r={80} fill="rgba(255,255,255,0.05)" />
                <Circle cx={15} cy={185} r={60} fill="rgba(255,255,255,0.04)" />

                {decor === 'community' && (
                    <>
                        {/* connected homes and a location pin */}
                        <Path
                            d="M30 96 l12 -10 l12 10 v16 h-24 z M78 100 l10 -8 l10 8 v12 h-20 z"
                            fill="none"
                            stroke="rgba(255,255,255,0.09)"
                            strokeWidth={2}
                            strokeLinejoin="round"
                        />
                        <Path
                            d="M60 130 C 120 100, 220 150, 330 90"
                            stroke="rgba(255,255,255,0.08)"
                            strokeWidth={2}
                            strokeDasharray="4 8"
                            strokeLinecap="round"
                            fill="none"
                        />
                        <Path
                            d="M318 66 c0 -8 6 -14 13 -14 c7 0 13 6 13 14 c0 9 -13 22 -13 22 c0 0 -13 -13 -13 -22 z"
                            fill="none"
                            stroke="rgba(255,255,255,0.09)"
                            strokeWidth={2}
                        />
                    </>
                )}

                {decor === 'business' && (
                    <>
                        {/* shop awning + window + growth line */}
                        <Path
                            d="M28 76 L88 76 L83 91 L73 91 L68 76 L58 76 L53 91 L43 91 L38 76 L28 76 Z"
                            fill="rgba(255,255,255,0.07)"
                        />
                        <Rect x={36} y={91} width={44} height={28} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={1.5} />
                        <Path
                            d="M255 125 Q285 90 315 100 T380 60"
                            stroke="rgba(255,255,255,0.08)"
                            strokeWidth={2}
                            fill="none"
                        />
                    </>
                )}

                {decor === 'marketplace' && (
                    <>
                        {/* shopping bag + product box + price tag */}
                        <Path
                            d="M34 84 h34 l4 38 h-42 z"
                            fill="none"
                            stroke="rgba(255,255,255,0.08)"
                            strokeWidth={2}
                            strokeLinejoin="round"
                        />
                        <Path d="M42 84 c0 -10 18 -10 18 0" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={2} />
                        <Rect x={302} y={94} width={32} height={26} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={2} rx={3} />
                        <Path d="M302 104 h32 M318 94 v10" stroke="rgba(255,255,255,0.08)" strokeWidth={2} />
                        <Path d="M256 42 l20 0 l9 9 l-20 20 l-20 -20 z" fill="rgba(255,255,255,0.06)" transform="rotate(18 265 56)" />
                    </>
                )}

                <Circle cx={150} cy={40} r={3} fill={lime} opacity={0.5} />
                <Circle cx={245} cy={120} r={2.5} fill={secondary} opacity={0.5} />
            </Svg>
        </Animated.View>
    );
});

// ─── Component ────────────────────────────────────────────────────────────────

export const ScreenHeader = React.memo(function ScreenHeader({
    leftActions,
    rightActions,
    children,
    containerStyle,
    showMenuIcon = true,
    onBackPress,
    backIcon = 'arrow-back',
    hideAccountActions = false,
    decor,
    hero,
}: ScreenHeaderProps) {
    const { theme } = useTheme();
    const { user } = useAuth();
    const colors = Colors[theme];
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const router = useRouter();

    const openDrawer = useCallback(() => {
        navigation.dispatch(DrawerActions.openDrawer());
    }, [navigation]);

    // Pulsing hero tile (only animates when a hero is rendered).
    const pulse = useSharedValue(0);
    useEffect(() => {
        if (!hero) return;
        pulse.value = withRepeat(
            withTiming(1, { duration: 2500, easing: Easing.inOut(Easing.sin) }),
            -1,
            true
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [!!hero]);

    const haloStyle = useAnimatedStyle(() => ({
        opacity: 0.15 + pulse.value * 0.12,
        transform: [{ scale: 1.05 + pulse.value * 0.08 }],
    }));
    const tileStyle = useAnimatedStyle(() => ({
        transform: [{ scale: 1 + pulse.value * 0.03 }],
    }));

    const heroIcon = hero?.icon || (decor ? DECOR_ICON[decor] : 'apps');

    return (
        <View
            style={[
                styles.container,
                {
                    backgroundColor: colors.primary,
                    paddingTop: insets.top + (Platform.OS === 'android' ? 16 : 20),
                },
                containerStyle,
            ]}
        >
            {decor && <DecorLayer decor={decor} lime={colors.lime} secondary={colors.secondary} />}

            {/* ── Icon row ────────────────────────────────────────────────── */}
            <View style={styles.row}>
                {/* Left side: menu/back + optional extras */}
                <View style={styles.leftSide}>
                    {showMenuIcon ? (
                        <TouchableOpacity onPress={openDrawer} style={styles.iconBtn}>
                            <Ionicons name="grid-outline" size={20} color={colors.primary} />
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            onPress={() => {
                                if (onBackPress) {
                                    onBackPress();
                                } else if (router.canGoBack()) {
                                    router.back();
                                } else {
                                    router.replace('/(drawer)/(tabs)' as any);
                                }
                            }}
                            style={styles.iconBtn}
                        >
                            <Ionicons name={backIcon} size={20} color={colors.primary} />
                        </TouchableOpacity>
                    )}
                    {leftActions}
                </View>

                {/* Right side: optional extras + notification + profile */}
                <View style={styles.rightSide}>
                    {rightActions}

                    {!hideAccountActions && (
                        <>
                            <NotificationIcon
                                containerStyle={{ marginRight: 12 }}
                                badgeStyle={{ borderColor: colors.primary }}
                            />

                            <TouchableOpacity
                                onPress={() => router.push('/profile')}
                                style={styles.avatarBtn}
                            >
                                <Avatar
                                    uri={user?.user?.profileImage}
                                    name={user?.user?.name}
                                    size={34}
                                />
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </View>

            {/* ── Per-screen content (search, toggles, etc.) ────────────── */}
            {children}

            {/* ── Optional hero band ──────────────────────────────────────── */}
            {hero && (
                <Animated.View entering={FadeInDown.delay(120).duration(450)} style={styles.heroBand}>
                    <View style={styles.heroIconWrap}>
                        <Animated.View style={[styles.heroHalo, haloStyle]} />
                        <Animated.View style={[styles.heroTile, tileStyle]}>
                            <Ionicons name={heroIcon} size={20} color={colors.primary} />
                        </Animated.View>
                    </View>
                    <View style={styles.heroTitleRow}>
                        <ThemedText style={styles.heroTitle}>{hero.title}</ThemedText>
                        {hero.countLabel ? (
                            <View style={[styles.heroCountPill, { backgroundColor: colors.lime }]}>
                                <ThemedText style={styles.heroCountText}>{hero.countLabel}</ThemedText>
                            </View>
                        ) : null}
                    </View>
                    {hero.subtitle ? (
                        <ThemedText style={styles.heroSubtitle}>{hero.subtitle}</ThemedText>
                    ) : null}
                    <Svg width="100%" height={12} viewBox="0 0 375 12" preserveAspectRatio="none" style={styles.heroWave}>
                        <Path
                            d="M0 6 Q94 0 187 6 Q281 12 375 6"
                            stroke="rgba(255,255,255,0.12)"
                            strokeWidth={1.5}
                            fill="none"
                        />
                    </Svg>
                </Animated.View>
            )}
        </View>
    );
});

// ─── Shared icon-button helper ────────────────────────────────────────────────
// Export so screens can use the same style for their own extra buttons.

export const HeaderIconBtn = React.memo(function HeaderIconBtn({
    name,
    onPress,
    style,
    size = 20,
    badge,
}: {
    name: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
    style?: ViewStyle;
    size?: number;
    badge?: React.ReactNode;
}) {
    const { theme } = useTheme();
    const colors = Colors[theme];
    return (
        <TouchableOpacity onPress={onPress} style={[styles.iconBtn, { marginRight: 12 }, style]}>
            <Ionicons name={name} size={size} color={colors.primary} />
            {badge}
        </TouchableOpacity>
    );
});

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: {
        borderBottomLeftRadius: Layout.headerBorderRadius,
        borderBottomRightRadius: Layout.headerBorderRadius,
        paddingHorizontal: Platform.OS === 'android' ? 18 : 20,
        paddingBottom: Platform.OS === 'android' ? 8 : 16,
        zIndex: 10,
        overflow: 'hidden',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: Platform.OS === 'android' ? 18 : 20,
    },
    leftSide: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rightSide: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconBtn: {
        width: 38,
        height: 38,
        borderRadius: Layout.borderRadius,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarBtn: {
        width: 38,
        height: 38,
        borderRadius: 19,
        borderColor: 'rgba(255,255,255,0.5)',
        // borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    // Hero band
    heroBand: {
        alignItems: 'center',
        paddingTop: 10,
        paddingHorizontal: 8,
    },
    heroIconWrap: {
        width: 52,
        height: 52,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    heroHalo: {
        position: 'absolute',
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.4)',
    },
    heroTile: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    heroTitleRow: {
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
    heroCountPill: {
        paddingHorizontal: 9,
        paddingVertical: 3,
        borderRadius: 999,
    },
    heroCountText: {
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
    heroWave: {
        marginTop: 10,
    },
});
