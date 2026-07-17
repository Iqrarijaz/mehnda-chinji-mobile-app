import React, { memo, useState } from 'react';
import { StyleSheet, View, Image, TouchableOpacity, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '../ThemedText';
import { useAuth } from '@/context/AuthContext';
import { ActionMenu, ActionMenuItem } from '../common/ActionMenu';
import { ConfirmationModal } from '../ui/ConfirmationModal';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteMarketplaceListing, markMarketplaceListingAsSold, incrementMarketplaceInquiry, toggleMarketplaceListingStatus, MARKETPLACE_QUERY_KEYS } from '@/apis/marketplace';

interface MarketplaceCardProps {
    item: any;
    otherItemsStr?: string;
    colors: any;
    onEdit?: (item: any) => void;
    showActions?: boolean;
}

export const MarketplaceCard = memo(({ item, otherItemsStr, colors, onEdit, showActions }: MarketplaceCardProps) => {
    const { user } = useAuth();
    const router = useRouter();
    const queryClient = useQueryClient();
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showPhoneErrorModal, setShowPhoneErrorModal] = useState(false);

    const isOwner = user?.user?._id && item.sellerId && (item.sellerId._id || item.sellerId).toString() === user.user._id.toString();

    const formattedDate = React.useMemo(() => {
        if (!item.createdAt) return null;
        try {
            const date = new Date(item.createdAt);
            if (isNaN(date.getTime())) return null;
            return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
        } catch {
            return null;
        }
    }, [item.createdAt]);

    // Handle Contact / Phone Dial
    const handleCall = React.useCallback(async () => {
        const phone = item.sellerPhone;
        if (!phone) {
            Toast.show({ type: 'error', text1: 'Contact Failed', text2: 'Seller phone number is unavailable.' });
            return;
        }
        try {
            // Register inquiry metric
            incrementMarketplaceInquiry(item._id).catch(err => console.log("Failed to log inquiry:", err));

            const url = `tel:${phone}`;
            const supported = await Linking.canOpenURL(url);
            if (supported) {
                await Linking.openURL(url);
            } else {
                setShowPhoneErrorModal(true);
            }
        } catch (error) {
            console.log(error);
        }
    }, [item.sellerPhone, item._id]);


    // Mark as Sold Mutation
    const markSoldMutation = useMutation({
        mutationFn: () => markMarketplaceListingAsSold(item._id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: MARKETPLACE_QUERY_KEYS.all });
            Toast.show({ type: 'success', text1: 'Success', text2: 'Item marked as sold!' });
        },
        onError: (err: any) => {
            Toast.show({ type: 'error', text1: 'Error', text2: err.message || 'Failed to update listing' });
        }
    });

    // Delete Mutation
    const deleteMutation = useMutation({
        mutationFn: () => deleteMarketplaceListing(item._id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: MARKETPLACE_QUERY_KEYS.all });
            Toast.show({ type: 'success', text1: 'Deleted', text2: 'Listing deleted successfully!' });
        },
        onError: (err: any) => {
            Toast.show({ type: 'error', text1: 'Error', text2: err.message || 'Failed to delete listing' });
        }
    });

    // Toggle Status Mutation
    const toggleStatusMutation = useMutation({
        mutationFn: (newStatus: 'live' | 'offline') => toggleMarketplaceListingStatus(item._id, newStatus),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: MARKETPLACE_QUERY_KEYS.all });
            Toast.show({ type: 'success', text1: 'Success', text2: 'Listing status updated!' });
        },
        onError: (err: any) => {
            Toast.show({ type: 'error', text1: 'Error', text2: err.message || 'Failed to update listing status' });
        }
    });

    const confirmDelete = React.useCallback(() => {
        setShowDeleteConfirm(true);
    }, []);

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'sold': return '#FF5A5F';
            case 'pending': return '#F0803C';
            case 'offline': return '#6B7280';
            case 'live':
            default:
                return '#7BC043';
        }
    };

    const renderStatusBadge = () => (
        <View style={[styles.statusTab, { backgroundColor: getStatusColor(item.status) }]}>
            <ThemedText style={styles.statusTabText}>{item.status?.toUpperCase() || 'LIVE'}</ThemedText>
        </View>
    );

    const confirmMarkSold = React.useCallback(() => {
        Alert.alert(
            "Mark as Sold",
            "Mark this item as sold? It will no longer be visible in public listings.",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Yes, Mark Sold", onPress: () => markSoldMutation.mutate() }
            ]
        );
    }, [markSoldMutation]);

    const actions = React.useMemo(() => {
        const baseActions: ActionMenuItem[] = [
            { label: 'Delete', icon: 'trash-outline', color: '#FF5A5F', onPress: confirmDelete, destructive: true }
        ];
        if (item.status !== 'sold') {
            if (item.status === 'live') {
                baseActions.unshift({ label: 'Go Offline', icon: 'eye-off-outline', onPress: () => toggleStatusMutation.mutate('offline') });
            } else if (item.status === 'offline') {
                baseActions.unshift({ label: 'Go Online', icon: 'eye-outline', onPress: () => toggleStatusMutation.mutate('live') });
            }

            baseActions.unshift(
                { label: 'Edit Listing', icon: 'create-outline', onPress: () => onEdit?.(item) },
                { label: 'Mark Sold', icon: 'checkmark-circle-outline', color: '#7BC043', onPress: confirmMarkSold }
            );
        }
        return baseActions;
    }, [item.status, item, confirmDelete, confirmMarkSold, onEdit, toggleStatusMutation]);

    const handlePress = React.useCallback(() => {
        if (!isOwner) {
            incrementMarketplaceInquiry(item._id).catch(console.error);
        }
        router.push({
            pathname: `/marketplace/${item._id}`,
            params: otherItemsStr ? { otherItems: otherItemsStr } : {}
        } as any)
    }, [isOwner, item._id, otherItemsStr, router]);

    return (
        <>
            <TouchableOpacity
                style={[styles.container, { backgroundColor: colors.card }]}
                activeOpacity={0.9}
                onPress={handlePress}
            >

                {/* Listing Image */}
                {item.images && item.images.length > 0 ? (
                    <View style={styles.imageContainer}>
                        <Image source={{ uri: item.images[0] }} style={styles.image} resizeMode="cover" />
                        {(isOwner && showActions) && renderStatusBadge()}
                        {item.images.length > 1 && (
                            <View style={styles.imageBadge}>
                                <ThemedText style={styles.imageBadgeText}>+{item.images.length - 1} photos</ThemedText>
                            </View>
                        )}
                    </View>
                ) : (
                    <View style={[styles.imagePlaceholder, { backgroundColor: colors.background }]}>
                        <Ionicons name="images-outline" size={48} color={colors.textSecondary} />
                        <ThemedText style={[styles.imagePlaceholderText, { color: colors.textSecondary }]}>No Images Available</ThemedText>
                        {(isOwner && showActions) && renderStatusBadge()}
                    </View>
                )}

                {/* Content Details */}
                <View style={styles.detailsContainer}>

                    <View style={{ marginTop: 4, marginBottom: 4 }}>
                        <ThemedText style={[styles.title, { color: colors.primary }]}>
                            {item.title}
                        </ThemedText>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 8 }}>
                                <Ionicons name="location-outline" size={12} color={colors.textSecondary} />
                                <ThemedText style={{ color: colors.textSecondary, fontSize: 11, marginLeft: 4 }} numberOfLines={1}>
                                    {item.village ? `${item.village}, ${item.city}` : item.city}
                                </ThemedText>
                            </View>
                            {isOwner && showActions ? (
                                <ActionMenu actions={actions} />
                            ) : formattedDate ? (
                                <ThemedText style={{ color: colors.textSecondary, fontSize: 10, marginLeft: 8 }}>
                                    {formattedDate}
                                </ThemedText>
                            ) : null}
                        </View>
                    </View>

                    {/* Metadata details rendering for Vehicles */}
                    {/* {item.metadata && Object.keys(item.metadata).filter(key => key.toLowerCase() !== 'model' && key.toLowerCase() !== 'year').length > 0 && (
                        <View style={[styles.metadataContainer, { backgroundColor: colors.background }]}>
                            {Object.entries(item.metadata)
                                .filter(([key]) => key.toLowerCase() !== 'model' && key.toLowerCase() !== 'year')
                                .map(([key, val]) => (
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
                    )} */}

                </View>
            </TouchableOpacity>
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
                visible={showPhoneErrorModal}
                onClose={() => setShowPhoneErrorModal(false)}
                onConfirm={() => setShowPhoneErrorModal(false)}
                title="Dialer Not Supported"
                message={`Call dialer is not supported on this device. Phone: ${item.sellerPhone}`}
                type="danger"
                confirmText="OK"
                cancelText="Close"
            />
        </>
    );
});

