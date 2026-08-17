import { deleteMarketplaceListing, MARKETPLACE_QUERY_KEYS, markMarketplaceListingAsSold, toggleMarketplaceListingStatus } from '@/apis/marketplace';
import { trackEntityView } from '@/apis/views';
import { PressableScale } from '@/components/essentials/shared/PressableScale';
import { useAuth } from '@/context/AuthContext';
import { capitalizeString } from '@/utils/string';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React, { memo, useState } from 'react';
import { Alert, Image, Linking, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import { ActionMenu, ActionMenuItem } from '../common/ActionMenu';
import { ThemedText } from '../ThemedText';
import { ConfirmationModal } from '../ui/ConfirmationModal';
import { Layout } from '@/constants/layout';
import { LoaderOverlay } from '../common/LoaderOverlay';

interface MarketplaceCardProps {
    item: any;
    colors: any;
    onEdit?: (item: any) => void;
    showActions?: boolean;
}

export const MarketplaceCard = memo(({ item, colors, onEdit, showActions }: MarketplaceCardProps) => {
    const { user } = useAuth();
    const router = useRouter();
    const queryClient = useQueryClient();
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showPhoneErrorModal, setShowPhoneErrorModal] = useState(false);

    const isOwner = user?.user?._id && item.sellerId && (item.sellerId._id || item.sellerId).toString() === user.user._id.toString();
    const capitalizedTitle = React.useMemo(() => capitalizeString(item.title || ''), [item.title]);
    const capitalizedLocation = React.useMemo(
        () => capitalizeString(item.village ? `${item.village}, ${item.city}` : item.city || ''),
        [item.village, item.city]
    );

    // Handle Contact / Phone Dial
    const handleCall = React.useCallback(async () => {
        const phone = item.sellerPhone;
        if (!phone) {
            Toast.show({ type: 'error', text1: 'Contact Failed', text2: 'Seller phone number is unavailable.' });
            return;
        }
        try {
            // Register inquiry metric
            trackEntityView(item._id, 'Marketplace').catch(err => console.log("Failed to log inquiry:", err));

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
            case 'sold': return '#EF4444';
            case 'pending': return '#F59E0B';
            case 'offline': return '#6B7280';
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
            { label: 'Delete', icon: 'trash-outline', color: '#EF4444', onPress: confirmDelete, destructive: true }
        ];
        if (item.status !== 'sold') {
            if (item.status === 'live') {
                baseActions.unshift({ label: 'Go Offline', icon: 'eye-off-outline', onPress: () => toggleStatusMutation.mutate('offline') });
            } else if (item.status === 'offline') {
                baseActions.unshift({ label: 'Go Online', icon: 'eye-outline', onPress: () => toggleStatusMutation.mutate('live') });
            }

            baseActions.unshift(
                { label: 'Edit Listing', icon: 'create-outline', onPress: () => onEdit?.(item) },
                { label: 'Mark Sold', icon: 'checkmark-circle-outline', color: '#10B981', onPress: confirmMarkSold }
            );
        }
        return baseActions;
    }, [item.status, item, confirmDelete, confirmMarkSold, onEdit, toggleStatusMutation]);

    const handlePress = React.useCallback(() => {
        if (!isOwner) {
            trackEntityView(item._id, 'Marketplace').catch(console.error);
        }
        router.push(`/marketplace/${item._id}` as any);
    }, [isOwner, item._id, router]);

    return (
        <>
            <Animated.View entering={FadeInDown.duration(350)} style={{ flex: 1 }}>
            <PressableScale
                intensity={0.025}
                containerStyle={{ flex: 1 }}
                style={[styles.container, { backgroundColor: colors.cardBg }]}
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
                    <View style={[styles.imagePlaceholder, { backgroundColor: colors.lime }]}>
                        <Ionicons name="images-outline" size={48} color="#FFFFFF" />
                        <ThemedText style={[styles.imagePlaceholderText, { color: '#FFFFFF' }]}>No Images Available</ThemedText>
                        {(isOwner && showActions) && renderStatusBadge()}
                    </View>
                )}

                {/* Content Details */}
                <View style={styles.detailsContainer}>
                    <View style={styles.contentBlock}>
                        <ThemedText style={[styles.priceText, { color: colors.lime }]} numberOfLines={1}>
                            {capitalizedTitle}
                        </ThemedText>
                        <View style={styles.priceRow}>
                            <ThemedText style={[styles.title, { color: colors.text }]} numberOfLines={1}>
                                Rs. {typeof item.price === 'number' ? item.price.toLocaleString() : item.price || '—'}
                            </ThemedText>
                        </View>
                        {isOwner && showActions ? <View style={styles.actionsWrapper}><ActionMenu actions={actions} /></View> : null}
                    </View>
                </View>
            </PressableScale>
            </Animated.View>
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
            <LoaderOverlay
                visible={markSoldMutation.isPending || deleteMutation.isPending || toggleStatusMutation.isPending}
                text={
                    deleteMutation.isPending
                        ? 'Deleting listing...'
                        : markSoldMutation.isPending
                            ? 'Marking as sold...'
                            : 'Updating listing...'
                }
            />
        </>
    );
});

MarketplaceCard.displayName = 'MarketplaceCard';

const styles = StyleSheet.create({
    container: {
        borderRadius: Layout.borderRadius,
        marginBottom: 10,
        overflow: 'hidden',
        flex: 1 },
    imageContainer: {
        height: 130,
        width: '100%',
        position: 'relative' },
    image: {
        height: '100%',
        width: '100%' },
    imageBadge: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        backgroundColor: 'rgba(0, 0, 0, 0.55)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: Layout.borderRadius },
    imageBadgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '600' },
    statusTab: {
        position: 'absolute',
        top: 8,
        left: 8,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: Layout.borderRadius,
        zIndex: 5 },
    statusTabText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.5 },
    imagePlaceholder: {
        height: 130,
        justifyContent: 'center',
        alignItems: 'center' },
    imagePlaceholderText: {
        fontSize: 12,
        marginTop: 8 },
    detailsContainer: {
        paddingHorizontal: 8,
        paddingTop: 5,
        paddingBottom: 6 },
    contentBlock: {
        marginTop: 0,
        marginBottom: 0 },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 1 },
    priceText: {
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 0.15,
        flexShrink: 1 },
    title: {
        fontSize: 11.5,
        fontWeight: '700',
        marginTop: 0,
        lineHeight: 13.5 },
    actionsWrapper: {
        position: 'absolute',
        top: 8,
        right: 8,
        zIndex: 10 } });
