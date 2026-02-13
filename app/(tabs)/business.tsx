import { Ionicons } from '@expo/vector-icons';
import { useInfiniteQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import { BUSINESS_QUERY_KEYS, GET_BUSINESSES_LIST } from '@/apis/business';
import BusinessCard from '@/components/BusinessCard';
import BusinessRegistration from '@/components/BusinessRegistration';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { LiquidGlassLoader } from '@/components/ui/LiquidGlassLoader';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';

export default function BusinessScreen() {
    const { theme, isDark } = useTheme();
    const colors = Colors[theme];

    const [activeTab, setActiveTab] = useState<'find' | 'portal'>('find');
    const [searchQuery, setSearchQuery] = useState('');
    const [appliedSearch, setAppliedSearch] = useState('');

    const {
        data: infiniteData,
        isLoading: queryLoading,
        isRefetching,
        hasNextPage,
        fetchNextPage,
        isFetchingNextPage,
        refetch
    } = useInfiniteQuery({
        queryKey: BUSINESS_QUERY_KEYS.list({ search: appliedSearch || undefined }),
        queryFn: ({ pageParam = 1 }) => GET_BUSINESSES_LIST({
            search: appliedSearch || undefined,
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

    const handleSearch = () => {
        setAppliedSearch(searchQuery);
    };

    const handleRefresh = () => {
        refetch();
    };

    const renderItem = React.useCallback(({ item }: { item: any }) => <BusinessCard business={item} />, []);
    const keyExtractor = React.useCallback((item: any) => item._id, []);

    return (
        <ThemedView style={styles.container}>
            {/* Tab Switcher - Redesigned with Glass UI */}
            <View style={styles.tabOuterContainer}>
                <LinearGradient
                    colors={isDark
                        ? ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.03)']
                        : ['rgba(15, 23, 42, 0.08)', 'rgba(15, 23, 42, 0.03)']}
                    style={styles.tabGlassContainer}
                >
                    <TouchableOpacity
                        style={[styles.tab]}
                        onPress={() => setActiveTab('find')}
                        activeOpacity={0.8}
                    >
                        {activeTab === 'find' && (
                            <LinearGradient
                                colors={[Colors[theme].secondary, '#FF8E3D']}
                                style={styles.activeTabIndicator}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            />
                        )}
                        <Ionicons
                            name="search"
                            size={16}
                            color={activeTab === 'find' ? '#FFFFFF' : isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'}
                            style={{ marginRight: 6 }}
                        />
                        <ThemedText style={[
                            styles.tabText,
                            activeTab === 'find' && { color: '#FFFFFF', fontWeight: '800' }
                        ]}>
                            Find Service
                        </ThemedText>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.tab]}
                        onPress={() => setActiveTab('portal')}
                        activeOpacity={0.8}
                    >
                        {activeTab === 'portal' && (
                            <LinearGradient
                                colors={[Colors[theme].secondary, '#FF8E3D']}
                                style={styles.activeTabIndicator}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            />
                        )}
                        <Ionicons
                            name="business"
                            size={16}
                            color={activeTab === 'portal' ? '#FFFFFF' : isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'}
                            style={{ marginRight: 6 }}
                        />
                        <ThemedText style={[
                            styles.tabText,
                            activeTab === 'portal' && { color: '#FFFFFF', fontWeight: '800' }
                        ]}>
                            My Business
                        </ThemedText>
                    </TouchableOpacity>
                </LinearGradient>
            </View>

            {/* Find Service Section */}
            <View style={[styles.content, { display: activeTab === 'find' ? 'flex' : 'none' }]}>
                {/* Search Header */}
                <View style={[styles.searchSection, { backgroundColor: isDark ? '#1e293b' : '#0F172A' }]}>
                    <ThemedText style={styles.searchTitle}>Service Directory</ThemedText>
                    <View style={styles.searchRow}>
                        <View style={[styles.glassSearchInput, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)' }]}>
                            <Ionicons name="search" size={18} color="#94a3b8" />
                            <TextInput
                                placeholder="Search mechanic, shop, area..."
                                placeholderTextColor="#94a3b8"
                                style={styles.searchInput}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                onSubmitEditing={handleSearch}
                            />
                        </View>
                    </View>
                </View>

                {/* Listing */}
                {loading && businesses.length === 0 ? (
                    <View style={styles.loaderContainer}>
                        <LiquidGlassLoader />
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
                                    <ActivityIndicator color={colors.secondary} />
                                </View>
                            ) : hasNextPage ? null : businesses.length > 0 ? (
                                <ThemedText style={{ textAlign: 'center', color: '#94a3b8', fontSize: 12, paddingVertical: 20 }}>
                                    End of directory
                                </ThemedText>
                            ) : null
                        }
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Ionicons name="business-outline" size={64} color="#94a3b8" />
                                <ThemedText style={styles.emptyText}>No businesses found yet.</ThemedText>
                            </View>
                        }
                    />
                )}
            </View>

            {/* My Business Section (Portal) */}
            <View style={{ flex: 1, display: activeTab === 'portal' ? 'flex' : 'none' }}>
                <BusinessRegistration />
            </View>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    tabOuterContainer: {
        paddingHorizontal: 20,
        marginVertical: 16,
    },
    tabGlassContainer: {
        flexDirection: 'row',
        height: 52,
        borderRadius: 16,
        padding: 5,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        overflow: 'hidden',
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
        position: 'relative',
    },
    activeTabIndicator: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: 11,
    },
    tabText: {
        fontSize: 13,
        fontWeight: '600',
    },
    content: {
        flex: 1,
    },
    searchSection: {
        paddingTop: 10,
        paddingHorizontal: 20,
        paddingBottom: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        marginBottom: 8,
    },
    searchTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 12,
    },
    searchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    glassSearchInput: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        height: 48,
        borderRadius: 16,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    listContent: {
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 100,
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 60,
    },
    emptyText: {
        marginTop: 16,
        color: '#94a3b8',
        fontSize: 16,
        textAlign: 'center',
    },
});
