import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator, Dimensions, Modal, Linking, Alert, Platform } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { getMarketplaceDetails, MARKETPLACE_QUERY_KEYS, incrementMarketplaceInquiry, deleteMarketplaceListing, markMarketplaceListingAsSold, toggleMarketplaceListingStatus } from '@/apis/marketplace';
import Toast from 'react-native-toast-message';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BannerAd from '@/ads/components/BannerAd';
import { ActionMenu } from '@/components/common/ActionMenu';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { LoaderOverlay } from '@/components/common/LoaderOverlay';
const { width } = Dimensions.get('window');

export default function MarketplaceDetailsScreen() {
    const { id, otherItems } = useLocalSearchParams<{ id: string, otherItems?: string }>();
    const router = useRouter();
    const { theme, isDark } = useTheme();
    const colors = Colors[theme];
    const { user } = useAuth();
    const insets = useSafeAreaInsets();

    const [viewerVisible, setViewerVisible] = useState(false);
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const queryClient = useQueryClient();
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showSoldConfirm, setShowSoldConfirm] = useState(false);

    const parsedOtherItems = React.useMemo(() => {
        if (!otherItems) return [];
        try { return JSON.parse(otherItems); } catch { return []; }
    }, [otherItems]);

    const { data: response, isLoading, isError } = useQuery({
        queryKey: MARKETPLACE_QUERY_KEYS.details(id as string),
        queryFn: () => getMarketplaceDetails(id as string),
        enabled: !!id,
    });

    const item = response?.data;
    const isOwner = user?.user?._id && item?.sellerId && (item.sellerId._id || item.sellerId).toString() === user.user._id.toString();

    const formattedDate = React.useMemo(() => {
        if (!item?.createdAt) return null;
        try {
            const date = new Date(item.createdAt);
            if (isNaN(date.getTime())) return null;
            return date.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
        } catch {
            return null;
        }
    }, [item?.createdAt]);

    const handleCall = () => {
        if (item?.sellerPhone) {
            Linking.openURL(`tel:${item.sellerPhone}`);
        } else {
            Alert.alert("Error", "Phone number not available");
        }
    };

    const markSoldMutation = useMutation({
        mutationFn: () => markMarketplaceListingAsSold(item?._id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: MARKETPLACE_QUERY_KEYS.all });
            queryClient.invalidateQueries({ queryKey: MARKETPLACE_QUERY_KEYS.details(id as string) });
            Toast.show({ type: 'success', text1: 'Success', text2: 'Item marked as sold!' });
        },
        onError: (err: any) => {
            Toast.show({ type: 'error', text1: 'Error', text2: err.message || 'Failed to update listing' });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: () => deleteMarketplaceListing(item?._id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: MARKETPLACE_QUERY_KEYS.all });
            Toast.show({ type: 'success', text1: 'Deleted', text2: 'Listing deleted successfully!' });
            router.back();
        },
        onError: (err: any) => {
            Toast.show({ type: 'error', text1: 'Error', text2: err.message || 'Failed to delete listing' });
        }
    });

    const toggleStatusMutation = useMutation({
        mutationFn: (newStatus: 'live' | 'offline') => toggleMarketplaceListingStatus(item?._id, newStatus),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: MARKETPLACE_QUERY_KEYS.all });
            queryClient.invalidateQueries({ queryKey: MARKETPLACE_QUERY_KEYS.details(id as string) });
            Toast.show({ type: 'success', text1: 'Success', text2: 'Listing status updated!' });
        },
        onError: (err: any) => {
            Toast.show({ type: 'error', text1: 'Error', text2: err.message || 'Failed to update status' });
        }
    });

    const confirmMarkSold = () => {
        setShowSoldConfirm(true);
    };

    const confirmDelete = () => {
        setShowDeleteConfirm(true);
    };

    const handleEdit = () => {
        router.push({
            pathname: '/listing/create',
            params: { listing: JSON.stringify(item) }
        });
    };

    const ownerActions = [
        ...(item?.status !== 'sold' ? [
            { label: 'Edit Listing', icon: 'create-outline' as const, onPress: handleEdit },
            { label: 'Mark Sold', icon: 'checkmark-circle-outline' as const, color: '#10B981', onPress: confirmMarkSold },
            ...(item?.status === 'live' ? [
                { label: 'Go Offline', icon: 'eye-off-outline' as const, color: '#F59E0B', onPress: () => toggleStatusMutation.mutate('offline') }
            ] : []),
            ...(item?.status === 'offline' ? [
                { label: 'Go Live', icon: 'eye-outline' as const, color: '#10B981', onPress: () => toggleStatusMutation.mutate('live') }
            ] : [])
        ] : []),
        { label: 'Delete', icon: 'trash-outline' as const, color: '#EF4444', onPress: confirmDelete, destructive: true }
    ];

    const renderHeader = () => (
        <View style={[styles.header, { backgroundColor: colors.primary, paddingTop: insets.top + (Platform.OS === 'android' ? 12 : 8) }]}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={20} color="#fff" />
            </TouchableOpacity>
            <ThemedText style={styles.headerTitle} numberOfLines={1}>
                Marketplace Item
            </ThemedText>
            <View style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}>
                {isOwner && item?.status !== 'sold' ? (
                    <ActionMenu actions={ownerActions} triggerIconColor="#fff" triggerIconSize={24} />
                ) : null}
            </View>
        </View>
    );

    const renderStatusBadge = () => {
        if (!item?.status) return null;
        const isActive = item.status === 'live';
        return (
            <View style={[styles.statusTab, { backgroundColor: isActive ? '#10B981' : '#6B7280' }]}>
                <ThemedText style={styles.statusTabText}>{isActive ? 'LIVE' : item.status.toUpperCase()}</ThemedText>
            </View>
        );
    };

    if (isLoading) {
        return (
            <View style={[styles.loaderContainer, { backgroundColor: colors.background }]}>
                <Stack.Screen options={{ title: 'Loading...', headerShown: false }} />
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (isError || !item) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
                <Stack.Screen options={{ headerShown: false }} />
                {renderHeader()}
                <View style={styles.centered}>
                    <ThemedText style={{ color: colors.text }}>Item not found</ThemedText>
                    <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
                        <ThemedText style={{ color: colors.primary }}>Go Back</ThemedText>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    const category = typeof item.category === 'object' ? (item.category.en || item.category.ur) : item.category;
    const type = typeof item.type === 'object' ? (item.type.en || item.type.ur) : item.type;

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{ headerShown: false }} />
            {renderHeader()}
            <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
                {item.images && item.images.length > 0 ? (
                    <View style={styles.imageContainer}>
                        {isOwner && renderStatusBadge()}
                        <ScrollView
                            horizontal
                            pagingEnabled
                            showsHorizontalScrollIndicator={false}
                            onMomentumScrollEnd={(e) => {
                                const index = Math.round(e.nativeEvent.contentOffset.x / width);
                                setActiveImageIndex(index);
                            }}
                        >
                            {item.images.map((img: string, idx: number) => (
                                <TouchableOpacity
                                    key={idx}
                                    activeOpacity={0.9}
                                    onPress={() => {
                                        setActiveImageIndex(idx);
                                        setViewerVisible(true);
                                    }}
                                >
                                    <Image source={{ uri: img }} style={[styles.mainImage, { width }]} resizeMode="cover" />
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                        {item.images.length > 1 && (
                            <View style={styles.pagination}>
                                <ThemedText style={styles.paginationText}>
                                    {activeImageIndex + 1} / {item.images.length}
                                </ThemedText>
                            </View>
                        )}
                    </View>
                ) : (
                    <View style={[styles.noImage, { backgroundColor: colors.card, width }]}>
                        {isOwner && renderStatusBadge()}
                        <Ionicons name="images-outline" size={48} color={colors.textSecondary} />
                        <ThemedText style={{ color: colors.textSecondary, marginTop: 8 }}>No Images</ThemedText>
                    </View>
                )}

                <View style={[styles.detailsCard, { backgroundColor: isDark ? '#1e293b' : '#FFFFFF' }]}>
                    
                    {/* Title */}
                    <View style={styles.titleWrapper}>
                        <ThemedText style={[styles.heroTitle, { color: colors.text, textAlign: 'left', textTransform: 'capitalize' }]} >
                            {item.title}
                        </ThemedText>
                        <ThemedText style={[styles.price, { color: colors.primary }]}>
                            Rs. {item.price ? item.price.toLocaleString() : '0'}
                        </ThemedText>
                    </View>

                    {/* Quick Interactive Actions Row */}
                    {!isOwner && item?.status === 'live' && (
                        <View style={[styles.actionRow, { borderBottomColor: isDark ? '#334155' : '#f1f5f9' }]}>
                            {item.sellerPhone ? (
                                <TouchableOpacity
                                    style={[styles.actionBtnPrimary, { backgroundColor: colors.primary }]}
                                    onPress={handleCall}
                                    activeOpacity={0.8}
                                >
                                    <Ionicons name="call" size={20} color="#FFFFFF" />
                                    <ThemedText style={styles.actionBtnTextPrimary}>Call Seller</ThemedText>
                                </TouchableOpacity>
                            ) : (
                                <View style={[styles.actionBtnPrimary, { backgroundColor: colors.border, opacity: 0.6 }]}>
                                    <Ionicons name="call-outline" size={20} color={colors.textSecondary} />
                                    <ThemedText style={[styles.actionBtnTextPrimary, { color: colors.textSecondary }]}>No Phone</ThemedText>
                                </View>
                            )}

                            <TouchableOpacity
                                style={[styles.actionBtnSec, { backgroundColor: isDark ? '#334155' : '#f1f5f9' }]}
                                onPress={() => {}}
                                activeOpacity={0.8}
                            >
                                <Ionicons name="share-social" size={20} color={colors.textSecondary} />
                                <ThemedText style={[styles.actionBtnTextSec, { color: colors.textSecondary }]}>Share</ThemedText>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Banner Ad */}
                    <View style={styles.detailAdWrapper}>
                        <BannerAd placement="marketplace-details" />
                    </View>

                    {/* Details Sections */}
                    <View style={styles.sectionsContainer}>

                        {/* Section: Description */}
                        {item.description && (
                            <View style={styles.detailSection}>
                                <ThemedText style={[styles.sectionHeading, { color: colors.textSecondary }]}>
                                    Description
                                </ThemedText>
                                <ThemedText style={[styles.descriptionText, { color: colors.text }]}>
                                    {item.description}
                                </ThemedText>
                            </View>
                        )}

                        {/* Section: Details & Location */}
                        <View style={styles.detailSection}>
                            <ThemedText style={[styles.sectionHeading, { color: colors.textSecondary }]}>
                                Item Details
                            </ThemedText>

                            <View style={styles.infoListItem}>
                                <View style={[styles.infoListIcon, { backgroundColor: colors.primary + '10' }]}>
                                    <Ionicons name="pricetag" size={12} color={colors.primary} />
                                </View>
                                <View style={styles.infoListContent}>
                                    <ThemedText style={[styles.infoListLabel, { color: colors.textSecondary }]}>Condition / Type</ThemedText>
                                    <ThemedText style={[styles.infoListVal, { color: colors.text, textTransform: 'capitalize' }]}>
                                        {item.condition || 'Used'} {type ? `• ${type}` : ''}
                                    </ThemedText>
                                </View>
                            </View>

                            {category && (
                                <View style={styles.infoListItem}>
                                    <View style={[styles.infoListIcon, { backgroundColor: colors.primary + '10' }]}>
                                        <Ionicons name="grid" size={12} color={colors.primary} />
                                    </View>
                                    <View style={styles.infoListContent}>
                                        <ThemedText style={[styles.infoListLabel, { color: colors.textSecondary }]}>Category</ThemedText>
                                        <ThemedText style={[styles.infoListVal, { color: colors.text, textTransform: 'capitalize' }]}>
                                            {category}
                                        </ThemedText>
                                    </View>
                                </View>
                            )}

                            <View style={styles.infoListItem}>
                                <View style={[styles.infoListIcon, { backgroundColor: colors.primary + '10' }]}>
                                    <Ionicons name="calendar" size={12} color={colors.primary} />
                                </View>
                                <View style={styles.infoListContent}>
                                    <ThemedText style={[styles.infoListLabel, { color: colors.textSecondary }]}>Date Posted</ThemedText>
                                    <ThemedText style={[styles.infoListVal, { color: colors.text }]}>{formattedDate}</ThemedText>
                                </View>
                            </View>

                            <View style={styles.infoListItem}>
                                <View style={[styles.infoListIcon, { backgroundColor: colors.primary + '10' }]}>
                                    <Ionicons name="location" size={12} color={colors.primary} />
                                </View>
                                <View style={styles.infoListContent}>
                                    <ThemedText style={[styles.infoListLabel, { color: colors.textSecondary }]}>Location</ThemedText>
                                    <ThemedText style={[styles.infoListVal, { color: colors.text }]}>
                                        {item?.village ? `${item.village}, ${item.city}` : item?.city}
                                    </ThemedText>
                                </View>
                            </View>
                        </View>

                        {/* Metadata tags */}
                        {item.metadata && Object.keys(item.metadata).length > 0 && (
                            <View style={styles.detailSection}>
                                <ThemedText style={[styles.sectionHeading, { color: colors.textSecondary }]}>
                                    Additional Info
                                </ThemedText>
                                <View style={styles.detailsTagsContainer}>
                                    {Object.entries(item.metadata).map(([key, val], index) => (
                                        <View
                                            key={index}
                                            style={[
                                                styles.detailTagChip,
                                                { backgroundColor: colors.primary + '15' }
                                            ]}
                                        >
                                            <ThemedText style={[styles.detailTagText, { color: colors.primary }]}>
                                                {key.toUpperCase()}: {String(val)}
                                            </ThemedText>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}

                        {/* Other Items */}
                        {parsedOtherItems.length > 0 && (
                            <View style={[styles.detailSection, { marginTop: 16 }]}>
                                <ThemedText style={[styles.sectionHeading, { color: colors.textSecondary }]}>
                                    Other Items by Seller
                                </ThemedText>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.otherItemsScroll} contentContainerStyle={{ gap: 12, paddingRight: 16 }}>
                                    {parsedOtherItems.map((otherItem: any) => (
                                        <TouchableOpacity
                                            key={otherItem._id}
                                            style={[styles.smallCard, { backgroundColor: colors.card }]}
                                            onPress={() => {
                                                const isOtherItemOwner = user?.user?._id && otherItem.sellerId && otherItem.sellerId.toString() === user.user._id.toString();
                                                if (!isOtherItemOwner) {
                                                    incrementMarketplaceInquiry(otherItem._id).catch(console.error);
                                                }
                                                router.push(`/marketplace/${otherItem._id}` as any);
                                            }}
                                        >
                                            <Image source={{ uri: otherItem.image || 'https://via.placeholder.com/150' }} style={styles.smallCardImage} />
                                            <View style={styles.smallCardInfo}>
                                                <ThemedText style={[styles.smallCardTitle, { color: colors.text }]} numberOfLines={1}>{otherItem.title}</ThemedText>
                                                <ThemedText style={[styles.smallCardPrice, { color: colors.primary }]}>Rs. {otherItem.price}</ThemedText>
                                            </View>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        )}
                    </View>
                </View>
            </ScrollView>

            {/* Image Viewer Modal */}
            <Modal visible={viewerVisible} transparent={true} animationType="fade" onRequestClose={() => setViewerVisible(false)}>
                <View style={styles.viewerContainer}>
                    <TouchableOpacity style={styles.viewerClose} onPress={() => setViewerVisible(false)}>
                        <Ionicons name="close" size={30} color="#fff" />
                    </TouchableOpacity>
                    <ScrollView
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        contentOffset={{ x: activeImageIndex * width, y: 0 }}
                        onMomentumScrollEnd={(e) => {
                            const index = Math.round(e.nativeEvent.contentOffset.x / width);
                            setActiveImageIndex(index);
                        }}
                    >
                        {item.images?.map((img: string, idx: number) => (
                            <View key={idx} style={{ width, justifyContent: 'center', alignItems: 'center' }}>
                                <Image source={{ uri: img }} style={{ width: '100%', height: '80%' }} resizeMode="contain" />
                            </View>
                        ))}
                    </ScrollView>
                    <View style={styles.viewerPagination}>
                        <ThemedText style={styles.viewerPaginationText}>
                            {activeImageIndex + 1} / {item.images?.length || 0}
                        </ThemedText>
                    </View>
                </View>
            </Modal>

            <ConfirmationModal
                visible={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={() => {
                    setShowDeleteConfirm(false);
                    deleteMutation.mutate();
                }}
                title="Delete Listing"
                message="Are you sure you want to remove this listing? This action cannot be undone."
                type="danger"
                confirmText="Delete"
                cancelText="Cancel"
            />

            <ConfirmationModal
                visible={showSoldConfirm}
                onClose={() => setShowSoldConfirm(false)}
                onConfirm={() => {
                    setShowSoldConfirm(false);
                    markSoldMutation.mutate();
                }}
                title="Mark as Sold"
                message="Mark this item as sold? It will no longer be visible in public listings."
                type="info"
                confirmText="Yes, Mark Sold"
                cancelText="Cancel"
            />

            <LoaderOverlay visible={markSoldMutation.isPending || deleteMutation.isPending || toggleStatusMutation.isPending} text="Updating..." />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    backButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        flex: 1,
        textAlign: 'center',
        color: '#fff',
    },
    headerActionsRight: {
        position: 'absolute',
        right: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    content: {
        flex: 1,
    },
    imageContainer: {
        position: 'relative',
    },
    mainImage: {
        height: 300,
    },
    statusTab: {
        position: 'absolute',
        top: 12,
        left: 12,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        zIndex: 5,
    },
    statusTabText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    noImage: {
        height: 300,
        justifyContent: 'center',
        alignItems: 'center',
    },
    pagination: {
        position: 'absolute',
        bottom: 28,
        right: 12,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    paginationText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    detailsCard: {
        paddingHorizontal: 16,
        paddingTop: 24,
        flex: 1,
        marginTop: -16,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
    },
    titleWrapper: {
        marginBottom: 16,
    },
    heroTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 0.2,
        marginBottom: 4,
    },
    price: {
        fontSize: 24,
        fontWeight: '900',
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 12,
        paddingBottom: 16,
        paddingTop: 4,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
        marginBottom: 16,
    },
    actionBtnPrimary: {
        flex: 1,
        height: 48,
        borderRadius: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    actionBtnTextPrimary: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700',
    },
    actionBtnSec: {
        flex: 1,
        height: 48,
        borderRadius: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    actionBtnTextSec: {
        fontSize: 15,
        fontWeight: '700',
    },
    detailAdWrapper: {
        marginBottom: 16,
        alignItems: 'center',
    },
    sectionsContainer: {
        gap: 16,
    },
    detailSection: {
        gap: 6,
    },
    sectionHeading: {
        fontSize: 11,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: 4,
    },
    descriptionText: {
        fontSize: 14,
        lineHeight: 22,
    },
    infoListItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
        gap: 12,
    },
    infoListIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    infoListContent: {
        flex: 1,
    },
    infoListLabel: {
        fontSize: 10,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    infoListVal: {
        fontSize: 14,
        fontWeight: '500',
    },
    detailsTagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 4,
    },
    detailTagChip: {
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 6,
        flexDirection: 'row',
        alignItems: 'center',
    },
    detailTagText: {
        fontSize: 12,
        fontWeight: '600',
    },
    viewerContainer: {
        flex: 1,
        backgroundColor: '#000',
    },
    viewerClose: {
        position: 'absolute',
        top: 50,
        right: 20,
        zIndex: 20,
        padding: 8,
    },
    viewerPagination: {
        position: 'absolute',
        bottom: 50,
        alignSelf: 'center',
    },
    viewerPaginationText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    otherItemsScroll: {
        marginTop: 8,
        marginHorizontal: -16,
        paddingHorizontal: 16,
    },
    smallCard: {
        width: 140,
        borderRadius: 12,
        overflow: 'hidden',
    },
    smallCardImage: {
        width: '100%',
        height: 100,
        backgroundColor: '#eee',
    },
    smallCardInfo: {
        padding: 8,
    },
    smallCardTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
        textTransform: 'capitalize',
    },
    smallCardPrice: {
        fontSize: 14,
        fontWeight: 'bold',
    },
});
