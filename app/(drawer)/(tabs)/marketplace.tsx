import React, { useState, useCallback, memo, useRef, useEffect, useMemo } from 'react';
import { StyleSheet, View, TouchableOpacity, Platform, RefreshControl } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Stack, useFocusEffect, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { ThemedText } from '@/components/ThemedText';
import { MarketplaceCard } from '@/components/marketplace/MarketplaceCard';
import { MarketplaceCategoryPicker } from '@/components/marketplace/MarketplaceCategoryPicker';
import { MarketplaceListSkeleton } from '@/components/marketplace/MarketplaceScreenSkeleton';
import { useMarketplaceAPI } from '@/hooks/useMarketplaceAPI';
import { ScreenHeader, HeaderIconBtn } from '@/components/common/ScreenHeader';
import { SearchBar } from '@/components/common/SearchBar';
import NativeAd from '@/ads/components/NativeAd';
import { PillsList } from '@/components/common/PillsList';
import { LoadingDots } from '@/components/common/LoadingDots';
import { useMarketplaceStore } from '@/store/marketplaceStore';

const EmptyMarketplace = memo(({ colors }: { colors: any }) => (
    <View style={[styles.centered, { flex: 1, marginTop: 100 }]}>
        <Ionicons name="cart-outline" size={64} color="#CBD5E1" />
        <ThemedText style={{ color: colors.textSecondary, marginTop: 12, fontSize: 13.5 }}>
            No items found
        </ThemedText>
    </View>
));

EmptyMarketplace.displayName = 'EmptyMarketplace';