const styles = StyleSheet.create({
    container: {
        borderRadius: 16,
        marginBottom: 16,
        overflow: 'hidden',
        flex: 1,
    },
    header: {
        position: 'absolute',
        top: 8,
        right: 8,
        zIndex: 10,
    },
    dateText: {
        fontSize: 10,
    },

    imageContainer: {
        height: 130,
        width: '100%',
        position: 'relative',
    },
    image: {
        height: '100%',
        width: '100%',
    },
    imageBadge: {
        position: 'absolute',
        bottom: 10,
        right: 10,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    imageBadgeText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '600',
    },
    statusTab: {
        position: 'absolute',
        top: 8,
        left: 8,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        zIndex: 5,
    },
    statusTabText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    imagePlaceholder: {
        height: 180,
        justifyContent: 'center',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    imagePlaceholderText: {
        fontSize: 12,
        marginTop: 8,
    },
    detailsContainer: {
        paddingHorizontal: 6,
    },
    categoryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    categoryBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    categoryText: {
        fontSize: 10,
        fontWeight: '600',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '700',
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    priceText: {
        fontSize: 16,
        fontWeight: '800',
    },
    negotiableBadge: {
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginLeft: 8,
    },
    negotiableText: {
        color: '#7BC043',
        fontSize: 10,
        fontWeight: '700',
    },
    title: {
        fontSize: 14,
        fontWeight: '700',
        marginTop: 2,
        textTransform: 'capitalize',
    },
    description: {
        fontSize: 12,
        marginTop: 4,
        lineHeight: 18,
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    locationText: {
        fontSize: 11,
        marginLeft: 4,
    },
    metadataContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 8,
        borderRadius: 6,
        marginTop: 10,
        gap: 6,
    },
    metadataTag: {
        flexDirection: 'row',
        backgroundColor: 'rgba(0,0,0,0.03)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        alignItems: 'center',
    },
    metaTagKey: {
        fontSize: 9,
        fontWeight: '700',
    },
    metaTagVal: {
        fontSize: 10,
        fontWeight: '600',
        marginLeft: 2,
    },
    actionRow: {
        flexDirection: 'row',
        marginTop: 12,
        gap: 8,
    },
    actionButton: {
        flex: 1,
        height: 38,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
    },
    chatButton: {
    },
    callButton: {},
    actionButtonText: {
        fontSize: 12,
        fontWeight: '700',
    },
});
