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
    ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Avatar from '../ui/avatar';
import { NotificationIcon } from '../common/NotificationIcon';

// ─── Types ────────────────────────────────────────────────────────────────────

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
}

// ─── Component ────────────────────────────────────────────────────────────────

export const ScreenHeader = React.memo(function ScreenHeader({
    leftActions,
    rightActions,
    children,
    containerStyle,
    showMenuIcon = true,
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
                                if (router.canGoBack()) router.back();
                                else router.replace('/(drawer)/(tabs)' as any);
                            }}
                            style={styles.iconBtn}
                        >
                            <Ionicons name="arrow-back" size={20} color={colors.primary} />
                        </TouchableOpacity>
                    )}
                    {leftActions}
                </View>

                {/* Right side: optional extras + notification + chat + profile */}
                <View style={styles.rightSide}>
                    {rightActions}

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
                </View>
            </View>

            {/* ── Per-screen content (search, toggles, etc.) ────────────── */}
            {children}
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
});
