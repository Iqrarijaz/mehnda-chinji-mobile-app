import { Ionicons } from '@expo/vector-icons';
import {
    DrawerContentComponentProps,
    DrawerContentScrollView } from '@react-navigation/drawer';
import { useRouter } from 'expo-router';
import React, { memo, useCallback } from 'react';
import {
    Platform,
    StyleSheet,
    Switch,
    TouchableOpacity,
    View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LoaderOverlay } from '@/components/common/LoaderOverlay';
import { ThemedText } from '@/components/ThemedText';
import Avatar from '@/components/ui/Avatar';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Layout } from '@/constants/layout';

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
    colors: typeof Colors.light;
    onPress: () => void;
}

const DrawerRow = memo(function DrawerRow({
    item,
    isFocused,
    isDisabled,
    colors,
    onPress }: DrawerRowProps) {
    return (
        <TouchableOpacity
            activeOpacity={0.7}
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
                            : `${colors.primary}0D` },
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
        </TouchableOpacity>
    );
});

interface DarkModeDrawerRowProps {
    colors: typeof Colors.light;
    isDark: boolean;
    onToggle: () => void;
}

const DarkModeDrawerRow = memo(function DarkModeDrawerRow({
    colors,
    isDark,
    onToggle }: DarkModeDrawerRowProps) {
    return (
        <TouchableOpacity
            activeOpacity={0.7}
            onPress={onToggle}
            style={styles.menuItem}
        >
            <View
                style={[
                    styles.iconTile,
                    {
                        backgroundColor: isDark
                            ? `${colors.primary}20`
                            : `${colors.primary}0D` },
                ]}
            >
                <Ionicons
                    name={isDark ? 'moon' : 'moon-outline'}
                    size={18}
                    color={isDark ? colors.lime : colors.textSecondary}
                />
            </View>

            <ThemedText
                style={[
                    styles.menuLabel,
                    { color: colors.text },
                ]}
                numberOfLines={1}
            >
                Dark Mode
            </ThemedText>

            <Switch
                value={isDark}
                onValueChange={onToggle}
                trackColor={{ false: `${colors.textSecondary}33`, true: colors.primary }}
                thumbColor={isDark ? colors.lime : '#f5f5f5'}
                ios_backgroundColor={`${colors.textSecondary}33`}
                style={Platform.OS === 'ios' ? { transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] } : undefined}
            />
        </TouchableOpacity>
    );
});

