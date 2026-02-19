import { BUSINESS_QUERY_KEYS, GET_BUSINESSES_LIST } from '@/apis/business';
import BusinessCard from '@/components/business/BusinessCard';
import { BusinessRegistration } from '@/components/business/BusinessRegistration';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { DrawerActions } from '@react-navigation/native';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useNavigation } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function BusinessScreen() {
    const { theme, isDark } = useTheme();
    const { user } = useAuth();
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const colors = Colors[theme];

    const [activeTab, setActiveTab] = useState<'find' | 'portal'>('find');
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const {
        data: infiniteData,
        isLoading: queryLoading,
        isRefetching,
        hasNextPage,
        fetchNextPage,
        isFetchingNextPage,
        refetch
    } = useInfiniteQuery({
        queryKey: BUSINESS_QUERY_KEYS.list({ search: debouncedSearch || undefined }),
        queryFn: ({ pageParam = 1 }) => GET_BUSINESSES_LIST({
            search: debouncedSearch || undefined,
            currentPage: pageParam
        }),
        getNextPageParam: (lastPage: any, allPages: any[]) => {
            const pagination = lastPage?.pagination;
            if (pagination && pagination.currentPage < pagination.totalPages) {
                return pagination.currentPage + 1;
            }
            // Fallback for security
            const currentData = lastPage?.data;
            if (Array.isArray(currentData) && currentData.length === 20) {
                return (Array.isArray(allPages) ? allPages.length : 0) + 1;
            }
            return undefined;
        },
        initialPageParam: 1,
        enabled: activeTab === 'find',
    });

    const businesses = (infiniteData as any)?.pages?.flatMap((page: any) => Array.isArray(page?.data) ? page.data : []) || [];
    const loading = queryLoading || isRefetching;

    const handleRefresh = () => {
        refetch();
    };

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

    const renderItem = React.useCallback(({ item }: { item: any }) => <BusinessCard business={item} />, []);
    const keyExtractor = React.useCallback((item: any) => item._id, []);

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header with Primary Color Background */}
            <View style={[styles.headerContainer, { backgroundColor: colors.primary, paddingTop: insets.top + 20 }]}>
                <View style={styles.headerContent}>
                    {/* Top Row: Menu & Title & Profile */}
                    <TouchableOpacity
                        onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
                        style={styles.iconButton}
                    >
                        <Ionicons name="grid-outline" size={20} color="#FFFFFF" />
                    </TouchableOpacity>

                    <ThemedText style={styles.headerTitle}>Business Directory</ThemedText>

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

                {/* Search Bar - Only visible when on 'find' tab */}
                {activeTab === 'find' && (
                    <View style={styles.searchContainer}>
                        <View style={styles.searchBar}>
                            <Ionicons name="search" size={20} color="#94A3B8" />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Search mechanic, shop, area..."
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
                )}

                {/* Filter Chips */}
                <View style={styles.filterContainer}>
                    <TouchableOpacity
                        style={[styles.filterChip, activeTab === 'find' && styles.activeFilterChip]}
                        onPress={() => setActiveTab('find')}
                    >
                        <ThemedText style={[
                            styles.filterText,
                            activeTab === 'find' && [styles.activeFilterText, { color: colors.primary }]
                        ]}>
                            Find Service
                        </ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.filterChip, activeTab === 'portal' && styles.activeFilterChip]}
                        onPress={() => setActiveTab('portal')}
                    >
                        <ThemedText style={[
                            styles.filterText,
                            activeTab === 'portal' && [styles.activeFilterText, { color: colors.primary }]
                        ]}>
                            My Business
                        </ThemedText>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Find Service Section */}
            <View style={[styles.content, { display: activeTab === 'find' ? 'flex' : 'none' }]}>
                {/* Listing */}
                {loading && businesses.length === 0 ? (
                    <View style={styles.loaderContainer}>
                        <ActivityIndicator size="large" color={colors.primary} />
                    </View>
                ) : (
                    <FlatList
                        data={businesses}
                        renderItem={renderItem}
                        keyExtractor={keyExtractor}
                        contentContainerStyle={styles.listContent}
                        onRefresh={handleRefresh}
                        refreshing={loading && !isFetchingNextPage}
                        onEndReached={() => {
                            if (hasNextPage && !isFetchingNextPage) {
                                fetchNextPage();
                            }
                        }}
                        onEndReachedThreshold={0.5}
                        ListFooterComponent={
                            isFetchingNextPage ? (
                                <View style={{ paddingVertical: 20 }}>
                                    <ActivityIndicator color={colors.primary} />
                                </View>
                            ) : hasNextPage ? null : businesses.length > 0 ? (
                                <ThemedText style={{ textAlign: 'center', color: '#94a3b8', fontSize: 12, paddingVertical: 20 }}>
                                    End of directory
                                </ThemedText>
                            ) : null
                        }
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Ionicons name="business-outline" size={64} color={colors.icon} />
                                <ThemedText style={[styles.emptyText, { color: colors.text }]}>No businesses found.</ThemedText>
                                <ThemedText style={[styles.emptySubText, { color: colors.icon }]}>Try adjusting your search criteria</ThemedText>
                            </View>
                        }
                    />
                )}
            </View>

            {/* My Business Section (Portal) */}
            <View style={{ flex: 1, display: activeTab === 'portal' ? 'flex' : 'none' }}>
                <BusinessRegistration />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    headerContainer: {
        paddingBottom: 20,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
        zIndex: 10,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginBottom: 30,
    },
    iconButton: {
        width: 38,
        height: 38,
        borderRadius: 11,
        backgroundColor: 'rgba(255,255,255,0.2)',
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
        overflow: 'hidden',
    },
    profileImage: {
        width: '100%',
        height: '100%',
        borderRadius: 17,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    searchContainer: {
        paddingHorizontal: 20,
        paddingBottom: 16,
    },
    searchBar: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        height: 44,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 15,
        color: '#0F172A',
    },
    filterContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        gap: 12,
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
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
        fontSize: 13,
        fontWeight: '600',
    },
    activeFilterText: {
        fontWeight: '700',
    },
    content: {
        flex: 1,
    },
    listContent: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 100,
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 40,
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 60,
    },
    emptyText: {
        marginTop: 16,
        color: '#64748B',
        fontSize: 18,
        fontWeight: '700',
    },
    emptySubText: {
        marginTop: 6,
        color: '#94A3B8',
        fontSize: 14,
    }
});

