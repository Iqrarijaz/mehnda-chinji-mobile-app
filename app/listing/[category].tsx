import NativeAd from '@/ads/components/NativeAd';
import { getAuthenticatedConfiguration } from '@/apis/configuration';
import BusinessCard from '@/components/business/BusinessCard';
import { CleanConfirmationModal } from '@/components/common/CleanConfirmationModal';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { LoadingDots } from '@/components/common/LoadingDots';
import { PillsList } from '@/components/common/PillsList';
import { ReportModal, ReportModalRef } from '@/components/common/ReportModal';
import { SearchBar } from '@/components/common/SearchBar';
import EmptyListingState from '@/components/essentials/EmptyListingState';
import { ListingCardSkeleton } from '@/components/essentials/ListingCardSkeleton';
import PlaceCard from '@/components/essentials/PlaceCard';
import RequestCard from '@/components/essentials/shared/RequestCard';
import { ThemedText } from '@/components/ThemedText';
import { BackButton } from '@/components/common/BackButton';
import { PLACE_CATEGORY_MAPPING } from '@/constants/categories';
import { getCategoryTypes } from '@/constants/categoryTypes';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useEssentialsAPI } from '@/hooks/useEssentialsAPI';
import Avatar from '@/components/ui/Avatar';
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { useQuery } from '@tanstack/react-query';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
    Platform,
    RefreshControl,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Layout } from '@/constants/layout';

