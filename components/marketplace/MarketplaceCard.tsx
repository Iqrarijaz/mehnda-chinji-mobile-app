import React, { memo, useState } from 'react';
import { StyleSheet, View, Image, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '../ThemedText';
import { PressableScale } from '../ui/PressableScale';
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
            <PressableScale
                style={[styles.container, { backgroundColor: colors.card }]}
                pressedScale={0.97}
                onPress={handlePress}
            >

                {/* Listing Image */}
                {item.images && item.images.length > 0 ? (
                    <View style={styles.imageContainer}>
                        <Image source={{ uri: item.images[0] }} style={styles.image} resizeMode="cover" />
                        {(isOwner && showActions) && renderStatusBadge()}
                        {item.images.length > 1 && (
                            <View style={styles.imageBadge}>
                                <Ionicons name="images-outline" size={10} color="#FFFFFF" />
                                <ThemedText style={styles.imageBadgeText}>{item.images.length}</ThemedText>
                            </View>
                        )}
                    </View>
                ) : (
                    <View style={[styles.imagePlaceholder, { backgroundColor: colors.field }]}>
                        <Ionicons name="images-outline" size={36} color={colors.textSecondary} />
                        <ThemedText style={[styles.imagePlaceholderText, { color: colors.textSecondary }]}>No Images</ThemedText>
                        {(isOwner && showActions) && renderStatusBadge()}
                    </View>
                )}

                {/* Content Details */}
                <View style={styles.detailsContainer}>
                    <ThemedText style={[styles.title, { color: colors.text }]} numberOfLines={1}>
                        {item.title}
                    </ThemedText>

                    {/* Price row — the hero of the card */}
                    <View style={styles.priceRow}>
                        <ThemedText style={[styles.priceText, { color: colors.primary }]} numberOfLines={1}>
                            {item.price != null ? `Rs. ${Number(item.price).toLocaleString()}` : 'Price on call'}
                        </ThemedText>
                        {item.negotiable ? (
                            <View style={[styles.negotiableBadge, { backgroundColor: colors.limeSoft }]}>
                                <ThemedText style={[styles.negotiableText, { color: colors.limeDark }]}>Negotiable</ThemedText>
                            </View>
                        ) : null}
                    </View>

                    <View style={styles.footerRow}>
                        <View style={styles.locationWrap}>
                            <Ionicons name="location-outline" size={12} color={colors.textSecondary} />
                            <ThemedText style={[styles.locationText, { color: colors.textSecondary }]} numberOfLines={1}>
                                {item.village ? `${item.village}, ${item.city}` : item.city}
                            </ThemedText>
                        </View>
                        {isOwner && showActions ? (
                            <ActionMenu actions={actions} />
                        ) : formattedDate ? (
                            <ThemedText style={[styles.dateText, { color: colors.textSecondary }]}>
                                {formattedDate}
                            </ThemedText>
                        ) : null}
                    </View>
                </View>
            </PressableScale>
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
        borderRadius: 22,
        marginBottom: 16,
        overflow: 'hidden',
        flex: 1,
    },
    imageContainer: {
        height: 140,
        width: '100%',
        position: 'relative',
    },
    image: {
        height: '100%',
        width: '100%',
    },
    imageBadge: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        backgroundColor: 'rgba(0, 20, 15, 0.55)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 999,
    },
    imageBadgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '700',
    },
    statusTab: {
        position: 'absolute',
        top: 8,
        left: 8,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 999,
        zIndex: 5,
    },
    statusTabText: {
        color: '#fff',
        fontSize: 9,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    imagePlaceholder: {
        height: 140,
        justifyContent: 'center',
        alignItems: 'center',
    },
    imagePlaceholderText: {
        fontSize: 11,
        marginTop: 6,
    },
    detailsContainer: {
        paddingHorizontal: 12,
        paddingTop: 10,
        paddingBottom: 12,
    },
    title: {
        fontSize: 13,
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
        flexWrap: 'wrap',
        gap: 6,
    },
    priceText: {
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: -0.2,
    },
    negotiableBadge: {
        paddingHorizontal: 7,
        paddingVertical: 2,
        borderRadius: 999,
    },
    negotiableText: {
        fontSize: 9,
        fontWeight: '800',
    },
    footerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
    },
    locationWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        paddingRight: 8,
    },
    locationText: {
        fontSize: 11,
        marginLeft: 3,
        flex: 1,
    },
    dateText: {
        fontSize: 10,
    },
});
