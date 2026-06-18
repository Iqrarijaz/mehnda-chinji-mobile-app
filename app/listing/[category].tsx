import { deleteRequest, getMyRequests, getEssentialsList, ESSENTIAL_SUBMISSION_QUERY_KEYS, ESSENTIALS_QUERY_KEYS } from '@/apis/essentials';
import { getAuthenticatedConfiguration } from '@/apis/configuration';
import { getCategoryTypes } from '@/constants/categoryTypes';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import BusinessCard from '@/components/business/BusinessCard';
import { CleanConfirmationModal } from '@/components/common/CleanConfirmationModal';
import CategoryListingHeader from '@/components/listing/CategoryListingHeader';
import EducationCard from '@/components/listing/EducationCard';
import EmptyListingState from '@/components/listing/EmptyListingState';
import HealthCard from '@/components/listing/HealthCard';
import MosqueCard from '@/components/listing/MosqueCard';
import RequestCard from '@/components/places/RequestCard';
import EmergencyCard from '@/components/listing/emergencyCard';
import GovtOfficeCard from '@/components/listing/govtOfficeCard';
import TravelCard from '@/components/listing/travelCard';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { useInfiniteQuery, useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Stack, useLocalSearchParams, useNavigation, useRouter, useFocusEffect } from 'expo-router';
import React, { useMemo, useState, useCallback, useEffect } from 'react';
import NativeAd from '@/ads/components/NativeAd';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    StyleSheet,
    View,
    Platform,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import { BusinessCardSkeleton } from '@/components/common/CardSkeletons';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTooltipStore } from '@/store/tooltipStore';
import { ReportModal, ReportModalRef } from '@/components/common/ReportModal';


import { ThemedText } from '@/components/themedText';
import { PLACE_CATEGORY_MAPPING } from '@/constants/categories';
import BankCard from '@/components/listing/bankCard';

