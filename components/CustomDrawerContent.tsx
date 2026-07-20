import { Ionicons } from '@expo/vector-icons';
import {
    DrawerContentComponentProps,
    DrawerContentScrollView,
} from '@react-navigation/drawer';
import { useRouter } from 'expo-router';
import React, { memo, useCallback } from 'react';
import {
    Platform,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeIn, FadeInLeft } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';

import { useRewardedAd } from '@/ads/hooks/useAds';
import { LoaderOverlay } from '@/components/common/LoaderOverlay';
import { PressableScale } from '@/components/essentials/shared/PressableScale';
import { ThemedText } from '@/components/ThemedText';
import Avatar from '@/components/ui/avatar';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

interface MenuItem {
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    route: string;
    section?: string;
}

const MENU_ITEMS: MenuItem[] = [
    { label: 'Home', icon: 'home-outline', route: '/(drawer)/(tabs)', section: 'Main' },
    { label: 'Bazaar', icon: 'storefront-outline', route: '/(drawer)/(tabs)/marketplace', section: 'Main' },
    { label: 'Business', icon: 'briefcase-outline', route: '/(drawer)/(tabs)/business', section: 'Main' },
    { label: 'Profile', icon: 'person-outline', route: '/profile', section: 'Account' },
    { label: 'Settings', icon: 'settings-outline', route: '/settings', section: 'Account' },
    { label: 'Give Feedback', icon: 'chatbubble-ellipses-outline', route: '/(drawer)/feedback', section: 'Support' },
    { label: 'Support & FAQ', icon: 'help-circle-outline', route: '/support', section: 'Support' },
];

// Presentation-only, time-based greeting for the header.
const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
};

interface DrawerRowProps {
    item: MenuItem;
    isFocused: boolean;
    isDisabled: boolean;
    delay: number;
    colors: typeof Colors.light;
    onPress: () => void;
}

const DrawerRow = memo(function DrawerRow({
    item,
    isFocused,
    isDisabled,
    delay,
    colors,
    onPress,
}: DrawerRowProps) {
    return (
        <Animated.View entering={FadeInLeft.delay(delay).duration(300)}>
            <PressableScale
                intensity={0.03}
                disabled={isDisabled}
                onPress={onPress}
                style={[
                    styles.menuItem,
                    isFocused && { backgroundColor: `${colors.primary}0F` },
                    isDisabled && { opacity: 0.5 },
                ]}
            >
                {/* Active accent bar */}
                {isFocused && <View style={[styles.activeBar, { backgroundColor: colors.lime }]} />}

                {/* Icon tile */}
                <View
                    style={[
                        styles.iconTile,
                        {
                            backgroundColor: isFocused
                                ? colors.primary
                                : `${colors.primary}0D`,
                        },
                    ]}
                >
                    <Ionicons
                        name={item.icon}
                        size={18}
                        color={isFocused ? '#FFFFFF' : colors.textSecondary}
                    />
                </View>

                <ThemedText
                    style={[
                        styles.menuLabel,
                        { color: isFocused ? colors.primary : colors.text },
                        isFocused && { fontWeight: '800' },
                    ]}
                    numberOfLines={1}
                >
                    {item.label}
                </ThemedText>

                <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={isFocused ? colors.primary : `${colors.textSecondary}66`}
                />
            </PressableScale>
        </Animated.View>
    );
});

