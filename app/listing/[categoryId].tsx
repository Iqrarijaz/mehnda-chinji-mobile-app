import { DELETE_REQUEST, GET_MY_REQUESTS, GET_PLACES_LIST, PLACE_SUBMISSION_QUERY_KEYS, PLACES_QUERY_KEYS } from '@/apis/places';
import BusinessCard from '@/components/business/BusinessCard';
import { CleanConfirmationModal } from '@/components/common/CleanConfirmationModal';
import CategoryListingHeader from '@/components/listing/CategoryListingHeader';
import EducationCard from '@/components/listing/EducationCard';
import EmptyListingState from '@/components/listing/EmptyListingState';
import HealthCard from '@/components/listing/HealthCard';
import MosqueCard from '@/components/listing/MosqueCard';
import RequestCard from '@/components/places/RequestCard';
import { Colors } from '@/constants/colors';
import { getCategoryColor } from '@/constants/professions';
import { useTheme } from '@/context/ThemeContext';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Stack, useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    StyleSheet,
    View,
} from 'react-native';
import Toast from 'react-native-toast-message';

const CATEGORY_LABELS: Record<string, string> = {
    education: 'Education',
    religious: 'Religious',
    health: 'Health',
    govt: 'Govt Offices',
    shops: 'Shops',
    playgrounds: 'Playgrounds',
    food: 'Food',
    services: 'Services',
};

import PlaceSubmissionModal from '@/components/places/PlaceSubmissionModal';

const CategoryListingScreen = React.memo(() => {
    const { categoryId } = useLocalSearchParams<{ categoryId: string }>();
    const { theme } = useTheme();
    const navigation = useNavigation();
    const router = useRouter();
    const queryClient = useQueryClient();


    const colors = Colors[theme];
    const [search, setSearch] = React.useState('');
    const [debouncedSearch, setDebouncedSearch] = React.useState('');
    const [submissionModalVisible, setSubmissionModalVisible] = React.useState(false);
    const [activeTab, setActiveTab] = useState<'all' | 'requests'>('all');
    const [editingRequest, setEditingRequest] = useState<any>(null);
    const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

    // Debounce search
    React.useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    const categoryTitle = useMemo(() => {
        return CATEGORY_LABELS[categoryId || ''] || 'Listing';
    }, [categoryId]);

    const headerColor = useMemo(() => {
        return getCategoryColor(categoryId || '');
    }, [categoryId]);

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
        queryKey: PLACES_QUERY_KEYS.list({ categoryId, search: debouncedSearch }),
        queryFn: ({ pageParam = 0 }) => GET_PLACES_LIST({
            category: categoryId,
            search: debouncedSearch,
            skip: (pageParam as number) * 20,
            limit: 20
        }),
        getNextPageParam: (lastPage: any) => {
            const pagination = lastPage?.pagination;
            if (pagination && pagination.currentPage < pagination.totalPages) {
                return pagination.currentPage;
            }
            return undefined;
        },
        initialPageParam: 0,
        enabled: !!categoryId && activeTab === 'all',
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
        queryKey: PLACE_SUBMISSION_QUERY_KEYS.myRequests({ page: 1, category: categoryId }),
        queryFn: ({ pageParam = 1 }) => GET_MY_REQUESTS({ page: pageParam, category: categoryId }),
        getNextPageParam: (lastPage: any) => {
            const pagination = lastPage?.pagination;
            if (pagination && pagination.page < pagination.pages) {
                return pagination.page + 1;
            }
            return undefined;
        },
        initialPageParam: 1,
        enabled: !!categoryId && activeTab === 'requests',
    });

    // --- Mutations ---

    const deleteMutation = useMutation({
        mutationFn: DELETE_REQUEST,
        onSuccess: () => {
            Toast.show({
                type: 'success',
                text1: 'Deleted',
                text2: 'Request deleted successfully.',
            });
            setDeleteTarget(null);
            queryClient.invalidateQueries({ queryKey: ['my-place-requests'] });
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
        setEditingRequest(item);
        setSubmissionModalVisible(true);
    };

    // --- Data processing ---

    const businesses = (infiniteData as any)?.pages?.flatMap((page: any) => Array.isArray(page?.data) ? page.data : []) || [];
    const myRequests = (myRequestsData as any)?.pages?.flatMap((page: any) => page.data || []) || [];

    const loading = activeTab === 'all' ? (queryLoading || isRefetching) : (myRequestsLoading || myRequestsRefetching);
    const dataToRender = activeTab === 'all' ? businesses : myRequests;

    // --- Render Items ---

    const renderItem = React.useCallback(({ item }: { item: any }) => {
        if (categoryId === 'religious') {
            return <MosqueCard data={item} color={headerColor} />;
        }
        if (categoryId === 'health') {
            return <HealthCard data={item} />;
        }
        if (categoryId === 'education') {
            return <EducationCard data={item} />;
        }
        return <BusinessCard business={item} />;
    }, [categoryId, headerColor]);



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

            <PlaceSubmissionModal
                visible={submissionModalVisible}
                onClose={() => {
                    setSubmissionModalVisible(false);
                    setEditingRequest(null);
                }}
                category={categoryId || ''}
                onSuccess={() => {
                    if (activeTab === 'requests') myRequestsRefetch();
                    else refetch();
                }}
                editData={editingRequest}
            />

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
                onBack={() => router.back()}
                onAdd={() => setSubmissionModalVisible(true)}
            />

            {/* Content */}
            <View style={styles.content}>
                {loading && dataToRender.length === 0 ? (
                    <View style={styles.loaderContainer}>
                        <ActivityIndicator size="large" color={colors.primary} />
                    </View>
                ) : (
                    <FlatList
                        data={dataToRender}
                        renderItem={activeTab === 'all' ? renderItem : renderRequestItem}
                        keyExtractor={keyExtractor}
                        contentContainerStyle={styles.listContent}
                        onRefresh={handleRefresh}
                        refreshing={loading && !isFetchingNextPage && !myRequestsFetchingNextPage}
                        onEndReached={handleLoadMore}
                        onEndReachedThreshold={0.5}
                        ListFooterComponent={
                            (activeTab === 'all' ? isFetchingNextPage : myRequestsFetchingNextPage) ? (
                                <View style={{ paddingVertical: 20 }}>
                                    <ActivityIndicator color={colors.primary} />
                                </View>
                            ) : null
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
    listContent: {
        padding: 20,
        paddingBottom: 40,
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },


});
