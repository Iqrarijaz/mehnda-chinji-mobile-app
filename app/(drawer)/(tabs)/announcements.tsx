import React, { useState, useCallback, memo, useRef, useEffect, useMemo } from 'react';
import { StyleSheet, View, TouchableOpacity, FlatList, ActivityIndicator, Image, Platform, Alert } from 'react-native';
import { Stack, useNavigation, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DrawerActions } from '@react-navigation/native';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { ThemedText } from '@/components/ThemedText';
import { useAnnouncements } from '@/hooks/useAnnouncements';
import { AnnouncementCard } from '@/components/announcements/AnnouncementCard';
import { analyticsService, AnalyticsEvents } from '@/analytics';
import { useAuth } from '@/context/AuthContext';
import { NotificationIcon } from '@/components/common/NotificationIcon';
import Avatar from '@/components/ui/avatar';
import { CreatePublicAnnouncement } from '@/components/announcements/CreatePublicAnnouncement';
import Toast from 'react-native-toast-message';
import { useMutation } from '@tanstack/react-query';
import { deleteAnnouncement } from '@/apis/announcements';
import { CleanConfirmationModal } from '@/components/common/CleanConfirmationModal';
import { LoaderOverlay } from '@/components/common/LoaderOverlay';

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

export default function AnnouncementsScreen() {
    const navigation = useNavigation();
    const { theme } = useTheme();
    const { user } = useAuth();
    const colors = Colors[theme];
    const insets = useSafeAreaInsets();
    const { id } = useLocalSearchParams<{ id?: string }>();
    const [selectedTab, setSelectedTab] = useState('');
    const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
    const flatListRef = useRef<FlatList>(null);

    const announcementFilters = useMemo(() => {
        return selectedTab === 'mine'
            ? { authorId: user?.user?._id }
            : { type: selectedTab || undefined };
    }, [selectedTab, user?.user?._id]);

    const { data: announcements = [], isLoading, refetch, isRefetching } = useAnnouncements(announcementFilters);

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

    const [announcementToEdit, setAnnouncementToEdit] = useState<any>(null);
    const [announcementToDelete, setAnnouncementToDelete] = useState<any>(null);

    const deleteMutation = useMutation({
        mutationFn: deleteAnnouncement,
        onSuccess: () => {
            refetch();
            Toast.show({ type: 'success', text1: 'Deleted', text2: 'Announcement deleted successfully!' });
        },
        onError: (error: any) => {
            Toast.show({ type: 'error', text1: 'Error', text2: error.message || 'Failed to delete announcement.' });
        }
    });

    const handleEdit = useCallback((item: any) => {
        setAnnouncementToEdit(item);
        setIsCreateModalVisible(true);
    }, []);

    const handleDelete = useCallback((item: any) => {
        setAnnouncementToDelete(item);
    }, []);

    const toggleDrawer = useCallback(() => {
        navigation.dispatch(DrawerActions.toggleDrawer());
    }, [navigation]);

    const renderItem = useCallback(({ item }: { item: any }) => {
        return (
            <AnnouncementCard
                item={item}
                colors={colors}
                selected={item._id === id}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />
        );
    }, [colors, id, handleEdit, handleDelete]);

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

            {/* Header Section with Primary Color Background */}
            <View style={[
                styles.headerContainer,
                {
                    backgroundColor: colors.primary,
                    paddingTop: insets.top + (Platform.OS === 'android' ? 16 : 20),
                }
            ]}>
                <View style={styles.headerContent}>
                    <TouchableOpacity
                        onPress={toggleDrawer}
                        style={styles.iconButton}
                    >
                        <Ionicons name="grid-outline" size={20} color="#FFFFFF" />
                    </TouchableOpacity>


                    <View style={styles.rightActions}>
                        {(user?.user?.isPublicAnnouncer || (user?.user?.managedEssentials && user.user.managedEssentials.length > 0) || selectedTab === 'mine') && (
                            <TouchableOpacity
                                onPress={() => setIsCreateModalVisible(true)}
                                style={[styles.iconButton, { marginRight: 12 }]}
                            >
                                <Ionicons name="add" size={22} color="#FFFFFF" />
                            </TouchableOpacity>
                        )}
                        <NotificationIcon
                            containerStyle={{ marginRight: 12 }}
                            badgeStyle={{ borderColor: colors.primary }}
                        />
                        <TouchableOpacity
                            onPress={() => navigation.navigate('profile' as never)}
                            style={styles.profileButton}
                        >
                            <Avatar
                                uri={user?.user?.profileImage}
                                name={user?.user?.name}
                                size={34}
                            />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

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
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : announcements.length === 0 ? (
                <View style={styles.centered}>
                    <Ionicons name="megaphone-outline" size={48} color={colors.textSecondary} style={{ opacity: 0.5 }} />
                    <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>
                        No announcements posted in this category.
                    </ThemedText>
                </View>
            ) : (
                <FlatList
                    ref={flatListRef}
                    data={announcements}
                    keyExtractor={(item) => item._id}
                    renderItem={renderItem}
                    contentContainerStyle={[styles.feedList, { paddingBottom: insets.bottom + 100 }]}
                    refreshing={isRefetching}
                    onRefresh={refetch}
                    initialNumToRender={8}
                    maxToRenderPerBatch={10}
                    windowSize={10}
                    removeClippedSubviews={Platform.OS === 'android'}
                    onScrollToIndexFailed={(info) => {
                        const wait = new Promise(resolve => setTimeout(resolve, 500));
                        wait.then(() => {
                            flatListRef.current?.scrollToIndex({ index: info.index, animated: true, viewPosition: 0.5 });
                        });
                    }}
                />
            )}
            {/* Create/Edit Announcement Modal */}
            <CreatePublicAnnouncement
                visible={isCreateModalVisible}
                onClose={() => {
                    setIsCreateModalVisible(false);
                    setAnnouncementToEdit(null);
                }}
                onSuccess={refetch}
                announcementToEdit={announcementToEdit}
            />

            {/* Delete Confirmation Modal */}
            <CleanConfirmationModal
                visible={!!announcementToDelete}
                onClose={() => setAnnouncementToDelete(null)}
                onConfirm={() => {
                    if (announcementToDelete) {
                        deleteMutation.mutate(announcementToDelete._id);
                        setAnnouncementToDelete(null);
                    }
                }}
                title="Delete Announcement"
                message="Are you sure you want to delete this announcement? This action cannot be undone."
                confirmText="Delete"
                type="danger"
                isLoading={deleteMutation.isPending}
            />

            <LoaderOverlay visible={deleteMutation.isPending} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerContainer: {
        paddingBottom: Platform.OS === 'android' ? 14 : 16,
        borderBottomLeftRadius: Layout.headerBorderRadius,
        borderBottomRightRadius: Layout.headerBorderRadius,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        zIndex: 10,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Platform.OS === 'android' ? 18 : 20,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    iconButton: {
        width: 38,
        height: 38,
        borderRadius: Layout.borderRadius,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    rightActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    profileButton: {
        width: 38,
        height: 38,
        borderRadius: 19,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    addBtn: {
        marginRight: 12,
        justifyContent: 'center',
        alignItems: 'center',
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
    card: {
        borderRadius: 16,
        padding: 16,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    tag: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    tagText: {
        fontSize: 10,
        fontWeight: '800',
    },
    dateText: {
        fontSize: 11,
        fontWeight: '600',
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '800',
        marginBottom: 6,
    },
    cardMessage: {
        fontSize: 13,
        fontWeight: '500',
        lineHeight: 18,
    },
    placeInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 10,
    },
    placeText: {
        fontSize: 12,
        fontWeight: '700',
    },
    imageGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 12,
    },
    image: {
        width: 80,
        height: 80,
        borderRadius: 8,
    },
    cardFooter: {
        marginTop: 14,
        paddingTop: 10,
        borderTopWidth: 1,
    },
    authorText: {
        fontSize: 11,
    },
});
