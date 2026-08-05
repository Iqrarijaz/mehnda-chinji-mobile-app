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
    ViewStyle } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import Animated, {
    Easing,
    FadeInDown,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming } from 'react-native-reanimated';
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
    marketplace: 'pricetag' };

// ─── Decor layer ──────────────────────────────────────────────────────────────



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
    hero }: ScreenHeaderProps) {
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
        transform: [{ scale: 1.05 + pulse.value * 0.08 }] }));
    const tileStyle = useAnimatedStyle(() => ({
        transform: [{ scale: 1 + pulse.value * 0.03 }] }));

    const heroIcon = hero?.icon || (decor ? DECOR_ICON[decor] : 'apps');

    return (
        <View
            style={[
                styles.container,
                {
                    backgroundColor: colors.primary,
                    paddingTop: insets.top + (Platform.OS === 'android' ? 16 : 20) },
                containerStyle,
            ]}
        >


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
                            />
                            <TouchableOpacity onPress={() => router.push('/profile')} style={styles.avatarBtn}>
                                <Avatar size={38} uri={user?.user?.profile_image_url || user?.user?.avatar} name={user?.user?.first_name || user?.user?.name || ''} />
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </View>

            {/* ── Content (search bars, toggles, etc.) ────────────── */}
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
    badge }: {
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
        overflow: 'hidden' },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: Platform.OS === 'android' ? 18 : 20 },
    leftSide: {
        flexDirection: 'row',
        alignItems: 'center' },
    rightSide: {
        flexDirection: 'row',
        alignItems: 'center' },
    iconBtn: {
        width: 38,
        height: 38,
        borderRadius: Layout.borderRadius,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center' },
    avatarBtn: {
        width: 38,
        height: 38,
        borderRadius: Layout.borderRadius,
        //
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden' },
    // Hero band
    heroBand: {
        alignItems: 'center',
        paddingTop: 8,
        paddingHorizontal: 7 },
    heroIconWrap: {
        width: 52,
        height: 52,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8 },
    heroHalo: {
        position: 'absolute',
        width: 44,
        height: 44,
        borderRadius: Layout.borderRadius,
        backgroundColor: 'rgba(255,255,255,0.4)' },
    heroTile: {
        width: 40,
        height: 40,
        borderRadius: Layout.borderRadius,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center' },
    heroTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8 },
    heroTitle: {
        fontSize: 15.5,
        fontWeight: '800',
        color: '#FFFFFF',
        textAlign: 'center',
        letterSpacing: 0.2 },
    heroCountPill: {
        paddingHorizontal: 7,
        paddingVertical: 3,
        borderRadius: Layout.borderRadius },
    heroCountText: {
        fontSize: 9,
        fontWeight: '800',
        color: '#1E293B',
        letterSpacing: 0.4,
        textTransform: 'uppercase' },
    heroSubtitle: {
        fontSize: 10.5,
        color: 'rgba(255,255,255,0.8)',
        textAlign: 'center',
        marginTop: 6,
        lineHeight: 18 },
    heroWave: {
        marginTop: 10 } });
