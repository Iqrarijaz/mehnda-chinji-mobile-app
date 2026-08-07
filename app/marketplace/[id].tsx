import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Dimensions, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import BannerAd from '@/ads/components/BannerAd';
import { trackEntityInquiry } from '@/apis/inquiries';
import { trackEntityView } from '@/apis/views';
import { ActionMenu } from '@/components/common/ActionMenu';
import { ImageViewerModal } from '@/components/common/ImageViewerModal';
import { LoaderOverlay } from '@/components/common/LoaderOverlay';
import { ContactItem, ContactSection } from '@/components/essentials/shared/ContactSection';
import { PressableScale } from '@/components/essentials/shared/PressableScale';
import { SectionHeading } from '@/components/essentials/shared/SectionHeading';
import { MarketplaceDetailsSkeleton } from '@/components/marketplace/MarketplaceDetailsSkeleton';
import { ThemedText } from '@/components/ThemedText';
import { BackButton } from '@/components/common/BackButton';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useMarketplaceAPI } from '@/hooks/useMarketplaceAPI';
import { useMarketplaceStore } from '@/store/marketplaceStore';
import { capitalizeString } from '@/utils/string';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Layout } from '@/constants/layout';

const { width } = Dimensions.get('window');

export default function MarketplaceDetailsScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { theme, isDark } = useTheme();
    const colors = Colors[theme];
    const { user } = useAuth();
    const insets = useSafeAreaInsets();

    const [viewerVisible, setViewerVisible] = useState(false);
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showSoldConfirm, setShowSoldConfirm] = useState(false);

    const getSimilarItems = useMarketplaceStore((s) => s.getSimilarItems);

    const {
        detailsQuery,
        markSoldMutation,
        deleteMutation,
        toggleStatusMutation } = useMarketplaceAPI({ id: id as string });

    const { data: response, isLoading, isError } = detailsQuery;

    const item = response?.data;
    const isOwner = user?.user?._id && item?.sellerId && (item.sellerId._id || item.sellerId).toString() === user.user._id.toString();

    React.useEffect(() => {
        if (id && user?.user?._id) {
            trackEntityView(id as string, 'Marketplace').catch(() => { });
        }
    }, [id, user?.user?._id]);

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

    // Track an inquiry when the buyer calls or messages the seller.
    const handleContactAction = React.useCallback((_method: 'call' | 'whatsapp', _contact: ContactItem) => {
        if (!isOwner) {
            trackEntityInquiry(id as string, 'Marketplace').catch(() => { });
        }
    }, [isOwner, id]);

    const handleEdit = () => {
        router.push({
            pathname: '/listing/create',
            params: { listing: JSON.stringify(item) } });
    };

    const ownerActions = [
        ...(item?.status !== 'sold' ? [
            { label: 'Edit Listing', icon: 'create-outline' as const, onPress: handleEdit },
            { label: 'Mark Sold', icon: 'checkmark-circle-outline' as const, color: colors.lime, onPress: () => setShowSoldConfirm(true) },
            ...(item?.status === 'live' ? [
                { label: 'Go Offline', icon: 'eye-off-outline' as const, color: colors.secondary, onPress: () => toggleStatusMutation.mutate('offline') },
            ] : []),
            ...(item?.status === 'offline' ? [
                { label: 'Go Live', icon: 'eye-outline' as const, color: colors.lime, onPress: () => toggleStatusMutation.mutate('live') },
            ] : []),
        ] : []),
        { label: 'Delete', icon: 'trash-outline' as const, color: '#EF4444', onPress: () => setShowDeleteConfirm(true), destructive: true },
    ];

    const renderHeader = () => (
        <View style={[styles.header, { backgroundColor: colors.primary, paddingTop: insets.top + (Platform.OS === 'android' ? 12 : 8) }]}>
            <BackButton backgroundColor="rgba(255,255,255,0.18)" color="#FFFFFF" size={22} />
            <ThemedText style={styles.headerTitle} numberOfLines={1}>Marketplace</ThemedText>
            <View style={styles.headerAction}>
                {isOwner ? (
                    <ActionMenu actions={ownerActions} triggerIconColor="#fff" triggerIconSize={22} />
                ) : null}
            </View>
        </View>
    );

    if (isLoading) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <Stack.Screen options={{ headerShown: false }} />
                {renderHeader()}
                <MarketplaceDetailsSkeleton />
            </View>
        );
    }

    if (isError || !item) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <Stack.Screen options={{ headerShown: false }} />
                {renderHeader()}
                <View style={styles.centered}>
                    <Ionicons name="alert-circle-outline" size={48} color={colors.textSecondary} />
                    <ThemedText style={{ color: colors.text, marginTop: 12, fontWeight: '700' }}>Item not found</ThemedText>
                    <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
                        <ThemedText style={{ color: colors.primary, fontWeight: '700' }}>Go Back</ThemedText>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    const category = typeof item.category === 'object' ? (item.category.en || item.category.ur) : item.category;
    const type = typeof item.type === 'object' ? (item.type.en || item.type.ur) : item.type;
    const images: string[] = Array.isArray(item.images) ? item.images : [];
    const location = item?.village ? `${item.village}, ${item.city}` : item?.city;

    const sellerName = item?.sellerId?.name || 'Seller';
    const contacts: ContactItem[] = item?.sellerPhone ? [{ name: sellerName, number: item.sellerPhone }] : [];

    const similarItems = getSimilarItems(id as string, category);

    const formattedCondition = capitalizeString(item.condition || 'Used');
    const formattedType = type ? capitalizeString(String(type)) : '';
    const formattedCategory = category ? capitalizeString(String(category)) : '';
    const formattedLocation = location ? capitalizeString(String(location)) : '';
    const formattedDateLabel = formattedDate ? capitalizeString(formattedDate) : '';

    // Modern info rows.
    const infoRows: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }[] = [
        { icon: 'sparkles', label: 'Condition', value: `${formattedCondition}${formattedType ? ` • ${formattedType}` : ''}` },
        ...(formattedCategory ? [{ icon: 'grid' as const, label: 'Category', value: formattedCategory }] : []),
        ...(formattedLocation ? [{ icon: 'location' as const, label: 'Location', value: formattedLocation }] : []),
        ...(formattedDateLabel ? [{ icon: 'calendar' as const, label: 'Posted', value: formattedDateLabel }] : []),
        ...(isOwner && item?.viewsCount !== undefined ? [{ icon: 'eye' as const, label: 'Views', value: String(item.viewsCount) }] : []),
    ];

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{ headerShown: false }} />
            {renderHeader()}

            <ScrollView style={styles.content} contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
                {/* ── Image hero ─────────────────────────────────────────── */}
                {images.length > 0 ? (
                    <Animated.View entering={FadeIn.duration(350)} style={styles.imageContainer}>
                        <ScrollView
                            horizontal
                            pagingEnabled
                            showsHorizontalScrollIndicator={false}
                            onMomentumScrollEnd={(e) => setActiveImageIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
                        >
                            {images.map((img, idx) => (
                                <TouchableOpacity
                                    key={idx}
                                    activeOpacity={0.95}
                                    onPress={() => { setActiveImageIndex(idx); setViewerVisible(true); }}
                                >
                                    <Image source={{ uri: img }} style={[styles.mainImage, { width }]} contentFit="cover" transition={250} />
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        {/* subtle top gradient for status/legibility */}
                        <LinearGradient colors={['rgba(0,0,0,0.28)', 'transparent']} style={styles.imageTopFade} pointerEvents="none" />

                        {item?.status && item.status !== 'live' && (
                            <View style={[styles.statusTab, { backgroundColor: item.status === 'sold' ? '#EF4444' : '#6B7280' }]}>
                                <ThemedText style={styles.statusTabText}>{item.status.toUpperCase()}</ThemedText>
                            </View>
                        )}

                        {images.length > 1 && (
                            <View style={styles.dotsRow}>
                                {images.map((_, i) => (
                                    <View
                                        key={i}
                                        style={[
                                            styles.dot,
                                            i === activeImageIndex
                                                ? { backgroundColor: colors.lime, width: 18 }
                                                : { backgroundColor: 'rgba(255,255,255,0.7)' },
                                        ]}
                                    />
                                ))}
                            </View>
                        )}

                        <TouchableOpacity style={styles.expandBtn} onPress={() => setViewerVisible(true)} activeOpacity={0.8}>
                            <Ionicons name="expand" size={16} color="#FFFFFF" />
                        </TouchableOpacity>
                    </Animated.View>
                ) : (
                    <View style={[styles.noImage, { backgroundColor: colors.card, width }]}>
                        <Ionicons name="images-outline" size={48} color={colors.textSecondary} />
                        <ThemedText style={{ color: colors.textSecondary, marginTop: 8 }}>No Images</ThemedText>
                    </View>
                )}

                {/* ── Details card ───────────────────────────────────────── */}
                <View style={[styles.detailsCard, { backgroundColor: isDark ? '#1e293b' : '#FFFFFF', paddingBottom: 40 + insets.bottom }]}>
                    {/* Title + price */}
                    <Animated.View entering={FadeInDown.duration(400)} style={styles.titleWrapper}>
                        <ThemedText style={[styles.title, { color: colors.text }]}>{item.title}</ThemedText>
                        <View style={styles.priceRow}>
                            <ThemedText style={[styles.price, { color: colors.lime }]}>
                                Rs. {item.price ? item.price.toLocaleString() : '0'}
                            </ThemedText>
                        </View>
                    </Animated.View>

                    {/* Seller contact — shared ContactSection (Call + WhatsApp) */}
                    {!isOwner && item?.status === 'live' && contacts.length > 0 && (
                        <Animated.View entering={FadeInDown.delay(60).duration(400)} style={{ marginBottom: 16 }}>
                            <ContactSection
                                contacts={contacts}
                                title="Contact Seller"
                                hint="Tap to call"
                                iconTint="secondary"
                                onContactAction={handleContactAction}
                            />
                        </Animated.View>
                    )}

                    {/* Banner Ad */}
                    <View style={styles.detailAdWrapper}>
                        <BannerAd placement="marketplace-details" />
                    </View>

                    <View style={styles.sectionsContainer}>
                        {/* Description */}
                        {item.description && (
                            <Animated.View entering={FadeInDown.delay(80).duration(400)} style={styles.detailSection}>
                                <SectionHeading icon="reader" label="Description" />
                                <ThemedText style={[styles.descriptionText, { color: colors.textSecondary }]}>
                                    {item.description}
                                </ThemedText>
                            </Animated.View>
                        )}

                        {/* Item details — modern info grid */}
                        <Animated.View entering={FadeInDown.delay(120).duration(400)} style={styles.detailSection}>
                            <SectionHeading icon="pricetags" label="Item Details" />
                            <View style={styles.infoGrid}>
                                {infoRows.map((row) => (
                                    <View
                                        key={row.label}
                                        style={[styles.infoCard, { backgroundColor: colors.cardBg }]}
                                    >
                                        <View style={[styles.infoIconTile, { backgroundColor: `${colors.secondary}16` }]}>
                                            <Ionicons name={row.icon} size={13} color={colors.secondary} />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <ThemedText style={[styles.infoLabel, { color: colors.textSecondary }]}>{row.label}</ThemedText>
                                            <ThemedText style={[styles.infoValue, { color: colors.text }]} numberOfLines={1}>
                                                {row.value}
                                            </ThemedText>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </Animated.View>

                        {/* Recent viewers (owner premium) */}
                        {isOwner && item?.recentViewers && item.recentViewers.length > 0 && (
                            <View style={styles.detailSection}>
                                <SectionHeading icon="people" label="Recent Viewers" pill="Premium" />
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingVertical: 4 }}>
                                    {item.recentViewers.map((viewerLog: any, index: number) => (
                                        <View key={index} style={{ alignItems: 'center', width: 54 }}>
                                            <Image
                                                source={{ uri: viewerLog.viewerId?.profileImage || 'https://via.placeholder.com/40' }}
                                                style={[styles.viewerAvatar, { backgroundColor: colors.skeletonBase }]}
                                                contentFit="cover"
                                            />
                                            <ThemedText style={{ fontSize: 9, color: colors.text, textAlign: 'center', marginTop: 4 }} numberOfLines={1}>
                                                {viewerLog.viewerId?.name?.split(' ')[0] || 'User'}
                                            </ThemedText>
                                            <ThemedText style={{ fontSize: 8, color: colors.primary, textAlign: 'center', fontWeight: 'bold' }}>
                                                {viewerLog.viewCount} {viewerLog.viewCount === 1 ? 'view' : 'views'}
                                            </ThemedText>
                                        </View>
                                    ))}
                                </ScrollView>
                            </View>
                        )}

                        {/* Additional info (metadata) */}
                        {item.metadata && Object.keys(item.metadata).length > 0 && (
                            <View style={styles.detailSection}>
                                <SectionHeading icon="information-circle" label="Additional Info" />
                                <View style={styles.chipWrap}>
                                    {Object.entries(item.metadata).map(([key, val], index) => (
                                        <View key={index} style={[styles.metaChip, { backgroundColor: `${colors.primary}10` }]}>
                                            <ThemedText style={[styles.metaChipText, { color: colors.primary }]}>
                                                {capitalizeString(String(key))}: {capitalizeString(String(val))}
                                            </ThemedText>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}

                        {/* Similar items — from global store */}
                        {similarItems.length > 0 && (
                            <View style={[styles.detailSection, { marginTop: 4 }]}>
                                <SectionHeading icon="albums" label="Similar Items" />
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 16, paddingVertical: 4 }}>
                                    {similarItems.map((sim: any, idx: number) => (
                                        <Animated.View key={sim._id} entering={FadeInDown.delay(idx * 50).duration(300)}>
                                            <PressableScale
                                                intensity={0.03}
                                                onPress={() => {
                                                    const simOwner = user?.user?._id && sim.sellerId && (sim.sellerId._id || sim.sellerId).toString() === user.user._id.toString();
                                                    if (!simOwner) trackEntityInquiry(sim._id, 'Marketplace').catch(() => { });
                                                    router.push(`/marketplace/${sim._id}` as any);
                                                }}
                                                style={[styles.simCard, { backgroundColor: colors.cardBg }]}
                                            >
                                                <Image
                                                    source={{ uri: sim.images?.[0] || sim.image || 'https://via.placeholder.com/150' }}
                                                    style={[styles.simImage, { backgroundColor: colors.skeletonBase }]}
                                                    contentFit="cover"
                                                    transition={200}
                                                />
                                                <View style={styles.simInfo}>
                                                    <ThemedText style={[styles.simTitle, { color: colors.text }]} numberOfLines={1}>
                                                        {sim.title}
                                                    </ThemedText>
                                                    <ThemedText style={[styles.simPrice, { color: colors.lime }]}>
                                                        Rs. {typeof sim.price === 'number' ? sim.price.toLocaleString() : sim.price}
                                                    </ThemedText>
                                                </View>
                                            </PressableScale>
                                        </Animated.View>
                                    ))}
                                </ScrollView>
                            </View>
                        )}
                    </View>
                </View>
            </ScrollView>

            {/* Full-screen image viewer (shared component) */}
            <ImageViewerModal
                visible={viewerVisible}
                onClose={() => setViewerVisible(false)}
                images={images}
                initialIndex={activeImageIndex}
            />

            <ConfirmationModal
                visible={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={() => { setShowDeleteConfirm(false); deleteMutation.mutate(); }}
                title="Delete Listing"
                message="Are you sure you want to remove this listing? This action cannot be undone."
                type="danger"
                confirmText="Delete"
                cancelText="Cancel"
            />

            <ConfirmationModal
                visible={showSoldConfirm}
                onClose={() => setShowSoldConfirm(false)}
                onConfirm={() => { setShowSoldConfirm(false); markSoldMutation.mutate(); }}
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
    container: { flex: 1 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 14,
        paddingBottom: 10 },
    backButton: {
        width: 36,
        height: 36,
        borderRadius: Layout.borderRadius,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center' },
    headerTitle: {
        fontSize: 15,
        fontWeight: '800',
        flex: 1,
        textAlign: 'center',
        color: '#fff',
        letterSpacing: 0.2 },
    headerAction: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
    content: { flex: 1 },
    imageContainer: { position: 'relative' },
    mainImage: { height: 300 },
    imageTopFade: { position: 'absolute', top: 0, left: 0, right: 0, height: 60 },
    statusTab: {
        position: 'absolute',
        top: 12,
        left: 12,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: Layout.borderRadius },
    statusTabText: { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
    dotsRow: {
        position: 'absolute',
        bottom: 32,
        alignSelf: 'center',
        flexDirection: 'row',
        gap: 5 },
    dot: { width: 6, height: 6, borderRadius: Layout.borderRadius },
    expandBtn: {
        position: 'absolute',
        bottom: 28,
        right: 14,
        width: 30,
        height: 30,
        borderRadius: Layout.borderRadius,
        backgroundColor: 'rgba(0,0,0,0.4)',
        alignItems: 'center',
        justifyContent: 'center' },
    noImage: { height: 300, alignItems: 'center', justifyContent: 'center' },
    detailsCard: {
        flex: 1,
        marginTop: -20,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingHorizontal: 14,
        paddingTop: 17 },
    titleWrapper: { marginBottom: 13 },
    title: { fontSize: 17, fontWeight: '800', textTransform: 'capitalize', letterSpacing: 0.2, lineHeight: 22 },
    priceRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 5 },
    price: { fontSize: 18, fontWeight: '800', letterSpacing: 0.3 },
    negChip: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: Layout.borderRadius },
    negText: { fontSize: 9.5, fontWeight: '800', letterSpacing: 0.4 },
    detailAdWrapper: { marginBottom: 13, alignItems: 'center' },
    sectionsContainer: { gap: 16 },
    detailSection: { gap: 8 },
    descriptionText: { fontSize: 11.5, lineHeight: 17 },
    infoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8 },
    infoCard: {
        width: (width - 32 - 10) / 2,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: 6,
        borderRadius: Layout.borderRadius },
    infoIconTile: {
        width: 26,
        height: 26,
        borderRadius: Layout.borderRadius,
        justifyContent: 'center',
        alignItems: 'center' },
    infoLabel: {
        fontSize: 9,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.4,
        marginBottom: 2 },
    infoValue: { fontSize: 11.5, fontWeight: '700', textTransform: 'capitalize' },
    viewerAvatar: { width: 44, height: 44, borderRadius: Layout.borderRadius },
    chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    metaChip: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: Layout.borderRadius },
    metaChipText: { fontSize: 10, fontWeight: '700' },
    simCard: { width: 150, borderRadius: Layout.borderRadius, overflow: 'hidden' },
    simImage: { width: 150, height: 110 },
    simInfo: { padding: 8, gap: 3 },
    simTitle: { fontSize: 11.5, fontWeight: '700', textTransform: 'capitalize' },
    simPrice: { fontSize: 12, fontWeight: '800' } });