const CategoryListingScreen = React.memo(() => {
    const { category, tab } = useLocalSearchParams<{ category: string; tab?: string }>();
    const { theme, isDark } = useTheme();
    const navigation = useNavigation();
    const router = useRouter();
    const queryClient = useQueryClient();
    const tooltipStore = useTooltipStore();


    const colors = Colors[theme];
    const insets = useSafeAreaInsets();
    const [search, setSearch] = React.useState('');
    const [debouncedSearch, setDebouncedSearch] = React.useState('');
    const [activeTab, setActiveTab] = useState<'all' | 'requests'>(tab === 'requests' ? 'requests' : 'all');
    const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
    const [showTooltip, setShowTooltip] = useState(false);
    const [selectedType, setSelectedType] = useState<string>('');

    // Reporting state
    const reportModalRef = React.useRef<ReportModalRef>(null);
    const [reportTarget, setReportTarget] = useState<{ id: string; type: 'PLACE' | 'POST' } | null>(null);

    const handleReport = useCallback((id: string) => {
        setReportTarget({ id, type: 'PLACE' });
        reportModalRef.current?.present();
    }, []);

    // Fetch configuration for categories/types
    const { data: essentialsConfig } = useQuery({
        queryKey: ['configuration', 'ESSENTIALS_ICONS'],
        queryFn: () => getAuthenticatedConfiguration('ESSENTIALS_ICONS'),
        staleTime: 0, // Force fresh fetch to get newly added tags configuration
    });
    const getConfigArray = (resp: any) => {
        let val = resp?.data?.data || resp?.data?.value || resp?.data || resp;
        if (val && typeof val === 'object' && val.value) val = val.value;
        if (typeof val === 'string') {
            try { val = JSON.parse(val); } catch (e) { }
        }
        return Array.isArray(val) ? val : [];
    };

    const configData = useMemo(() => getConfigArray(essentialsConfig), [essentialsConfig]);
    const categoryConfig = useMemo(() =>
        configData.find((c: any) => c.category === category?.toLowerCase() || c.key === category?.toLowerCase()),
        [configData, category]);

    const dynamicTypes = categoryConfig?.types || [];

    const typesToRender = useMemo(() => {
        const types = dynamicTypes.length > 0
            ? dynamicTypes
            : getCategoryTypes(category || '').map(t => ({ key: t, label: t.charAt(0).toUpperCase() + t.slice(1) }));

        // Add "All" type at the beginning
        return [{ key: '', label: 'All' }, ...types];
    }, [dynamicTypes, category]);


    // Show tooltip only if not viewed before
    useFocusEffect(
        useCallback(() => {
            const tooltipId = `listing-${category}`;
            if (tooltipStore.viewedTooltips[tooltipId]) {
                setShowTooltip(false);
                return;
            }

            // Reset state first to ensure it triggers if already false
            setShowTooltip(false);

            const timer = setTimeout(() => {
                setShowTooltip(true);
            }, 1000);

            return () => {
                clearTimeout(timer);
                setShowTooltip(false);
            };
        }, [category, tooltipStore.viewedTooltips])
    );

    const handleDismissTooltip = () => {
        const tooltipId = `listing-${category}`;
        tooltipStore.markAsViewed(tooltipId);
        setShowTooltip(false);
    };

    // Debounce search
    React.useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    const categoryTitle = useMemo(() => {
        return PLACE_CATEGORY_MAPPING[category || ''] || 'Listing';
    }, [category]);

    const headerColor = useMemo(() => {
        return colors.primary;
    }, [colors.primary]);

    const tooltipMessage = useMemo(() => {
        switch (category) {
            case 'religious': return 'نیا مقام (مسجد) شامل کرنے کے لیے یہاں ٹیپ کریں';
            case 'education': return 'نیا تعلیمی ادارہ شامل کرنے کے لیے یہاں ٹیپ کریں';
            case 'health': return 'نیا ہسپتال یا کلینک شامل کرنے کے لیے یہاں ٹیپ کریں';
            case 'emergency': return 'ایمرجنسی سروس شامل کرنے کے لیے یہاں ٹیپ کریں';
            case 'govt': return 'نیا سرکاری دفتر شامل کرنے کے لیے یہاں ٹیپ کریں';
            default: return 'نیا مقام شامل کرنے کے لیے یہاں ٹیپ کریں';
        }
    }, [category]);

    // --- Queries ---

    // 1. All Places
    const {
        data: infiniteData,
        isLoading: queryLoading,
        isRefetching,
        hasNextPage,
        fetchNextPage,
        isFetchingNextPage,
        refetch
    } = useInfiniteQuery({
        queryKey: ESSENTIALS_QUERY_KEYS.list({ category, search: debouncedSearch, type: selectedType }),
        queryFn: ({ pageParam = 0 }) => getEssentialsList({
            category: category,
            search: debouncedSearch,
            type: selectedType,
            skip: (pageParam as number) * 20,
            limit: 20
        }),
        getNextPageParam: (lastPage: any) => {
            const pagination = lastPage?.pagination;
            if (pagination && pagination.currentPage < pagination.totalPages) {
                return pagination.currentPage + 1;
            }
            return undefined;
        },
        initialPageParam: 0,
        enabled: !!category && activeTab === 'all',
    });

    // 2. My Requests
    const {
        data: myRequestsData,
        isLoading: myRequestsLoading,
        isRefetching: myRequestsRefetching,
        hasNextPage: myRequestsHasNextPage,
        fetchNextPage: myRequestsFetchNextPage,
        isFetchingNextPage: myRequestsFetchingNextPage,
        refetch: myRequestsRefetch
    } = useInfiniteQuery({
        queryKey: ESSENTIAL_SUBMISSION_QUERY_KEYS.myRequests({ page: 1, category: category }),
        queryFn: ({ pageParam = 1 }) => getMyRequests({ page: pageParam, category: category }),
        getNextPageParam: (lastPage: any) => {
            const pagination = lastPage?.pagination;
            if (pagination && pagination.page < pagination.pages) {
                return pagination.page + 1;
            }
            return undefined;
        },
        initialPageParam: 1,
        enabled: !!category && activeTab === 'requests',
    });

    // --- Mutations ---

    const deleteMutation = useMutation({
        mutationFn: deleteRequest,
        onSuccess: () => {
            Toast.show({
                type: 'success',
                text1: 'Deleted',
                text2: 'Request deleted successfully.',
            });
            setDeleteTarget(null);
            queryClient.invalidateQueries({ queryKey: ['my-essential-requests'] });
        },
        onError: (error: any) => {
            Alert.alert('Error', error);
        }
    });

    const handleDelete = (id: string, name: string) => {
        setDeleteTarget({ id, name });
    };

    const confirmDelete = () => {
        if (deleteTarget) {
            deleteMutation.mutate(deleteTarget.id);
        }
    };

    const handleEdit = (item: any) => {
        router.push({
            pathname: '/(drawer)/place-submission',
            params: { category: category, editData: JSON.stringify(item) }
        });
    };

    // --- Data processing ---

    const businesses = (infiniteData as any)?.pages?.flatMap((page: any) => Array.isArray(page?.data) ? page.data : []) || [];
    const myRequests = (myRequestsData as any)?.pages?.flatMap((page: any) => page.data || []) || [];

    const loading = activeTab === 'all' ? (queryLoading || isRefetching) : (myRequestsLoading || myRequestsRefetching);
    const rawData = activeTab === 'all' ? businesses : myRequests;

    const AD_SUPPORTED_CATEGORIES = ['education', 'health', 'govt', 'banks', 'travel'];
    // --- Ad Injection Logic ---
    const listData = useMemo(() => {
        if (activeTab !== 'all' || rawData.length === 0 || !AD_SUPPORTED_CATEGORIES.includes(category || '')) return rawData;

        const processed: any[] = [];
        const adInterval = 4; // Show ad after every 4 items

        rawData.forEach((item: any, index: number) => {
            processed.push(item);
            // Inject ad after every 6th item, but not at the very end
            if ((index + 1) % adInterval === 0 && index !== rawData.length - 1) {
                processed.push({ _id: `ad-${index}`, isAd: true });
            }
        });

        return processed;
    }, [rawData, activeTab]);

    // --- Render Items ---

    const renderItem = React.useCallback(({ item }: { item: any }) => {
        if (item.isAd) {
            return <NativeAd placement={`listing-${category}`} />;
        }

        const commonProps = {
            data: item,
            color: headerColor,
            onReport: () => handleReport(item._id)
        };

        if (category === 'religious') {
            return <MosqueCard {...commonProps} />;
        }
        if (category === 'health') {
            return <HealthCard {...commonProps} />;
        }
        if (category === 'education') {
            return <EducationCard {...commonProps} />;
        }
        if (category === 'banks') {
            return <BankCard business={item} onReport={() => handleReport(item._id)} />;
        }
        if (category === 'emergency') {
            return <EmergencyCard {...commonProps} />;
        }
        if (category === 'govt') {
            return <GovtOfficeCard {...commonProps} />;
        }
        if (category === 'travel') {
            return <TravelCard {...commonProps} />;
        }
        return <BusinessCard business={item} onReport={() => handleReport(item._id)} />;
    }, [category, headerColor, handleReport]);



    const renderRequestItem = React.useCallback(({ item }: { item: any }) => (
        <RequestCard
            item={item}
            categoryColor={headerColor}
            isDeleting={deleteMutation.isPending && deleteMutation.variables === item._id}
            onEdit={handleEdit}
            onDelete={handleDelete}
        />
    ), [headerColor, deleteMutation.isPending, deleteMutation.variables]);

    const keyExtractor = React.useCallback((item: any) => item._id, []);

    const handleLoadMore = () => {
        if (activeTab === 'all') {
            if (hasNextPage && !isFetchingNextPage) fetchNextPage();
        } else {
            if (myRequestsHasNextPage && !myRequestsFetchingNextPage) myRequestsFetchNextPage();
        }
    };

    const handleRefresh = () => {
        if (activeTab === 'all') refetch();
        else myRequestsRefetch();
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{ headerShown: false, gestureEnabled: true, gestureDirection: 'horizontal' }} />

            <CleanConfirmationModal
                visible={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={confirmDelete}
                title="Delete Request"
                message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                type="danger"
                isLoading={deleteMutation.isPending}
            />

            {/* Header Component */}
            <CategoryListingHeader
                categoryTitle={categoryTitle}
                headerColor={headerColor}
                search={search}
                setSearch={setSearch}
                activeTab={activeTab}
                setActiveTab={(tab) => {
                    if (tab === 'requests') {
                        router.push({
                            pathname: '/user/requests',
                            params: { category: category }
                        });
                    } else {
                        setActiveTab(tab);
                    }
                }}
                onBack={() => {
                    if (router.canGoBack()) {
                        router.back();
                    } else {
                        router.replace('/(drawer)/(tabs)' as any);
                    }
                }}
                onAdd={() => router.push({ pathname: '/(drawer)/place-submission', params: { category: category } })}
                showTooltip={showTooltip}
                onCloseTooltip={handleDismissTooltip}
                tooltipMessage={tooltipMessage}
            >
                {/* Type Filters moved inside Header */}
                {activeTab === 'all' && typesToRender.length > 0 && (
                    <View style={styles.headerTypesContainer}>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.headerTypesScrollContent}
                        >
                            {typesToRender.map((t: any) => (
                                <TouchableOpacity
                                    key={t.key}
                                    onPress={() => setSelectedType(t.key)}
                                    style={[
                                        styles.headerTypeChip,
                                        selectedType === t.key && styles.headerTypeChipActive
                                    ]}
                                >
                                    <View style={[
                                        styles.headerTypeIconContainer,
                                        selectedType === t.key && styles.headerTypeIconContainerActive
                                    ]}>
                                        {t.icon && typeof t.icon === 'string' && t.key !== '' ? (
                                            <Image
                                                source={{ uri: t.icon }}
                                                style={{ width: 14, height: 14 }}
                                                contentFit="contain"
                                                tintColor={selectedType === t.key ? headerColor : undefined}
                                            />
                                        ) : (
                                            <Ionicons
                                                name={t.key === '' ? "apps-outline" : "layers-outline"}
                                                size={14}
                                                color={selectedType === t.key ? headerColor : '#FFFFFF'}
                                            />
                                        )}
                                    </View>
                                    <View style={styles.headerTypeTextContainer}>
                                        <ThemedText style={[
                                            styles.headerTypeChipText,
                                            selectedType === t.key && { color: headerColor },
                                            selectedType === t.key && styles.headerTypeChipTextActive
                                        ]} numberOfLines={1}>
                                            {t.label}
                                        </ThemedText>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}
            </CategoryListingHeader>

            {/* Content */}
            <View style={styles.content}>
                {loading && rawData.length === 0 ? (
                    <View style={styles.listContent}>
                        {[1, 2, 3, 4, 5].map((i) => (
                            <BusinessCardSkeleton key={i} />
                        ))}
                    </View>
                ) : (
                    <>
                        <FlatList
                            data={listData}
                            renderItem={activeTab === 'all' ? renderItem : renderRequestItem}
                            keyExtractor={keyExtractor}
                            contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 20 }]}
                            onRefresh={handleRefresh}
                            refreshing={loading && !isFetchingNextPage && !myRequestsFetchingNextPage}
                            onEndReached={handleLoadMore}
                            onEndReachedThreshold={0.5}
                            ListFooterComponent={
                                () => {
                                    const hasMore = activeTab === 'all' ? hasNextPage : myRequestsHasNextPage;
                                    const isFetching = activeTab === 'all' ? isFetchingNextPage : myRequestsFetchingNextPage;
                                    const hasData = listData.length > 0;

                                    if (isFetching) {
                                        return (
                                            <View style={styles.footerLoader}>
                                                <ActivityIndicator color={colors.primary} />
                                            </View>
                                        );
                                    }

                                    if (!hasMore && hasData) {
                                        return (
                                            <View style={styles.endOfListContainer}>
                                                <View style={[styles.endOfListLine, { backgroundColor: colors.border }]} />
                                                <ThemedText style={[styles.endOfListText, { color: colors.icon }]}>
                                                    You've reached the end of the list
                                                </ThemedText>
                                                <View style={[styles.endOfListLine, { backgroundColor: colors.border }]} />
                                            </View>
                                        );
                                    }

                                    return <View style={{ height: 20 }} />;
                                }
                            }
                            ListEmptyComponent={
                                <EmptyListingState activeTab={activeTab} categoryTitle={categoryTitle} />
                            }
                        />
                    </>
                )}
            </View>

            <ReportModal
                ref={reportModalRef}
                targetId={reportTarget?.id || ''}
                targetType={reportTarget?.type || 'PLACE'}
            />
        </View>
    );
});

