import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
    Dimensions,
    Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BannerAd from '@/ads/components/BannerAd';
import { useAdsStore, selectCanShowBanner } from '@/store/ads.store';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { ActionMenu, ActionMenuItem } from '@/components/common/ActionMenu';

import { deleteTopper, deleteEvent, getMyRequests } from '@/apis/essentials';
import { ThemedText } from '@/components/ThemedText';
import { LoaderOverlay } from '@/components/common/LoaderOverlay';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { CleanConfirmationModal } from '@/components/common/CleanConfirmationModal';
import Toast from 'react-native-toast-message';
import { Alert } from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { Layout } from '@/constants/layout';

const ACADEMIC_CLASSES = [
    { label: 'Playgroup / Nursery', value: 'playgroup_nursery' },
    { label: 'Prep / Kindergarten', value: 'prep_kindergarten' },
    { label: 'Grade 1', value: 'grade_1' },
    { label: 'Grade 2', value: 'grade_2' },
    { label: 'Grade 3', value: 'grade_3' },
    { label: 'Grade 4', value: 'grade_4' },
    { label: 'Grade 5', value: 'grade_5' },
    { label: 'Grade 6', value: 'grade_6' },
    { label: 'Grade 7', value: 'grade_7' },
    { label: 'Grade 8', value: 'grade_8' },
    { label: 'Grade 9 / Matric Part-I', value: 'grade_9_matric_1' },
    { label: 'Grade 10 / Matric Part-II', value: 'grade_10_matric_2' },
    { label: 'O-Levels', value: 'o_levels' },
    { label: 'A-Levels', value: 'a_levels' },
    { label: 'FSc Pre-Medical', value: 'fsc_pre_medical' },
    { label: 'FSc Pre-Engineering', value: 'fsc_pre_engineering' },
    { label: 'ICS', value: 'ics' },
    { label: 'I.Com', value: 'icom' },
    { label: 'FA', value: 'fa' },
    { label: 'Other', value: 'other' },
];

const { width } = Dimensions.get('window');

