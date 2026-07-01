import React, { useState, useCallback, memo, useRef, useEffect, useMemo } from 'react';
import { StyleSheet, View, TouchableOpacity, FlatList, ActivityIndicator, Platform } from 'react-native';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { ThemedText } from '@/components/ThemedText';
import { useQuery } from '@tanstack/react-query';
import { getAuthenticatedConfiguration, CONFIG_QUERY_KEYS } from '@/apis/configuration';
import { MarketplaceCard } from '@/components/marketplace/MarketplaceCard';
import { MarketplaceCategoryPicker } from '@/components/marketplace/MarketplaceCategoryPicker';
import { useInfiniteMarketplace, useInfiniteMyMarketplace } from '@/hooks/useMarketplace';
import { ScreenHeader, HeaderIconBtn } from '@/components/common/ScreenHeader';
import { SearchBar } from '@/components/common/SearchBar';

const MarketplaceScreen = memo(function MarketplaceScreen() {
    const router = useRouter();
    const { theme } = useTheme();
    const colors = Colors[theme];
    const insets = useSafeAreaInsets();

    // Fetch categories configuration dynamically
    const { data: configData, refetch: refetchCategories } = useQuery({
        queryKey: CONFIG_QUERY_KEYS.marketplaceCategories,
        queryFn: () => getAuthenticatedConfiguration('MARKETPLACE_CATEGORIES'),
        staleTime: 1000 * 60 * 60 * 12, // 24 hours
    });

    useFocusEffect(
        useCallback(() => {
            refetchCategories();
        }, [refetchCategories])
    );

    const tabs = useMemo(() => {
        const baseTabs = [
            { id: '', label: 'All Items' }
        ];

        let apiCats: any[] = [];
        if (configData) {
            if (Array.isArray(configData)) apiCats = configData;
            else if (Array.isArray(configData.data)) apiCats = configData.data;
            else if (Array.isArray(configData.data?.data)) apiCats = configData.data.data;
        }
        const dynamicCats = apiCats.map((cat: any) => ({
            id: cat.title.en,
            label: cat.title.en
        }));
        return [...baseTabs, ...dynamicCats];
    }, [configData]);

    const [selectedTab, setSelectedTab] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // Multi-select filters states
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [selectedItems, setSelectedItems] = useState<string[]>([]);
    const [isFilterVisible, setIsFilterVisible] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Construct filters based on selected tab and search
    const isMineTab = selectedTab === 'mine';

    const marketplaceFilters = useMemo(() => {
        if (isMineTab) {
            return {};
        }
        return {
            category: selectedCategories.length === 0 && selectedTab ? selectedTab : undefined,
            categories: selectedCategories.length > 0 ? selectedCategories.join(',') : undefined,
            types: selectedItems.length > 0 ? selectedItems.join(',') : undefined,
            search: debouncedSearch || undefined,
        };
    }, [selectedTab, debouncedSearch, isMineTab, selectedCategories, selectedItems]);

    // Use appropriate infinite query depending on selected tab (public list or personal listings)
    const publicQuery = useInfiniteMarketplace(marketplaceFilters);
    const personalQuery = useInfiniteMyMarketplace({ status: undefined }); // Fetch all my listings

    const activeQuery = isMineTab ? personalQuery : publicQuery;

    const {
        data: infiniteData,
        isLoading,
        refetch,
        isRefetching,
        hasNextPage,
        fetchNextPage,
        isFetchingNextPage
    } = activeQuery;

    const listings = useMemo(() => {
        return infiniteData?.pages?.flatMap(page => Array.isArray(page?.data) ? page.data : []) || [];
    }, [infiniteData]);

    const handleEdit = useCallback((item: any) => {
        router.push({
            pathname: '/listing/create',
            params: { listing: JSON.stringify(item) }
        });
    }, [router]);

    const handleEndReached = useCallback(() => {
        if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    const handleRefresh = useCallback(async () => {
        try {
            await Promise.all([
                refetchCategories(),
                refetch()
            ]);
        } catch (error) {
            console.log("Error during refresh:", error);
        }
    }, [refetchCategories, refetch]);

    const renderFooter = useCallback(() => {
        if (isFetchingNextPage) {
            return (
                <View style={{ paddingVertical: 20 }}>
                    <ActivityIndicator color={colors.primary} />
                </View>
            );
        }
        if (!hasNextPage && listings.length > 0) {
            return (
                <ThemedText style={{ textAlign: 'center', color: '#94a3b8', fontSize: 12, paddingVertical: 20 }}>
                    That's all
                </ThemedText>
            );
        }
        return null;
    }, [isFetchingNextPage, hasNextPage, listings.length, colors.primary]);


    const renderItem = useCallback(({ item }: { item: any }) => {
        const otherItems = listings.filter((l: any) => l._id !== item._id).slice(0, 4);
        return (
            <MarketplaceCard
                item={item}
                otherItems={otherItems}
                colors={colors}
                onEdit={handleEdit}
                showActions={isMineTab}
            />
        );
    }, [colors, handleEdit, isMineTab, listings]);

    const renderTabItem = useCallback(({ item }: { item: any }) => {
        const isActive = selectedTab === item.id && selectedCategories.length === 0;
        return (
            <TouchableOpacity
                style={[
                    styles.tab,
                    { borderColor: colors.border },
                    isActive && { backgroundColor: colors.primary, borderColor: colors.primary }
                ]}
                onPress={() => {
                    setSelectedTab(item.id);
                    setSelectedCategories([]);
                    setSelectedItems([]);
                }}
            >
                <ThemedText style={[
                    styles.tabText,
                    { color: isActive ? '#FFF' : colors.textSecondary }
                ]}>
                    {item.label}
                </ThemedText>
            </TouchableOpacity>
        );
    }, [selectedTab, colors, selectedCategories]);


    const hasActiveFilters = selectedCategories.length > 0 || selectedItems.length > 0;


    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <ScreenHeader
                rightActions={
                    <HeaderIconBtn
                        name="add"
                        size={22}
                        onPress={() => router.push('/listing/create')}
                    />
                }
            >
                {/* Search Bar & filters */}
                <View style={styles.searchSection}>
                    <View style={styles.searchRow}>
                        <SearchBar
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholder="Search marketplace..."
                            style={{ flex: 1 }}
                        />
                        <TouchableOpacity
                            style={[styles.filterButton, { backgroundColor: hasActiveFilters ? '#10B981' : 'rgba(255, 255, 255, 0.15)' }]}
                            onPress={() => setIsFilterVisible(true)}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="funnel-outline" size={20} color="#FFFFFF" />
                            {hasActiveFilters && (
                                <View style={styles.filterBadge}>
                                    <ThemedText style={styles.filterBadgeText}>
                                        {selectedCategories.length + selectedItems.length}
                                    </ThemedText>
                                </View>
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.filterButton, { backgroundColor: isMineTab ? '#10B981' : 'rgba(255, 255, 255, 0.15)' }]}
                            onPress={() => {
                                if (isMineTab) {
                                    setSelectedTab('');
                                } else {
                                    setSelectedTab('mine');
                                }
                                setSelectedCategories([]);
                                setSelectedItems([]);
                            }}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="list-outline" size={20} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>
                </View>
            </ScreenHeader>

            {/* Category Filter Tabs */}
            {!isMineTab && (
                <View style={styles.tabsContainer}>
                    <FlatList
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        data={tabs}
                        keyExtractor={(item) => item.id}
                        renderItem={renderTabItem}
                        contentContainerStyle={styles.tabsList}
                    />
                </View>
            )}

            {/* Active multi-filter indicators row */}
            {hasActiveFilters && (
                <View style={styles.activeFiltersRow}>
                    <ThemedText style={[styles.activeFiltersTitle, { color: colors.textSecondary }]}>
                        Active Filters:
                    </ThemedText>
                    <TouchableOpacity
                        style={[styles.clearFiltersBtn, { borderColor: colors.primary }]}
                        onPress={() => {
                            setSelectedCategories([]);
                            setSelectedItems([]);
                        }}
                    >
                        <ThemedText style={{ color: colors.primary, fontSize: 11, fontWeight: '700' }}>
                            Clear All
                        </ThemedText>
                    </TouchableOpacity>
                </View>
            )}

            {/* Listings Grid/List */}
            {isLoading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={listings}
                    renderItem={renderItem}
                    keyExtractor={(item: any) => item._id}
                    numColumns={2}
                    columnWrapperStyle={{ gap: 12 }}
                    contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 80, flexGrow: 1, paddingTop: isMineTab ? 20 : 0 }]}
                    onEndReached={handleEndReached}
                    onEndReachedThreshold={0.5}
                    ListFooterComponent={renderFooter}
                    refreshing={isRefetching}
                    onRefresh={handleRefresh}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={() => (
                        <View style={[styles.centered, { flex: 1, marginTop: 100 }]}>
                            <Ionicons name="cart-outline" size={64} color="#CBD5E1" />
                            <ThemedText style={{ color: colors.textSecondary, marginTop: 12, fontSize: 16 }}>
                                No items found
                            </ThemedText>
                        </View>
                    )}
                />
            )}

            {/* Multi-select filter categories picker */}
            <MarketplaceCategoryPicker
                visible={isFilterVisible}
                onClose={() => setIsFilterVisible(false)}
                currentCategory={selectedCategories[0]}
                currentType={selectedItems[0]}
                onSelect={({ category, type }) => {
                    if (category.en === 'All') {
                        setSelectedCategories([]);
                        setSelectedItems([]);
                    } else {
                        setSelectedCategories([category.en]);
                        setSelectedItems([type.en]);
                        setSelectedTab(''); // Reset single horizontal tab
                    }
                }}
            />
        </View>
    );
});

