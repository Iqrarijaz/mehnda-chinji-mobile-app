import { DONOR_QUERY_KEYS, getDonorsList } from '@/apis/bloodDonation';
import BloodRegistration from '@/components/blood/bloodRegistration';
import { BloodDonorHeader } from '@/components/blood/bloodDonorHeader';
import DonorCard from '@/components/blood/donorCard';
import { ThemedText } from '@/components/themedText';
import { ThemedView } from '@/components/themedView';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useInfiniteQuery } from '@tanstack/react-query';
import { ReportModal, ReportModalRef } from '@/components/common/ReportModal';
import { useNavigation, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState, useRef } from 'react';
import { ErrorBoundary } from '@/components/common/errorBoundary';
import {

    ActivityIndicator,
    FlatList,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function BloodScreen() {
    const { theme, isDark } = useTheme();
    const { user } = useAuth();
    const navigation = useNavigation();
    const colors = Colors[theme];

    const [activeTab, setActiveTab] = useState<'find' | 'portal'>('find');
    const [showTooltip, setShowTooltip] = useState(false);

    // Show tooltip on every focus
    useFocusEffect(
        useCallback(() => {
            setShowTooltip(false);
            const timer = setTimeout(() => {
                setShowTooltip(true);
            }, 1000);
            return () => {
                clearTimeout(timer);
                setShowTooltip(false);
            };
        }, [])
    );

    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
    const [groupModalVisible, setGroupModalVisible] = useState(false);

    // Reporting
    const reportModalRef = useRef<ReportModalRef>(null);
    const [reportTargetId, setReportTargetId] = useState<string>('');

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const {
        data: infiniteData,
        isLoading: queryLoading,
        isRefetching,
        hasNextPage,
        fetchNextPage,
        isFetchingNextPage,
        refetch
    } = useInfiniteQuery({
        queryKey: DONOR_QUERY_KEYS.list({
            name: debouncedSearch || undefined,
            bloodGroup: selectedGroup || undefined
        }),
        queryFn: ({ pageParam = 1 }) => getDonorsList({
            name: debouncedSearch || undefined,
            bloodGroup: selectedGroup || undefined,
            currentPage: pageParam
        }),
        getNextPageParam: (lastPage: any, allPages: any[]) => {
            const pagination = lastPage?.pagination;
            if (pagination && pagination.currentPage < pagination.totalPages) {
                return pagination.currentPage + 1;
            }
            // Fallback for security
            const currentData = lastPage?.data;
            if (Array.isArray(currentData) && currentData.length === 20) {
                return (Array.isArray(allPages) ? allPages.length : 0) + 1;
            }
            return undefined;
        },
        initialPageParam: 1,
        enabled: activeTab === 'find',
    });

    const donors = (infiniteData as any)?.pages?.flatMap((page: any) => Array.isArray(page?.data) ? page.data : []) || [];
    const loading = queryLoading || isRefetching;

    const handleRefresh = () => {
        refetch();
    };

    const handleGroupSelect = (group: string | null) => {
        setSelectedGroup(group);
        setGroupModalVisible(false);
    };

    const handleReportPress = useCallback((donorId: string) => {
        setReportTargetId(donorId);
        setTimeout(() => reportModalRef.current?.present(), 100);
    }, []);

    const renderItem = useCallback(({ item }: { item: any }) => (
        <DonorCard donor={item} onReportPress={handleReportPress} />
    ), [handleReportPress]);
    const keyExtractor = useCallback((item: any) => item._id, []);

    return (
        <ErrorBoundary>
            <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
                {/* Header Section with Primary Color Background */}
                <BloodDonorHeader
                    navigation={navigation}
                    user={user}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    selectedGroup={selectedGroup}
                    onOpenGroupModal={() => setGroupModalVisible(true)}
                    showTooltip={showTooltip}
                    onCloseTooltip={() => setShowTooltip(false)}
                />


                <View style={[styles.content, { display: activeTab === 'find' ? 'flex' : 'none' }]}>
                    {/* Donors List */}
                    {loading && donors.length === 0 ? (
                        <View style={styles.loaderContainer}>
                            <ActivityIndicator size="large" color={colors.primary} />
                        </View>
                    ) : (
                        <FlatList
                            data={donors}
                            renderItem={renderItem}
                            keyExtractor={keyExtractor}
                            contentContainerStyle={styles.listContent}
                            onRefresh={handleRefresh}
                            refreshing={loading && !isFetchingNextPage}
                            onEndReached={() => {
                                if (hasNextPage && !isFetchingNextPage) {
                                    fetchNextPage();
                                }
                            }}
                            onEndReachedThreshold={0.5}
                            ListFooterComponent={
                                isFetchingNextPage ? (
                                    <View style={{ paddingVertical: 20 }}>
                                        <ActivityIndicator color={colors.primary} />
                                    </View>
                                ) : hasNextPage ? null : donors.length > 0 ? (
                                    <ThemedText style={{ textAlign: 'center', color: colors.icon, fontSize: 12, paddingVertical: 20 }}>
                                        End of list
                                    </ThemedText>
                                ) : null
                            }
                            ListEmptyComponent={
                                <View style={styles.emptyContainer}>
                                    <Ionicons name="water-outline" size={64} color={colors.icon} />
                                    <ThemedText style={[styles.emptyText, { color: colors.text }]}>No donors found.</ThemedText>
                                    <ThemedText style={[styles.emptySubText, { color: colors.icon }]}>Try adjusting your search criteria</ThemedText>
                                </View>
                            }
                        />
                    )}
                </View>

                <View style={{ flex: 1, display: activeTab === 'portal' ? 'flex' : 'none' }}>
                    <BloodRegistration />
                </View>

                {/* Blood Group Modal */}
                <Modal
                    visible={groupModalVisible}
                    animationType="fade"
                    transparent={true}
                    onRequestClose={() => setGroupModalVisible(false)}
                >
                    <Pressable
                        style={styles.modalOverlay}
                        onPress={() => setGroupModalVisible(false)}
                    >
                        <View style={[styles.dropdownModalContent, { backgroundColor: colors.card }]}>
                            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                                <ThemedText style={[styles.modalTitle, { color: colors.text }]}>Filter by Group</ThemedText>
                            </View>

                            {/* "Any" Option */}
                            <TouchableOpacity
                                style={[
                                    styles.groupItem,
                                    { borderBottomColor: colors.border },
                                    !selectedGroup && { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 64, 48, 0.08)' }
                                ]}
                                onPress={() => handleGroupSelect(null)}
                            >
                                <ThemedText style={[
                                    styles.groupItemText,
                                    { color: colors.text },
                                    !selectedGroup && { color: colors.primary, fontWeight: '700' }
                                ]}>
                                    Any Blood Group
                                </ThemedText>
                                {!selectedGroup && (
                                    <Ionicons name="checkmark" size={20} color={colors.primary} />
                                )}
                            </TouchableOpacity>

                            {BLOOD_GROUPS.map((group) => (
                                <TouchableOpacity
                                    key={group}
                                    style={[
                                        styles.groupItem,
                                        { borderBottomColor: colors.border },
                                        selectedGroup === group && { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 64, 48, 0.08)' }
                                    ]}
                                    onPress={() => handleGroupSelect(group)}
                                >
                                    <ThemedText style={[
                                        styles.groupItemText,
                                        { color: colors.text },
                                        selectedGroup === group && { color: colors.primary, fontWeight: '700' }
                                    ]}>
                                        {group}
                                    </ThemedText>
                                    {selectedGroup === group && (
                                        <Ionicons name="checkmark" size={20} color={colors.primary} />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </Pressable>
                </Modal>

                {/* Report Modal */}
                <ReportModal
                    ref={reportModalRef}
                    targetId={reportTargetId}
                    targetType="DONOR"
                />
            </ThemedView>
        </ErrorBoundary>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    // Header Styles
    headerContainer: {
        paddingBottom: Platform.OS === 'android' ? 18 : 20,
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
        shadowColor: "#000",
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
        marginBottom: Platform.OS === 'android' ? 18 : 20,
    },
    rightActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconButton: {
        width: 38,
        height: 38,
        borderRadius: 11,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
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
    profileImage: {
        width: '100%',
        height: '100%',
        borderRadius: 17,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFFFFF', // Keeping white for primary backdrop
    },
    // Content
    content: {
        flex: 1,
    },
    // Search Section
    searchSection: {
        paddingHorizontal: Platform.OS === 'android' ? 18 : 20,
        paddingBottom: Platform.OS === 'android' ? 14 : 16,
    },
    searchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    searchInputContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 24,
        paddingHorizontal: Platform.OS === 'android' ? 14 : 16,
        height: Platform.OS === 'android' ? 46 : 48,
        borderWidth: 1,
    },
    searchInput: {
        flex: 1,
        fontSize: Platform.OS === 'android' ? 13 : 15,
        color: '#0F172A',
        height: '100%',
    },
    bloodGroupButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        paddingHorizontal: Platform.OS === 'android' ? 14 : 16,
        height: Platform.OS === 'android' ? 46 : 48,
        gap: 6,
    },
    bloodGroupText: {
        fontSize: Platform.OS === 'android' ? 12 : 14,
        fontWeight: '700',
    },
    filterContainer: {
        flexDirection: 'row',
        paddingHorizontal: Platform.OS === 'android' ? 18 : 20,
        gap: Platform.OS === 'android' ? 10 : 12,
    },
    filterChip: {
        paddingHorizontal: Platform.OS === 'android' ? 14 : 16,
        paddingVertical: Platform.OS === 'android' ? 6 : 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    activeFilterChip: {
        backgroundColor: '#FFFFFF',
        borderColor: '#FFFFFF',
    },
    filterText: {
        color: '#FFFFFF',
        fontSize: Platform.OS === 'android' ? 11 : 13,
        fontWeight: '600',
    },
    activeFilterText: {
        fontWeight: '700',
    },
    // List
    listContent: {
        paddingHorizontal: Platform.OS === 'android' ? 18 : 20,
        paddingTop: Platform.OS === 'android' ? 18 : 20,
        paddingBottom: 100,
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 40,
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: Platform.OS === 'android' ? 58 : 60,
    },
    emptyText: {
        marginTop: Platform.OS === 'android' ? 14 : 16,
        color: '#64748B',
        fontSize: Platform.OS === 'android' ? 16 : 18,
        fontWeight: '700',
    },
    emptySubText: {
        marginTop: Platform.OS === 'android' ? 4 : 6,
        color: '#94A3B8',
        fontSize: Platform.OS === 'android' ? 12 : 14,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    dropdownModalContent: {
        width: '85%',
        maxHeight: '70%',
        borderRadius: 24,
        padding: 20,
        overflow: 'hidden',
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
    },
    modalHeader: {
        marginBottom: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '800',
        textAlign: 'center',
    },
    groupItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 4,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    groupItemText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1E293B',
    },
    selectedItemText: {
        color: '#004030',
        fontWeight: '700',
    },
});
