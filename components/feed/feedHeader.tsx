import { NotificationIcon } from '@/components/common/NotificationIcon';
import { ThemedText } from '@/components/themedText';
import Avatar from '@/components/ui/avatar';
import { Layout } from '@/constants/layout';
import { Ionicons } from '@expo/vector-icons';
import { DrawerActions } from '@react-navigation/native';
import { Image } from 'expo-image';
import React, { useRef } from 'react';
import { Platform, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { usePostCategories } from '@/hooks/useConfiguration';

interface FeedHeaderProps {
    colors: any;
    insets: any;
    navigation: any;
    user: any;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    selectedType: string | null;
    setSelectedType: (type: string | null) => void;
    onCreatePost?: () => void;
    containerStyle?: any;
    onSearch?: (query: string) => void;
    onFilterChange?: (type: string | null) => void;
}

export const FeedHeader: React.FC<FeedHeaderProps> = React.memo(({
    colors,
    insets,
    navigation,
    user,
    searchQuery,
    setSearchQuery,
    selectedType,
    setSelectedType,
    onCreatePost,
    containerStyle,
    onSearch,
    onFilterChange,
}) => {
    const inputRef = useRef<TextInput>(null);
    const { data: categoriesData } = usePostCategories();
    const categories = categoriesData?.data?.data || [];

    return (
        <View style={[styles.headerContainer, { backgroundColor: colors.primary, paddingTop: insets.top + (Platform.OS === 'android' ? 16 : 20) }, containerStyle]}>
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

                    {user?.user?.role === 'APP_ADMIN' && (
                        <TouchableOpacity
                            onPress={onCreatePost}
                            style={[styles.iconButton, { marginRight: 12 }]}
                        >
                            <Ionicons name="add-circle-outline" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                    )}

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
            <TouchableOpacity
                activeOpacity={1}
                onPress={() => inputRef.current?.focus()}
                style={styles.searchContainer}
            >
                <View style={styles.searchBar} pointerEvents="box-none">
                    <Ionicons name="search" size={20} color="#94A3B8" />
                    <TextInput
                        ref={inputRef}
                        style={styles.searchInput}
                        placeholder="Search posts..."
                        placeholderTextColor="#94A3B8"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        onSubmitEditing={() => onSearch?.(searchQuery)}
                        returnKeyType="search"
                        clearButtonMode="while-editing"
                    />
                </View>
            </TouchableOpacity>

            {/* Type Filter Chips */}
            <View style={styles.filterWrapper}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filterScrollContent}
                >
                    {/* All Chip */}
                    <TouchableOpacity
                        style={[
                            styles.filterChip,
                            !selectedType && styles.activeFilterChip
                        ]}
                        onPress={() => {
                            setSelectedType(null);
                            onFilterChange?.(null);
                        }}
                    >
                        <View style={styles.chipIconColumn}>
                            <Ionicons
                                name="apps-outline"
                                size={18}
                                color={!selectedType ? colors.primary : "#FFFFFF"}
                            />
                        </View>
                        <View style={styles.chipTextColumn}>
                            <ThemedText style={[
                                styles.filterText,
                                !selectedType && [styles.activeFilterText, { color: colors.primary }]
                            ]}>
                                All
                            </ThemedText>
                        </View>
                    </TouchableOpacity>

                    {/* Dynamic Category Chips */}
                    {categories.map((cat: any) => (
                        <TouchableOpacity
                            key={cat.name}
                            style={[
                                styles.filterChip,
                                selectedType === cat.name && styles.activeFilterChip
                            ]}
                            onPress={() => {
                                setSelectedType(cat.name);
                                onFilterChange?.(cat.name);
                            }}
                        >
                            <View style={styles.chipIconColumn}>
                                <Image
                                    source={{ uri: cat.icon }}
                                    style={styles.chipIcon}
                                    contentFit="contain"
                                />
                            </View>
                            <View style={styles.chipTextColumn}>
                                <ThemedText style={[
                                    styles.filterText,
                                    selectedType === cat.name && [styles.activeFilterText, { color: colors.primary }]
                                ]}>
                                    {cat.name}
                                </ThemedText>
                            </View>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>
        </View>
    );
});

const styles = StyleSheet.create({
    headerContainer: {
        paddingBottom: Platform.OS === 'android' ? 16 : 20,
        borderBottomLeftRadius: Layout.headerBorderRadius,
        borderBottomRightRadius: Layout.headerBorderRadius,
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
        borderRadius: Layout.borderRadius,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Platform.OS === 'android' ? 14 : 16,
        height: Platform.OS === 'android' ? 40 : 48,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: Platform.OS === 'android' ? 13 : 15,
        color: '#0F172A',
        height: '100%',
    },
    filterWrapper: {
        marginTop: 4,
    },
    filterScrollContent: {
        paddingHorizontal: Platform.OS === 'android' ? 18 : 20,
        gap: 10,
    },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 38,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.25)',
        overflow: 'hidden',
        marginRight: 2,
    },
    activeFilterChip: {
        backgroundColor: '#FFFFFF',
        borderColor: '#FFFFFF',
    },
    chipIconColumn: {
        width: 30,
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    chipIcon: {
        width: 22,
        height: 22,
    },
    chipTextColumn: {
        paddingRight: 14,
        paddingLeft: 4,
        justifyContent: 'center',
        alignItems: 'center',
    },
    filterText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
    },
    activeFilterText: {
        fontWeight: '700',
    }
});