const CategoryListingScreen = React.memo(() => {
    const { category, tab } = useLocalSearchParams<{ category: string; tab?: string }>();
    const { theme, isDark } = useTheme();
    const router = useRouter();


    const colors = Colors[theme];
    const insets = useSafeAreaInsets();
    const { user } = useAuth();
    const [search, setSearch] = React.useState('');
    const [debouncedSearch, setDebouncedSearch] = React.useState('');
    const [activeTab, setActiveTab] = useState<'all' | 'requests'>(tab === 'requests' ? 'requests' : 'all');
    const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
    const [selectedType, setSelectedType] = useState<string>('');

    React.useEffect(() => {
        if (tab) {
            setActiveTab(tab === 'requests' ? 'requests' : 'all');
        }
    }, [tab]);

    // Reporting state
    const reportModalRef = React.useRef<ReportModalRef>(null);
    const [reportTarget, setReportTarget] = useState<{ id: string; type: 'PLACE' | 'POST' } | null>(null);

    const handleReport = useCallback((id: string) => {
        setReportTarget({ id, type: 'PLACE' });
        reportModalRef.current?.present();
    }, []);

    // Fetch configuration for categories/types
    const { data: essentialsConfig } = useQuery({
        queryKey: ['configuration', 'ESSENTIALS_ICONS'],
        queryFn: () => getAuthenticatedConfiguration('ESSENTIALS_ICONS'),
        staleTime: 0, // Force fresh fetch to get newly added tags configuration
    });
    const getConfigArray = (resp: any) => {
        let val = resp?.data?.data || resp?.data?.value || resp?.data || resp;
        if (val && typeof val === 'object' && val.value) val = val.value;
        if (typeof val === 'string') {
            try { val = JSON.parse(val); } catch (e) { }
        }
        return Array.isArray(val) ? val : [];
    };

    const configData = useMemo(() => getConfigArray(essentialsConfig), [essentialsConfig]);
    const categoryConfig = useMemo(() =>
        configData.find((c: any) => c.category === category?.toLowerCase() || c.key === category?.toLowerCase()),
        [configData, category]);

    const dynamicTypes = categoryConfig?.types || [];

    const typesToRender = useMemo(() => {
        const types = dynamicTypes.length > 0
            ? dynamicTypes
            : getCategoryTypes(category || '').map(t => ({ key: t, label: t.charAt(0).toUpperCase() + t.slice(1) }));

        // Add "All" type at the beginning
        return [{ key: '', label: 'All' }, ...types];
    }, [dynamicTypes]);


    // Debounce search
    React.useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    const categoryTitle = useMemo(() => {
        return PLACE_CATEGORY_MAPPING[category || ''] || 'Listing';
    }, [category]);

    // Category-specific header background (matches detail hero headers)
    const headerBg = useMemo(() => {
        const cat = (category || '').toLowerCase();
        if (cat === 'emergency') return '#b91c1c';   // deep red
        if (cat === 'health') return colors.primary;  // theme primary (teal)
        if (cat === 'religious') return '#1a5c3a'; // Islamic green
        if (cat === 'banks') return '#1a2d4a'; // deep navy
        if (cat === 'govt') return '#1e2e4a'; // slate-blue
        if (cat === 'travel') return '#0f172a';        // dark slate
        if (cat === 'education') return '#312e81';     // deep indigo
        return colors.primary;
    }, [category, colors.primary]);

    // --- API Hook ---
    const {
        infiniteQuery,
        myRequestsQuery,
        deleteMutation } = useEssentialsAPI({
        category,
        search: debouncedSearch,
        type: selectedType,
        activeTab,
        onDeleteSuccess: () => setDeleteTarget(null) });

    const {
        data: infiniteData,
        isLoading: queryLoading,
        isRefetching,
        hasNextPage,
        fetchNextPage,
        isFetchingNextPage,
        refetch
    } = infiniteQuery;

    const {
        data: myRequestsData,
        isLoading: myRequestsLoading,
        isRefetching: myRequestsRefetching,
        hasNextPage: myRequestsHasNextPage,
        fetchNextPage: myRequestsFetchNextPage,
        isFetchingNextPage: myRequestsFetchingNextPage,
        refetch: myRequestsRefetch
    } = myRequestsQuery;


    const handleDelete = (id: string, name: string) => {
        setDeleteTarget({ id, name });
    };

    const confirmDelete = () => {
        if (deleteTarget) {
            deleteMutation.mutate(deleteTarget.id);
        }
    };

    const handleEdit = (item: any) => {
        router.push({
            pathname: '/(drawer)/place-submission',
            params: { category: category, editData: JSON.stringify(item) }
        });
    };

    // --- Data processing ---

    const businesses = (infiniteData as any)?.pages?.flatMap((page: any) => Array.isArray(page?.data) ? page.data : []) || [];
    const myRequests = (myRequestsData as any)?.pages?.flatMap((page: any) => page.data || []) || [];

    // Total result count when the API reports one (display only).
    const firstPagePagination = (infiniteData as any)?.pages?.[0]?.pagination;
    const totalResults: number | null =
        typeof firstPagePagination?.totalItems === 'number'
            ? firstPagePagination.totalItems
            : typeof firstPagePagination?.total === 'number'
                ? firstPagePagination.total
                : null;

    const loading = activeTab === 'all' ? (queryLoading || isRefetching) : (myRequestsLoading || myRequestsRefetching);
    const rawData = activeTab === 'all' ? businesses : myRequests;

    const AD_SUPPORTED_CATEGORIES = ['education', 'health', 'govt', 'banks', 'travel'];
    // --- Ad Injection Logic ---
    const listData = useMemo(() => {
        if (activeTab !== 'all' || rawData.length === 0 || !AD_SUPPORTED_CATEGORIES.includes(category || '')) return rawData;

        const processed: any[] = [];
        const adInterval = 4; // Show ad after every 4 items

        rawData.forEach((item: any, index: number) => {
            processed.push(item);
            // Inject ad after every 6th item, but not at the very end
            if ((index + 1) % adInterval === 0 && index !== rawData.length - 1) {
                processed.push({ _id: `ad-${index}`, isAd: true });
            }
        });

        return processed;
    }, [rawData, activeTab, category]);

    // --- Render Items ---

    const renderItem = React.useCallback(({ item, index }: { item: any; index: number }) => {
        if (item.isAd) {
            return <NativeAd placement={`listing-${category}`} />;
        }

        const commonProps = {
            data: item,
            color: headerBg,
            onReport: () => handleReport(item._id)
        };

        if (['religious', 'health', 'education', 'emergency', 'govt', 'travel', 'banks', 'bank'].includes(category || '')) {
            return <PlaceCard {...commonProps} category={category || ''} index={index} />;
        }
        return <BusinessCard business={item} onReport={() => handleReport(item._id)} />;
    }, [category, headerBg, handleReport]);



    const renderRequestItem = React.useCallback(({ item }: { item: any }) => (
        <RequestCard
            item={item}
            categoryColor={headerBg}
            isDeleting={deleteMutation.isPending && deleteMutation.variables === item._id}
            onEdit={handleEdit}
            onDelete={handleDelete}
        />
    ), [headerBg, deleteMutation.isPending, deleteMutation.variables, handleEdit, handleDelete]);

    const keyExtractor = React.useCallback((item: any) => item._id, []);

    const handleLoadMore = () => {
        if (activeTab === 'all') {
            if (hasNextPage && !isFetchingNextPage) fetchNextPage();
        } else {
            if (myRequestsHasNextPage && !myRequestsFetchingNextPage) myRequestsFetchNextPage();
        }
    };

    const handleRefresh = () => {
        if (activeTab === 'all') refetch();
        else myRequestsRefetch();
    };

    return (
        <ErrorBoundary>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{ headerShown: false, gestureEnabled: true, gestureDirection: 'horizontal' }} />

            <CleanConfirmationModal
                visible={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={confirmDelete}
                title="Delete Request"
                message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                type="danger"
                isLoading={deleteMutation.isPending}
            />

            {/* Category-Aware Hero Header */}
            <View style={[styles.header, { backgroundColor: headerBg, paddingTop: insets.top + (Platform.OS === 'android' ? 16 : 20) }]}>
                {/* Nav row */}
                <View style={styles.headerRow}>
                    <BackButton backgroundColor="rgba(255,255,255,0.18)" color="#FFFFFF" size={22} />

                    <Animated.View entering={FadeInDown.delay(80).duration(350)} style={styles.headerTitleWrap}>
                        <ThemedText style={styles.headerTitle} numberOfLines={1}>{categoryTitle}</ThemedText>
                    </Animated.View>

                    <View style={styles.headerRight}>
                        <TouchableOpacity
                            style={styles.headerIconBtn}
                            onPress={() => router.push({ pathname: '/(drawer)/place-submission', params: { category: category } })}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="add" size={22} color={headerBg} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.headerIconBtn}
                            onPress={() => router.push('/notifications' as any)}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="notifications-outline" size={20} color={headerBg} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.headerIconBtn}
                            onPress={() => router.push('/profile' as any)}
                            activeOpacity={0.8}
                        >
                            <Avatar
                                uri={user?.user?.profileImage}
                                name={user?.user?.name}
                                size={32}
                            />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Search Bar & tab toggle */}
                <View style={styles.searchSection}>
                    <View style={styles.searchRow}>
                        <SearchBar
                            value={search}
                            onChangeText={setSearch}
                            placeholder={`Search ${categoryTitle}...`}
                            style={{ flex: 1 }}
                        />
                        <TouchableOpacity
                            style={[styles.filterButton, { backgroundColor: activeTab === 'requests' ? colors.lime : 'rgba(255, 255, 255, 0.15)' }]}
                            onPress={() => setActiveTab(activeTab === 'requests' ? 'all' : 'requests')}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="list-outline" size={20} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {/* Category Filter Tabs */}
            {activeTab === 'all' && typesToRender.length > 0 && (
                <PillsList
                    data={typesToRender.map((t: any) => ({ id: t.key, label: t.label }))}
                    selectedId={selectedType}
                    onSelect={setSelectedType}
                    activeColor={headerBg}
                />
            )}

            {/* Result count (shown only when the API reports a total) */}
            {activeTab === 'all' && !loading && totalResults != null && rawData.length > 0 && (
                <View style={styles.resultCountRow}>
                    <View style={[styles.resultCountDot, { backgroundColor: colors.lime }]} />
                    <ThemedText style={[styles.resultCountText, { color: colors.textSecondary }]}>
                        {totalResults} {totalResults === 1 ? 'result' : 'results'}
                    </ThemedText>
                </View>
            )}

            {/* Content */}
            <View style={styles.content}>
                {loading && rawData.length === 0 ? (
                    <View style={styles.listContent}>
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <ListingCardSkeleton key={i} />
                        ))}
                    </View>
                ) : (
                    <>
                        {activeTab === 'requests' && rawData.length > 0 && (
                            <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 6 }}>
                                <ThemedText style={{ fontSize: 13.5, fontWeight: '800', color: colors.text }}>
                                    List of my essentials
                                </ThemedText>
                            </View>
                        )}
                        <View style={{ flex: 1 }}>
                            <FlashList
                                data={listData}
                                renderItem={activeTab === 'all' ? renderItem : renderRequestItem}
                                keyExtractor={keyExtractor}
                                contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 70 }]}
                                refreshControl={
                                    <RefreshControl
                                        refreshing={loading && !isFetchingNextPage && !myRequestsFetchingNextPage}
                                        onRefresh={handleRefresh}
                                        tintColor={colors.primary}
                                        colors={[colors.primary]}
                                    />
                                }
                                onEndReached={handleLoadMore}
                                onEndReachedThreshold={0.5}
                                ListFooterComponent={
                                    () => {
                                        const hasMore = activeTab === 'all' ? hasNextPage : myRequestsHasNextPage;
                                        const isFetching = activeTab === 'all' ? isFetchingNextPage : myRequestsFetchingNextPage;
                                        const hasData = listData.length > 0;

                                        if (isFetching) {
                                            return (
                                                <View style={styles.footerLoader}>
                                                    <LoadingDots />
                                                </View>
                                            );
                                        }

                                        if (!hasMore && hasData) {
                                            return (
                                                <View style={styles.endOfListContainer}>
                                                    <View style={[styles.endOfListLine, { backgroundColor: colors.border }]} />
                                                    <View style={[styles.endOfListDot, { backgroundColor: colors.lime }]} />
                                                    <ThemedText style={[styles.endOfListText, { color: colors.icon }]}>
                                                        {"You're all caught up"}
                                                    </ThemedText>
                                                    <View style={[styles.endOfListDot, { backgroundColor: colors.lime }]} />
                                                    <View style={[styles.endOfListLine, { backgroundColor: colors.border }]} />
                                                </View>
                                            );
                                        }

                                        return <View style={{ height: 20 }} />;
                                    }
                                }
                                ListEmptyComponent={
                                    <EmptyListingState
                                        activeTab={activeTab}
                                        categoryTitle={categoryTitle}
                                        onAdd={() => router.push({ pathname: '/(drawer)/place-submission', params: { category: category } })}
                                    />
                                }
                            />
                        </View>
                    </>
                )}
            </View>
            <ReportModal
                ref={reportModalRef}
                targetId={reportTarget?.id || ''}
                targetType={reportTarget?.type || 'PLACE'}
            />
        </View>
        </ErrorBoundary>
    );
});

