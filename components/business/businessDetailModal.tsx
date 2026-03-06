import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import Animated, {
    FadeIn,
    FadeInDown,
    FadeInUp,
} from 'react-native-reanimated';
import React, { useCallback } from 'react';
import {
    ActivityIndicator,
    Alert,
    Linking,
    Platform,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
    Share,
} from 'react-native';

import { PremiumModal } from '../common/PremiumModal';
import { ThemedText } from '../themedText';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/colors';

const isAndroid = Platform.OS === 'android';

// ── InfoRow Component ───────────────────────────────────────────────────────
interface InfoRowProps {
    icon: string;
    label: string;
    value: string;
    delay?: number;
}

const InfoRow = React.memo(({ icon, label, value, delay = 0 }: InfoRowProps) => {
    const { theme } = useTheme();
    const colors = Colors[theme];
    if (!value) return null;

    return (
        <Animated.View
            entering={FadeInDown.delay(delay).duration(500)}
            style={[styles.infoRowContainer, { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.03)' : '#F8FAFC' }]}
        >
            <View style={[styles.infoIconCircle, { backgroundColor: `${colors.primary}12` }]}>
                <Ionicons name={icon as any} size={18} color={colors.primary} />
            </View>
            <View style={styles.infoMeta}>
                <ThemedText style={styles.infoLabel}>{label}</ThemedText>
                <ThemedText style={styles.infoValue}>{value}</ThemedText>
            </View>
        </Animated.View>
    );
});

// ── CallButton Component ─────────────────────────────────────────────────────
const CallButton = React.memo(({ onPress }: { onPress: () => void }) => {
    const { theme } = useTheme();
    const colors = Colors[theme];

    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.8}
            style={[styles.callNowBtn, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
        >
            <Ionicons name="call" size={18} color="#FFFFFF" />
            <ThemedText style={styles.callNowText}>Call Now</ThemedText>
        </TouchableOpacity>
    );
});

// ── BusinessDetailModal Component ──────────────────────────────────────────────
export interface BusinessDetailModalProps {
    visible: boolean;
    onClose: () => void;
    business: any;
    businessName: string;
    ownerName: string;
    ownerImage?: string;
    address: string;
    category: string;
    urduCategory?: string;
}

const BusinessDetailModal: React.FC<BusinessDetailModalProps> = ({
    visible,
    onClose,
    business,
    businessName,
    ownerName,
    ownerImage,
    address,
    category,
    urduCategory,
}) => {
    const { theme, isDark } = useTheme();
    const colors = Colors[theme];

    const handleCall = useCallback(() => {
        if (business?.phone) {
            Linking.openURL(`tel:${business.phone}`);
        } else {
            Alert.alert('No Phone', 'Phone number not available.');
        }
    }, [business?.phone]);

    const handleShare = useCallback(async () => {
        try {
            const result = await Share.share({
                message: `Check out ${businessName} (${category}) on Rehbar! \nLocation: ${address}`,
                title: businessName,
            });
            if (result.action === Share.sharedAction) {
                if (result.activityType) {
                    // shared with activity type of result.activityType
                } else {
                    // shared
                }
            } else if (result.action === Share.dismissedAction) {
                // dismissed
            }
        } catch (error: any) {
            Alert.alert(error.message);
        }
    }, [businessName, category, address]);

    return (
        <PremiumModal
            visible={visible}
            onClose={onClose}
            type="centered"
            sheetStyle={styles.modalSheet}
        >
            <View style={[styles.container, { backgroundColor: isDark ? '#0F172A' : '#F8FAFC' }]}>
                {business ? (
                    <>
                        {/* ── HEADER ── */}
                        <View style={[styles.headerWrap, { backgroundColor: colors.primary }]}>
                            <View style={styles.headerTopRow}>
                                <TouchableOpacity onPress={onClose} style={styles.headerActionBtn}>
                                    <Ionicons name="close" size={24} color="#FFFFFF" />
                                </TouchableOpacity>

                                <View style={styles.headerTitleContainer}>
                                    <ThemedText style={styles.headerTitleText}>Business Profile</ThemedText>
                                </View>

                                <TouchableOpacity onPress={handleShare} style={styles.headerActionBtn}>
                                    <Ionicons name="share-social-outline" size={20} color="#FFFFFF" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* ── SCROLLABLE CONTENT ── */}
                        <ScrollView
                            style={styles.contentScroll}
                            contentContainerStyle={styles.scrollContentContainer}
                            showsVerticalScrollIndicator={false}
                        >
                            {/* SUMMARY CARD */}
                            <Animated.View
                                entering={FadeInDown.delay(100).duration(500)}
                                style={[styles.premiumCard, isDark && styles.darkCard]}
                            >
                                <View style={styles.profileHeaderRow}>
                                    <View style={[styles.avatarBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9' }]}>
                                        {ownerImage ? (
                                            <Image
                                                source={{ uri: ownerImage }}
                                                style={styles.fullImage}
                                                contentFit="cover"
                                                transition={200}
                                            />
                                        ) : (
                                            <ThemedText style={[styles.avatarLetter, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                                                {ownerName?.charAt(0)?.toUpperCase()}
                                            </ThemedText>
                                        )}
                                    </View>

                                    <View style={styles.profileInfoMeta}>
                                        <ThemedText
                                            style={[styles.businessNameText, { color: isDark ? '#F8FAFC' : '#0F172A' }]}
                                            numberOfLines={2}
                                        >
                                            {businessName}
                                        </ThemedText>
                                        <View style={[styles.categoryBadge, { backgroundColor: `${colors.primary}15` }]}>
                                            <ThemedText style={[styles.categoryBadgeText, { color: colors.primary }]}>
                                                {category}{urduCategory ? `  •  ${urduCategory}` : ''}
                                            </ThemedText>
                                        </View>
                                    </View>
                                </View>
                            </Animated.View>

                            {/* ABOUT SECTION */}
                            {business?.description ? (
                                <Animated.View
                                    entering={FadeInDown.delay(200).duration(500)}
                                    style={[styles.premiumCard, isDark && styles.darkCard]}
                                >
                                    <View style={styles.sectionHeaderSmall}>
                                        <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
                                        <ThemedText style={styles.sectionHeaderText}>About</ThemedText>
                                    </View>
                                    <ThemedText style={[styles.descriptionText, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                                        {business.description}
                                    </ThemedText>
                                </Animated.View>
                            ) : null}

                            {/* PHOTOS SECTION */}
                            {business?.photos?.length > 0 && (
                                <Animated.View
                                    entering={FadeInDown.delay(300).duration(500)}
                                    style={[styles.premiumCard, isDark && styles.darkCard]}
                                >
                                    <View style={styles.sectionHeaderSmall}>
                                        <Ionicons name="images-outline" size={20} color={colors.primary} />
                                        <ThemedText style={styles.sectionHeaderText}>Photos</ThemedText>
                                    </View>
                                    <View style={styles.photosGrid}>
                                        {business.photos.map((photo: string, index: number) => (
                                            <Animated.View
                                                key={index}
                                                entering={FadeIn.delay(100 * index)}
                                                style={styles.photoWrap}
                                            >
                                                <Image
                                                    source={{ uri: photo }}
                                                    style={styles.galleryImage}
                                                    contentFit="cover"
                                                    transition={200}
                                                />
                                            </Animated.View>
                                        ))}
                                    </View>
                                </Animated.View>
                            )}

                            {/* CONTACT INFORMATION */}
                            <Animated.View
                                entering={FadeInDown.delay(400).duration(500)}
                                style={[styles.premiumCard, isDark && styles.darkCard]}
                            >
                                <View style={styles.sectionHeaderSmall}>
                                    <Ionicons name="id-card-outline" size={20} color={colors.primary} />
                                    <ThemedText style={styles.sectionHeaderText}>Contact Information</ThemedText>
                                </View>

                                <View style={styles.infoRowsContainer}>
                                    <InfoRow icon="person-outline" label="Owner Name" value={ownerName} delay={450} />
                                    <InfoRow icon="location-outline" label="Address" value={address} delay={500} />
                                </View>
                            </Animated.View>

                            {/* TRUST BADGE */}
                            <View style={styles.trustFooter}>
                                <Ionicons name="shield-checkmark" size={16} color="#94A3B8" />
                                <ThemedText style={styles.trustText}>Verified business information.</ThemedText>
                            </View>
                        </ScrollView>

                        {/* ── FOOTER ACTION ── */}
                        <View style={styles.footerWrap}>
                            <CallButton onPress={handleCall} />
                        </View>
                    </>
                ) : (
                    <View style={styles.loaderContainer}>
                        <ActivityIndicator size="large" color={colors.primary} />
                    </View>
                )}
            </View>
        </PremiumModal>
    );
};

export default BusinessDetailModal;

const styles = StyleSheet.create({
    modalSheet: {
        width: '90%',
        height: '80%',
        paddingTop: 0,
        paddingHorizontal: 0,
        paddingBottom: 0,
        borderRadius: 24,
        overflow: 'hidden',
        backgroundColor: '#FFFFFF',
    },
    container: {
        width: '100%',
        flex: 1,
    },
    loaderContainer: {
        height: 200,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerWrap: {
        paddingTop: 8,
        paddingBottom: 8,
    },
    headerTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        height: 44,
    },
    headerActionBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.18)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitleContainer: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitleText: {
        fontSize: Platform.select({ ios: 16, android: 14 }),
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },
    contentScroll: {
        flex: 1,
    },
    scrollContentContainer: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 20,
    },
    premiumCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: Platform.select({ ios: 10, android: 8 }),
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    darkCard: {
        backgroundColor: '#1E293B',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    profileHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    avatarBox: {
        width: 44,
        height: 44,
        borderRadius: 12,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullImage: {
        width: '100%',
        height: '100%',
    },
    avatarLetter: {
        fontSize: Platform.select({ ios: 24, android: 22 }),
        fontWeight: '800',
    },
    profileInfoMeta: {
        flex: 1,
        gap: 2,
    },
    businessNameText: {
        fontSize: Platform.select({ ios: 18, android: 16 }),
        fontWeight: '800',
    },
    categoryBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        alignSelf: 'flex-start',
    },
    categoryBadgeText: {
        fontSize: Platform.select({ ios: 11, android: 9 }),
        fontWeight: '700',
    },
    sectionHeaderSmall: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    sectionHeaderText: {
        fontSize: Platform.select({ ios: 12, android: 10 }),
        fontWeight: '700',
        color: '#94A3B8',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    descriptionText: {
        fontSize: Platform.select({ ios: 14, android: 12 }),
        lineHeight: 20,
        fontWeight: '500',
    },
    photosGrid: {
        gap: 8,
    },
    photoWrap: {
        width: '100%',
        height: 150,
        borderRadius: 12,
        overflow: 'hidden',
    },
    galleryImage: {
        width: '100%',
        height: '100%',
    },
    infoRowsContainer: {
        gap: 6,
    },
    infoRowContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderRadius: 12,
        gap: 10,
    },
    infoIconCircle: {
        width: 32,
        height: 32,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    infoMeta: {
        flex: 1,
    },
    infoLabel: {
        fontSize: Platform.select({ ios: 10, android: 8 }),
        color: '#94A3B8',
        fontWeight: '600',
        marginBottom: 1,
    },
    infoValue: {
        fontSize: Platform.select({ ios: 12, android: 10 }),
        fontWeight: '700',
    },
    footerWrap: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: 'transparent',
    },
    callNowBtn: {
        height: 44,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    callNowText: {
        color: '#FFFFFF',
        fontSize: Platform.select({ ios: 14, android: 12 }),
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    trustFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        marginTop: 4,
        opacity: 0.6,
    },
    trustText: {
        fontSize: 9,
        color: '#94A3B8',
        fontWeight: '500',
    },
});