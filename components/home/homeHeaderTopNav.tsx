import { Colors } from '@/constants/colors';
import { ThemedText } from '../ThemedText';
import { Layout } from '@/constants/layout';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { DrawerActions } from '@react-navigation/native';
import { useNavigation, useRouter } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';

import Avatar from '../ui/avatar';
import { NotificationIcon } from '../common/NotificationIcon';

interface HomeHeaderTopNavProps {
    onSearchPress?: () => void;
}

export function HomeHeaderTopNav({ onSearchPress }: HomeHeaderTopNavProps) {
    const { user } = useAuth();
    const { theme } = useTheme();
    const colors = Colors[theme];
    const router = useRouter();
    const navigation = useNavigation();

    return (
        <View style={styles.container}>
            <View style={styles.leftRow}>
                <TouchableOpacity
                    onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
                    style={[styles.menuBtn, { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.2)' }]}
                >
                    <Ionicons name="grid-outline" size={20} color="#FFFFFF" />
                </TouchableOpacity>
            </View>

            <View style={styles.rightActions}>
                <TouchableOpacity
                    onPress={onSearchPress}
                    style={[styles.searchBtn, { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.2)' }]}
                >
                    <Ionicons name="search-outline" size={20} color="#FFFFFF" />
                </TouchableOpacity>
                <NotificationIcon
                    containerStyle={{ marginRight: 12 }}
                    badgeStyle={{ borderColor: theme === 'dark' ? '#111827' : colors.primary }}
                />
                <TouchableOpacity
                    onPress={() => router.push('/profile')}
                    style={styles.avatarButton}
                >
                    <Avatar
                        uri={user?.user?.profileImage}
                        name={user?.user?.name}
                        size={34}
                        style={{ borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }}
                    />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Platform.OS === 'android' ? 18 : 20,
    },
    leftRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    menuBtn: {
        width: 38,
        height: 38,
        borderRadius: Layout.borderRadius,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    rightActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    searchBtn: {
        width: 38,
        height: 38,
        borderRadius: Layout.borderRadius,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    avatarButton: {
        width: 38,
        height: 38,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