const MarketplaceScreen = memo(function MarketplaceScreen() {
    const router = useRouter();
    const { theme } = useTheme();
    const colors = Colors[theme];
    const insets = useSafeAreaInsets();

    const [selectedTab, setSelectedTab] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    const params = useLocalSearchParams();

    useEffect(() => {
        if (params.tab === 'mine') {
            setSelectedTab('mine');
        }
    }, [params.tab]);

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

    const {
        categoriesConfigQuery,
        infiniteQuery,
        myListQuery } = useMarketplaceAPI({
        filters: marketplaceFilters,
        isMineTab });

    const { data: configData, refetch: refetchCategories } = categoriesConfigQuery;

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

    const activeQuery = isMineTab ? myListQuery : infiniteQuery;

    const {
        data: infiniteData,
        isLoading,
        refetch,
        isRefetching,
        hasNextPage,
        fetchNextPage,
        isFetchingNextPage
    } = activeQuery;

    useFocusEffect(
        useCallback(() => {
            refetchCategories();
            refetch();
        }, [refetchCategories, refetch])
    );

    const rawListings = useMemo(() => {
        return infiniteData?.pages?.flatMap(page => Array.isArray(page?.data) ? page.data : []) || [];
    }, [infiniteData]);

    // Feed the global store so the details screen can derive Similar Items
    // without relying on navigation params.
    const setMarketItems = useMarketplaceStore((s) => s.setItems);
    useEffect(() => {
        if (!isMineTab && rawListings.length) {
            setMarketItems(rawListings);
        }
    }, [rawListings, isMineTab, setMarketItems]);

    const listingsRows = useMemo(() => {
        const rows: any[] = [];
        const adInterval = 6;
        let currentRow: any[] = [];

        rawListings.forEach((item: any, index: number) => {
            currentRow.push(item);

            if (currentRow.length === 2 || index === rawListings.length - 1) {
                rows.push({ _id: `row-${index}`, isRow: true, items: currentRow });
                currentRow = [];
            }

            if ((index + 1) % adInterval === 0 && index !== rawListings.length - 1) {
                rows.push({ _id: `ad-${index}`, isAd: true });
            }
        });
        return rows;
    }, [rawListings]);

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
                    <LoadingDots />
                </View>
            );
        }
        if (!hasNextPage && rawListings.length > 0) {
            return (
                <ThemedText style={{ textAlign: 'center', color: colors.placeholder, fontSize: 10.5, fontWeight: '600', letterSpacing: 0.4, paddingVertical: 16 }}>
                    {"You're all caught up"}
                </ThemedText>
            );
        }
        return null;
    }, [isFetchingNextPage, hasNextPage, rawListings.length, colors.placeholder]);


    const renderItem = useCallback(({ item }: { item: any }) => {
        if (item.isAd) {
            return (
                <View style={{ width: '100%', paddingVertical: 2 }}>
                    <NativeAd placement="marketplace-feed" />
                </View>
            );
        }

        return (
            <View style={{ flexDirection: 'row', gap: 14, marginBottom: 6 }}>
                {item.items.map((subItem: any) => {
                    return (
                        <View key={subItem._id} style={{ flex: 1 }}>
                            <MarketplaceCard
                                item={subItem}
                                colors={colors}
                                onEdit={handleEdit}
                                showActions={isMineTab}
                            />
                        </View>
                    );
                })}
                {item.items.length === 1 && <View style={{ flex: 1 }} />}
            </View>
        );
    }, [colors, handleEdit, isMineTab]);


    const hasActiveFilters = selectedCategories.length > 0 || selectedItems.length > 0;


    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <ScreenHeader
                decor="marketplace"
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
                            style={[styles.filterButton, { backgroundColor: hasActiveFilters ? colors.lime : 'rgba(255, 255, 255, 0.15)' }]}
                            onPress={() => setIsFilterVisible(true)}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="funnel-outline" size={20} color="#FFFFFF" />
                            {hasActiveFilters && (
                                <View style={styles.filterBadge}>
                                    <ThemedText style={styles.filterBadgeText}>
                                        1
                                    </ThemedText>
                                </View>
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.filterButton, { backgroundColor: isMineTab ? colors.lime : 'rgba(255, 255, 255, 0.15)' }]}
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
                <PillsList
                    data={tabs}
                    selectedId={selectedCategories.length === 0 ? selectedTab : ''}
                    onSelect={(id) => {
                        setSelectedTab(id);
                        setSelectedCategories([]);
                        setSelectedItems([]);
                    }}
                />
            )}

            {/* Active multi-filter indicators row */}
            {hasActiveFilters && (
                <View style={styles.activeFiltersRow}>
                    <ThemedText style={[styles.activeFiltersTitle, { color: colors.textSecondary }]}>
                        Active Filters:
                    </ThemedText>
                    <TouchableOpacity
                        style={[styles.clearFiltersBtn, { backgroundColor: colors.card }]}
                        onPress={() => {
                            setSelectedItems([]);
                        }}
                    >
                        <ThemedText style={{ color: colors.primary, fontSize: 10, fontWeight: '700' }}>
                            Clear All
                        </ThemedText>
                    </TouchableOpacity>
                </View>
            )}

            {/* Listings Grid/List */}
            {isLoading ? (
                <MarketplaceListSkeleton />
            ) : (
                <View style={{ flex: 1 }}>
                    <FlashList
                        data={listingsRows}
                        renderItem={renderItem as any}
                        keyExtractor={(item: any) => item._id}
                        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 80, paddingTop: isMineTab ? 20 : 0 }]}
                        onEndReached={handleEndReached}
                        onEndReachedThreshold={0.5}
                        ListFooterComponent={renderFooter}
                        refreshControl={
                            <RefreshControl
                                refreshing={isRefetching}
                                onRefresh={handleRefresh}
                                tintColor={colors.primary}
                                colors={[colors.primary]}
                            />
                        }
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={<EmptyMarketplace colors={colors} />}
                    />
                </View>
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
        flex: 1 },
    headerContainer: {
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
        paddingBottom: Platform.OS === 'android' ? 8 : 16 },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Platform.OS === 'android' ? 18 : 20,
        marginBottom: Platform.OS === 'android' ? 18 : 20 },
    headerTitle: {
        color: '#FFFFFF',
        fontSize: 15.5,
        fontWeight: 'bold' },
    iconButton: {
        width: 38,
        height: 38,
        borderRadius: Layout.borderRadius,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)' },
    rightActions: {
        flexDirection: 'row',
        alignItems: 'center' },
    profileButton: {
        width: 38,
        height: 38,
        borderRadius: Layout.borderRadius,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden' },
    searchSection: {
        paddingTop: Platform.OS === 'android' ? 2 : 4,
        paddingBottom: 14 },
    searchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8 },
    searchInputContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        height: 42,
        borderRadius: Layout.borderRadius,
        paddingHorizontal: 13 },
    searchInput: {
        flex: 1,
        fontSize: 12.5,
        paddingVertical: 7 },
    filterButton: {
        width: 42,
        height: 42,
        borderRadius: Layout.borderRadius,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative' },
    filterBadge: {
        position: 'absolute',
        top: -2,
        right: -2,
        backgroundColor: '#EF4444',
        borderRadius: Layout.borderRadius,
        width: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center' },
    filterBadgeText: {
        color: '#FFFFFF',
        fontSize: 9,
        fontWeight: 'bold',
        textAlign: 'center',
        lineHeight: 12,
        includeFontPadding: false },
    activeFiltersRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 13,
        marginBottom: 8 },
    activeFiltersTitle: {
        fontSize: 10.5,
        fontWeight: '700' },
    clearFiltersBtn: {
        borderRadius: Layout.borderRadius,
        paddingHorizontal: 8,
        paddingVertical: 3 },
    listContent: {
        paddingHorizontal: 13,
        paddingTop: 14 },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16 } });