const ManageEssentialDashboard = () => {
    const { id, name: initialName, category: initialCategory } = useLocalSearchParams<{ id: string; name: string; category: string }>();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { theme } = useTheme();
    const colors = Colors[theme];
    const isDark = theme === 'dark';
    const queryClient = useQueryClient();

    const canShowBanner = useAdsStore(selectCanShowBanner);
    const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 12 : 0);

    const [activeTab, setActiveTab] = useState<'toppers' | 'events'>('toppers');
    const [deleteTarget, setDeleteTarget] = useState<{ id: string; type: 'topper' | 'event'; name: string } | null>(null);

    // Fetch full details
    const { data: requestData, isLoading, refetch } = useQuery({
        queryKey: ['my-essential-request', id],
        queryFn: async () => {
            const res = await getMyRequests({ page: 1, category: initialCategory });
            // Find the specific one in the list (simplified lookup for now)
            return res.data.find((r: any) => r._id === id);
        }
    });

    const essential = requestData || { name: initialName, category: initialCategory };

    const handleGoBack = () => router.back();

    const deleteMutation = useMutation({
        mutationFn: (target: { id: string; type: 'topper' | 'event' }) => {
            if (target.type === 'topper') return deleteTopper(id, target.id);
            return deleteEvent(id, target.id);
        },
        onSuccess: () => {
            Toast.show({ type: 'success', text1: 'Deleted successfully' });
            queryClient.invalidateQueries({ queryKey: ['my-essential-request', id] });
            setDeleteTarget(null);
        },
        onError: (error: any) => {
            Alert.alert('Error', error.message || 'Failed to delete');
        }
    });

    const renderEmptyState = (type: 'toppers' | 'events') => (
        <View style={styles.emptyState}>
            <View style={[styles.emptyIconCircle, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name={type === 'toppers' ? 'school-outline' : 'calendar-outline'} size={40} color={colors.primary} />
            </View>
            <ThemedText style={styles.emptyTitle}>No {type} yet</ThemedText>
            <ThemedText style={styles.emptySubtitle}>
                Add your {type === 'toppers' ? 'school toppers' : 'upcoming events'} to showcase them to the community.
            </ThemedText>
            <TouchableOpacity
                style={[styles.addBtn, { backgroundColor: colors.primary }]}
                onPress={() => {
                    if (type === 'toppers') {
                        router.push({ pathname: '/user/manage-essential/topper-form', params: { essentialId: id } });
                    } else {
                        router.push({ pathname: '/user/manage-essential/event-form', params: { essentialId: id } });
                    }
                }}
            >
                <Ionicons name="add" size={24} color="#FFF" />
                <ThemedText style={styles.addBtnText}>Add {type === 'toppers' ? 'Topper' : 'Event'}</ThemedText>
            </TouchableOpacity>
        </View>
    );

    const renderTopperItem = (topper: any) => (
        <View key={topper._id} style={[styles.itemCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#FFF' }]}>
            <View style={styles.itemMain}>
                <View style={styles.itemImageContainer}>
                    {topper.image ? (
                        <Image source={{ uri: topper.image }} style={styles.itemImage} />
                    ) : (
                        <View style={[styles.itemImagePlaceholder, { backgroundColor: colors.primary + '20' }]}>
                            <Ionicons name="person" size={20} color={colors.primary} />
                        </View>
                    )}
                </View>
                <View style={styles.itemInfo}>
                    <ThemedText style={styles.itemName}>{topper.name}</ThemedText>
                    {topper.fatherName ? (
                        <ThemedText style={[styles.itemSubtitle, { textTransform: 'capitalize' }]}>Father: {topper.fatherName}</ThemedText>
                    ) : null}
                    {topper.className ? (
                        <ThemedText style={[styles.itemSubtitle, { textTransform: 'capitalize' }]}>Class: {ACADEMIC_CLASSES.find(c => c.value === topper.className)?.label || topper.className}</ThemedText>
                    ) : null}
                    <ThemedText style={styles.itemSubtitle}>{topper.passingYear} • {topper.obtainedMarks}/{topper.totalMarks}</ThemedText>
                </View>
                <View style={styles.moreBtn}>
                    <ActionMenu
                        actions={[
                            {
                                label: 'Edit',
                                icon: 'create-outline',
                                onPress: () => router.push({ pathname: '/user/manage-essential/topper-form', params: { essentialId: id, editData: JSON.stringify(topper) } })
                            },
                            {
                                label: 'Delete',
                                icon: 'trash-outline',
                                destructive: true,
                                onPress: () => setDeleteTarget({ id: topper._id, type: 'topper', name: topper.name })
                            }
                        ]}
                        triggerIcon="ellipsis-vertical"
                    />
                </View>
            </View>
        </View>
    );

    const renderEventItem = (event: any) => (
        <View key={event._id} style={[styles.itemCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#FFF' }]}>
            <View style={styles.itemMain}>
                <View style={styles.itemInfo}>
                    <View style={styles.eventBadgeRow}>
                        <View style={[styles.typeBadge, { backgroundColor: colors.primary + '20' }]}>
                            <ThemedText style={[styles.typeBadgeText, { color: colors.primary }]}>{event.type}</ThemedText>
                        </View>
                        <ThemedText style={styles.eventDate}>{event.date}</ThemedText>
                    </View>
                    <ThemedText style={styles.itemName}>{event.name}</ThemedText>
                    <ThemedText style={styles.itemSubtitle} numberOfLines={1}>{event.description}</ThemedText>
                </View>
                <View style={styles.moreBtn}>
                    <ActionMenu
                        actions={[
                            {
                                label: 'Edit',
                                icon: 'create-outline',
                                onPress: () => router.push({ pathname: '/user/manage-essential/event-form', params: { essentialId: id, editData: JSON.stringify(event) } })
                            },
                            {
                                label: 'Delete',
                                icon: 'trash-outline',
                                destructive: true,
                                onPress: () => setDeleteTarget({ id: event._id, type: 'event', name: event.name })
                            }
                        ]}
                        triggerIcon="ellipsis-vertical"
                    />
                </View>
            </View>
        </View>
    );

    return (
        <View style={[styles.mainContainer, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{ headerShown: false }} />

            <CleanConfirmationModal
                visible={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={() => deleteTarget && deleteMutation.mutate({ id: deleteTarget.id, type: deleteTarget.type })}
                title={`Delete ${deleteTarget?.type === 'topper' ? 'Topper' : 'Event'}`}
                message={`Are you sure you want to delete ${deleteTarget?.name}?`}
                confirmText="Delete"
                type="danger"
                isLoading={deleteMutation.isPending}
            />

            {/* Header */}
            <LinearGradient
                colors={[colors.primary, colors.primary + 'DD']}
                style={[styles.header, { paddingTop: insets.top + 10 }]}
            >
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={handleGoBack} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <View style={styles.headerTitleContainer}>
                        <ThemedText style={styles.headerTitle} numberOfLines={1}>{essential.category?.toUpperCase()}</ThemedText>
                        <ThemedText style={[styles.headerSubtitle, { textTransform: 'capitalize' }]}>{essential.name}</ThemedText>
                    </View>
                    <View style={{ width: 40 }} />
                </View>
            </LinearGradient>

            {/* Tabs */}
            <View style={[styles.tabContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F1F5F9' }]}>
                <TouchableOpacity
                    onPress={() => setActiveTab('toppers')}
                    style={[styles.tab, activeTab === 'toppers' && { backgroundColor: colors.primary }]}
                >
                    <Ionicons name="school" size={18} color={activeTab === 'toppers' ? '#FFF' : colors.textSecondary} />
                    <ThemedText style={[styles.tabText, { color: activeTab === 'toppers' ? '#FFF' : colors.textSecondary, fontWeight: activeTab === 'toppers' ? '700' : '500' }]}>
                        Toppers
                    </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => setActiveTab('events')}
                    style={[styles.tab, activeTab === 'events' && { backgroundColor: colors.primary }]}
                >
                    <Ionicons name="calendar" size={18} color={activeTab === 'events' ? '#FFF' : colors.textSecondary} />
                    <ThemedText style={[styles.tabText, { color: activeTab === 'events' ? '#FFF' : colors.textSecondary, fontWeight: activeTab === 'events' ? '700' : '500' }]}>
                        Events
                    </ThemedText>
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.content}
                contentContainerStyle={{
                    padding: 20,
                    paddingBottom: canShowBanner ? bottomInset + 150 : insets.bottom + 100
                }}
                refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.primary} />}
            >
                {activeTab === 'toppers' ? (
                    essential.toppers?.length > 0 ? (
                        <View style={styles.list}>
                            {essential.toppers.map(renderTopperItem)}
                        </View>
                    ) : renderEmptyState('toppers')
                ) : (
                    essential.events?.length > 0 ? (
                        <View style={styles.list}>
                            {essential.events.map(renderEventItem)}
                        </View>
                    ) : renderEmptyState('events')
                )}
            </ScrollView>

            <TouchableOpacity
                style={[
                    styles.floatingAdd,
                    {
                        backgroundColor: colors.primary,
                        bottom: canShowBanner ? bottomInset + 70 : insets.bottom + 20
                    }
                ]}
                onPress={() => {
                    if (activeTab === 'toppers') {
                        router.push({ pathname: '/user/manage-essential/topper-form', params: { essentialId: id } });
                    } else {
                        router.push({ pathname: '/user/manage-essential/event-form', params: { essentialId: id } });
                    }
                }}
            >
                <Ionicons name="add" size={30} color="#FFF" />
            </TouchableOpacity>

            {canShowBanner && (
                <View style={[styles.bannerContainer, { paddingBottom: bottomInset }]}>
                    <BannerAd placement="essential-details" />
                </View>
            )}
            <LoaderOverlay visible={deleteMutation.isPending} text="Deleting..." />
        </View>
    );
};

export default ManageEssentialDashboard;

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1 },
    header: {
        paddingHorizontal: 20,
        paddingBottom: 25,
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28 },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20 },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: Layout.borderRadius,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center' },
    headerTitleContainer: {
        flex: 1,
        alignItems: 'center' },
    headerTitle: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '700' },
    headerSubtitle: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 1 },
    statusCard: {
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: Layout.borderRadius,
        padding: 15 },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5 },
    statusIndicator: {
        width: 8,
        height: 8,
        borderRadius: Layout.borderRadius,
        marginRight: 8 },
    statusLabel: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 1 },
    statusDescription: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 13,
        lineHeight: 18 },
    tabContainer: {
        flexDirection: 'row',
        borderRadius: Layout.borderRadius,
        padding: 4,
        height: 42,
        marginHorizontal: 20,
        marginTop: 15,
        marginBottom: 5 },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: Layout.borderRadius,
        gap: 8,
        height: '100%' },
    tabText: {
        fontSize: 14 },
    content: {
        flex: 1 },
    list: {
        gap: 15 },
    itemCard: {
        padding: 12,
        borderRadius: Layout.borderRadius },
    itemMain: {
        flexDirection: 'row',
        alignItems: 'center' },
    itemImageContainer: {
        width: 50,
        height: 50,
        borderRadius: Layout.borderRadius,
        overflow: 'hidden',
        marginRight: 12 },
    itemImage: {
        width: '100%',
        height: '100%' },
    itemImagePlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center' },
    itemInfo: {
        flex: 1 },
    itemName: {
        fontSize: 16,
        fontWeight: '700',
        textTransform: 'capitalize' },
    itemSubtitle: {
        fontSize: 13,
        opacity: 0.7,
        marginTop: 2 },
    schoolRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 4 },
    schoolText: {
        fontSize: 12,
        textTransform: 'capitalize',
        flex: 1 },
    moreBtn: {
        padding: 8 },
    menuContainer: {
        width: 160,
        borderRadius: Layout.borderRadius,
        padding: 6 },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: Layout.borderRadius },
    menuItemText: {
        fontSize: 14,
        fontWeight: '600' },
    eventBadgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
        gap: 8 },
    typeBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: Layout.borderRadius },
    typeBadgeText: {
        fontSize: 10,
        fontWeight: '800' },
    eventDate: {
        fontSize: 11,
        opacity: 0.5,
        fontWeight: '600' },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60 },
    emptyIconCircle: {
        width: 100,
        height: 100,
        borderRadius: Layout.borderRadius,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20 },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 10 },
    emptySubtitle: {
        fontSize: 14,
        textAlign: 'center',
        opacity: 0.6,
        paddingHorizontal: 40,
        marginBottom: 30,
        lineHeight: 20 },
    addBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 25,
        paddingVertical: 12,
        borderRadius: Layout.borderRadius,
        gap: 8 },
    addBtnText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '700' },
    floatingAdd: {
        position: 'absolute',
        right: 20,
        width: 60,
        height: 60,
        borderRadius: Layout.borderRadius,
        justifyContent: 'center',
        alignItems: 'center' },
    bannerContainer: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center' }
});
