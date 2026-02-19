import { DONOR_QUERY_KEYS, GET_DONORS_LIST } from '@/apis/bloodDonation';
import BloodRegistration from '@/components/blood/BloodRegistration';
import DonorCard from '@/components/blood/DonorCard';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { DrawerActions } from '@react-navigation/native';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useNavigation } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    Modal,
    Pressable,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function BloodScreen() {
    const { theme, isDark } = useTheme();
    const { user } = useAuth();
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const colors = Colors[theme];

    const [activeTab, setActiveTab] = useState<'find' | 'portal'>('find');
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
    const [groupModalVisible, setGroupModalVisible] = useState(false);

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
        queryFn: ({ pageParam = 1 }) => GET_DONORS_LIST({
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

    const getProfileSource = () => {
        if (user?.user?.profileImage) {
            return { uri: user.user.profileImage };
        }
        const gender = user?.user?.gender?.toUpperCase();
        if (gender === 'FEMALE') {
            return require('../../assets/icons/user-female.png');
        }
        return require('../../assets/icons/user-male.png');
    };

    const renderItem = useCallback(({ item }: { item: any }) => <DonorCard donor={item} />, []);
    const keyExtractor = useCallback((item: any) => item._id, []);

    return (
        <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header Section with Primary Color Background */}
            <View style={[styles.headerContainer, { backgroundColor: colors.primary, paddingTop: insets.top + 20 }]}>
                <View style={styles.headerContent}>
                    {/* Top Row: Menu & Title & Profile */}
                    <TouchableOpacity
                        onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
                        style={styles.iconButton}
                    >
                        <Ionicons name="grid-outline" size={20} color="#FFFFFF" />
                    </TouchableOpacity>

                    <ThemedText style={styles.headerTitle}>Blood Donors</ThemedText>

                    <TouchableOpacity
                        onPress={() => navigation.navigate('profile' as never)}
                        style={styles.profileButton}
                    >
                        <Image
                            source={getProfileSource()}
                            style={styles.profileImage}
                        />
                    </TouchableOpacity>
                </View>

                {/* Search Section - Only visible when on 'find' tab */}
                {activeTab === 'find' && (
                    <View style={styles.searchSection}>
                        <View style={styles.searchRow}>
                            <View style={[styles.searchInputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                <Ionicons name="search" size={20} color={colors.icon} style={{ marginRight: 10 }} />
                                <TextInput
                                    placeholder="Search area..."
                                    placeholderTextColor={colors.icon}
                                    style={[styles.searchInput, { color: colors.text }]}
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                />
                                {searchQuery.length > 0 && (
                                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                                        <Ionicons name="close-circle" size={18} color={colors.icon} />
                                    </TouchableOpacity>
                                )}
                            </View>

                            {/* Blood Group Selector */}
                            <TouchableOpacity
                                style={[styles.bloodGroupButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                                onPress={() => setGroupModalVisible(true)}
                            >
                                <Ionicons name="water" size={16} color={colors.primary} />
                                <ThemedText style={[styles.bloodGroupText, { color: colors.primary }]}>
                                    {selectedGroup || 'Any'}
                                </ThemedText>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Filter Chips */}
                <View style={styles.filterContainer}>
                    <TouchableOpacity
                        style={[styles.filterChip, activeTab === 'find' && styles.activeFilterChip]}
                        onPress={() => setActiveTab('find')}
                    >
                        <ThemedText style={[
                            styles.filterText,
                            activeTab === 'find' && [styles.activeFilterText, { color: colors.primary }]
                        ]}>
                            Find Donors
                        </ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.filterChip, activeTab === 'portal' && styles.activeFilterChip]}
                        onPress={() => setActiveTab('portal')}
                    >
                        <ThemedText style={[
                            styles.filterText,
                            activeTab === 'portal' && [styles.activeFilterText, { color: colors.primary }]
                        ]}>
                            Register as Donor
                        </ThemedText>
                    </TouchableOpacity>
                </View>
            </View>


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
                                <ThemedText style={{ textAlign: 'center', color: '#94a3b8', fontSize: 12, paddingVertical: 20 }}>
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
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    // Header Styles
    headerContainer: {
        paddingBottom: 20,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
        zIndex: 10,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginBottom: 30,
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
        padding: 1.5,
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
        color: '#FFFFFF',
    },
    // Content
    content: {
        flex: 1,
    },
    // Search Section
    searchSection: {
        paddingHorizontal: 20,
        paddingBottom: 16,
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
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 44,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: '#0F172A',
        height: '100%',
    },
    bloodGroupButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        paddingHorizontal: 14,
        height: 44,
        gap: 6,
    },
    bloodGroupText: {
        fontSize: 14,
        fontWeight: '700',
    },
    filterContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        gap: 12,
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
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
        fontSize: 13,
        fontWeight: '600',
    },
    activeFilterText: {
        fontWeight: '700',
    },
    // List
    listContent: {
        paddingHorizontal: 20,
        paddingTop: 20,
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
        marginTop: 60,
    },
    emptyText: {
        marginTop: 16,
        color: '#64748B',
        fontSize: 18,
        fontWeight: '700',
    },
    emptySubText: {
        marginTop: 6,
        color: '#94A3B8',
        fontSize: 14,
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
        elevation: 10,
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
        color: '#004030',
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