export default CategoryListingScreen;

CategoryListingScreen.displayName = 'CategoryListingScreen';
const styles = StyleSheet.create({
    container: {
        flex: 1 },

    content: {
        flex: 1 },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center' },
    listContent: {
        padding: 13,
        paddingBottom: 36 },
    footerLoader: {
        paddingVertical: 26,
        alignItems: 'center' },
    endOfListContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 36,
        paddingHorizontal: 13,
        gap: 15 },
    endOfListLine: {
        height: 1,
        flex: 1,
        opacity: 0.3 },
    endOfListDot: {
        width: 5,
        height: 5,
        borderRadius: Layout.borderRadius },
    endOfListText: {
        fontSize: 11.5,
        fontWeight: '600',
        opacity: 0.6,
        letterSpacing: 0.5 },
    typesContainer: {
        paddingVertical: 10,
        paddingHorizontal: 4,
        backgroundColor: 'rgba(0,0,0,0.05)' },
    typesScrollContent: {
        paddingHorizontal: 10,
        gap: 10 },
    searchSection: {
        paddingTop: Platform.OS === 'android' ? 2 : 12,
        paddingBottom: 4 },
    searchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8 },
    resultCountRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 16,
        paddingBottom: 5 },
    resultCountDot: {
        width: 5,
        height: 5,
        borderRadius: Layout.borderRadius },
    resultCountText: {
        fontSize: 9.5,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.6 },
    filterButton: {
        width: 42,
        height: 42,
        borderRadius: Layout.borderRadius,
        justifyContent: 'center',
        alignItems: 'center' },
    header: {
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
        paddingHorizontal: 13,
        paddingBottom: 11,
        zIndex: 10 },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12 },
    headerTitleWrap: {
        flex: 1,
        alignItems: 'center' },
    headerTitle: {
        fontSize: 14.5,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 0.3,
        textTransform: 'capitalize' },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8 },
    headerIconBtn: {
        width: 36,
        height: 36,
        borderRadius: Layout.borderRadius,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center' } });
