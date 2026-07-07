import { deleteRequest, getMyRequests, getEssentialsList, ESSENTIAL_SUBMISSION_QUERY_KEYS, ESSENTIALS_QUERY_KEYS } from '@/apis/essentials';
import { getAuthenticatedConfiguration } from '@/apis/configuration';
import { getCategoryTypes } from '@/constants/categoryTypes';
import { Ionicons } from '@expo/vector-icons';
import { PillsList } from '@/components/common/PillsList';
import BusinessCard from '@/components/business/BusinessCard';
import { CleanConfirmationModal } from '@/components/common/CleanConfirmationModal';
import { ScreenHeader, HeaderIconBtn } from '@/components/common/ScreenHeader';
import { SearchBar } from '@/components/common/SearchBar';
import PlaceCard from '@/components/listing/PlaceCard';
import EmptyListingState from '@/components/listing/EmptyListingState';
import RequestCard from '@/components/places/RequestCard';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { useInfiniteQuery, useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState, useCallback } from 'react';
import NativeAd from '@/ads/components/NativeAd';
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    View,
    Platform,
    TouchableOpacity,
} from 'react-native';
import { BusinessCardSkeleton } from '@/components/common/CardSkeletons';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ReportModal, ReportModalRef } from '@/components/common/ReportModal';
import { ThemedText } from '@/components/ThemedText';
import { PLACE_CATEGORY_MAPPING } from '@/constants/categories';
import BankCard from '@/components/listing/BankCard';
import { FlashList } from '@shopify/flash-list';

