import React, { useState, useCallback, memo, useRef, useEffect, useMemo } from 'react';
import { StyleSheet, View, TouchableOpacity, FlatList, ActivityIndicator, Platform, TextInput } from 'react-native';
import { FlashList, FlashListRef } from '@shopify/flash-list';
import { Stack, useNavigation, useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { ThemedText } from '@/components/ThemedText';
import { useInfiniteAnnouncements } from '@/hooks/useAnnouncements';
import { AnnouncementCard } from '@/components/announcements/AnnouncementCard';
import { analyticsService, AnalyticsEvents } from '@/analytics';
import { useAuth } from '@/context/AuthContext';
import { CreatePublicAnnouncement } from '@/components/announcements/CreatePublicAnnouncement';
import Toast from 'react-native-toast-message';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteAnnouncement, ANNOUNCEMENT_QUERY_KEYS, AnnouncementData } from '@/apis/announcements';
import { CleanConfirmationModal } from '@/components/common/CleanConfirmationModal';
import { LoaderOverlay } from '@/components/common/LoaderOverlay';
import { AnnouncementCardSkeleton } from '@/components/common/CardSkeletons';
import { ScreenHeader, HeaderIconBtn } from '@/components/common/ScreenHeader';

// Category tab config
const TABS = [
    { id: '', label: 'All' },
    { id: 'mine', label: 'Mine' },
    { id: 'emergency', label: 'Emergency' },
    { id: 'health', label: 'Health' },
    { id: 'education', label: 'Education' },
    { id: 'travel', label: 'Travel' },
    { id: 'religious', label: 'Religious' },
    { id: 'govt', label: 'Govt Office' },
    { id: 'banks', label: 'Banks' },
    { id: 'public', label: 'Public' },
    { id: 'lost_found', label: 'Lost & Found' },
];

