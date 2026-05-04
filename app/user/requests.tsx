import { deleteRequest, getMyRequests, ESSENTIAL_SUBMISSION_QUERY_KEYS } from '@/apis/essentials';
import { ThemedText } from '@/components/themedText';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import RequestCard from '@/components/places/RequestCard';

const MyRequestsScreen = () => {
    const { theme } = useTheme();
    const colors = Colors[theme];
    const router = useRouter();
    const queryClient = useQueryClient();
    const { placeId: highlightId } = useLocalSearchParams<{ placeId?: string }>();
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
        queryKey: ESSENTIAL_SUBMISSION_QUERY_KEYS.myRequests({ page: 1 }), // simplified for now
        queryFn: ({ pageParam = 1 }) => getMyRequests({ page: pageParam }),
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

    const handleDelete = (id: string, name: string) => {
        Alert.alert(
            'Delete Request',
            `Are you sure you want to delete "${name}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => deleteMutation.mutate(id),
                },
            ]
        );
    };

    const handleEdit = (item: any) => {
        router.push({
            pathname: '/(drawer)/place-submission',
            params: {
                category: item.category?.en || item.category,
                editData: JSON.stringify(item),
            },
        });
    };

    const handleManage = (item: any) => {
        router.push({
            pathname: '/user/manage-essential/[id]',
            params: { id: item._id, name: item.name, category: item.category }
        });
    };

    const requests = (data as any)?.pages?.flatMap((page: any) => page.data || []) || [];
    const loading = isLoading || isRefetching;

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

    const renderItem = ({ item }: { item: any }) => {
        return (
            <RequestCard
                item={item}
                categoryColor={colors.primary}
                isDeleting={deleteMutation.isPending && deleteMutation.variables === item._id}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onManage={handleManage}
            />
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{
                headerShown: true,
                title: 'My Requests',
                headerStyle: { backgroundColor: colors.background },
                headerTintColor: colors.text,
            }} />

            {loading && requests.length === 0 ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <FlatList
                    ref={flatListRef}
                    data={requests}
                    renderItem={renderItem}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={styles.listContent}
                    onRefresh={refetch}
                    refreshing={loading && !isFetchingNextPage}
                    onEndReached={() => {
                        if (hasNextPage && !isFetchingNextPage) fetchNextPage();
                    }}
                    onScrollToIndexFailed={() => {}}
                    ListEmptyComponent={
                        <View style={styles.center}>
                            <ThemedText>No requests found.</ThemedText>
                        </View>
                    }
                />
            )}
        </View>
    );
};

export default MyRequestsScreen;

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContent: { padding: 16 },
    card: {
        borderRadius: Layout.borderRadius,
        marginBottom: 12,
        borderWidth: 1,
        overflow: 'hidden',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    cardContent: {
        padding: 16,
    },
    cardImage: {
        width: '100%',
        height: 120,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        textTransform: 'capitalize',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: Layout.borderRadius,
    },
    statusText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 12,
    },
    dateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    dateText: {
        fontSize: 11,
        color: '#94A3B8',
        fontWeight: '600',
    },
    actions: {
        flexDirection: 'row',
        gap: 8,
    },
    actionBtn: {
        padding: 4,
    }
});
