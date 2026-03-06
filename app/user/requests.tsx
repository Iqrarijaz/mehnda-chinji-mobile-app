import { deleteRequest, getMyRequests, PLACE_SUBMISSION_QUERY_KEYS } from '@/apis/places';
import { ThemedText } from '@/components/themedText';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Stack, useRouter } from 'expo-router';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';

const MyRequestsScreen = () => {
    const { theme } = useTheme();
    const colors = Colors[theme];
    const router = useRouter();
    const queryClient = useQueryClient();

    const {
        data,
        isLoading,
        isRefetching,
        hasNextPage,
        fetchNextPage,
        isFetchingNextPage,
        refetch
    } = useInfiniteQuery({
        queryKey: PLACE_SUBMISSION_QUERY_KEYS.myRequests({ page: 1 }), // simplified for now
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
            queryClient.invalidateQueries({ queryKey: ['my-place-requests'] });
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
        // TODO: Open Edit Modal (Reuse Submission Modal or creating new one)
        // For now just alert
        Alert.alert('Info', 'Edit functionality to be implemented.');
    };

    const requests = (data as any)?.pages?.flatMap((page: any) => page.data || []) || [];
    const loading = isLoading || isRefetching;

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'APPROVED': return '#10B981';
            case 'REJECTED': return '#EF4444';
            default: return '#F59E0B'; // Pending
        }
    };

    const renderItem = ({ item }: { item: any }) => (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
                <ThemedText style={styles.cardTitle}>{item.name}</ThemedText>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                    <ThemedText style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                        {item.status}
                    </ThemedText>
                </View>
            </View>

            <ThemedText style={{ color: colors.icon, marginBottom: 4 }}>{item.category}</ThemedText>
            <ThemedText style={{ color: colors.text }} numberOfLines={2}>{item.address}</ThemedText>

            {item.status === 'PENDING' && (
                <View style={styles.actions}>
                    <TouchableOpacity onPress={() => handleEdit(item)} style={styles.actionBtn}>
                        <Ionicons name="create-outline" size={20} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(item._id, item.name)} style={styles.actionBtn}>
                        <Ionicons name="trash-outline" size={20} color="#EF4444" />
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );

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
                    data={requests}
                    renderItem={renderItem}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={styles.listContent}
                    onRefresh={refetch}
                    refreshing={loading && !isFetchingNextPage}
                    onEndReached={() => {
                        if (hasNextPage && !isFetchingNextPage) fetchNextPage();
                    }}
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
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        shadowRadius: 3,
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
            borderRadius: 8,
    },
statusText: {
    fontSize: 12,
        fontWeight: 'bold',
    },
actions: {
    flexDirection: 'row',
        justifyContent: 'flex-end',
            marginTop: 12,
                gap: 12,
    },
actionBtn: {
    padding: 8,
    }
});
