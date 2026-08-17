import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { DrawerActions } from '@react-navigation/native';
import { useNavigation, useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import {
    Platform,
    StyleSheet,
    TouchableOpacity,
    View,
    ViewStyle
} from 'react-native';
import Animated, {
    FadeInDown,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Avatar from '../ui/Avatar';
import { NotificationIcon } from './NotificationIcon';
import { ThemedText } from '../ThemedText';
import { BackButton } from './BackButton';

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
    marketplace: 'pricetag'
};

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
    const { theme, isDark } = useTheme();
    const { user } = useAuth();
    const colors = Colors[theme];
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const router = useRouter();

    const openDrawer = useCallback(() => {
        let currentNav: any = navigation;
        let drawerNav: any = null;

        while (currentNav) {
            try {
                const state = currentNav.getState?.();
                if (state?.type === 'drawer' || typeof currentNav.openDrawer === 'function') {
                    drawerNav = currentNav;
                    break;
                }
            } catch (e) {
                // Ignore state inspection errors
            }
            currentNav = currentNav.getParent ? currentNav.getParent() : null;
        }

        if (drawerNav) {
            try {
                if (typeof drawerNav.openDrawer === 'function') {
                    drawerNav.openDrawer();
                } else {
                    drawerNav.dispatch(DrawerActions.openDrawer());
                }
            } catch (err) {
                router.push('/(drawer)/(tabs)' as any);
            }
        } else {
            if (router.canGoBack()) {
                router.back();
            } else {
                router.replace('/(drawer)/(tabs)' as any);
            }
        }
    }, [navigation, router]);

    const heroIcon = hero?.icon || (decor ? DECOR_ICON[decor] : 'apps');

    return (
        <View
            style={[
                styles.container,
                {
                    backgroundColor: colors.primary,
                    paddingTop: insets.top + (Platform.OS === 'android' ? 16 : 20)
                },
                containerStyle,
            ]}
        >


            {/* ── Icon row ────────────────────────────────────────────────── */}
            <View style={styles.row}>
                {/* Left side: menu/back + optional extras */}
                <View style={styles.leftSide}>
                    {showMenuIcon ? (
                        <TouchableOpacity onPress={openDrawer} style={[styles.iconBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#FFFFFF' }]}>
                            <Ionicons name="grid-outline" size={20} color={isDark ? '#FFFFFF' : colors.primary} />
                        </TouchableOpacity>
                    ) : (
                        <BackButton
                            onPress={() => {
                                if (onBackPress) {
                                    onBackPress();
                                } else if (router.canGoBack()) {
                                    router.back();
                                } else {
                                    router.replace('/(drawer)/(tabs)' as any);
                                }
                            }}
                            backgroundColor={isDark ? 'rgba(255,255,255,0.1)' : '#FFFFFF'}
                            color={isDark ? '#FFFFFF' : colors.primary}
                            size={20}
                            style={{ marginRight: 0 }}
                        />
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
                                <Avatar size={38} uri={user?.user?.profileImage || user?.user?.profile_image_url || user?.user?.avatar} name={user?.user?.name || user?.user?.first_name || ''} />
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
                        <View style={styles.heroHalo} />
                        <View style={styles.heroTile}>
                            <Ionicons name={heroIcon} size={20} color={colors.primary} />
                        </View>
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
    const { theme, isDark } = useTheme();
    const colors = Colors[theme];
    return (
        <TouchableOpacity onPress={onPress} style={[styles.iconBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#FFFFFF', marginRight: 12 }, style]}>
            <Ionicons name={name} size={size} color={isDark ? '#FFFFFF' : colors.primary} />
            {badge}
        </TouchableOpacity>
    );
});

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: {
        borderBottomLeftRadius: Layout.headerBorderRadius,
        borderBottomRightRadius: Layout.headerBorderRadius,
        paddingHorizontal: 14,
        paddingBottom: 0,
        zIndex: 10,
        overflow: 'hidden'
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: Platform.OS === 'android' ? 10 : 12
    },
    leftSide: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    rightSide: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    iconBtn: {
        width: 38,
        height: 38,
        borderRadius: Layout.borderRadius,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center'
    },
    avatarBtn: {
        width: 38,
        height: 38,
        borderRadius: Layout.borderRadius,
        //
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden'
    },
    // Hero band
    heroBand: {
        alignItems: 'center',
        paddingTop: 0,
        paddingBottom: 20,
        paddingHorizontal: 7
    },
    heroIconWrap: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 6
    },
    heroHalo: {
        position: 'absolute',
        width: 38,
        height: 38,
        borderRadius: Layout.borderRadius,
        backgroundColor: 'rgba(255,255,255,0.4)'
    },
    heroTile: {
        width: 34,
        height: 34,
        borderRadius: Layout.borderRadius,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center'
    },
    heroTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8
    },
    heroTitle: {
        fontSize: 15.5,
        fontWeight: '800',
        color: '#FFFFFF',
        textAlign: 'center',
        letterSpacing: 0.2
    },
    heroCountPill: {
        paddingHorizontal: 7,
        paddingVertical: 3,
        borderRadius: Layout.borderRadius
    },
    heroCountText: {
        fontSize: 9,
        fontWeight: '800',
        color: '#1E293B',
        letterSpacing: 0.4,
        textTransform: 'uppercase'
    },
    heroSubtitle: {
        fontSize: 10.5,
        color: 'rgba(255,255,255,0.8)',
        textAlign: 'center',
        marginTop: 6,
        lineHeight: 18
    }
});
