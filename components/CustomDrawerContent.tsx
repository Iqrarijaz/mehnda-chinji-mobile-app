import { Ionicons } from '@expo/vector-icons';
import {
    DrawerContentComponentProps,
    DrawerContentScrollView,
} from '@react-navigation/drawer';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeIn, FadeInLeft } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themedText';
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
    // { label: 'Community Feed', icon: 'newspaper-outline', route: '/(drawer)/(tabs)/feed', section: 'Main' },
    { label: 'Blood Donors', icon: 'water-outline', route: '/(drawer)/(tabs)/blood', section: 'Main' },
    { label: 'Business Directory', icon: 'briefcase-outline', route: '/(drawer)/(tabs)/business', section: 'Main' },
    { label: 'Profile', icon: 'person-outline', route: '/profile', section: 'Account' },
    { label: 'Settings', icon: 'settings-outline', route: '/settings', section: 'Account' },
    { label: 'Support & FAQ', icon: 'help-circle-outline', route: '/support', section: 'Support' },
];

export default function CustomDrawerContent(props: DrawerContentComponentProps) {
    const { user, logout } = useAuth();
    const { theme } = useTheme();
    const colors = Colors[theme];
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const activeRoute = props.state.routes[props.state.index].name;

    const handleNavigation = (route: string) => {
        router.navigate(route as any);
    };

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
        <View style={[styles.container, { backgroundColor: '#F5F6FA' }]}>
            {/* Header */}
            <Animated.View entering={FadeIn.duration(400)} style={[styles.header, { paddingTop: insets.top + 16, backgroundColor: colors.primary }]}>
                <View style={styles.headerContent}>
                    <TouchableOpacity
                        onPress={() => handleNavigation('/profile')}
                        activeOpacity={0.8}
                        style={styles.avatarWrap}
                    >
                        <Avatar
                            uri={user?.user?.profileImage}
                            name={user?.user?.name}
                            size={52}
                        />
                        <View style={styles.onlineBadge} />
                    </TouchableOpacity>
                    <View style={styles.headerTextWrap}>
                        <ThemedText style={styles.headerName}>{userName}</ThemedText>
                        {userEmail ? (
                            <ThemedText style={styles.headerEmail} numberOfLines={1}>{userEmail}</ThemedText>
                        ) : null}
                    </View>
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
                        entering={FadeInLeft.delay(200 + sectionIndex * 100).duration(400)}
                        style={styles.section}
                    >
                        <ThemedText style={styles.sectionLabel}>{sectionName}</ThemedText>
                        {items.map((item, index) => {
                            const isFocused =
                                (item.route === '/(tabs)' && activeRoute === '(tabs)') ||
                                item.route === `/${activeRoute}`;

                            return (
                                <TouchableOpacity
                                    key={index}
                                    activeOpacity={0.7}
                                    style={[
                                        styles.menuItem,
                                        isFocused && { backgroundColor: colors.primary + '10' },
                                    ]}
                                    onPress={() => handleNavigation(item.route)}
                                >
                                    <View style={[
                                        styles.menuIconWrap,
                                        { backgroundColor: isFocused ? colors.primary + '15' : '#F0F1F5' },
                                    ]}>
                                        <Ionicons
                                            name={item.icon}
                                            size={20}
                                            color={isFocused ? colors.primary : '#64748B'}
                                        />
                                    </View>
                                    <ThemedText style={[
                                        styles.menuLabel,
                                        { color: isFocused ? colors.primary : '#1E293B' },
                                        isFocused && { fontWeight: '700' },
                                    ]}>
                                        {item.label}
                                    </ThemedText>
                                    <Ionicons
                                        name="chevron-forward"
                                        size={16}
                                        color={isFocused ? colors.primary : '#CBD5E1'}
                                    />
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
                    <View style={styles.logoutIconWrap}>
                        <Ionicons name="log-out-outline" size={20} color="#EF4444" />
                    </View>
                    <ThemedText style={styles.logoutText}>Sign Out</ThemedText>
                </TouchableOpacity>

                <ThemedText style={styles.versionText}>Rehbar v1.0.0</ThemedText>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },

    // Header
    header: {
        paddingHorizontal: 20,
        paddingBottom: 20,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarWrap: {
        position: 'relative',
        marginRight: 14,
    },
    onlineBadge: {
        position: 'absolute',
        bottom: 1,
        right: 1,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#10B981',
        borderWidth: 2.5,
        borderColor: '#FFFFFF',
    },
    headerTextWrap: {
        flex: 1,
    },
    headerName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    headerEmail: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.7)',
        fontWeight: '400',
        marginTop: 2,
    },

    // Scroll
    scrollContent: {
        paddingTop: 20,
        paddingHorizontal: 16,
    },

    // Section
    section: {
        marginBottom: 16,
    },
    sectionLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: '#94A3B8',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginLeft: 14,
        marginBottom: 8,
    },

    // Menu Items
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 14,
        marginBottom: 4,
    },
    menuIconWrap: {
        width: 36,
        height: 36,
        borderRadius: 11,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    menuLabel: {
        flex: 1,
        fontSize: 15,
        fontWeight: '500',
    },

    // Footer
    footer: {
        paddingHorizontal: 20,
        paddingTop: 12,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: 'rgba(0,0,0,0.06)',
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderRadius: 14,
    },
    logoutIconWrap: {
        width: 36,
        height: 36,
        borderRadius: 11,
        backgroundColor: 'rgba(239, 68, 68, 0.08)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    logoutText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#EF4444',
    },
    versionText: {
        fontSize: 11,
        color: '#B0B8C9',
        fontWeight: '500',
        textAlign: 'center',
        marginTop: 16,
    },
});
