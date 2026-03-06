import { NotificationIcon } from '@/components/common/notificationIcon';
import { ThemedText } from '@/components/themedText';
import Avatar from '@/components/ui/avatar';
import { Ionicons } from '@expo/vector-icons';
import { DrawerActions } from '@react-navigation/native';
import React from 'react';
import { Platform, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

interface FeedHeaderProps {
    colors: any;
    insets: any;
    navigation: any;
    user: any;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    selectedType: string | null;
    setSelectedType: (type: string | null) => void;
}

export const FeedHeader: React.FC<FeedHeaderProps> = React.memo(({
    colors,
    insets,
    navigation,
    user,
    searchQuery,
    setSearchQuery,
    selectedType,
    setSelectedType
}) => {
    return (
        <View style={[styles.headerContainer, { backgroundColor: colors.primary, paddingTop: insets.top + (Platform.OS === 'android' ? 16 : 20) }]}>
            <View style={styles.headerTopRow}>
                <TouchableOpacity
                    onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
                    style={styles.iconButton}
                >
                    <Ionicons name="grid-outline" size={20} color="#FFFFFF" />
                </TouchableOpacity>

                <View style={styles.rightActions}>
                    <NotificationIcon
                        containerStyle={{ marginRight: 12 }}
                        badgeStyle={{ borderColor: colors.primary }}
                    />

                    <TouchableOpacity
                        onPress={() => navigation.navigate('profile' as never)}
                        style={styles.profileButton}
                    >
                        <Avatar
                            uri={user?.user?.profileImage}
                            name={user?.user?.name}
                            size={34}
                        />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <View style={styles.searchBar}>
                    <Ionicons name="search" size={20} color="#94A3B8" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search posts, discussions..."
                        placeholderTextColor="#94A3B8"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={20} color="#94A3B8" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Type Filter Chips */}
            <View style={styles.filterContainer}>
                {['ALL', 'GENERAL', 'DEATH', 'ACCIDENT'].map((type) => (
                    <TouchableOpacity
                        key={type}
                        style={[
                            styles.filterChip,
                            (selectedType === type || (!selectedType && type === 'ALL')) && styles.activeFilterChip
                        ]}
                        onPress={() => setSelectedType(type === 'ALL' ? null : type)}
                    >
                        <ThemedText style={[
                            styles.filterText,
                            (selectedType === type || (!selectedType && type === 'ALL')) && [styles.activeFilterText, { color: colors.primary }]
                        ]}>
                            {type.charAt(0) + type.slice(1).toLowerCase()}
                        </ThemedText>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
});

const styles = StyleSheet.create({
    headerContainer: {
        paddingBottom: Platform.OS === 'android' ? 16 : 20,
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        zIndex: 10,
    },
    headerTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Platform.OS === 'android' ? 18 : 20,
        marginBottom: Platform.OS === 'android' ? 18 : 20,
    },
    iconButton: {
        width: 38,
        height: 38,
        borderRadius: 11,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    rightActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    profileButton: {
        width: 38,
        height: 38,
        borderRadius: 19,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    searchContainer: {
        paddingHorizontal: Platform.OS === 'android' ? 18 : 20,
        paddingBottom: Platform.OS === 'android' ? 14 : 16,
    },
    searchBar: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Platform.OS === 'android' ? 14 : 16,
        height: Platform.OS === 'android' ? 40 : 48,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: Platform.OS === 'android' ? 13 : 15,
        color: '#0F172A',
    },
    filterContainer: {
        flexDirection: 'row',
        paddingHorizontal: Platform.OS === 'android' ? 18 : 20,
        gap: Platform.OS === 'android' ? 10 : 12,
    },
    filterChip: {
        paddingHorizontal: Platform.OS === 'android' ? 14 : 16,
        paddingVertical: Platform.OS === 'android' ? 6 : 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    activeFilterChip: {
        backgroundColor: '#FFFFFF',
        borderColor: '#FFFFFF',
    },
    filterText: {
        color: '#FFFFFF',
        fontSize: Platform.OS === 'android' ? 11 : 13,
        fontWeight: '600',
    },
    activeFilterText: {
        fontWeight: '700',
    }
});
