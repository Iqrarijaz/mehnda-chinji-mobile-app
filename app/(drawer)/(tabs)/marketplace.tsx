import React, { useState, useCallback, memo, useRef, useEffect, useMemo } from 'react';
import { StyleSheet, View, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Stack, useFocusEffect, useRouter, useLocalSearchParams } from 'expo-router';
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
import NativeAd from '@/ads/components/NativeAd';
import { PillsList } from '@/components/common/PillsList';
import { MarketplaceGridSkeleton } from '@/components/common/CardSkeletons';
import Animated, { FadeInDown } from 'react-native-reanimated';

const EmptyMarketplace = memo(({ colors }: { colors: any }) => (
    <Animated.View
        entering={FadeInDown.delay(80).springify().damping(16)}
        style={[styles.centered, { flex: 1, marginTop: 80 }]}
    >
        <View style={[styles.emptyIconWell, { backgroundColor: colors.cream }]}>
            <Ionicons name="cart-outline" size={36} color={colors.primary} />
        </View>
        <ThemedText style={[styles.emptyTitle, { color: colors.text }]}>
            No items found
        </ThemedText>
        <ThemedText style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            Try a different search or category,{'\n'}or be the first to list something!
        </ThemedText>
    </Animated.View>
));

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

    const rawListings = useMemo(() => {
        return infiniteData?.pages?.flatMap(page => Array.isArray(page?.data) ? page.data : []) || [];
    }, [infiniteData]);

    const listingsRows = useMemo(() => {
        const rows: any[] = [];
        const adInterval = 6;
        let currentRow: any[] = [];

        rawListings.forEach((item: any, index: number) => {
            const otherItems = rawListings.slice(0, 9).filter(l => l._id !== item._id).slice(0, 8);
            const minimalOtherItems = otherItems.map(i => ({
                _id: i._id,
                title: i.title,
                price: i.price,
                image: i.images?.[0],
                sellerId: i.sellerId?._id || i.sellerId
            }));
            const precomputedOtherItemsStr = minimalOtherItems.length > 0 ? JSON.stringify(minimalOtherItems) : undefined;
            
            currentRow.push({ ...item, precomputedOtherItemsStr });

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
                    <ActivityIndicator color={colors.primary} />
                </View>
            );
        }
        if (!hasNextPage && rawListings.length > 0) {
            return (
                <ThemedText style={{ textAlign: 'center', color: colors.textSecondary, fontSize: 12, paddingVertical: 20 }}>
                    You&apos;re all caught up
                </ThemedText>
            );
        }
        return null;
    }, [isFetchingNextPage, hasNextPage, rawListings.length, colors.primary, colors.textSecondary]);


    const renderItem = useCallback(({ item }: { item: any }) => {
        if (item.isAd) {
            return (
                <View style={{ width: '100%', paddingVertical: 2 }}>
                    <NativeAd placement="marketplace-feed" />
                </View>
            );
        }

        return (
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 2 }}>
                {item.items.map((subItem: any) => {
                    return (
                        <View key={subItem._id} style={{ flex: 1 }}>
                            <MarketplaceCard
                                item={subItem}
                                otherItemsStr={subItem.precomputedOtherItemsStr}
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
                            style={[styles.filterButton, { backgroundColor: hasActiveFilters ? '#7BC043' : 'rgba(255, 255, 255, 0.15)' }]}
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
                            style={[styles.filterButton, { backgroundColor: isMineTab ? '#7BC043' : 'rgba(255, 255, 255, 0.15)' }]}
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
                <Animated.View entering={FadeInDown.springify().damping(16)} style={styles.activeFiltersRow}>
                    <View style={[styles.activeFilterChip, { backgroundColor: colors.limeSoft }]}>
                        <Ionicons name="funnel" size={11} color={colors.limeDark} />
                        <ThemedText style={[styles.activeFiltersTitle, { color: colors.limeDark }]} numberOfLines={1}>
                            {[...selectedCategories, ...selectedItems].filter(Boolean).join(' • ') || 'Filters on'}
                        </ThemedText>
                    </View>
                    <TouchableOpacity
                        style={[styles.clearFiltersBtn, { backgroundColor: colors.field }]}
                        onPress={() => {
                            setSelectedCategories([]);
                            setSelectedItems([]);
                        }}
                    >
                        <ThemedText style={{ color: colors.primary, fontSize: 11, fontWeight: '700' }}>
                            Clear All
                        </ThemedText>
                    </TouchableOpacity>
                </Animated.View>
            )}

            {/* Listings Grid/List */}
            {isLoading ? (
                <MarketplaceGridSkeleton rows={3} />
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
                        refreshing={isRefetching}
                        onRefresh={handleRefresh}
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
        backgroundColor: '#FF5A5F',
        borderRadius: 9,
        width: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderColor: '#FFFFFF',
    },
    filterBadgeText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: 'bold',
        textAlign: 'center',
        lineHeight: 12,
        includeFontPadding: false,
    },
    activeFiltersRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        marginBottom: 8,
        gap: 8,
    },
    activeFilterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 5,
        flexShrink: 1,
    },
    activeFiltersTitle: {
        fontSize: 11,
        fontWeight: '700',
        flexShrink: 1,
    },
    clearFiltersBtn: {
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    emptyIconWell: {
        width: 72,
        height: 72,
        borderRadius: 36,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 14,
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 6,
    },
    emptySubtitle: {
        fontSize: 13,
        lineHeight: 19,
        textAlign: 'center',
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
