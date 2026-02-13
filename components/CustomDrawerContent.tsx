import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import {
    DrawerContentComponentProps,
    DrawerContentScrollView,
} from '@react-navigation/drawer';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    Image,
    StyleSheet,
    Switch,
    TouchableOpacity,
    View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

export default function CustomDrawerContent(
    props: DrawerContentComponentProps
) {
    const { user, logout } = useAuth();
    const { theme, toggleTheme, isDark } = useTheme();
    const colors = Colors[theme];
    const router = useRouter();

    const activeRoute = props.state.routes[props.state.index].name;

    const getProfileSource = () => {
        if (user?.user?.profileImage) {
            return { uri: user.user.profileImage };
        }
        const gender = user?.user?.gender?.toUpperCase();
        if (gender === 'FEMALE') {
            return require('../assets/icons/user-female.png');
        }
        return require('../assets/icons/user-male.png');
    };

    const menuItems = [
        {
            label: 'Blood Donors',
            icon: 'tint',
            type: 'font-awesome',
            route: '/(tabs)/blood',
        },
        { label: 'Learn and Earn', icon: 'verified-user', type: 'material' },
        { label: 'Invite Friends', icon: 'person-add', type: 'material' },
        {
            label: 'Send a Gift',
            icon: 'card-giftcard',
            type: 'material',
            badge: '$10',
        },
        {
            label: 'Settings',
            icon: 'settings',
            type: 'material',
            route: '/(tabs)/settings',
        },
    ];

    const handleNavigation = (route?: string) => {
        if (route) {
            router.push(route as any);
        }
    };

    return (
        <ThemedView style={styles.container}>
            <LinearGradient
                colors={['#1e293b', '#0F172A']}
                style={StyleSheet.absoluteFill}
            />

            <DrawerContentScrollView
                {...props}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Header */}
                <LinearGradient
                    colors={['#FF9B51', '#FF9B51']}
                    style={styles.header}
                >
                    <View style={styles.headerRow}>
                        <View style={styles.profileContainer}>
                            <Image
                                source={getProfileSource()}
                                style={styles.profileImage}
                            />
                            <View style={styles.profileOnlineBadge} />
                        </View>
                        <ThemedText style={styles.name}>
                            {user?.user?.name || 'User'}
                        </ThemedText>
                    </View>
                </LinearGradient>

                {/* Menu */}
                <View style={styles.menuContainer}>
                    {menuItems.map((item, index) => {
                        const isFocused =
                            !!item.route &&
                            (item.route === `/${activeRoute}` ||
                                (item.route === '/(tabs)' &&
                                    activeRoute === 'index'));

                        return (
                            <TouchableOpacity
                                key={index}
                                activeOpacity={0.85}
                                style={[
                                    styles.menuItem,
                                    {
                                        backgroundColor: isFocused
                                            ? 'rgba(255,255,255,0.06)'
                                            : 'rgba(255,255,255,0.04)',
                                        borderColor: isFocused
                                            ? 'rgba(255,255,255,0.2)'
                                            : 'rgba(255,255,255,0.08)',
                                    },
                                ]}
                                onPress={() =>
                                    handleNavigation(item.route)
                                }
                            >
                                {isFocused && (
                                    <LinearGradient
                                        colors={[
                                            'rgba(255,255,255,0.18)',
                                            'rgba(255,255,255,0.04)',
                                        ]}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={StyleSheet.absoluteFill}
                                    />
                                )}

                                <View style={styles.menuItemLeft}>
                                    <View
                                        style={[
                                            styles.iconContainer,
                                            {
                                                backgroundColor: isFocused
                                                    ? 'rgba(255,255,255,0.15)'
                                                    : 'rgba(255,255,255,0.06)',
                                                borderColor: isFocused
                                                    ? 'rgba(255,255,255,0.25)'
                                                    : 'rgba(255,255,255,0.1)',
                                            },
                                        ]}
                                    >
                                        {item.type === 'material' ? (
                                            <MaterialIcons
                                                name={item.icon as any}
                                                size={22}
                                                color="#FFFFFF"
                                            />
                                        ) : item.type ===
                                            'font-awesome' ? (
                                            <IconSymbol
                                                name="drop.fill"
                                                size={22}
                                                color="#FFFFFF"
                                            />
                                        ) : (
                                            <Ionicons
                                                name={item.icon as any}
                                                size={22}
                                                color="#FFFFFF"
                                            />
                                        )}
                                    </View>

                                    <ThemedText
                                        style={[
                                            styles.menuLabel,
                                            isFocused && {
                                                fontWeight: '700',
                                            },
                                        ]}
                                    >
                                        {item.label}
                                    </ThemedText>
                                </View>

                                {item.badge ? (
                                    <View style={styles.badge}>
                                        <ThemedText
                                            style={styles.badgeText}
                                        >
                                            {item.badge}
                                        </ThemedText>
                                    </View>
                                ) : (
                                    <Ionicons
                                        name="chevron-forward"
                                        size={16}
                                        color="#FFFFFF"
                                        style={{ opacity: 0.4 }}
                                    />
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Preferences */}
                <View style={styles.preferencesContainer}>
                    <ThemedText style={styles.sectionTitle}>
                        PREFERENCES
                    </ThemedText>

                    <View style={styles.themeToggleContainer}>
                        <View style={styles.menuItemLeft}>
                            <View style={styles.iconContainer}>
                                <Ionicons
                                    name={isDark ? 'moon' : 'sunny'}
                                    size={20}
                                    color="#FFFFFF"
                                />
                            </View>
                            <ThemedText style={styles.menuLabel}>
                                Dark Mode
                            </ThemedText>
                        </View>

                        <Switch
                            value={isDark}
                            onValueChange={toggleTheme}
                            trackColor={{
                                false: '#CBD5E1',
                                true: Colors.dark.secondary,
                            }}
                            thumbColor="#FFFFFF"
                        />
                    </View>
                </View>
            </DrawerContentScrollView>

            {/* Footer */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.signOutBtn}
                    onPress={logout}
                >
                    <Ionicons
                        name="log-out-outline"
                        size={20}
                        color="#EF4444"
                    />
                    <ThemedText style={styles.signOutText}>
                        Sign out
                    </ThemedText>
                </TouchableOpacity>
            </View>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { paddingTop: 0 },

    header: {
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 30,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
    },

    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
    },

    profileContainer: { position: 'relative' },

    profileImage: {
        width: 54,
        height: 54,
        borderRadius: 27,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.4)',
    },

    profileOnlineBadge: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#10B981',
        borderWidth: 2,
        borderColor: '#0F172A',
    },

    name: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: '700',
        textTransform: 'capitalize',
    },

    menuContainer: {
        paddingTop: 24,
        paddingHorizontal: 16,
    },

    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
        paddingHorizontal: 10,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 8, // 👈 +2px spacing
    },

    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },

    iconContainer: {
        width: 38,
        height: 38,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },

    menuLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: '#FFFFFF',
    },

    badge: {
        backgroundColor: '#FF9B51',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },

    badgeText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '700',
    },

    preferencesContainer: {
        paddingHorizontal: 16,
        paddingBottom: 20,
    },

    sectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 1,
        opacity: 0.5,
        marginTop: 24,
        marginBottom: 10,
        marginLeft: 10,
        color: '#FFFFFF',
    },

    themeToggleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },

    footer: {
        padding: 24,
        paddingBottom: 40,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
    },

    signOutBtn: {
        flexDirection: 'row',
        gap: 10,
        height: 56,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(239,68,68,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(239,68,68,0.2)',
    },

    signOutText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#EF4444',
    },
});
