import { BUSINESS_QUERY_KEYS, getBusinessesList } from '@/apis/business';
import BusinessCard from '@/components/business/BusinessCard';
import BankCard from '@/components/listing/bankCard';
import { analyticsService, AnalyticsEvents } from '@/analytics';
import { BusinessRegistration } from '@/components/business/BusinessRegistration';
import { NotificationIcon } from '@/components/common/NotificationIcon';
import { ProfessionPicker } from '@/components/common/ProfessionPicker';
import { ThemedText } from '@/components/themedText';
import Avatar from '@/components/ui/avatar';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { Layout } from '@/constants/layout';
import { DrawerActions } from '@react-navigation/native';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useNavigation, useFocusEffect } from 'expo-router';
import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
    FlatList,
    Platform,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
    ActivityIndicator
} from 'react-native';
import { BusinessCardSkeleton } from '@/components/common/CardSkeletons';
import { useTooltipStore } from '@/store/tooltipStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import Tooltip from 'react-native-walkthrough-tooltip';


export default function BusinessScreen() {
    const { theme } = useTheme();
    const tooltipStore = useTooltipStore();
    const { user } = useAuth();
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const colors = Colors[theme];
    const params = useLocalSearchParams<{ tab?: string }>();

    // Determine initial tab based on params
    const [activeTab, setActiveTab] = useState<'find' | 'portal'>(params.tab === 'portal' ? 'portal' : 'find');
    const [showTooltip, setShowTooltip] = useState(false);

    // Show tooltip only if not viewed before
    useFocusEffect(
        useCallback(() => {
            const tooltipId = 'business-screen';
            if (tooltipStore.viewedTooltips[tooltipId]) {
                setShowTooltip(false);
                return;
            }

            setShowTooltip(false);
            const timer = setTimeout(() => {
                setShowTooltip(true);
            }, 1000);
            return () => {
                clearTimeout(timer);
                setShowTooltip(false);
            };
        }, [tooltipStore.viewedTooltips])
    );

    const handleDismissTooltip = () => {
        const tooltipId = 'business-screen';
        tooltipStore.markAsViewed(tooltipId);
        setShowTooltip(false);
    };

    useEffect(() => {
        if (params.tab) {
            setActiveTab(params.tab as 'find' | 'portal');
        }
    }, [params.tab]);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [isProfessionPickerVisible, setIsProfessionPickerVisible] = useState(false);
    const searchInputRef = useRef<TextInput>(null);
    const lastTrackedQuery = React.useRef<string>('');

    const categories = ['All', 'Doctors', 'Vendors', 'Pharmacies', 'Mechanics', 'Tailors', 'Restaurants'];

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            if (searchQuery.trim()) {
                analyticsService.trackEvent(AnalyticsEvents.SEARCH_USED, { query: searchQuery, category: 'business' });
            }
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
        queryKey: BUSINESS_QUERY_KEYS.list({ text: debouncedSearch || undefined, categoryEn: selectedCategory === 'All' ? undefined : selectedCategory }),
        queryFn: ({ pageParam = 1 }) => getBusinessesList({
            text: debouncedSearch || undefined,
            categoryEn: selectedCategory === 'All' ? undefined : selectedCategory,
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

    const businesses = (infiniteData as any)?.pages?.flatMap((page: any) => Array.isArray(page?.data) ? page.data : []) || [];
    const loading = queryLoading || isRefetching;

    // Track results viewed - only once per new search query
    useEffect(() => {
        if (!loading && businesses.length > 0 && debouncedSearch && lastTrackedQuery.current !== debouncedSearch) {
            analyticsService.trackEvent(AnalyticsEvents.SEARCH_RESULTS_VIEWED, {
                query: debouncedSearch,
                count: businesses.length,
                category: 'business'
            });
            lastTrackedQuery.current = debouncedSearch;
        } else if (!debouncedSearch) {
            lastTrackedQuery.current = '';
        }
    }, [loading, businesses.length, debouncedSearch]);

    const handleRefresh = () => {
        refetch();
    };


    const renderItem = React.useCallback(({ item }: { item: any }) => {
        const isBank = item?.category?.toLowerCase() === 'banks' || item?.categoryEn?.toLowerCase() === 'banks';
        return isBank ? <BankCard business={item} /> : <BusinessCard business={item} />;
    }, []);
    const keyExtractor = React.useCallback((item: any) => item._id?.$oid || item._id?.toString() || Math.random().toString(), []);

    return (
        <ErrorBoundary>
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                {/* Top Bar Area */}
                <View style={[styles.headerContainer, { paddingTop: insets.top + (Platform.OS === 'android' ? 16 : 20), backgroundColor: colors.primary }]}>
                    <View style={styles.headerContent}>
                        {/* Top Row: Menu & Title & Profile */}
                        <TouchableOpacity
                            onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
                            style={[styles.iconButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
                        >
                            <Ionicons name="grid-outline" size={20} color="#FFFFFF" />
                        </TouchableOpacity>



                        <View style={styles.rightActions}>
                            <NotificationIcon
                                containerStyle={{ marginRight: 12 }}
                                badgeStyle={{ borderColor: colors.primary }}
                            />

                            <TouchableOpacity
                                onPress={() => navigation.navigate('profile' as never)}
                                style={[styles.profileButton, { borderColor: 'rgba(255,255,255,0.5)' }]}
                            >
                                <Avatar
                                    uri={user?.user?.profileImage}
                                    name={user?.user?.name}
                                    size={34}
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Main Find / Portal Toggle */}
                    <View style={styles.mainToggleContainer}>
                        <TouchableOpacity
                            style={[styles.mainToggleBtn, activeTab === 'find' ? styles.mainToggleBtnActive : { backgroundColor: 'rgba(255,255,255,0.2)' }]}
                            onPress={() => setActiveTab('find')}
                        >
                            <ThemedText style={[styles.mainToggleText, activeTab === 'find' ? [styles.mainToggleTextActive, { color: colors.primary }] : { color: '#FFFFFF' }]}>Find Service</ThemedText>
                        </TouchableOpacity>
                        <Tooltip
                            isVisible={showTooltip}
                            content={
                                <View style={styles.tooltipPill}>
                                    <ThemedText style={styles.tooltipText}>اپنا کاروبار رجسٹر کرنے کے لیے یہاں ٹیپ کریں</ThemedText>
                                    <TouchableOpacity onPress={handleDismissTooltip} style={styles.tooltipClose}>
                                        <Ionicons name="close-circle" size={18} color="#64748B" />
                                    </TouchableOpacity>
                                </View>
                            }
                            placement="bottom"
                            onClose={handleDismissTooltip}
                            contentStyle={styles.tooltipContent}
                            backgroundColor="rgba(0,0,0,0.2)"
                            // useInteraction={true}
                            displayInsets={{ top: 0, bottom: 0, left: 16, right: 16 }}
                            childrenWrapperStyle={{ flex: 1 }}
                        >
                            <TouchableOpacity
                                style={[styles.mainToggleBtn, activeTab === 'portal' ? styles.mainToggleBtnActive : { backgroundColor: 'rgba(255,255,255,0.2)' }, { width: '100%' }]}
                                onPress={() => setActiveTab('portal')}
                            >
                                <ThemedText style={[styles.mainToggleText, activeTab === 'portal' ? [styles.mainToggleTextActive, { color: colors.primary }] : { color: '#FFFFFF' }]}>My Business</ThemedText>
                            </TouchableOpacity>
                        </Tooltip>
                    </View>

                    {/* Sticky Search & Categories - Only on 'find' tab */}
                    {activeTab === 'find' && (
                        <View style={styles.stickySearchSection}>
                            <TouchableOpacity
                                activeOpacity={1}
                                onPress={() => searchInputRef.current?.focus()}
                                style={styles.searchBar}
                            >
                                <Ionicons name="search" size={20} color="#94A3B8" />
                                <TextInput
                                    ref={searchInputRef}
                                    style={styles.searchInput}
                                    placeholder="Search businesses..."
                                    placeholderTextColor="#94A3B8"
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                    returnKeyType="search"
                                    clearButtonMode="while-editing"
                                />
                                <TouchableOpacity
                                    style={styles.filterIconButton}
                                    onPress={(e) => {
                                        e.stopPropagation();
                                        setIsProfessionPickerVisible(true);
                                    }}
                                >
                                    <Ionicons name="options-outline" size={20} color={colors.primary} />
                                </TouchableOpacity>
                            </TouchableOpacity>

                            <ProfessionPicker
                                visible={isProfessionPickerVisible}
                                onClose={() => setIsProfessionPickerVisible(false)}
                                onSelect={(prof) => setSelectedCategory(prof.name_eng)}
                                currentProfession={selectedCategory}
                            />
                        </View>
                    )}
                </View>

                {/* Find Service Section */}
                <View style={[styles.content, { display: activeTab === 'find' ? 'flex' : 'none' }]}>
                    {/* Listing */}
                    {loading && businesses.length === 0 ? (
                        <View style={styles.listContent}>
                            {[1, 2, 3, 4, 5].map((i) => (
                                <BusinessCardSkeleton key={i} />
                            ))}
                        </View>
                    ) : (
                        <FlatList
                            data={businesses}
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
                                ) : hasNextPage ? null : businesses.length > 0 ? (
                                    <ThemedText style={{ textAlign: 'center', color: '#94a3b8', fontSize: 12, paddingVertical: 20 }}>
                                        End of directory
                                    </ThemedText>
                                ) : null
                            }
                            ListEmptyComponent={
                                <View style={styles.emptyContainer}>
                                    <Ionicons name="business-outline" size={64} color={colors.icon} />
                                    <ThemedText style={[styles.emptyText, { color: colors.text }]}>No businesses found.</ThemedText>
                                    <ThemedText style={[styles.emptySubText, { color: colors.icon }]}>Try adjusting your search criteria</ThemedText>
                                </View>
                            }
                        />
                    )}
                </View>

                {/* My Business Section (Portal) */}
                <View style={{ flex: 1, display: activeTab === 'portal' ? 'flex' : 'none' }}>
                    <BusinessRegistration />
                </View>


            </View>
        </ErrorBoundary>
    );
}

const styles = StyleSheet.create({
    tooltipContent: {
        padding: 0,
        borderRadius: Layout.borderRadius,
        backgroundColor: 'transparent',
    },
    tooltipPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: Layout.borderRadius,
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
        gap: 12,
    },
    tooltipText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#64748B',
    },
    tooltipClose: {
        padding: 4,
    },
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    headerContainer: {
        borderBottomLeftRadius: Layout.headerBorderRadius,
        borderBottomRightRadius: Layout.headerBorderRadius,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        zIndex: 10,
        paddingBottom: Platform.OS === 'android' ? 8 : 20,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Platform.OS === 'android' ? 18 : 20,
        marginBottom: Platform.OS === 'android' ? 18 : 20,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    rightActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconButton: {
        width: 38,
        height: 38,
        borderRadius: Layout.borderRadius,
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileButton: {
        width: 38,
        height: 38,
        borderRadius: 19,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    mainToggleContainer: {
        flexDirection: 'row',
        paddingHorizontal: Platform.OS === 'android' ? 14 : 16,
        marginBottom: Platform.OS === 'android' ? 14 : 16,
        gap: Platform.OS === 'android' ? 6 : 8,
    },
    mainToggleBtn: {
        flex: 1,
        paddingVertical: Platform.OS === 'android' ? 6 : 8,
        paddingHorizontal: Platform.OS === 'android' ? 12 : 14,
        borderRadius: Layout.borderRadius,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    mainToggleBtnActive: {
        backgroundColor: '#FFFFFF',
    },
    mainToggleText: {
        fontSize: Platform.OS === 'android' ? 12 : 14,
        fontWeight: '600',
    },
    mainToggleTextActive: {
        fontWeight: '700',
    },
    stickySearchSection: {
        paddingTop: Platform.OS === 'android' ? 2 : 4,
    },
    searchBar: {
        backgroundColor: '#FFFFFF',
        borderRadius: Layout.borderRadius,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Platform.OS === 'android' ? 14 : 16,
        height: Platform.OS === 'android' ? 40 : 48,
        marginHorizontal: Platform.OS === 'android' ? 14 : 16,
        marginBottom: Platform.OS === 'android' ? 14 : 16,
        borderWidth: 0,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: Platform.OS === 'android' ? 13 : 15,
        color: '#0F172A',
        height: '100%',
    },
    filterIconButton: {
        marginLeft: 8,
        paddingLeft: 10,
        borderLeftWidth: 1,
        borderLeftColor: '#E2E8F0',
    },
    categoryScroller: {
        paddingHorizontal: 16,
        gap: 8,
    },
    categoryChip: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: Layout.borderRadius,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    categoryChipActive: {
        backgroundColor: '#FFFFFF',
        borderColor: '#FFFFFF',
    },
    categoryChipText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '600',
    },
    categoryChipTextActive: {
        fontWeight: '700',
    },
    content: {
        flex: 1,
    },
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
    }
});

