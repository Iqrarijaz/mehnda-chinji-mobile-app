import React, { memo } from 'react';
import { StyleSheet, View, Image, TouchableOpacity, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '../ThemedText';
import { useAuth } from '@/context/AuthContext';
import { Menu, MenuOptions, MenuOption, MenuTrigger } from 'react-native-popup-menu';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteMarketplaceListing, markMarketplaceListingAsSold, incrementMarketplaceInquiry, MARKETPLACE_QUERY_KEYS } from '@/apis/marketplace';
import { createOrGetConversation } from '@/apis/chat/chat';
import { ConversationSource } from '@/types/chat';

interface MarketplaceCardProps {
    item: any;
    otherItems?: any[];
    colors: any;
    onEdit?: (item: any) => void;
    showActions?: boolean;
}

export const MarketplaceCard = memo(({ item, otherItems, colors, onEdit, showActions }: MarketplaceCardProps) => {
    const { user } = useAuth();
    const router = useRouter();
    const queryClient = useQueryClient();

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
    const handleCall = async () => {
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
                Alert.alert("Error", "Call dialer is not supported on this device. Phone: " + phone);
            }
        } catch (error) {
            console.log(error);
        }
    };

    // Handle Chat Initialization
    const handleChat = async () => {
        const sellerId = item.sellerId?._id || item.sellerId;
        if (!sellerId) return;

        // Register inquiry metric
        incrementMarketplaceInquiry(item._id).catch(err => console.log("Failed to log inquiry:", err));

        try {
            const res = await createOrGetConversation(sellerId, ConversationSource.MARKETPLACE);
            if (res.success && res.data?._id) {
                router.push({
                    pathname: '/chat/[id]' as any,
                    params: { id: res.data._id, name: item.sellerId?.name || 'Seller', profileImage: item.sellerId?.profileImage || '' }
                });
            } else {
                Toast.show({ type: 'error', text1: 'Error', text2: 'Could not create conversation.' });
            }
        } catch (error) {
            console.error("Chat init error:", error);
            Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to start chat.' });
        }
    };

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

    const confirmDelete = () => {
        Alert.alert(
            "Delete Listing",
            "Are you sure you want to remove this listing? This action cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: () => deleteMutation.mutate() }
            ]
        );
    };

    const confirmMarkSold = () => {
        Alert.alert(
            "Mark as Sold",
            "Mark this item as sold? It will no longer be visible in public listings.",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Yes, Mark Sold", onPress: () => markSoldMutation.mutate() }
            ]
        );
    };

    return (
        <TouchableOpacity
            style={[styles.container, { backgroundColor: colors.card }]}
            activeOpacity={0.9}
            onPress={() => {
                if (!isOwner) {
                    incrementMarketplaceInquiry(item._id).catch(console.error);
                }
                const minimalOtherItems = otherItems?.map(i => ({
                    _id: i._id,
                    title: i.title,
                    price: i.price,
                    image: i.images?.[0],
                    sellerId: i.sellerId?._id || i.sellerId
                })) || [];
                router.push({
                    pathname: `/marketplace/${item._id}`,
                    params: minimalOtherItems.length > 0 ? { otherItems: JSON.stringify(minimalOtherItems) } : {}
                } as any)
            }}
        >
            {/* Header / Actions Info */}
            <View style={styles.header}>
                {/* Owner Operations Menu */}
                {isOwner && showActions && (
                    <Menu>
                        <MenuTrigger style={styles.menuTrigger}>
                            <Ionicons name="ellipsis-vertical" size={20} color={colors.textSecondary} />
                        </MenuTrigger>
                        <MenuOptions customStyles={{ optionsContainer: { backgroundColor: colors.card, borderRadius: 8, padding: 4 } }}>
                            {item.status !== 'sold' && (
                                <>
                                    <MenuOption onSelect={() => onEdit?.(item)}>
                                        <View style={styles.menuItem}>
                                            <Ionicons name="create-outline" size={18} color={colors.text} />
                                            <ThemedText style={[styles.menuText, { color: colors.text }]}>Edit Listing</ThemedText>
                                        </View>
                                    </MenuOption>
                                    <MenuOption onSelect={confirmMarkSold}>
                                        <View style={styles.menuItem}>
                                            <Ionicons name="checkmark-circle-outline" size={18} color="#10B981" />
                                            <ThemedText style={[styles.menuText, { color: "#10B981" }]}>Mark Sold</ThemedText>
                                        </View>
                                    </MenuOption>
                                </>
                            )}
                            <MenuOption onSelect={confirmDelete}>
                                <View style={styles.menuItem}>
                                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                                    <ThemedText style={[styles.menuText, { color: "#EF4444" }]}>Delete</ThemedText>
                                </View>
                            </MenuOption>
                        </MenuOptions>
                    </Menu>
                )}
            </View>

            {/* Listing Image */}
            {item.images && item.images.length > 0 ? (
                <View style={styles.imageContainer}>
                    <Image source={{ uri: item.images[0] }} style={styles.image} resizeMode="cover" />
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
                </View>
            )}

            {/* Content Details */}
            <View style={styles.detailsContainer}>

                <View style={{ marginTop: 4, marginBottom: 4 }}>
                    <ThemedText style={[styles.title, { color: colors.primary }]}>
                        {item.title}
                    </ThemedText>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', }}>
                        <ThemedText style={{ color: colors.textSecondary, fontSize: 11, flex: 1 }} numberOfLines={1}>
                            {item.place}
                        </ThemedText>
                        {formattedDate ? (
                            <ThemedText style={{ color: colors.textSecondary, fontSize: 10, marginLeft: 8 }}>
                                {formattedDate}
                            </ThemedText>
                        ) : null}
                    </View>
                </View>

                {/* Metadata details rendering for Vehicles */}
                {item.metadata && Object.keys(item.metadata).length > 0 && (
                    <View style={[styles.metadataContainer, { backgroundColor: colors.background }]}>
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

                {/* Call / Chat Action Row */}
                {!isOwner && item.status === 'live' && (
                    <View style={styles.actionRow}>
                        <Ionicons name="chatbubble-ellipses-outline" size={24} color={colors.primary} />
                        <Ionicons name="call-outline" size={24} color="#000000ff" />


                    </View>
                )}
            </View>
        </TouchableOpacity>
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
    menuTrigger: {
        padding: 6,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 8,
    },
    menuText: {
        marginLeft: 8,
        fontSize: 13,
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
        color: '#10B981',
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
        borderWidth: 1,
    },
    callButton: {},
    actionButtonText: {
        fontSize: 12,
        fontWeight: '700',
    },
});
