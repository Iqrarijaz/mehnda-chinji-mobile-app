import { deleteRequest, getMyRequests, getEssentialsList, ESSENTIAL_SUBMISSION_QUERY_KEYS, ESSENTIALS_QUERY_KEYS } from '@/apis/essentials';
import BusinessCard from '@/components/business/businessCard';
import { CleanConfirmationModal } from '@/components/common/cleanConfirmationModal';
import CategoryListingHeader from '@/components/listing/categoryListingHeader';
import EducationCard from '@/components/listing/educationCard';
import EmptyListingState from '@/components/listing/emptyListingState';
import HealthCard from '@/components/listing/healthCard';
import MosqueCard from '@/components/listing/mosqueCard';
import RequestCard from '@/components/places/requestCard';
import EmergencyCard from '@/components/listing/emergencyCard';
import GovtOfficeCard from '@/components/listing/govtOfficeCard';
import TravelCard from '@/components/listing/travelCard';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Stack, useLocalSearchParams, useNavigation, useRouter, useFocusEffect } from 'expo-router';
import React, { useMemo, useState, useCallback, useEffect } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    StyleSheet,
    View,
    Platform,
} from 'react-native';
import { BusinessCardSkeleton } from '@/components/common/CardSkeletons';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTooltipStore } from '@/store/tooltipStore';


import { ThemedText } from '@/components/themedText';
import { PLACE_CATEGORY_MAPPING } from '@/constants/categories';
import BankCard from '@/components/listing/bankCard';

const CategoryListingScreen = React.memo(() => {
    const { category, tab } = useLocalSearchParams<{ category: string; tab?: string }>();
    const { theme } = useTheme();
    const navigation = useNavigation();
    const router = useRouter();
    const queryClient = useQueryClient();
    const tooltipStore = useTooltipStore();


    const colors = Colors[theme];
    const insets = useSafeAreaInsets();
    const [search, setSearch] = React.useState('');
    const [debouncedSearch, setDebouncedSearch] = React.useState('');
    const [activeTab, setActiveTab] = useState<'all' | 'requests'>(tab === 'requests' ? 'requests' : 'all');
    const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
    const [showTooltip, setShowTooltip] = useState(false);

    // Show tooltip only if not viewed before
    useFocusEffect(
        useCallback(() => {
            const tooltipId = `listing-${category}`;
            if (tooltipStore.viewedTooltips[tooltipId]) {
                setShowTooltip(false);
                return;
            }

            // Reset state first to ensure it triggers if already false
            setShowTooltip(false);

            const timer = setTimeout(() => {
                setShowTooltip(true);
            }, 1000);

            return () => {
                clearTimeout(timer);
                setShowTooltip(false);
            };
        }, [category, tooltipStore.viewedTooltips])
    );

    const handleDismissTooltip = () => {
        const tooltipId = `listing-${category}`;
        tooltipStore.markAsViewed(tooltipId);
        setShowTooltip(false);
    };

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

    const tooltipMessage = useMemo(() => {
        switch (category) {
            case 'religious': return 'نیا مقام (مسجد) شامل کرنے کے لیے یہاں ٹیپ کریں';
            case 'education': return 'نیا تعلیمی ادارہ شامل کرنے کے لیے یہاں ٹیپ کریں';
            case 'health': return 'نیا ہسپتال یا کلینک شامل کرنے کے لیے یہاں ٹیپ کریں';
            case 'emergency': return 'ایمرجنسی سروس شامل کرنے کے لیے یہاں ٹیپ کریں';
            case 'govt': return 'نیا سرکاری دفتر شامل کرنے کے لیے یہاں ٹیپ کریں';
            default: return 'نیا مقام شامل کرنے کے لیے یہاں ٹیپ کریں';
        }
    }, [category]);

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
        queryKey: ESSENTIALS_QUERY_KEYS.list({ category, search: debouncedSearch }),
        queryFn: ({ pageParam = 0 }) => getEssentialsList({
            category: category,
            search: debouncedSearch,
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
    const dataToRender = activeTab === 'all' ? businesses : myRequests;

    // --- Render Items ---

    const renderItem = React.useCallback(({ item }: { item: any }) => {
        if (category === 'religious') {
            return <MosqueCard data={item} color={headerColor} />;
        }
        if (category === 'health') {
            return <HealthCard data={item} color={headerColor} />;
        }
        if (category === 'education') {
            return <EducationCard data={item} color={headerColor} />;
        }
        if (category === 'banks') {
            return <BankCard business={item} />;
        }
        if (category === 'emergency') {
            return <EmergencyCard data={item} color={headerColor} />;
        }
        if (category === 'govt') {
            return <GovtOfficeCard data={item} color={headerColor} />;
        }
        if (category === 'travel') {
            return <TravelCard data={item} color={headerColor} />;
        }
        return <BusinessCard business={item} />;
    }, [category, headerColor]);



    const renderRequestItem = React.useCallback(({ item }: { item: any }) => (
        <RequestCard
            item={item}
            categoryColor={headerColor}
            isDeleting={deleteMutation.isPending && deleteMutation.variables === item._id}
            onEdit={handleEdit}
            onDelete={handleDelete}
        />
    ), [headerColor, deleteMutation.isPending, deleteMutation.variables]);

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
            <CategoryListingHeader
                categoryTitle={categoryTitle}
                headerColor={headerColor}
                search={search}
                setSearch={setSearch}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                onBack={() => {
                    if (router.canGoBack()) {
                        router.back();
                    } else {
                        router.replace('/(drawer)/(tabs)' as any);
                    }
                }}
                onAdd={() => router.push({ pathname: '/(drawer)/place-submission', params: { category: category } })}
                showTooltip={showTooltip}
                onCloseTooltip={handleDismissTooltip}
                tooltipMessage={tooltipMessage}
            />

            {/* Content */}
            <View style={styles.content}>
                {loading && dataToRender.length === 0 ? (
                    <View style={styles.listContent}>
                        {[1, 2, 3, 4, 5].map((i) => (
                            <BusinessCardSkeleton key={i} />
                        ))}
                    </View>
                ) : (
                    <FlatList
                        data={dataToRender}
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
                                const hasData = dataToRender.length > 0;

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
                )}
            </View>
        </View>
    );
});

export default CategoryListingScreen;

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
});
