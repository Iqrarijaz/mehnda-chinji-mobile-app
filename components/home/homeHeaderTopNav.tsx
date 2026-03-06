import { Colors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { DrawerActions } from '@react-navigation/native';
import { useNavigation, useRouter } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';

import Avatar from '../ui/avatar';
import { NotificationIcon } from '../common/notificationIcon';

export function HomeHeaderTopNav() {
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
                    style={styles.menuBtn}
                >
                    <Ionicons name="grid-outline" size={20} color="#FFFFFF" />
                </TouchableOpacity>
            </View>

            <View style={styles.rightActions}>
                <NotificationIcon
                    containerStyle={{ marginRight: 12 }}
                    badgeStyle={{ borderColor: colors.primary }}
                />
                <TouchableOpacity
                    onPress={() => router.push('/profile')}
                    style={styles.avatarButton}
                >
                    <Avatar
                        uri={user?.user?.profileImage}
                        name={user?.user?.name}
                        size={34}
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
        flex: 1,
    },
    menuBtn: {
        width: 38,
        height: 38,
        borderRadius: 11,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    rightActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarButton: {
        width: 38,
        height: 38,
        borderRadius: 19,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