const CustomDrawerContentComponent = (props: DrawerContentComponentProps) => {
    const { user, logout } = useAuth();
    const { theme } = useTheme();
    const colors = Colors[theme];
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { showAd, isAdLoaded } = useRewardedAd();
    const [isLoggingOut, setIsLoggingOut] = React.useState(false);

    const activeRoute = props.state.routes[props.state.index].name;

    const handleNavigation = useCallback((route: string) => {
        if (route === 'REWARDED_AD') {
            showAd(() => {
                console.log('Reward earned from drawer!');
            });
            return;
        }
        router.navigate(route as any);
    }, [router, showAd]);

    const handleLogout = useCallback(async () => {
        setIsLoggingOut(true);
        try {
            await logout();
        } catch (error) {
            console.error('Logout failed', error);
        } finally {
            setIsLoggingOut(false);
        }
    }, [logout]);

    const userName = user?.user?.name
        ? user.user.name.split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
        : 'User';

    const userEmail = user?.user?.email || '';

    // Group items by section
    const sections = MENU_ITEMS.reduce<Record<string, MenuItem[]>>((acc, item) => {
        const section = item.section || 'Other';
        if (!acc[section]) acc[section] = [];
        acc[section].push(item);
        return acc;
    }, {});

    // Running index so menu rows stagger in continuously across sections.
    let rowIndex = 0;

    return (
        <View style={[styles.container, { backgroundColor: colors.card }]}>
            {/* ── Premium hero header ─────────────────────────────────── */}
            <Animated.View
                entering={FadeIn.duration(400)}
                style={[
                    styles.header,
                    {
                        backgroundColor: colors.primary,
                        paddingTop: insets.top + (Platform.OS === 'android' ? 16 : 20),
                    },
                ]}
            >
                {/* Faint community decor */}
                <Svg style={StyleSheet.absoluteFill} viewBox="0 0 300 200" preserveAspectRatio="xMinYMin slice">
                    <Circle cx={290} cy={10} r={70} fill="rgba(255,255,255,0.05)" />
                    <Circle cx={10} cy={190} r={55} fill="rgba(255,255,255,0.04)" />
                    <Path
                        d="M40 150 C 100 120, 180 175, 280 115"
                        stroke="rgba(255,255,255,0.08)"
                        strokeWidth={2}
                        strokeDasharray="4 8"
                        strokeLinecap="round"
                        fill="none"
                    />
                    <Path
                        d="M230 60 l10 -8 l10 8 v14 h-20 z"
                        fill="none"
                        stroke="rgba(255,255,255,0.09)"
                        strokeWidth={2}
                        strokeLinejoin="round"
                    />
                    <Circle cx={60} cy={70} r={3} fill={colors.lime} opacity={0.55} />
                    <Circle cx={200} cy={150} r={2.5} fill={colors.secondary} opacity={0.6} />
                </Svg>

                <View style={styles.headerTop}>
                    <TouchableOpacity
                        style={styles.closeBtn}
                        onPress={() => props.navigation.closeDrawer()}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Ionicons name="close" size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    onPress={() => handleNavigation('/profile')}
                    activeOpacity={0.85}
                    style={styles.identityRow}
                >
                    <View style={styles.avatarWrap}>
                        <Avatar
                            uri={user?.user?.profileImage}
                            name={user?.user?.name}
                            size={54}
                        />
                        <View style={[styles.onlineBadge, { backgroundColor: colors.lime, borderColor: colors.primary }]} />
                    </View>

                    <View style={styles.identityText}>
                        <ThemedText style={styles.greeting}>{getGreeting()}</ThemedText>
                        <ThemedText style={styles.headerName} numberOfLines={1}>{userName}</ThemedText>
                        {user?.user?.isPremium ? (
                            <View style={[styles.premiumBadge, { backgroundColor: colors.lime }]}>
                                <Ionicons name="star" size={10} color="#1E293B" style={{ marginRight: 3 }} />
                                <ThemedText style={styles.premiumText}>PREMIUM</ThemedText>
                            </View>
                        ) : userEmail ? (
                            <ThemedText style={styles.headerEmail} numberOfLines={1}>{userEmail}</ThemedText>
                        ) : null}
                    </View>

                    <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.7)" />
                </TouchableOpacity>
            </Animated.View>

            {/* ── Menu ────────────────────────────────────────────────── */}
            <DrawerContentScrollView
                {...props}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {Object.entries(sections).map(([sectionName, items], sectionIndex) => (
                    <View key={sectionName} style={styles.section}>
                        <Animated.View entering={FadeInLeft.delay(80 + sectionIndex * 40).duration(300)}>
                            <View style={styles.sectionLabelRow}>
                                <View style={[styles.sectionDot, { backgroundColor: colors.secondary }]} />
                                <ThemedText style={[styles.sectionLabel, { color: colors.textSecondary }]}>{sectionName}</ThemedText>
                            </View>
                        </Animated.View>
                        {items.map((item) => {
                            const isFocused =
                                (item.route === '/(tabs)' && activeRoute === '(tabs)') ||
                                item.route === `/${activeRoute}`;

                            const isDisabled = item.route === 'REWARDED_AD' && !isAdLoaded;
                            const delay = 120 + rowIndex * 40;
                            rowIndex += 1;

                            return (
                                <DrawerRow
                                    key={item.route}
                                    item={item}
                                    isFocused={isFocused}
                                    isDisabled={isDisabled}
                                    delay={delay}
                                    colors={colors}
                                    onPress={() => handleNavigation(item.route)}
                                />
                            );
                        })}
                    </View>
                ))}
            </DrawerContentScrollView>

            {/* ── Footer ──────────────────────────────────────────────── */}
            <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
                <PressableScale
                    intensity={0.03}
                    onPress={handleLogout}
                    containerStyle={styles.logoutBtnWrap}
                    style={[styles.logoutBtn, { backgroundColor: `${colors.secondary}12` }]}
                >
                    <Ionicons name="log-out-outline" size={18} color={colors.secondary} style={{ marginRight: 8 }} />
                    <ThemedText style={[styles.logoutText, { color: colors.secondary }]}>Sign Out</ThemedText>
                </PressableScale>
                <ThemedText style={[styles.versionText, { color: colors.textSecondary }]}>Rehbar v{process.env.EXPO_PUBLIC_APP_VERSION ?? '2.0.4'}</ThemedText>
            </View>
            <LoaderOverlay visible={isLoggingOut} text="Logging out..." />
        </View>
    );
};

