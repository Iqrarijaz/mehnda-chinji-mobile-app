import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator, Dimensions, Modal, Linking, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { getMarketplaceDetails, MARKETPLACE_QUERY_KEYS, incrementMarketplaceInquiry, deleteMarketplaceListing, markMarketplaceListingAsSold } from '@/apis/marketplace';
import Toast from 'react-native-toast-message';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BannerAd from '@/ads/components/BannerAd';
import { ActionMenu } from '@/components/common/ActionMenu';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
const { width } = Dimensions.get('window');

export default function MarketplaceDetailsScreen() {
    const { id, otherItems } = useLocalSearchParams<{ id: string, otherItems?: string }>();
    const router = useRouter();
    const { theme } = useTheme();
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
            { label: 'Mark Sold', icon: 'checkmark-circle-outline' as const, color: '#10B981', onPress: confirmMarkSold }
        ] : []),
        { label: 'Delete', icon: 'trash-outline' as const, color: '#EF4444', onPress: confirmDelete, destructive: true }
    ];

    const renderHeader = () => (
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={20} color="#fff" />
            </TouchableOpacity>
            <ThemedText style={[styles.headerTitle, { color: '#fff' }]} numberOfLines={1}>
                Details
            </ThemedText>
            <View style={{ width: 36, alignItems: 'flex-end', justifyContent: 'center' }}>
                {isOwner ? (
                    <View style={styles.headerActionsRight}>
                        <ActionMenu actions={ownerActions} triggerIconColor="#fff" triggerIconSize={24} />
                    </View>
                ) : item?.status === 'live' ? (
                    <View style={styles.headerActionsRight}>

                        <TouchableOpacity onPress={handleCall} style={styles.headerIconButton}>
                            <Ionicons name="call-outline" size={20} color="#fff" />
                        </TouchableOpacity>
                    </View>
                ) : null}
            </View>
        </View>
    );

    if (isLoading) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
                {renderHeader()}
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </View>
        );
    }

    if (isError || !item) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
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

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'sold': return '#EF4444';
            case 'pending': return '#F59E0B';
            case 'live':
            default:
                return '#10B981';
        }
    };

    const renderStatusBadge = () => (
        <View style={[styles.statusTab, { backgroundColor: getStatusColor(item.status) }]}>
            <ThemedText style={styles.statusTabText}>{item.status?.toUpperCase() || 'LIVE'}</ThemedText>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
            {renderHeader()}

            <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 24 }}>
                {/* Images */}
                {item.images && item.images.length > 0 ? (
                    <View>
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

                <View style={styles.detailsSection}>
                    {/* Title & Price */}
                    <View style={styles.titleRow}>
                        <ThemedText style={[styles.title, { color: colors.text, textTransform: 'capitalize' }]} >
                            {item.title}
                        </ThemedText>
                        <ThemedText style={[styles.price, { color: colors.primary }]}>
                            Rs. {item.price ? item.price.toLocaleString() : '0'}
                        </ThemedText>
                    </View>

                    {/* Location & Date */}
                    <View style={styles.infoRow}>
                        <View style={styles.infoItem}>
                            <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
                            <ThemedText style={[styles.infoText, { color: colors.textSecondary }]}>
                                {item?.village ? `${item.village}, ${item.city}` : item?.city}
                            </ThemedText>
                        </View>
                        <View style={styles.infoItem}>
                            <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
                            <ThemedText style={[styles.infoText, { color: colors.textSecondary }]}>{formattedDate}</ThemedText>
                        </View>
                    </View>

                    {/* Category & Type */}
                    <View style={styles.infoRow}>
                        {item.category && (
                            <View style={styles.infoItem}>
                                <Ionicons name="grid-outline" size={16} color={colors.textSecondary} />
                                <ThemedText style={[styles.infoText, { color: colors.textSecondary, textTransform: 'capitalize' }]}>
                                    {typeof item.category === 'object' ? (item.category.en || item.category.ur) : item.category}
                                </ThemedText>
                            </View>
                        )}
                        {item.type && (
                            <View style={styles.infoItem}>
                                <Ionicons name="pricetag-outline" size={16} color={colors.textSecondary} />
                                <ThemedText style={[styles.infoText, { color: colors.textSecondary, textTransform: 'capitalize' }]}>
                                    {typeof item.type === 'object' ? (item.type.en || item.type.ur) : item.type}
                                </ThemedText>
                            </View>
                        )}
                    </View>

                    {/* Metadata tags */}
                    {item.metadata && Object.keys(item.metadata).length > 0 && (
                        <View style={[styles.metadataContainer, { backgroundColor: colors.card }]}>
                            {Object.entries(item.metadata).map(([key, val]) => (
                                <View key={key} style={styles.metadataTag}>
                                    <ThemedText style={[styles.metaTagKey, { color: colors.textSecondary }]}>
                                        {key.toUpperCase()}:
                                    </ThemedText>
                                    <ThemedText style={[styles.metaTagVal, { color: colors.text }]}>
                                        {String(val)}
                                    </ThemedText>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Description */}
                    <View style={styles.descriptionContainer}>
                        <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>Description</ThemedText>
                        <ThemedText style={[styles.description, { color: colors.textSecondary }]}>
                            {item.description || 'No description provided.'}
                        </ThemedText>
                    </View>

                    {/* Banner Ad */}
                    <BannerAd placement="marketplace-details" />

                    {/* Other Items */}
                    {parsedOtherItems.length > 0 && (
                        <View style={styles.otherItemsContainer}>
                            <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>Other Items</ThemedText>
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
    },
    headerActionsRight: {
        position: 'absolute',
        right: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    headerIconButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        flex: 1,
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
        bottom: 12,
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
    detailsSection: {
        padding: 16,
    },
    titleRow: {
        marginBottom: 12,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    price: {
        fontSize: 24,
        fontWeight: '900',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    infoText: {
        fontSize: 14,
        marginLeft: 6,
    },
    metadataContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
        gap: 8,
    },
    metadataTag: {
        flexDirection: 'row',
        backgroundColor: 'rgba(0,0,0,0.05)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        alignItems: 'center',
    },
    metaTagKey: {
        fontSize: 12,
        fontWeight: '700',
    },
    metaTagVal: {
        fontSize: 13,
        fontWeight: '600',
        marginLeft: 4,
    },
    descriptionContainer: {
        marginTop: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    description: {
        fontSize: 15,
        lineHeight: 24,
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
    otherItemsContainer: {
        marginTop: 24,
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
