import { deleteSupportTicket, getSupportTickets } from '@/apis/support';
import { ThemedText } from '@/components/ThemedText';
import { BackButton } from '@/components/common/BackButton';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    Animated,
    Dimensions,
    LayoutAnimation,
    RefreshControl,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { FlashList } from '@shopify/flash-list';
import { LoaderOverlay } from '@/components/common/LoaderOverlay';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

const { width } = Dimensions.get('window');

interface Message {
    sender: 'user' | 'admin';
    senderId: string;
    message: string;
    attachments: string[];
    createdAt: string;
}

interface Ticket {
    _id: string;
    ticketId: string;
    subject: string;
    description: string;
    status: 'open' | 'in-progress' | 'closed';
    attachments: string[];
    messages: Message[];
    createdAt: string;
}

const FILTERS = [
    { label: 'All', value: 'all' },
    { label: 'Open', value: 'open' },
    { label: 'In Progress', value: 'in-progress' },
    { label: 'Closed', value: 'closed' }
];

export default function TicketListScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { theme } = useTheme();
    const colors = Colors[theme];
    const queryClient = useQueryClient();

    const [selectedFilter, setSelectedFilter] = useState('all');

    const handleBack = () => {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace('/support' as any);
        }
    };

    const { data: response, isLoading, isError, refetch, isRefetching } = useQuery({
        queryKey: ['support_tickets', selectedFilter === 'all' ? undefined : selectedFilter],
        queryFn: () => getSupportTickets({ status: selectedFilter === 'all' ? undefined : selectedFilter })
    });

    const tickets = response?.data?.tickets || [];
    const totalTickets = response?.data?.pagination?.total || 0;

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteSupportTicket(id),
        onSuccess: () => {
            Toast.show({ type: 'success', text1: 'Ticket Deleted' });
            queryClient.invalidateQueries({ queryKey: ['support_tickets'] });
        },
        onError: (error: any) => {
            Alert.alert('Error', error.message || 'Failed to delete ticket.');
        }
    });

    const handleDelete = (id: string) => {
        Alert.alert(
            'Delete Ticket',
            'Are you sure you want to delete this ticket?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate(id) }
            ]
        );
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'open': return '#F59E0B'; // Orange
            case 'in-progress': return '#3B82F6'; // Blue
            case 'closed': return '#10B981'; // Green
            default: return colors.textSecondary;
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const renderHeader = () => (
        <View style={styles.headerContent}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterBar}
            >
                {FILTERS.map((filter) => {
                    const isActive = selectedFilter === filter.value;
                    return (
                        <TouchableOpacity
                            key={filter.value}
                            onPress={() => {
                                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                                setSelectedFilter(filter.value);
                            }}
                            style={[
                                styles.filterChip,
                                isActive && { backgroundColor: `${colors.primary}15` }
                            ]}
                        >
                            <ThemedText
                                style={[
                                    styles.filterLabel,
                                    { color: isActive ? colors.primary : colors.textSecondary },
                                    isActive && { fontWeight: '700' }
                                ]}
                            >
                                {filter.label}
                            </ThemedText>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>
    );

    const renderTicket = ({ item }: { item: Ticket }) => {
        const statusColor = getStatusColor(item.status);

        const renderRightActions = (progress: any, dragX: any) => {
            const scale = dragX.interpolate({
                inputRange: [-80, 0],
                outputRange: [1, 0],
                extrapolate: 'clamp' });

            return (
                <TouchableOpacity
                    style={[styles.deleteAction, { backgroundColor: colors.card }]}
                    onPress={() => handleDelete(item._id)}
                >
                    <Animated.View style={{ transform: [{ scale }] }}>
                        <Ionicons name="trash-outline" size={24} color="#FF5252" />
                    </Animated.View>
                </TouchableOpacity>
            );
        };

        return (
            <Swipeable
                renderRightActions={renderRightActions}
                friction={2}
                rightThreshold={40}
            >
                <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => router.push(`/support/${item._id}` as any)}
                    style={[styles.cardContainer, { backgroundColor: colors.card }]}
                >
                    <View style={[styles.accentStrip, { backgroundColor: statusColor }]} />
                    <View style={styles.cardMain}>
                        <View style={styles.cardHeader}>
                            <ThemedText style={styles.ticketId} numberOfLines={1}>
                                {item.ticketId || `TCK-${item._id.slice(-5).toUpperCase()}`}
                            </ThemedText>
                            <View style={[styles.statusBadge, { backgroundColor: statusColor + '15' }]}>
                                <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                                <ThemedText style={[styles.statusText, { color: statusColor }]}>
                                    {item.status.replace('-', ' ').toUpperCase()}
                                </ThemedText>
                            </View>
                        </View>

                        <ThemedText style={styles.subject} numberOfLines={1}>{item.subject}</ThemedText>
                        <ThemedText style={[styles.desc, { color: colors.textSecondary }]} numberOfLines={2}>
                            {item.description}
                        </ThemedText>

                        <View style={styles.cardFooter}>
                            <View style={styles.footerItem}>
                                <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
                                <ThemedText style={[styles.footerText, { color: colors.textSecondary }]}>
                                    {formatDate(item.createdAt)}
                                </ThemedText>
                            </View>
                            <Ionicons name="chevron-forward" size={16} color={colors.textSecondary + '50'} />
                        </View>
                    </View>
                </TouchableOpacity>
            </Swipeable>
        );
    };

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconBg, { backgroundColor: colors.primary + '10' }]}>
                <Ionicons name="chatbubbles-outline" size={80} color={colors.primary} style={{ opacity: 0.8 }} />
            </View>
            <ThemedText style={styles.emptyTitle}>No support tickets yet</ThemedText>
            <ThemedText style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                Need help? Create your first ticket and our team will assist you.
            </ThemedText>
            <TouchableOpacity
                style={[styles.createButton, { backgroundColor: colors.primary }]}
                onPress={() => router.push('/support/create-ticket')}
            >
                <Ionicons name="add" size={24} color="#FFFFFF" style={{ marginRight: 8 }} />
                <ThemedText style={styles.createButtonText}>Create Ticket</ThemedText>
            </TouchableOpacity>
        </View>
    );

    const SkeletonCard = () => (
        <View style={[styles.skeletonCard, { backgroundColor: colors.card }]}>
            <View style={[styles.skeletonHeader, { backgroundColor: colors.border + '50' }]} />
            <View style={[styles.skeletonLine, { width: '80%', backgroundColor: colors.border + '50' }]} />
            <View style={[styles.skeletonLine, { width: '60%', backgroundColor: colors.border + '50' }]} />
        </View>
    );

    return (
        <ErrorBoundary>
        <GestureHandlerRootView style={{ flex: 1 }}>
            <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
                {/* Custom Nav Bar */}
                <View style={styles.navBar}>
                    <BackButton backgroundColor="rgba(255,255,255,0.18)" color="#FFFFFF" size={22} />
                    <ThemedText style={styles.navTitle}>My Support Tickets</ThemedText>
                    <View style={{ width: 40 }} />
                </View>

                {renderHeader()}

                {isLoading ? (
                    <View style={styles.skeletonContainer}>
                        {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
                    </View>
                ) : isError ? (
                    <View style={styles.errorContainer}>
                        <Ionicons name="alert-circle-outline" size={64} color="#FF5252" />
                        <ThemedText style={styles.errorText}>Failed to load tickets</ThemedText>
                        <TouchableOpacity onPress={() => refetch()} style={styles.retryButton}>
                            <ThemedText style={{ color: colors.primary, fontWeight: '700' }}>Retry</ThemedText>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={{ flex: 1 }}>
                        <FlashList
                            data={tickets}
                            renderItem={renderTicket}
                            keyExtractor={(item) => item._id}
                            contentContainerStyle={styles.listContent}
                            showsVerticalScrollIndicator={false}
                            ListEmptyComponent={renderEmpty}
                            refreshControl={
                                <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
                            }
                        />
                    </View>
                )}
            </View>
            <LoaderOverlay visible={deleteMutation.isPending} text="Deleting ticket..." />
        </GestureHandlerRootView>
        </ErrorBoundary>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1 },
    navBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10 },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: Layout.borderRadius,
        justifyContent: 'center',
        alignItems: 'center' },
    navTitle: {
        fontSize: 15.5,
        fontWeight: '700' },
    headerContent: {
        paddingHorizontal: 16,
        marginBottom: 16 },
    filterBar: {
        flexDirection: 'row',
        paddingRight: 16,
        paddingVertical: 4 },
    filterChip: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: Layout.borderRadius,
        marginRight: 8,
        backgroundColor: 'rgba(0,0,0,0.04)' },
    filterLabel: {
        fontSize: 11.5,
        fontWeight: '600' },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 36 },
    cardContainer: {
        flexDirection: 'row',
        borderRadius: Layout.borderRadius,
        marginBottom: 16,
        overflow: 'hidden' },
    accentStrip: {
        width: 6 },
    cardMain: {
        flex: 1,
        padding: 13 },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10 },
    ticketId: {
        fontSize: 10,
        fontWeight: '600',
        opacity: 0.5,
        letterSpacing: 0.5 },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 7,
        paddingVertical: 4,
        borderRadius: Layout.borderRadius },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: Layout.borderRadius,
        marginRight: 6 },
    statusText: {
        fontSize: 9,
        fontWeight: '800' },
    subject: {
        fontSize: 13.5,
        fontWeight: '700',
        marginBottom: 6 },
    desc: {
        fontSize: 11.5,
        lineHeight: 18,
        marginBottom: 16 },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 10 },
    footerItem: {
        flexDirection: 'row',
        alignItems: 'center' },
    footerText: {
        fontSize: 10.5,
        marginLeft: 6,
        fontWeight: '500' },
    deleteAction: {
        width: 80,
        height: '92%',
        borderRadius: Layout.borderRadius,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 10 },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 76 },
    emptyIconBg: {
        width: 140,
        height: 140,
        borderRadius: Layout.borderRadius,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24 },
    emptyTitle: {
        fontSize: 16.5,
        fontWeight: 'bold',
        marginBottom: 8 },
    emptySubtitle: {
        fontSize: 12.5,
        textAlign: 'center',
        paddingHorizontal: 36,
        lineHeight: 20,
        marginBottom: 32 },
    createButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 11,
        borderRadius: Layout.borderRadius },
    createButtonText: {
        color: '#FFFFFF',
        fontSize: 13.5,
        fontWeight: '700' },
    skeletonContainer: {
        paddingHorizontal: 16 },
    skeletonCard: {
        height: 140,
        borderRadius: Layout.borderRadius,
        padding: 13,
        marginBottom: 16 },
    skeletonHeader: {
        height: 20,
        width: '40%',
        borderRadius: Layout.borderRadius,
        marginBottom: 16 },
    skeletonLine: {
        height: 14,
        borderRadius: Layout.borderRadius,
        marginBottom: 10 },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 36 },
    errorText: {
        fontSize: 13.5,
        marginTop: 16,
        marginBottom: 20 },
    retryButton: {
        padding: 8 }
});