const CustomDrawerContentComponent = (props: DrawerContentComponentProps) => {
    const { user, logout } = useAuth();
    const { theme, isDark, toggleTheme } = useTheme();
    const colors = Colors[theme];
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [isLoggingOut, setIsLoggingOut] = React.useState(false);

    const activeRoute = props.state.routes[props.state.index].name;

    const handleNavigation = useCallback((route: string) => {
        router.navigate(route as any);
    }, [router]);

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
            <View
                style={[
                    styles.header,
                    {
                        backgroundColor: colors.primary,
                        paddingTop: insets.top + (Platform.OS === 'android' ? 16 : 20) },
                ]}
            >
                {/* Removed community decor */}

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
                        <View style={[styles.onlineBadge, { backgroundColor: colors.lime }]} />
                    </View>
                    <View style={styles.identityText}>
                        <ThemedText style={styles.greeting}>{getGreeting()},</ThemedText>
                        <ThemedText style={styles.headerName} numberOfLines={1}>{userName}</ThemedText>
                        {user?.user?.premium ? (
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
            </View>

            {/* ── Menu ────────────────────────────────────────────────── */}
            <DrawerContentScrollView
                {...props}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {Object.entries(sections).map(([sectionName, items], sectionIndex) => (
                    <View key={sectionName} style={styles.section}>
                        <View>
                            <View style={styles.sectionLabelRow}>
                                <View style={[styles.sectionDot, { backgroundColor: colors.secondary }]} />
                                <ThemedText style={[styles.sectionLabel, { color: colors.textSecondary }]}>{sectionName}</ThemedText>
                            </View>
                        </View>
                        {items.map((item) => {
                            const isFocused =
                                (item.route === '/(tabs)' && activeRoute === '(tabs)') ||
                                item.route === `/${activeRoute}`;

                            return (
                                <DrawerRow
                                    key={item.route}
                                    item={item}
                                    isFocused={isFocused}
                                    isDisabled={false}
                                    colors={colors}
                                    onPress={() => handleNavigation(item.route)}
                                />
                            );
                        })}
                        {sectionName === 'Account' && (
                            <DarkModeDrawerRow
                                key="dark-mode-toggle"
                                colors={colors}
                                isDark={isDark}
                                onToggle={toggleTheme}
                            />
                        )}
                    </View>
                ))}
            </DrawerContentScrollView>

            {/* ── Footer ──────────────────────────────────────────────── */}
            <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
                <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={handleLogout}
                    style={[styles.logoutBtn, { backgroundColor: `${colors.secondary}12` }]}
                >
                    <Ionicons name="log-out-outline" size={18} color={colors.secondary} style={{ marginRight: 8 }} />
                    <ThemedText style={[styles.logoutText, { color: colors.secondary }]}>Sign Out</ThemedText>
                </TouchableOpacity>
                <ThemedText style={[styles.versionText, { color: colors.textSecondary }]}>Rehbar v{process.env.EXPO_PUBLIC_APP_VERSION ?? '2.0.6'}</ThemedText>
            </View>
            <LoaderOverlay visible={isLoggingOut} text="Logging out..." />
        </View>
    );
};

export default memo(CustomDrawerContentComponent);

const styles = StyleSheet.create({
    container: {
        flex: 1 },
    // Header
    header: {
        paddingHorizontal: 16,
        paddingBottom: 16,
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
        overflow: 'hidden' },
    headerTop: {
        width: '100%',
        alignItems: 'flex-end',
        height: 32,
        justifyContent: 'center' },
    closeBtn: {
        width: 32,
        height: 32,
        borderRadius: Layout.borderRadius,
        backgroundColor: 'rgba(255,255,255,0.18)',
        alignItems: 'center',
        justifyContent: 'center' },
    identityRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        marginTop: 8 },
    avatarWrap: {
        position: 'relative' },
    onlineBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 14,
        height: 14,
        borderRadius: Layout.borderRadius },
    identityText: {
        flex: 1 },
    greeting: {
        fontSize: 10,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.8)',
        letterSpacing: 0.3 },
    headerName: {
        fontSize: 15.5,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 0.2,
        marginTop: 2 },
    headerEmail: {
        fontSize: 10,
        fontWeight: '500',
        color: 'rgba(255,255,255,0.75)',
        marginTop: 3 },
    premiumBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: 7,
        paddingVertical: 3,
        borderRadius: Layout.borderRadius,
        marginTop: 6 },
    premiumText: {
        fontSize: 9,
        fontWeight: '800',
        letterSpacing: 0.5,
        color: '#1E293B' },
    // Scroll
    scrollContent: {
        paddingTop: 10,
        paddingHorizontal: 11 },
    // Section
    section: {
        marginBottom: 14 },
    sectionLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginLeft: 6,
        marginBottom: 8 },
    sectionDot: {
        width: 5,
        height: 5,
        borderRadius: Layout.borderRadius },
    sectionLabel: {
        fontSize: 9,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 1.2 },
    // Menu Items
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 7,
        paddingHorizontal: 8,
        borderRadius: Layout.borderRadius,
        marginBottom: 4,
        gap: 12 },
    activeBar: {
        position: 'absolute',
        left: 0,
        top: 14,
        bottom: 14,
        width: 3,
        borderRadius: Layout.borderRadius },
    iconTile: {
        width: 38,
        height: 38,
        borderRadius: Layout.borderRadius,
        alignItems: 'center',
        justifyContent: 'center' },
    menuLabel: {
        flex: 1,
        fontSize: 12.5,
        fontWeight: '600' },
    // Footer
    footer: {
        paddingHorizontal: 13,
        paddingTop: 10,
        alignItems: 'center' },
    logoutBtnWrap: {
        width: '100%',
        marginBottom: 10 },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: Layout.borderRadius,
        width: '100%' },
    logoutText: {
        fontSize: 12.5,
        fontWeight: '700' },
    versionText: {
        fontSize: 9,
        fontWeight: '500',
        textAlign: 'center',
        opacity: 0.7 } });