const AnnouncementsScreen = memo(function AnnouncementsScreen() {
    const { theme } = useTheme();
    const { user } = useAuth();
    const currentUserId = user?.user?._id;
    const queryClient = useQueryClient();
    const colors = Colors[theme];
    const { id } = useLocalSearchParams<{ id?: string }>();
    const [selectedTab, setSelectedTab] = useState('');
    const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const flatListRef = useRef<FlashListRef<AnnouncementData>>(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const announcementFilters = useMemo(() => {
        return {
            type: selectedTab === 'mine' ? undefined : (selectedTab || undefined),
            authorId: selectedTab === 'mine' ? user?.user?._id : undefined,
            search: debouncedSearch || undefined,
        };
    }, [selectedTab, user?.user?._id, debouncedSearch]);

    const {
        data: infiniteData,
        isLoading,
        refetch,
        isRefetching,
        hasNextPage,
        fetchNextPage,
        isFetchingNextPage
    } = useInfiniteAnnouncements(announcementFilters);

    const announcements = useMemo(() => {
        return infiniteData?.pages?.flatMap(page => Array.isArray(page?.data) ? page.data : []) || [];
    }, [infiniteData]);

    useEffect(() => {
        if (id) {
            setSelectedTab('');
        }
    }, [id]);

    useEffect(() => {
        if (id) {
            analyticsService.trackEvent(AnalyticsEvents.ANNOUNCEMENT_VIEWED, { announcementId: id, source: 'home_carousel' });
        } else {
            analyticsService.trackEvent(AnalyticsEvents.ANNOUNCEMENT_VIEWED, { source: 'list' });
        }
    }, [id]);

    useEffect(() => {
        if (id && announcements.length > 0) {
            const index = announcements.findIndex((item: any) => item._id === id);
            if (index !== -1) {
                const timer = setTimeout(() => {
                    flatListRef.current?.scrollToIndex({
                        index,
                        animated: true,
                        viewPosition: 0.5
                    });
                }, 300);
                return () => clearTimeout(timer);
            }
        }
    }, [id, announcements]);

    const [announcementToEdit, setAnnouncementToEdit] = useState<AnnouncementData | null>(null);
    const [announcementToDelete, setAnnouncementToDelete] = useState<AnnouncementData | null>(null);

    const deleteMutation = useMutation({
        mutationFn: deleteAnnouncement,
        onMutate: async (announcementId: string) => {
            await queryClient.cancelQueries({ queryKey: ANNOUNCEMENT_QUERY_KEYS.all });
            const previousData = queryClient.getQueriesData({ queryKey: ANNOUNCEMENT_QUERY_KEYS.all });

            queryClient.setQueriesData(
                { queryKey: ANNOUNCEMENT_QUERY_KEYS.all },
                (old: any) => {
                    if (!old?.pages) return old;
                    return {
                        ...old,
                        pages: old.pages.map((page: any) => {
                            if (!page || !Array.isArray(page.data)) return page;
                            return {
                                ...page,
                                data: page.data.filter((item: any) => item._id !== announcementId)
                            };
                        })
                    };
                }
            );

            return { previousData };
        },
        onSuccess: () => {
            Toast.show({ type: 'success', text1: 'Deleted', text2: 'Announcement deleted successfully!' });
        },
        onError: (error: any, _variables, context: any) => {
            if (context?.previousData) {
                context.previousData.forEach(([queryKey, data]: [any, any]) => {
                    queryClient.setQueryData(queryKey, data);
                });
            }
            Toast.show({ type: 'error', text1: 'Error', text2: error.message || 'Failed to delete announcement.' });
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ANNOUNCEMENT_QUERY_KEYS.all });
        }
    });


    const feedListStyle = useMemo(() => [
        styles.feedList,
        { paddingBottom: 100 }
    ], []);

    const handleEdit = useCallback((item: AnnouncementData) => {
        setAnnouncementToEdit(item);
        setIsCreateModalVisible(true);
    }, []);

    const handleDelete = useCallback((item: AnnouncementData) => {
        setAnnouncementToDelete(item);
    }, []);

    const handleCreateClose = useCallback(() => {
        setIsCreateModalVisible(false);
        setAnnouncementToEdit(null);
    }, []);

    const handleCreateSuccess = useCallback(() => {
        // queryClient.invalidateQueries is already handled inside CreatePublicAnnouncement
    }, []);

    const handleDeleteClose = useCallback(() => {
        setAnnouncementToDelete(null);
    }, []);

    const handleDeleteConfirm = useCallback(() => {
        if (announcementToDelete) {
            deleteMutation.mutate(announcementToDelete._id);
            setAnnouncementToDelete(null);
        }
    }, [announcementToDelete, deleteMutation]);

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
        if (!hasNextPage && announcements.length > 0) {
            return (
                <ThemedText style={{ textAlign: 'center', color: '#94a3b8', fontSize: 12, paddingVertical: 20 }}>
                    That's all
                </ThemedText>
            );
        }
        return null;
    }, [isFetchingNextPage, hasNextPage, announcements.length, colors.primary]);


    const renderItem = useCallback(({ item }: { item: AnnouncementData }) => {
        const isAuthor = !!(currentUserId && item.authorId && (typeof item.authorId === 'string' ? item.authorId : (item.authorId as any)._id || item.authorId).toString() === currentUserId.toString());
        const isEssentialAdmin = !!(item.essentialId?._id && user?.user?.managedEssentials?.some((id: any) => (id._id || id).toString() === item.essentialId?._id?.toString()));
        const canManage = isAuthor || isEssentialAdmin;

        return (
            <AnnouncementCard
                item={item}
                colors={colors}
                selected={item._id === id}
                canManage={canManage}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />
        );
    }, [colors, id, handleEdit, handleDelete, currentUserId, user?.user?.managedEssentials]);

    const renderTabItem = useCallback(({ item }: { item: any }) => {
        const isActive = selectedTab === item.id;
        return (
            <TouchableOpacity
                style={[
                    styles.tab,
                    isActive && { backgroundColor: colors.primary }
                ]}
                onPress={() => {
                    analyticsService.trackEvent(AnalyticsEvents.ANNOUNCEMENT_TAB_CHANGED, { tab: item.id || 'all' });
                    setSelectedTab(item.id);
                    flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
                }}
            >
                <ThemedText style={[
                    styles.tabText,
                    { color: isActive ? '#FFF' : colors.textSecondary }
                ]}>
                    {item.label}
                </ThemedText>
            </TouchableOpacity>
        );
    }, [selectedTab, colors]);

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <ScreenHeader
                rightActions={
                    (user?.user?.isPublicAnnouncer ||
                        (user?.user?.managedEssentials && user.user.managedEssentials.length > 0) ||
                        selectedTab === 'mine') ? (
                        <HeaderIconBtn
                            name="add"
                            size={22}
                            onPress={() => setIsCreateModalVisible(true)}
                        />
                    ) : undefined
                }
            >
                {/* Search Bar */}
                <View style={styles.searchSection}>
                    <View style={styles.searchRow}>
                        <View style={[styles.searchInputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <Ionicons name="search" size={20} color="#94A3B8" style={{ marginRight: 10 }} />
                            <TextInput
                                style={[styles.searchInput, { color: colors.text }]}
                                placeholder="Search notices..."
                                placeholderTextColor="#94A3B8"
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                returnKeyType="search"
                                clearButtonMode="while-editing"
                            />
                        </View>
                    </View>
                </View>
            </ScreenHeader>

            {/* Tabs */}
            <View style={styles.tabsContainer}>
                <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={TABS}
                    keyExtractor={(item) => item.id}
                    renderItem={renderTabItem}
                    contentContainerStyle={styles.tabsList}
                />
            </View>

            {/* Announcements Feed */}
            {isLoading ? (
                <FlashList
                    data={[1, 2, 3, 4, 5]}
                    keyExtractor={(item) => String(item)}
                    renderItem={() => <AnnouncementCardSkeleton />}
                    contentContainerStyle={feedListStyle}
                    scrollEnabled={false}
                />
            ) : announcements.length === 0 ? (
                <View style={styles.centered}>
                    <Ionicons name="megaphone-outline" size={48} color={colors.textSecondary} style={{ opacity: 0.5 }} />
                    <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>
                        {searchQuery ? 'No matching announcements found.' : 'No announcements posted in this category.'}
                    </ThemedText>
                </View>
            ) : (
                <FlashList
                    ref={flatListRef}
                    data={announcements}
                    keyExtractor={(item) => item._id}
                    renderItem={renderItem}
                    contentContainerStyle={feedListStyle}
                    refreshing={isRefetching}
                    onRefresh={refetch}
                    onEndReached={handleEndReached}
                    onEndReachedThreshold={0.5}
                    ListFooterComponent={renderFooter}
                />
            )}
            {/* Create/Edit Announcement Modal */}
            <CreatePublicAnnouncement
                visible={isCreateModalVisible}
                onClose={handleCreateClose}
                onSuccess={handleCreateSuccess}
                announcementToEdit={announcementToEdit}
            />

            {/* Delete Confirmation Modal */}
            <CleanConfirmationModal
                visible={!!announcementToDelete}
                onClose={handleDeleteClose}
                onConfirm={handleDeleteConfirm}
                title="Delete Announcement"
                message="Are you sure you want to delete this announcement? This action cannot be undone."
                confirmText="Delete"
                type="danger"
                isLoading={deleteMutation.isPending}
            />

            <LoaderOverlay visible={deleteMutation.isPending} />
        </View>
    );
});

export default AnnouncementsScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    tabsContainer: {
        paddingVertical: 12,
    },
    tabsList: {
        paddingHorizontal: 16,
        gap: 8,
    },
    tab: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.03)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabText: {
        fontSize: 13,
        fontWeight: '700',
    },
    centered: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    emptyText: {
        marginTop: 12,
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
        opacity: 0.8,
    },
    feedList: {
        paddingHorizontal: 16,
        gap: 16,
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
    searchInputContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: Layout.borderRadius,
        paddingHorizontal: Platform.OS === 'android' ? 14 : 16,
        height: 42,
        borderWidth: 1,
    },
    searchInput: {
        flex: 1,
        fontSize: Platform.OS === 'android' ? 13 : 15,
        height: '100%',
    },
});