const CategoryListingScreen = React.memo(() => {
    const { category, tab } = useLocalSearchParams<{ category: string; tab?: string }>();
    const { theme, isDark } = useTheme();
    const router = useRouter();
    const queryClient = useQueryClient();


    const colors = Colors[theme];
    const insets = useSafeAreaInsets();
    const [search, setSearch] = React.useState('');
    const [debouncedSearch, setDebouncedSearch] = React.useState('');
    const [activeTab, setActiveTab] = useState<'all' | 'requests'>(tab === 'requests' ? 'requests' : 'all');
    const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
    const [selectedType, setSelectedType] = useState<string>('');

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

    const headerColor = useMemo(() => {
        return colors.primary;
    }, [colors.primary]);

    // --- Queries ---

    // 1. All Places
    const {
        data: infiniteData,
        isLoading: queryLoading,
        isRefetching,
        hasNextPage,
        fetchNextPage,
        isFetchingNextPage,
        refetch
    } = useInfiniteQuery({
        queryKey: ESSENTIALS_QUERY_KEYS.list({ category, search: debouncedSearch, type: selectedType }),
        queryFn: ({ pageParam = 0 }) => getEssentialsList({
            category: category,
            search: debouncedSearch,
            type: selectedType,
            skip: (pageParam as number) * 20,
            limit: 20
        }),
        getNextPageParam: (lastPage: any) => {
            const pagination = lastPage?.pagination;
            if (pagination && pagination.currentPage < pagination.totalPages) {
                return pagination.currentPage + 1;
            }
            return undefined;
        },
        initialPageParam: 0,
        enabled: !!category && activeTab === 'all',
    });

    // 2. My Requests
    const {
        data: myRequestsData,
        isLoading: myRequestsLoading,
        isRefetching: myRequestsRefetching,
        hasNextPage: myRequestsHasNextPage,
        fetchNextPage: myRequestsFetchNextPage,
        isFetchingNextPage: myRequestsFetchingNextPage,
        refetch: myRequestsRefetch
    } = useInfiniteQuery({
        queryKey: ESSENTIAL_SUBMISSION_QUERY_KEYS.myRequests({ page: 1, category: category }),
        queryFn: ({ pageParam = 1 }) => getMyRequests({ page: pageParam, category: category }),
        getNextPageParam: (lastPage: any) => {
            const pagination = lastPage?.pagination;
            if (pagination && pagination.page < pagination.pages) {
                return pagination.page + 1;
            }
            return undefined;
        },
        initialPageParam: 1,
        enabled: !!category && activeTab === 'requests',
    });

    // --- Mutations ---

    const deleteMutation = useMutation({
        mutationFn: deleteRequest,
        onSuccess: () => {
            Toast.show({
                type: 'success',
                text1: 'Deleted',
                text2: 'Request deleted successfully.',
            });
            setDeleteTarget(null);
            queryClient.invalidateQueries({ queryKey: ['my-essential-requests'] });
        },
        onError: (error: any) => {
            Alert.alert('Error', error);
        }
    });

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

    const renderItem = React.useCallback(({ item }: { item: any }) => {
        if (item.isAd) {
            return <NativeAd placement={`listing-${category}`} />;
        }

        const commonProps = {
            data: item,
            color: headerColor,
            onReport: () => handleReport(item._id)
        };

        if (['religious', 'health', 'education', 'emergency', 'govt', 'travel'].includes(category || '')) {
            return <PlaceCard {...commonProps} category={category || ''} />;
        }
        if (category === 'banks') {
            return <BankCard business={item} onReport={() => handleReport(item._id)} />;
        }
        return <BusinessCard business={item} onReport={() => handleReport(item._id)} />;
    }, [category, headerColor, handleReport]);



    const renderRequestItem = React.useCallback(({ item }: { item: any }) => (
        <RequestCard
            item={item}
            categoryColor={headerColor}
            isDeleting={deleteMutation.isPending && deleteMutation.variables === item._id}
            onEdit={handleEdit}
            onDelete={handleDelete}
        />
    ), [headerColor, deleteMutation.isPending, deleteMutation.variables, handleEdit, handleDelete]);

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

            {/* Header Component */}
            <ScreenHeader
                showMenuIcon={false}
                rightActions={
                    <HeaderIconBtn
                        name="add"
                        size={22}
                        onPress={() => router.push({ pathname: '/(drawer)/place-submission', params: { category: category } })}
                    />
                }
            >
                {/* Search Bar & actions */}
                <View style={styles.searchSection}>
                    <View style={styles.searchRow}>
                        <SearchBar
                            value={search}
                            onChangeText={setSearch}
                            placeholder={`Search ${categoryTitle}...`}
                            style={{ flex: 1 }}
                        />
                        <TouchableOpacity
                            style={[styles.filterButton, { backgroundColor: activeTab === 'requests' ? '#10B981' : 'rgba(255, 255, 255, 0.15)' }]}
                            onPress={() => setActiveTab(activeTab === 'requests' ? 'all' : 'requests')}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="list-outline" size={20} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>

                </View>
            </ScreenHeader>

            {/* Category Filter Tabs */}
            {activeTab === 'all' && typesToRender.length > 0 && (
                <PillsList
                    data={typesToRender.map((t: any) => ({ id: t.key, label: t.label }))}
                    selectedId={selectedType}
                    onSelect={setSelectedType}
                    activeColor={headerColor}
                />
            )}

            {/* Content */}
            <View style={styles.content}>
                {loading && rawData.length === 0 ? (
                    <View style={styles.listContent}>
                        {[1, 2, 3, 4, 5].map((i) => (
                            <BusinessCardSkeleton key={i} />
                        ))}
                    </View>
                ) : (
                    <>
                        <View style={{ flex: 1 }}>
                            <FlashList
                                data={listData}
                                renderItem={activeTab === 'all' ? renderItem : renderRequestItem}
                                keyExtractor={keyExtractor}
                                contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 20 }]}
                                onRefresh={handleRefresh}
                                refreshing={loading && !isFetchingNextPage && !myRequestsFetchingNextPage}
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
                                                    <ActivityIndicator color={colors.primary} />
                                                </View>
                                            );
                                        }

                                        if (!hasMore && hasData) {
                                            return (
                                                <View style={styles.endOfListContainer}>
                                                    <View style={[styles.endOfListLine, { backgroundColor: colors.border }]} />
                                                    <ThemedText style={[styles.endOfListText, { color: colors.icon }]}>
                                                        You've reached the end of the list
                                                    </ThemedText>
                                                    <View style={[styles.endOfListLine, { backgroundColor: colors.border }]} />
                                                </View>
                                            );
                                        }

                                        return <View style={{ height: 20 }} />;
                                    }
                                }
                                ListEmptyComponent={
                                    <EmptyListingState activeTab={activeTab} categoryTitle={categoryTitle} />
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
    );
});

export default CategoryListingScreen;

CategoryListingScreen.displayName = 'CategoryListingScreen';
const styles = StyleSheet.create({
    container: {
        flex: 1,
    },

    content: {
        flex: 1,
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 16,
        paddingBottom: 40,
    },
    footerLoader: {
        paddingVertical: 30,
        alignItems: 'center',
    },
    endOfListContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
        paddingHorizontal: 16,
        gap: 15,
    },
    endOfListLine: {
        height: 1,
        flex: 1,
        opacity: 0.3,
    },
    endOfListText: {
        fontSize: 13,
        fontWeight: '600',
        opacity: 0.6,
        letterSpacing: 0.5,
    },
    typesContainer: {
        paddingVertical: 12,
        paddingHorizontal: 4,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    typesScrollContent: {
        paddingHorizontal: 12,
        gap: 10,
    },
    searchSection: {
        paddingTop: Platform.OS === 'android' ? 2 : 12,
        paddingBottom: 4,
    },
    searchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    filterButton: {
        width: 42,
        height: 42,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
