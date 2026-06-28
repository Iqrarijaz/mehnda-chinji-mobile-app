import { deleteRequest, getMyRequests, ESSENTIAL_SUBMISSION_QUERY_KEYS } from '@/apis/essentials';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useCallback } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    View,
    Platform,
    Image,
} from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import RequestCard from '@/components/places/RequestCard';
import { RequestCardSkeleton } from '@/components/common/CardSkeletons';
import { CATEGORIES_CONFIG, MORE_CATEGORIES_CONFIG } from '@/constants/categories';

const ALL_CATEGORIES = [...CATEGORIES_CONFIG, ...MORE_CATEGORIES_CONFIG];

const MyRequestsScreen = () => {
    const { theme, isDark } = useTheme();
    const colors = Colors[theme];
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const queryClient = useQueryClient();
    const { placeId: highlightId, category } = useLocalSearchParams<{ placeId?: string; category?: string }>();
    const flatListRef = useRef<FlatList>(null);

    const {
        data,
        isLoading,
        isRefetching,
        hasNextPage,
        fetchNextPage,
        isFetchingNextPage,
        refetch
    } = useInfiniteQuery({
        queryKey: ESSENTIAL_SUBMISSION_QUERY_KEYS.myRequests({ page: 1, category }),
        queryFn: ({ pageParam = 1 }) => getMyRequests({ page: pageParam, category }),
        getNextPageParam: (lastPage: any) => {
            const pagination = lastPage?.pagination;
            if (pagination && pagination.page < pagination.pages) {
                return pagination.page + 1;
            }
            return undefined;
        },
        initialPageParam: 1,
    });

    const deleteMutation = useMutation({
        mutationFn: deleteRequest,
        onSuccess: () => {
            Alert.alert('Success', 'Request deleted successfully.');
            queryClient.invalidateQueries({ queryKey: ['my-essential-requests'] });
        },
        onError: (error: any) => {
            Alert.alert('Error', error);
        }
    });

    const handleDelete = useCallback((id: string, name: string) => {
        Alert.alert(
            'Delete Request',
            `Are you sure you want to delete "${name}"? This action cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => deleteMutation.mutate(id),
                },
            ]
        );
    }, [deleteMutation]);

    const handleEdit = useCallback((item: any) => {
        router.push({
            pathname: '/(drawer)/place-submission',
            params: {
                category: item.category?.en || item.category,
                editData: JSON.stringify(item),
            },
        });
    }, [router]);

    const handleManage = useCallback((item: any) => {
        const catSlug = item.category?.en || item.category;
        if (catSlug === 'education') {
            router.push({
                pathname: '/user/manage-essential/[id]',
                params: { id: item._id, name: item.name, category: catSlug }
            });
        }
    }, [router]);

    const requests = (data as any)?.pages?.flatMap((page: any) => page.data || []) || [];
    const loading = isLoading && !isRefetching;

    // Scroll to and highlight the place that triggered the notification
    useEffect(() => {
        if (!highlightId || requests.length === 0) return;
        const index = requests.findIndex((r: any) => r._id === highlightId);
        if (index !== -1) {
            setTimeout(() => {
                flatListRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.3 });
            }, 400);
        }
    }, [highlightId, requests.length]);

    const renderItem = useCallback(({ item }: { item: any }) => (
        <RequestCard
            item={item}
            categoryColor={colors.primary}
            isDeleting={deleteMutation.isPending && deleteMutation.variables === item._id}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onManage={handleManage}
        />
    ), [colors.primary, deleteMutation.isPending, deleteMutation.variables, handleEdit, handleDelete, handleManage]);

    const renderEmpty = () => (
        <Animated.View entering={FadeIn.duration(400)} style={styles.emptyContainer}>
            <View style={[styles.emptyIconCircle, { backgroundColor: colors.primary + '10' }]}>
                <Ionicons name="document-text-outline" size={48} color={colors.primary} />
            </View>
            <ThemedText style={styles.emptyTitle}>No requests yet</ThemedText>
            <ThemedText style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                Your submitted places and updates will appear here.
            </ThemedText>
            {category ? (
                <TouchableOpacity
                    style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
                    onPress={() => router.push({ pathname: '/(drawer)/place-submission', params: { category } })}
                >
                    <ThemedText style={styles.emptyBtnText}>Submit a Place</ThemedText>
                    <Ionicons name="add" size={20} color="#FFF" />
                </TouchableOpacity>
            ) : (
                <View style={{ width: '100%', alignItems: 'center' }}>
                    <ThemedText style={{ marginBottom: 16, fontWeight: '600', color: colors.textSecondary }}>
                        Select a category to submit:
                    </ThemedText>
                    <View style={styles.categoryGrid}>
                        {ALL_CATEGORIES.map(cat => (
                            <TouchableOpacity
                                key={cat.id}
                                style={[styles.catBtn, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '40' }]}
                                onPress={() => router.push({ pathname: '/(drawer)/place-submission', params: { category: cat.id } })}
                            >
                                {typeof cat.icon === 'string' ? (
                                    <Ionicons name={cat.icon as any} size={16} color={colors.primary} />
                                ) : (
                                    <Image source={cat.icon} style={{ width: 16, height: 16 }} resizeMode="contain" />
                                )}
                                <ThemedText style={{ fontSize: 13, color: colors.primary, fontWeight: '700' }}>
                                    {cat.label}
                                </ThemedText>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            )}
        </Animated.View>
    );

    const renderFooter = () => {
        if (!isFetchingNextPage) return <View style={{ height: insets.bottom + 20 }} />;
        return (
            <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={colors.primary} />
            </View>
        );
    };

    const displayTitle = category ? `${category.charAt(0).toUpperCase() + category.slice(1)} Requests` : 'My Requests';

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{
                headerShown: false,
            }} />

            {/* Header Design matching Place Submission / Essentials */}
            <Animated.View entering={FadeInUp.duration(600)} style={[styles.headerWrap, { backgroundColor: colors.primary }]}>
                <View style={[styles.headerTopRow, { paddingTop: insets.top + 8 }]}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={styles.backBtn}
                    >
                        <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Animated.View entering={FadeIn.delay(200).duration(500)} style={styles.headerTitleWrap}>
                        <ThemedText style={styles.headerTitle} numberOfLines={1}>
                            {displayTitle}
                        </ThemedText>
                    </Animated.View>
                    <View style={{ width: 42 }} />
                </View>
            </Animated.View>

            {loading ? (
                <View style={styles.skeletonContainer}>
                    <View style={{ height: 20 }} />
                    {[...Array(5)].map((_, i) => (
                        <RequestCardSkeleton key={i} />
                    ))}
                </View>
            ) : (
                <FlatList
                    ref={flatListRef}
                    data={requests}
                    renderItem={renderItem}
                    keyExtractor={(item) => item._id}
                    ListHeaderComponent={() => <View style={{ height: 20 }} />}
                    ListEmptyComponent={renderEmpty}
                    ListFooterComponent={renderFooter}
                    onRefresh={refetch}
                    refreshing={isRefetching && !isFetchingNextPage}
                    onEndReached={() => {
                        if (hasNextPage && !isFetchingNextPage) fetchNextPage();
                    }}
                    onEndReachedThreshold={0.5}
                    removeClippedSubviews={Platform.OS === 'android'}
                    maxToRenderPerBatch={10}
                    windowSize={10}
                    initialNumToRender={7}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </View>
    );
};

export default MyRequestsScreen;

const styles = StyleSheet.create({
    container: { flex: 1 },
    headerWrap: {
        paddingBottom: 16,
        borderBottomLeftRadius: Layout.headerBorderRadius,
        borderBottomRightRadius: Layout.headerBorderRadius,
        overflow: 'hidden',
        zIndex: 10,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
            },

        }),
    },
    headerTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    backBtn: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: 'rgba(255,255,255,0.18)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitleWrap: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 10,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
        textTransform: 'capitalize',
    },
    skeletonContainer: {
        flex: 1,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 60,
        paddingHorizontal: 40,
    },
    emptyIconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '800',
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 32,
    },
    emptyBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 16,
        gap: 8,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
            },

        }),
    },
    emptyBtnText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '700',
    },
    footerLoader: {
        paddingVertical: 20,
        alignItems: 'center',
    },
    categoryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 10,
        width: '100%',
    },
    catBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
        gap: 6,
    },
});
