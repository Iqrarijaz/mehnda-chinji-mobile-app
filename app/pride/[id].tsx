import React, { useState, useEffect, useRef } from 'react';
// Removed duplicate useRef import; added utilities
import { Modal, ActivityIndicator, TouchableOpacity, View, Share, Dimensions, KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { useShareBanner } from '@/hooks/useShareBanner';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInUp, FadeInLeft } from 'react-native-reanimated';

import { ThemedText } from '@/components/themedText';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/context/ThemeContext';
import { usePostDetail, useLikePost, usePostComments, useAddComment } from '@/hooks/usePosts';
import Avatar from '@/components/ui/avatar';
import { Image } from 'expo-image';
import ShareBanner from '@/components/shareBanner/shareBanner';
import { analyticsService } from '@/analytics/analyticsService';
import { AnalyticsEvents } from '@/analytics/analyticsEvents';

const { width } = Dimensions.get('window');

// Local fallback items in case no server data exists for these IDs yet
export default function PrideDetailsScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { theme } = useTheme();
    const colors = Colors[theme];
    const { id } = useLocalSearchParams<{ id: string }>();

    const [localTributesCount, setLocalTributesCount] = useState<number | null>(null);
    const [localIsLiked, setLocalIsLiked] = useState<boolean | null>(null);

    const [modalVisible, setModalVisible] = useState(false);
    const viewShotRef = useRef<any>(null);
    const { capture, save, share, isGenerating, bannerUri } = useShareBanner(viewShotRef);
    // Fetch live profile details
    const { data: profile, isLoading: isProfileLoading } = usePostDetail(id || '');

    const likeMutation = useLikePost();

    const postData = profile?.data;

    useEffect(() => {
        if (postData) {
            setLocalIsLiked(postData.isLiked || false);
        }
    }, [postData?.isLiked]);

    useEffect(() => {
        if (postData) {
            setLocalTributesCount(postData.likesCount || 0);
            analyticsService.trackEvent(AnalyticsEvents.POST_VIEWED, { postId: id, postType: postData.type });
        }
    }, [postData?.likesCount, postData?.type, id]);

    if (isProfileLoading) {
        return (
            <View style={[styles.loadingWrap, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
                <ThemedText style={{ marginTop: 12, color: colors.textSecondary }}>
                    Opening Digital Archive...
                </ThemedText>
            </View>
        );
    }

    if (!profile || !profile.data) {
        return (
            <View style={[styles.loadingWrap, { backgroundColor: colors.background }]}>
                <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
                <ThemedText style={{ marginTop: 12 }}>Profile not found.</ThemedText>
                <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
                    <ThemedText style={{ color: colors.primary, fontWeight: '700' }}>Go Back</ThemedText>
                </TouchableOpacity>
            </View>
        );
    }
    const { metadata } = postData;
    const subType = postData.type || metadata?.subType || 'LIVING_LEGEND';
    const fullName = metadata?.fullName || 'Community Hero';
    const title = metadata?.title || 'Honored Villager';
    const achievements = metadata?.achievements || [];
    const dateOfBirth = metadata?.dateOfBirth;
    const dateOfDeath = metadata?.dateOfDeath;

    // Likes mapping details
    const activeIsLiked = localIsLiked !== null ? localIsLiked : (postData.isLiked || false);
    const activeTributesCount = localTributesCount !== null ? localTributesCount : (postData.likesCount || 0);

    const getSubTypeMeta = () => {
        switch (subType) {
            case 'YOUTH_PRIDE':
                return {
                    label: '🏆 Youth Pride',
                    accentColor: '#10B981',
                    tributeIcon: 'star',
                    tributeLabelActive: 'Saluted! 👏',
                    tributeLabelInactive: 'Offer Salute 👏'
                };
            case 'DECEASED':
                return {
                    label: '🌹 In Memoriam (Passed Away)',
                    accentColor: theme === 'dark' ? '#94A3B8' : '#64748B',
                    tributeIcon: 'praying-hands',
                    tributeLabelActive: 'Dua Offered! 🤲',
                    tributeLabelInactive: 'Offer Dua 🤲'
                };
            case 'LIVING_LEGEND':
            default:
                return {
                    label: '🌟 Living Legend',
                    accentColor: '#FF9B51',
                    tributeIcon: 'ribbon',
                    tributeLabelActive: 'Respected! 💖',
                    tributeLabelInactive: 'Offer Respect 💖'
                };
        }
    };

    const meta = getSubTypeMeta();

    const handleTribute = () => {
        // Toggle tribute count optimistically
        const nextLikedState = !activeIsLiked;
        setLocalIsLiked(nextLikedState);
        setLocalTributesCount(prev => {
            const current = prev !== null ? prev : (postData.likesCount || 0);
            return nextLikedState ? current + 1 : Math.max(0, current - 1);
        });

        likeMutation.mutate(id);
        if (nextLikedState) {
            analyticsService.trackEvent(AnalyticsEvents.POST_LIKED, { postId: id, postType: postData.type });
        }
    };



    const handleShare = async () => {
        setModalVisible(true);
        // Add a slight delay to let modal render the ViewShot before capturing
        setTimeout(() => {
            capture();
        }, 300);
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1, backgroundColor: colors.background }}
        >
            <Stack.Screen options={{ headerShown: false }} />

            {/* Custom Transparent Floating Back header */}
            <View style={[styles.floatHeader, { paddingTop: insets.top + 12, height: 58 + insets.top }]}>
                <TouchableOpacity onPress={() => router.back()} style={[styles.circleBtn, { backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.8)' }]}>
                    <Ionicons name="arrow-back" size={22} color={colors.text} />
                </TouchableOpacity>

                <TouchableOpacity onPress={handleShare} style={[styles.circleBtn, { backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.8)' }]}>
                    <Ionicons name="share-social-outline" size={22} color={colors.text} />
                </TouchableOpacity>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
            >
                {/* 1. Immersive Parallax Top Cover */}
                <View style={[styles.coverContainer, { backgroundColor: colors.primary + '18', height: 150 + insets.top }]}>
                    <View style={[styles.badge, { backgroundColor: meta.accentColor + '20', top: insets.top + 20 }]}>
                        <ThemedText style={[styles.badgeText, { color: meta.accentColor }]}>
                            {meta.label.toUpperCase()}
                        </ThemedText>
                    </View>
                </View>

                {/* 2. Floating profile overview card */}
                <Animated.View entering={FadeInUp.delay(200).duration(500)} style={[styles.profileCard, { backgroundColor: theme === 'dark' ? colors.card : '#FFFFFF', borderColor: colors.border, marginTop: -35 }]}>
                    <View style={[styles.avatarWrap, { borderColor: meta.accentColor }]}>
                        <Avatar uri={postData.metadata?.profileImage || postData.images?.[0]} name={fullName} size={86} />
                    </View>

                    <ThemedText style={styles.fullName}>{fullName}</ThemedText>
                    <ThemedText style={[styles.titleTag, { color: colors.textSecondary }]}>{title}</ThemedText>

                    {/* Timeline Date details */}
                    {(dateOfBirth || dateOfDeath) && (
                        <View style={styles.timelineDates}>
                            <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
                            <ThemedText style={[styles.dateText, { color: colors.textSecondary }]}>
                                {dateOfBirth ? (
                                    <>
                                        {dateOfBirth.slice(0, 10)}
                                        {subType === 'DECEASED' ? ` — ${dateOfDeath ? dateOfDeath.slice(0, 10) : 'Deceased'}` : ' (Present)'}
                                    </>
                                ) : (
                                    subType === 'DECEASED' && dateOfDeath ? `Passed away on ${dateOfDeath.slice(0, 10)}` : 'Active Hero'
                                )}
                            </ThemedText>
                        </View>
                    )}

                    {subType === 'DECEASED' && (
                        <ThemedText style={[styles.arabicVerse, { color: colors.textSecondary }]}>
                            إِنَّا لِلَّٰهِ وَإِنَّا إِلَيْهِ رَاجِعُونَ
                        </ThemedText>
                    )}

                    {/* Double interactive actions: Tribute & Share */}
                    <View style={styles.profileActions}>
                        <TouchableOpacity
                            onPress={handleTribute}
                            activeOpacity={0.85}
                            style={[
                                styles.actionBtn,
                                {
                                    backgroundColor: activeIsLiked ? meta.accentColor : 'transparent',
                                    borderColor: meta.accentColor
                                }
                            ]}
                        >
                            {meta.tributeIcon === 'praying-hands' ? (
                                <FontAwesome5
                                    name="praying-hands"
                                    size={16}
                                    color={activeIsLiked ? '#FFFFFF' : meta.accentColor}
                                />
                            ) : (
                                <Ionicons
                                    name={meta.tributeIcon as any}
                                    size={18}
                                    color={activeIsLiked ? '#FFFFFF' : meta.accentColor}
                                />
                            )}
                            <ThemedText
                                style={[
                                    styles.actionText,
                                    { color: activeIsLiked ? '#FFFFFF' : meta.accentColor }
                                ]}
                            >
                                {activeIsLiked ? meta.tributeLabelActive : meta.tributeLabelInactive}
                            </ThemedText>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={handleShare}
                            activeOpacity={0.8}
                            style={[styles.shareAction, { borderColor: colors.border }]}
                        >
                            <Ionicons name="share-social" size={18} color={colors.primary} />
                            <ThemedText style={[styles.shareActionText, { color: colors.primary }]}>
                                Share Banner
                            </ThemedText>
                        </TouchableOpacity>
                    </View>
                </Animated.View>

                {/* 3. Biography Content */}
                <Animated.View entering={FadeInLeft.delay(350).duration(450)} style={styles.section}>
                    <ThemedText style={styles.sectionHeader}>The Inspiring Story</ThemedText>
                    <View style={[styles.storyCard, { backgroundColor: theme === 'dark' ? colors.card : '#FFFFFF', borderColor: colors.border }]}>
                        <ThemedText style={[styles.storyText, { color: colors.text }]}>
                            {postData.content}
                        </ThemedText>
                    </View>
                </Animated.View>

                {achievements.length > 0 && (
                    <Animated.View entering={FadeInLeft.delay(450).duration(450)} style={styles.section}>
                        <ThemedText style={styles.sectionHeader}>Key Contributions</ThemedText>
                        <View style={[styles.milestonesCard, { backgroundColor: theme === 'dark' ? colors.card : '#FFFFFF', borderColor: colors.border }]}>
                            {achievements.map((achievement: string, idx: number) => (
                                <View key={idx} style={styles.milestoneRow}>
                                    <View style={[styles.bulletPoint, { backgroundColor: meta.accentColor }]} />
                                    <ThemedText style={styles.milestoneText}>{achievement}</ThemedText>
                                </View>
                            ))}
                        </View>
                    </Animated.View>
                )}


                {/* 3.5. Gallery Section */}
                {postData.images && postData.images.length > 0 && (
                    <Animated.View entering={FadeInLeft.delay(400).duration(450)} style={styles.section}>
                        <ThemedText style={styles.sectionHeader}>Gallery</ThemedText>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.galleryScroll}
                        >
                            {postData.images.map((img: string, idx: number) => (
                                <View key={idx} style={[styles.galleryImageWrap, { borderColor: colors.border }]}>
                                    <Image
                                        source={{ uri: img }}
                                        style={styles.galleryImage}
                                        contentFit="cover"
                                    />
                                </View>
                            ))}
                        </ScrollView>
                    </Animated.View>
                )}

                {/* 4. Milestones / Key Accomplishments */}


            </ScrollView>
            {/* Banner Modal */}
            <Modal visible={modalVisible} transparent={true} animationType="slide" onRequestClose={() => setModalVisible(false)}>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.85)' }}>
                    <View style={{ width: width * 0.85, aspectRatio: 1080 / 1920, backgroundColor: '#000', borderRadius: 16, overflow: 'hidden' }}>
                        {isGenerating && (
                            <ActivityIndicator size="large" color={colors.primary} style={{ position: 'absolute', top: '50%', left: '50%', zIndex: 10, marginLeft: -18, marginTop: -18 }} />
                        )}
                        <ShareBanner ref={viewShotRef} post={postData} style={{ transform: [{ scale: (width * 0.85) / 1080 }], transformOrigin: 'top left' }} />
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 24, width: '100%', paddingHorizontal: 20 }}>
                        <TouchableOpacity onPress={async () => { if (bannerUri) { await save(); setModalVisible(false); } }} style={{ paddingVertical: 12, paddingHorizontal: 24, backgroundColor: colors.primary, borderRadius: 8 }}><ThemedText style={{ color: '#fff', fontWeight: '700' }}>Save to Gallery</ThemedText></TouchableOpacity>
                        <TouchableOpacity onPress={async () => { if (bannerUri) { await share(); setModalVisible(false); } }} style={{ paddingVertical: 12, paddingHorizontal: 24, backgroundColor: colors.secondary, borderRadius: 8 }}><ThemedText style={{ color: '#fff', fontWeight: '700' }}>Share Banner</ThemedText></TouchableOpacity>
                    </View>
                    <TouchableOpacity onPress={() => setModalVisible(false)} style={{ marginTop: 24, paddingVertical: 10, paddingHorizontal: 20, borderWidth: 1, borderColor: '#fff', borderRadius: 8 }}><ThemedText style={{ color: '#fff' }}>Cancel</ThemedText></TouchableOpacity>
                </View>
            </Modal>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    loadingWrap: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    floatHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        height: 54,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 5,
    },
    circleBtn: {
        width: 38,
        height: 38,
        borderRadius: 19,
        justifyContent: 'center',
        alignItems: 'center',
        ...Platform.select({
            ios: {
                shadowColor: '#000000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.15,
                shadowRadius: 4,
            },
            android: {
                elevation: 3,
            },
        }),
    },
    coverContainer: {
        height: 180,
        width: '100%',
        alignItems: 'center',
        position: 'relative',
    },
    badge: {
        position: 'absolute',
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 20,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    profileCard: {
        marginHorizontal: 20,
        borderRadius: Layout.borderRadius + 4,
        paddingHorizontal: 20,
        paddingBottom: 20,
        alignItems: 'center',
        borderWidth: 1,
        marginTop: -50,
    },
    avatarWrap: {
        width: 94,
        height: 94,
        borderRadius: 47,
        borderWidth: 4,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: -47,
        marginBottom: 10,
        backgroundColor: '#FFFFFF',
    },
    fullName: {
        fontSize: 20,
        fontWeight: '700',
        textAlign: 'center',
    },
    titleTag: {
        fontSize: 13,
        fontWeight: '600',
        marginTop: 4,
        textAlign: 'center',
    },
    timelineDates: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 10,
    },
    dateText: {
        fontSize: 12,
        fontWeight: '600',
    },
    profileActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 18,
        width: '100%',
    },
    actionBtn: {
        flex: 1.2,
        height: 40,
        borderRadius: Layout.borderRadius,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        gap: 6,
    },
    actionText: {
        fontSize: 12,
        fontWeight: '900',
    },
    shareAction: {
        flex: 1,
        height: 40,
        borderRadius: Layout.borderRadius,
        borderWidth: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6,
    },
    shareActionText: {
        fontSize: 12,
        fontWeight: '700',
    },
    section: {
        marginTop: 20,
        paddingHorizontal: 20,
    },
    sectionHeader: {
        fontSize: 15,
        fontWeight: '800',
        marginBottom: 10,
        opacity: 0.85,
    },
    storyCard: {
        borderRadius: Layout.borderRadius,
        borderWidth: 1,
        padding: 16,
    },
    storyText: {
        fontSize: 14,
        lineHeight: 22,
        fontWeight: '400',
    },
    milestonesCard: {
        borderRadius: Layout.borderRadius,
        borderWidth: 1,
        padding: 16,
        gap: 12,
    },
    milestoneRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
    },
    bulletPoint: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginTop: 5,
    },
    milestoneText: {
        flex: 1,
        fontSize: 13,
        lineHeight: 18,
        fontWeight: '500',
    },
    commentsTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 4,
    },
    commentCount: {
        fontSize: 14,
        fontWeight: '600',
    },
    inputBox: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: Layout.borderRadius,
        padding: 8,
        gap: 10,
        marginBottom: 16,
    },
    commentInput: {
        flex: 1,
        fontSize: 13,
        height: 38,
        textAlignVertical: 'center',
        paddingHorizontal: 6,
    },
    sendBtn: {
        width: 38,
        height: 38,
        borderRadius: 19,
        justifyContent: 'center',
        alignItems: 'center',
    },
    commentsList: {
        gap: 10,
    },
    commentCard: {
        borderRadius: Layout.borderRadius - 2,
        borderWidth: 1,
        padding: 12,
    },
    commentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    commentUser: {
        fontSize: 12.5,
        fontWeight: '700',
    },
    commentTime: {
        fontSize: 11,
    },
    commentBody: {
        fontSize: 13,
        lineHeight: 18,
    },
    galleryScroll: {
        gap: 12,
        paddingRight: 20,
        flexDirection: 'row',
    },
    galleryImageWrap: {
        width: 140,
        height: 140,
        borderRadius: Layout.borderRadius,
        borderWidth: 1,
        overflow: 'hidden',
    },
    galleryImage: {
        width: '100%',
        height: '100%',
    },
    arabicVerse: {
        fontSize: 18,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'serif',
        textAlign: 'center',
        marginTop: 10,
        fontWeight: '700',
        opacity: 0.85,
        lineHeight: 26,
    },
});
