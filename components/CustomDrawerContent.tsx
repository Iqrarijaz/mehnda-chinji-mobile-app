import React, { useCallback, memo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
    DrawerContentComponentProps,
    DrawerContentScrollView,
} from '@react-navigation/drawer';
import { useRouter } from 'expo-router';
import {
    Platform,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeIn, FadeInLeft } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import Avatar from '@/components/ui/avatar';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useRewardedAd } from '@/ads/hooks/useAds';

interface MenuItem {
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    route: string;
    section?: string;
}

const MENU_ITEMS: MenuItem[] = [
    { label: 'Home', icon: 'home-outline', route: '/(drawer)/(tabs)', section: 'Main' },
    { label: 'Bazaar', icon: 'storefront-outline', route: '/(drawer)/(tabs)/marketplace', section: 'Main' },
    { label: 'Business Directory', icon: 'briefcase-outline', route: '/(drawer)/(tabs)/business', section: 'Main' },
    { label: 'Profile', icon: 'person-outline', route: '/profile', section: 'Account' },
    { label: 'Settings', icon: 'settings-outline', route: '/settings', section: 'Account' },
    { label: 'Give Feedback', icon: 'chatbubble-ellipses-outline', route: '/(drawer)/feedback', section: 'Support' },
    { label: 'Support & FAQ', icon: 'help-circle-outline', route: '/support', section: 'Support' },
];

/**
 * Forest-green drawer — premium reference design: white/lime content on a
 * deep teal-green panel, active item as a lime pill.
 */
const CustomDrawerContentComponent = (props: DrawerContentComponentProps) => {
    const { user, logout } = useAuth();
    const { theme } = useTheme();
    const colors = Colors[theme];
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { showAd, isAdLoaded } = useRewardedAd();

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

    return (
        <View style={[styles.container, { backgroundColor: colors.primary }]}>
            {/* Centered profile header on forest surface */}
            <Animated.View entering={FadeIn.duration(400)} style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'android' ? 16 : 20) }]}>
                <View style={styles.headerTop}>
                    <TouchableOpacity
                        style={styles.closeBtn}
                        onPress={() => props.navigation.closeDrawer()}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Ionicons name="close" size={24} color={colors.onPrimaryMuted} />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    onPress={() => handleNavigation('/profile')}
                    activeOpacity={0.8}
                    style={styles.avatarWrap}
                >
                    <View style={[styles.avatarRing, { borderColor: colors.lime }]}>
                        <Avatar
                            uri={user?.user?.profileImage}
                            name={user?.user?.name}
                            size={64}
                        />
                    </View>
                    <View style={[styles.onlineBadge, { backgroundColor: colors.lime, borderColor: colors.primary }]} />
                </TouchableOpacity>
                <View style={styles.headerTextWrap}>
                    <ThemedText style={[styles.headerName, { color: colors.onPrimary }]}>{userName}</ThemedText>
                    {userEmail ? (
                        <ThemedText style={[styles.headerEmail, { color: colors.onPrimaryMuted }]} numberOfLines={1}>{userEmail}</ThemedText>
                    ) : null}
                </View>
            </Animated.View>

            {/* Menu */}
            <DrawerContentScrollView
                {...props}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {Object.entries(sections).map(([sectionName, items], sectionIndex) => (
                    <Animated.View
                        key={sectionName}
                        entering={FadeInLeft.delay(100 + sectionIndex * 50).duration(300)}
                        style={styles.section}
                    >
                        <ThemedText style={[styles.sectionLabel, { color: colors.onPrimaryMuted }]}>{sectionName}</ThemedText>
                        {items.map((item, index) => {
                            const isFocused =
                                (item.route === '/(tabs)' && activeRoute === '(tabs)') ||
                                item.route === `/${activeRoute}`;

                            const isDisabled = item.route === 'REWARDED_AD' && !isAdLoaded;

                            return (
                                <TouchableOpacity
                                    key={index}
                                    activeOpacity={0.7}
                                    disabled={isDisabled}
                                    style={[
                                        styles.menuItem,
                                        isFocused && { backgroundColor: colors.lime },
                                        isDisabled && { opacity: 0.5 },
                                    ]}
                                    onPress={() => handleNavigation(item.route)}
                                >
                                    <Ionicons
                                        name={item.icon}
                                        size={20}
                                        color={isFocused ? colors.primary : colors.onPrimaryMuted}
                                        style={styles.menuIcon}
                                    />
                                    <ThemedText style={[
                                        styles.menuLabel,
                                        { color: isFocused ? colors.primary : colors.onPrimary },
                                        isFocused && { fontWeight: '800' },
                                    ]}>
                                        {item.label}
                                    </ThemedText>
                                </TouchableOpacity>
                            );
                        })}
                    </Animated.View>
                ))}
            </DrawerContentScrollView>

            {/* Footer */}
            <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
                <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={logout}
                    style={styles.logoutBtn}
                >
                    <Ionicons name="log-out-outline" size={18} color={colors.pink} style={{ marginRight: 8 }} />
                    <ThemedText style={[styles.logoutText, { color: colors.onPrimary }]}>Sign Out</ThemedText>
                </TouchableOpacity>
                <ThemedText style={[styles.versionText, { color: colors.onPrimaryMuted }]}>Rehbar v{process.env.EXPO_PUBLIC_APP_VERSION ?? '1.2.7'}</ThemedText>
            </View>
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
        alignItems: 'center',
    },
    headerTop: {
        width: '100%',
        alignItems: 'flex-end',
        height: 38,
        justifyContent: 'center',
        marginBottom: 4,
    },
    closeBtn: {
        padding: 4,
    },
    avatarWrap: {
        position: 'relative',
        marginBottom: 12,
    },
    avatarRing: {
        borderWidth: 2,
        borderRadius: 999,
        padding: 3,
    },
    onlineBadge: {
        position: 'absolute',
        bottom: 4,
        right: 4,
        width: 14,
        height: 14,
        borderRadius: 7,
        borderWidth: 2,
    },
    headerTextWrap: {
        alignItems: 'center',
    },
    headerName: {
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 2,
    },
    headerEmail: {
        fontSize: 12,
        fontWeight: '500',
    },
    // Scroll
    scrollContent: {
        paddingTop: 4,
        paddingHorizontal: 16,
    },
    // Section
    section: {
        marginBottom: 14,
    },
    sectionLabel: {
        fontSize: 10,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginLeft: 12,
        marginBottom: 6,
        opacity: 0.8,
    },
    // Menu Items
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 13,
        paddingHorizontal: 14,
        borderRadius: 16,
        marginBottom: 2,
    },
    menuIcon: {
        marginRight: 12,
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
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 13,
        paddingHorizontal: 24,
        borderRadius: 999,
        width: '100%',
        backgroundColor: 'rgba(255,255,255,0.10)',
        marginBottom: 10,
    },
    logoutText: {
        fontSize: 14,
        fontWeight: '700',
    },
    versionText: {
        fontSize: 10,
        fontWeight: '500',
        textAlign: 'center',
        opacity: 0.8,
    },
});
