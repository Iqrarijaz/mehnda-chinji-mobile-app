import { Ionicons } from '@expo/vector-icons';
import { DrawerActions } from '@react-navigation/native';
import { useNavigation } from 'expo-router';
import React from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { SearchBar } from '../common/SearchBar';

export function HomeHeader() {
    const { theme } = useTheme();
    const { user } = useAuth();
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const colors = Colors[theme];
    const isDark = theme === 'dark';

    const getProfileSource = () => {
        if (user?.user?.profileImage) {
            return { uri: user.user.profileImage };
        }
        const gender = user?.user?.gender?.toUpperCase();
        if (gender === 'FEMALE') {
            return require('../../assets/icons/user-female.png');
        }
        return require('../../assets/icons/user-male.png');
    };

    const firstName = user?.user?.name?.split(' ')[0] || 'User';

    return (
        <View style={styles.headerWrapper}>
            <View style={[styles.container, { paddingTop: insets.top + 20, backgroundColor: '#004030' }]}>
                {/* Background color: #004030 */}

                {/* Top Row: Menu & Profile */}
                <View style={styles.topNavRow}>
                    <TouchableOpacity
                        onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
                        style={[styles.iconButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
                    >
                        <Ionicons name="grid-outline" size={20} color="#FFFFFF" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => navigation.navigate('profile' as never)}
                        style={styles.profileButton}
                    >
                        <Image
                            source={getProfileSource()}
                            style={styles.profileImage}
                        />
                    </TouchableOpacity>
                </View>

                {/* Centered Content */}
                <View style={styles.centerContent}>
                    <ThemedText style={styles.greeting}>Hello, {firstName}!</ThemedText>

                    <View style={styles.locationRow}>
                        <ThemedText style={styles.locationText}>Menda Chinji, PK</ThemedText>
                        <Ionicons name="location-sharp" size={20} color="#FF9B51" style={{ marginLeft: 4 }} />
                    </View>
                </View>

                {/* Search Bar - Floating partially out or inside? Inspiration has it inside. */}
                <View style={styles.searchContainer}>
                    <SearchBar
                        placeholder="What service are you looking for?"
                        style={{
                            backgroundColor: isDark ? colors.card : '#FFFFFF',
                            borderColor: 'transparent',
                            shadowColor: "#000",
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.1,
                            shadowRadius: 12,
                            elevation: 5,
                            height: 48,
                            borderRadius: 24,
                        }}
                    />
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    headerWrapper: {
        zIndex: 10,
        marginBottom: 10, // Spacing for content below
    },
    container: {
        paddingHorizontal: 20,
        paddingBottom: 26,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        zIndex: 10,
    },
    topNavRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    iconButton: {
        width: 38,
        height: 38,
        borderRadius: 11,
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileButton: {
        width: 38,
        height: 38,
        borderRadius: 19,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.5)',
        padding: 1.5,
    },
    profileImage: {
        width: '100%',
        height: '100%',
        borderRadius: 17,
    },
    centerContent: {
        alignItems: 'center',
        marginBottom: 24,
    },
    greeting: {
        fontSize: 14,
        opacity: 0.8,
        marginBottom: 4,
        letterSpacing: 0.5,
        color: '#FFFFFF',
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    locationText: {
        fontSize: 22,
        fontWeight: '800',
        letterSpacing: -0.5,
        color: '#FFFFFF',
    },
    searchContainer: {
        width: '100%',
    }
});
