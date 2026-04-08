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
import { Image } from 'expo-image';

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

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'APPROVED': return '#10B981';
            case 'REJECTED': return '#EF4444';
            default: return '#F59E0B'; // Pending
        }
    };

    const renderItem = ({ item }: { item: any }) => {
        const hasImage = Array.isArray(item.images) && item.images.length > 0 && typeof item.images[0] === 'string' && item.images[0].trim() !== '';
        
        if (__DEV__) {
            console.log(`[MyRequests] Rendering item: ${item.name} (${item._id}), hasImage: ${hasImage}, Url: ${item.images?.[0]}`);
        }

        return (
            <View style={[
                styles.card,
                { backgroundColor: colors.card, borderColor: colors.border },
                // Highlight the specific place that came from a notification
                highlightId && item._id === highlightId && { borderColor: colors.primary, borderWidth: 2 }
            ]}>
                {hasImage && (
                    <Image
                        source={{ uri: item.images[0] }}
                        style={[styles.cardImage, { backgroundColor: colors.icon + '10' }]}
                        contentFit="cover"
                        transition={200}
                    />
                )}
                <View style={styles.cardContent}>
                    <View style={styles.cardHeader}>
                        <ThemedText style={styles.cardTitle}>{item.name}</ThemedText>
                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                            <ThemedText style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                                {item.status}
                            </ThemedText>
                        </View>
                    </View>

                    <ThemedText style={{ color: colors.icon, fontSize: 12, marginBottom: 2, fontWeight: '600', textTransform: 'capitalize' }}>
                        {item.category?.toLowerCase()}{item.type ? ` • ${item.type?.toLowerCase()}` : ''}
                    </ThemedText>
                    <ThemedText style={{ color: colors.text, fontSize: 13, textTransform: 'capitalize' }} numberOfLines={2}>{item.address}</ThemedText>
                    {item.description && (
                        <ThemedText style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4, fontStyle: 'italic' }} numberOfLines={1}>
                            {item.description}
                        </ThemedText>
                    )}

                    <View style={styles.footer}>
                        <View style={styles.dateContainer}>
                            <Ionicons name="calendar-outline" size={12} color={colors.textSecondary} />
                            <ThemedText style={styles.dateText}>
                                {new Date(item.createdAt || Date.now()).toLocaleDateString()}
                            </ThemedText>
                        </View>

                        {item.status === 'PENDING' && (
                            <View style={styles.actions}>
                                <TouchableOpacity onPress={() => handleEdit(item)} style={styles.actionBtn}>
                                    <Ionicons name="create-outline" size={18} color={colors.primary} />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => handleDelete(item._id, item.name)} style={styles.actionBtn}>
                                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>
            </View>
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
