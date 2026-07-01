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
}

// ─── Component ────────────────────────────────────────────────────────────────

export const ScreenHeader = React.memo(function ScreenHeader({
    leftActions,
    rightActions,
    children,
    containerStyle,
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
                {/* Left side: menu + optional extras */}
                <View style={styles.leftSide}>
                    <TouchableOpacity onPress={openDrawer} style={styles.iconBtn}>
                        <Ionicons name="grid-outline" size={20} color="#FFFFFF" />
                    </TouchableOpacity>
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
                        onPress={() => router.push('/(drawer)/(tabs)/chat')}
                        style={[styles.iconBtn, { marginRight: 12 }]}
                    >
                        <Ionicons name="chatbubble-ellipses-outline" size={20} color="#FFFFFF" />
                    </TouchableOpacity>

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
    return (
        <TouchableOpacity onPress={onPress} style={[styles.iconBtn, { marginRight: 12 }, style]}>
            <Ionicons name={name} size={size} color="#FFFFFF" />
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
        // Subtle shadow to lift the header off the content
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
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
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarBtn: {
        width: 38,
        height: 38,
        borderRadius: 19,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
});