export default MarketplaceScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerContainer: {
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        paddingBottom: Platform.OS === 'android' ? 8 : 16,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Platform.OS === 'android' ? 18 : 20,
        marginBottom: Platform.OS === 'android' ? 18 : 20,
    },
    headerTitle: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    iconButton: {
        width: 38,
        height: 38,
        borderRadius: Layout.borderRadius,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
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
    searchSection: {
        paddingTop: Platform.OS === 'android' ? 2 : 4,
        paddingBottom: 8,
    },
    searchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    searchInputContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        height: 42,
        borderWidth: 1,
        borderRadius: 22,
        paddingHorizontal: 16,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        paddingVertical: 8,
    },
    filterButton: {
        width: 42,
        height: 42,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    filterBadge: {
        position: 'absolute',
        top: -2,
        right: -2,
        backgroundColor: '#EF4444',
        borderRadius: 9,
        width: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#FFFFFF',
    },
    filterBadgeText: {
        color: '#FFFFFF',
        fontSize: 8,
        fontWeight: 'bold',
    },
    tabsContainer: {
        paddingVertical: 12,
    },
    tabsList: {
        paddingHorizontal: 16,
    },
    tab: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        marginRight: 8,
    },
    tabText: {
        fontSize: 12,
        fontWeight: '700',
    },
    activeFiltersRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        marginBottom: 8,
    },
    activeFiltersTitle: {
        fontSize: 12,
        fontWeight: '700',
    },
    clearFiltersBtn: {
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 3,
    },
    listContent: {
        paddingHorizontal: 16,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
});