export default memo(CustomDrawerContentComponent);

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    // Header
    header: {
        paddingHorizontal: 20,
        paddingBottom: 20,
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
        overflow: 'hidden',
    },
    headerTop: {
        width: '100%',
        alignItems: 'flex-end',
        height: 32,
        justifyContent: 'center',
    },
    closeBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.18)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    identityRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        marginTop: 8,
    },
    avatarWrap: {
        position: 'relative',
    },
    onlineBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 14,
        height: 14,
        borderRadius: 7,
        borderWidth: 2,
    },
    identityText: {
        flex: 1,
    },
    greeting: {
        fontSize: 11,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.8)',
        letterSpacing: 0.3,
    },
    headerName: {
        fontSize: 18,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 0.2,
        marginTop: 2,
    },
    headerEmail: {
        fontSize: 11.5,
        fontWeight: '500',
        color: 'rgba(255,255,255,0.75)',
        marginTop: 3,
    },
    premiumBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 999,
        marginTop: 6,
    },
    premiumText: {
        fontSize: 9,
        fontWeight: '800',
        letterSpacing: 0.5,
        color: '#1E293B',
    },
    // Scroll
    scrollContent: {
        paddingTop: 12,
        paddingHorizontal: 14,
    },
    // Section
    section: {
        marginBottom: 14,
    },
    sectionLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginLeft: 6,
        marginBottom: 8,
    },
    sectionDot: {
        width: 5,
        height: 5,
        borderRadius: 2.5,
    },
    sectionLabel: {
        fontSize: 10,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 1.2,
    },
    // Menu Items
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderRadius: 16,
        marginBottom: 4,
        gap: 12,
    },
    activeBar: {
        position: 'absolute',
        left: 0,
        top: 14,
        bottom: 14,
        width: 3,
        borderRadius: 2,
    },
    iconTile: {
        width: 38,
        height: 38,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    menuLabel: {
        flex: 1,
        fontSize: 14,
        fontWeight: '600',
    },
    // Footer
    footer: {
        paddingHorizontal: 16,
        paddingTop: 12,
        alignItems: 'center',
    },
    logoutBtnWrap: {
        width: '100%',
        marginBottom: 10,
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 13,
        paddingHorizontal: 24,
        borderRadius: 18,
        width: '100%',
    },
    logoutText: {
        fontSize: 14,
        fontWeight: '700',
    },
    versionText: {
        fontSize: 10,
        fontWeight: '500',
        textAlign: 'center',
        opacity: 0.7,
    },
});
