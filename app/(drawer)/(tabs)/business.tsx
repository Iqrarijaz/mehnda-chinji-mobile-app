import { BUSINESS_QUERY_KEYS, getBusinessesList } from '@/apis/business';
import BusinessCard from '@/components/business/BusinessCard';
import BankCard from '@/components/listing/BankCard';
import { analyticsService, AnalyticsEvents } from '@/analytics';
import { BusinessRegistration } from '@/components/business/BusinessRegistration';
import { ProfessionPicker } from '@/components/common/ProfessionPicker';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { Layout } from '@/constants/layout';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState, useCallback } from 'react';
import {
    Platform,
    StyleSheet,
    TouchableOpacity,
    View,
    ActivityIndicator,
    TextInput
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { BusinessCardSkeleton } from '@/components/common/CardSkeletons';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { ScreenHeader, HeaderIconBtn } from '@/components/common/ScreenHeader';
import { SearchBar } from '@/components/common/SearchBar';


export default function BusinessScreen() {
    const { theme } = useTheme();
    const colors = Colors[theme];
    const params = useLocalSearchParams<{ tab?: string }>();
    const router = useRouter();

    // Determine initial tab based on params
    const [activeTab, setActiveTab] = useState<'find' | 'portal'>(params.tab === 'portal' ? 'portal' : 'find');
    const isPortalTab = activeTab === 'portal';

    useEffect(() => {
        if (params.tab) {
            setActiveTab(params.tab as 'find' | 'portal');
        }
    }, [params.tab]);
    const [searchQuery, setSearchQuery] = useState('');
    const searchInputRef = React.useRef<TextInput>(null);
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [isProfessionPickerVisible, setIsProfessionPickerVisible] = useState(false);
    const lastTrackedQuery = React.useRef<string>('');

    const categories = ['All', 'Doctors', 'Vendors', 'Pharmacies', 'Mechanics', 'Tailors', 'Restaurants'];

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            if (searchQuery.trim()) {
                analyticsService.trackEvent(AnalyticsEvents.SEARCH_USED, { query: searchQuery, category: 'business' });
            }
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
        queryKey: BUSINESS_QUERY_KEYS.list({ text: debouncedSearch || undefined, categoryEn: selectedCategory === 'All' ? undefined : selectedCategory }),
        queryFn: ({ pageParam = 1 }) => getBusinessesList({
            text: debouncedSearch || undefined,
            categoryEn: selectedCategory === 'All' ? undefined : selectedCategory,
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

    // Track results viewed - only once per new search query
    useEffect(() => {
        if (!loading && businesses.length > 0 && debouncedSearch && lastTrackedQuery.current !== debouncedSearch) {
            analyticsService.trackEvent(AnalyticsEvents.SEARCH_RESULTS_VIEWED, {
                query: debouncedSearch,
                count: businesses.length,
                category: 'business'
            });
            lastTrackedQuery.current = debouncedSearch;
        } else if (!debouncedSearch) {
            lastTrackedQuery.current = '';
        }
    }, [loading, businesses.length, debouncedSearch]);

    const handleRefresh = () => {
        refetch();
    };

    const hasActiveFilters = selectedCategory !== 'All';


    const renderItem = React.useCallback(({ item }: { item: any }) => {
        const isBank = item?.category?.toLowerCase() === 'banks' || item?.categoryEn?.toLowerCase() === 'banks';
        return isBank ? <BankCard business={item} /> : <BusinessCard business={item} />;
    }, []);
    const keyExtractor = React.useCallback((item: any) => item._id?.$oid || item._id?.toString() || Math.random().toString(), []);

    const handleEndReached = useCallback(() => {
        if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    const renderFooter = useCallback(() => {
        if (isFetchingNextPage) {
            return (
                <View style={{ paddingVertical: 20 }}>
                    <ActivityIndicator color={colors.primary} />
                </View>
            );
        }
        if (!hasNextPage && businesses.length > 0) {
            return (
                <ThemedText style={{ textAlign: 'center', color: '#94a3b8', fontSize: 12, paddingVertical: 20 }}>
                    End of directory
                </ThemedText>
            );
        }
        return null;
    }, [isFetchingNextPage, hasNextPage, businesses.length, colors.primary]);

    const renderEmpty = useCallback(() => (
        <View style={styles.emptyContainer}>
            <Ionicons name="business-outline" size={64} color={colors.icon} />
            <ThemedText style={[styles.emptyText, { color: colors.text }]}>No businesses found.</ThemedText>
            <ThemedText style={[styles.emptySubText, { color: colors.icon }]}>Try adjusting your search criteria</ThemedText>
        </View>
    ), [colors.icon, colors.text]);

    return (
        <ErrorBoundary>
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                {/* Top Bar Area */}
                <ScreenHeader
                    rightActions={
                        <HeaderIconBtn
                            name="add"
                            size={22}
                            onPress={() => router.push('/(drawer)/business-registration')}
                        />
                    }
                >
                    {/* Search Row with filter + My Business toggle icon */}
                    <View style={styles.searchSection}>
                        <View style={styles.searchRow}>
                            <SearchBar
                                inputRef={searchInputRef}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                placeholder="Search businesses..."
                                onPress={() => searchInputRef.current?.focus()}
                                style={{ flex: 1 }}
                            />
                            <TouchableOpacity
                                style={[styles.filterButton, { backgroundColor: hasActiveFilters ? '#10B981' : 'rgba(255, 255, 255, 0.15)' }]}
                                onPress={() => setIsProfessionPickerVisible(true)}
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
                            {/* My Business toggle — same as marketplace listing icon */}
                            <TouchableOpacity
                                style={[styles.listingIconButton, { backgroundColor: isPortalTab ? '#10B981' : 'rgba(255, 255, 255, 0.15)' }]}
                                onPress={() => setActiveTab(isPortalTab ? 'find' : 'portal')}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="list-outline" size={20} color="#FFFFFF" />
                            </TouchableOpacity>
                        </View>

                        <ProfessionPicker
                            visible={isProfessionPickerVisible}
                            onClose={() => setIsProfessionPickerVisible(false)}
                            onSelect={(prof) => setSelectedCategory(prof.name_eng)}
                            currentProfession={selectedCategory}
                        />
                    </View>
                </ScreenHeader>

                {/* Find Service Section */}
                <View style={[styles.content, { display: activeTab === 'find' ? 'flex' : 'none' }]}>
                    {/* Listing */}
                    {loading && businesses.length === 0 ? (
                        <View style={styles.listContent}>
                            {[1, 2, 3, 4, 5].map((i) => (
                                <BusinessCardSkeleton key={i} />
                            ))}
                        </View>
                    ) : (
                        <FlashList
                            data={businesses}
                            renderItem={renderItem}
                            keyExtractor={keyExtractor}
                            contentContainerStyle={styles.listContent}
                            onRefresh={handleRefresh}
                            refreshing={loading && !isFetchingNextPage}
                            onEndReached={handleEndReached}
                            onEndReachedThreshold={0.5}
                            ListFooterComponent={renderFooter}
                            ListEmptyComponent={renderEmpty}
                        />
                    )}
                </View>

                {/* My Business Section (Portal) */}
                <View style={{ flex: 1, display: activeTab === 'portal' ? 'flex' : 'none' }}>
                    <BusinessRegistration />
                </View>


            </View>
        </ErrorBoundary>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
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
    listingIconButton: {
        width: 42,
        height: 42,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
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
        borderColor: '#FFFFFF',
    },
    filterBadgeText: {
        color: '#FFFFFF',
        fontSize: 8,
        fontWeight: 'bold',
    },
    categoryScroller: {
        paddingHorizontal: 16,
        gap: 8,
    },
    categoryChip: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: Layout.borderRadius,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderColor: 'rgba(255,255,255,0.3)',
    },
    categoryChipActive: {
        backgroundColor: '#FFFFFF',
        borderColor: '#FFFFFF',
    },
    categoryChipText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '600',
    },
    categoryChipTextActive: {
        fontWeight: '700',
    },
    content: {
        flex: 1,
    },
    listContent: {
        paddingHorizontal: Platform.OS === 'android' ? 18 : 20,
        paddingTop: Platform.OS === 'android' ? 18 : 20,
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
        marginTop: Platform.OS === 'android' ? 58 : 60,
    },
    emptyText: {
        marginTop: Platform.OS === 'android' ? 14 : 16,
        color: '#64748B',
        fontSize: Platform.OS === 'android' ? 16 : 18,
        fontWeight: '700',
    },
    emptySubText: {
        marginTop: Platform.OS === 'android' ? 4 : 6,
        color: '#94A3B8',
        fontSize: Platform.OS === 'android' ? 12 : 14,
    }
});