export default CategoryListingScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },

    content: {
        flex: 1,
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 16,
        paddingBottom: 40,
    },
    footerLoader: {
        paddingVertical: 30,
        alignItems: 'center',
    },
    endOfListContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
        paddingHorizontal: 16,
        gap: 15,
    },
    endOfListLine: {
        height: 1,
        flex: 1,
        opacity: 0.3,
    },
    endOfListText: {
        fontSize: 13,
        fontWeight: '600',
        opacity: 0.6,
        letterSpacing: 0.5,
    },
    typesContainer: {
        paddingVertical: 12,
        paddingHorizontal: 4,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    typesScrollContent: {
        paddingHorizontal: 12,
        gap: 10,
    },
    headerTypesContainer: {
        paddingVertical: 10,
        marginTop: 4,
    },
    headerTypesScrollContent: {
        paddingHorizontal: 0,
        gap: 8,
    },
    headerTypeChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        height: 36,
        marginRight: 8,
    },
    headerTypeChipActive: {
        backgroundColor: '#FFFFFF',
        borderColor: '#FFFFFF',
    },
    headerTypeIconContainer: {
        width: 20,
        height: 20,
        borderRadius: 6,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    headerTypeIconContainerActive: {
        backgroundColor: 'transparent',
    },
    headerTypeTextContainer: {
        marginLeft: 6,
        justifyContent: 'center',
    },
    headerTypeChipText: {
        fontSize: 12,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.9)',
    },
    headerTypeChipTextActive: {
        fontWeight: '800',
    },
    typeChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        gap: 8,
    },
    typeChipImageContainer: {
        width: 18,
        height: 18,
        borderRadius: 9,
        overflow: 'hidden',
    },
    typeChipText: {
        fontSize: 13,
        fontWeight: '600',
    },
});
