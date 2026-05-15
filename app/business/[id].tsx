import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useRef, useMemo, useEffect } from 'react';
import {
    ActivityIndicator,
    Alert,
    Linking,
    ScrollView,
    Share,
    StyleSheet,
    TouchableOpacity,
    View,
    Platform,
} from 'react-native';
import { Image } from 'expo-image';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';

import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/context/ThemeContext';
import { ReportModal } from '@/components/common/ReportModal';
import { ThemedText } from '@/components/themedText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BannerAd from '@/ads/components/BannerAd';
import InterstitialService from '@/ads/interstitial.service';

const BusinessDetailScreen = () => {
    const { id, businessData } = useLocalSearchParams<{ id: string; businessData?: string }>();
    const router = useRouter();
    const { theme, isDark } = useTheme();
    const colors = Colors[theme];
    const insets = useSafeAreaInsets();
    const reportModalRef = useRef<any>(null);

    // Preload Interstitial Ad
    useEffect(() => {
        InterstitialService.getInstance().load();

        // Optionally show after a short delay to ensure it's ready
        const adTimer = setTimeout(() => {
            InterstitialService.getInstance().show();
        }, 1000);

        return () => clearTimeout(adTimer);
    }, []);

    const business = useMemo(() => {
        try {
            return businessData ? JSON.parse(businessData) : null;
        } catch (e) {
            console.error('Failed to parse businessData', e);
            return null;
        }
    }, [businessData]);

    const primaryColor = colors.primary;

    const capitalize = (str?: string) =>
        str
            ? str
                .toLowerCase()
                .split(' ')
                .map(w => w.charAt(0).toUpperCase() + w.slice(1))
                .join(' ')
            : '';

    const businessName = useMemo(() => capitalize(business?.name), [business?.name]);
    const ownerName = useMemo(() => capitalize(business?.userId?.name || 'Owner'), [business?.userId?.name]);
    const address = capitalize(business?.address || business?.village || 'N/A');
    const category = capitalize(business?.categoryEn || '');
    const urduCategory = business?.categoryUr;

    const handleCall = useCallback(() => {
        if (business?.phone) {
            Linking.openURL(`tel:${business.phone}`);
        } else {
            Alert.alert('No Phone', 'Phone number not available.');
        }
    }, [business?.phone]);

    const handleShare = useCallback(async () => {
        try {
            await Share.share({
                message: `Check out ${businessName} on Rehbar!\n📍 ${address}\n📞 ${business?.phone || 'Contact for details'}`,
                title: businessName,
            });
        } catch (error: any) {
            Alert.alert(error.message);
        }
    }, [businessName, address, business?.phone]);

    if (!business) {
        return (
            <View style={[styles.loaderContainer, { backgroundColor: colors.background }]}>
                <Stack.Screen options={{ title: 'Loading...', headerShown: false }} />
                <ActivityIndicator size="large" color={primaryColor} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Solid Header */}
            <Animated.View entering={FadeInUp.duration(600)} style={[styles.headerWrap, { backgroundColor: colors.primary }]}>
                <View style={[styles.headerTopRow, { paddingTop: insets.top + 8 }]}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={styles.headerBackBtn}
                    >
                        <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
                    </TouchableOpacity>
                    <View style={styles.headerTitleWrap}>
                        <ThemedText style={styles.headerTitle}>Business Details</ThemedText>
                    </View>
                    <TouchableOpacity
                        onPress={handleShare}
                        style={styles.headerBackBtn}
                    >
                        <Ionicons name="share-outline" size={22} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>
            </Animated.View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                style={styles.scrollView}
                contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
            >
                {/* Image Header */}
                {business.images && business.images.length > 0 && (
                    <View style={styles.imageHeaderWrapper}>
                        <Image
                            source={{ uri: business.images[0] }}
                            style={styles.headerImage}
                            contentFit="cover"
                            transition={300}
                        />
                        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.2)' }]} />
                    </View>
                )}

                {/* Info Container */}
                <View style={styles.heroContainer}>
                    {/* 1. Name */}
                    <ThemedText style={[styles.businessName, { color: colors.text }]}>
                        {businessName}
                    </ThemedText>

                    {/* 2. Category */}
                    <View style={styles.chipRow}>
                        <View style={[styles.categoryChip, { backgroundColor: primaryColor + '12', borderColor: primaryColor + '20' }]}>
                            <Ionicons name="pricetag" size={12} color={primaryColor} />
                            <ThemedText style={[styles.categoryChipText, { color: primaryColor }]}>
                                {category}
                            </ThemedText>
                        </View>

                        {urduCategory && (
                            <View style={[styles.categoryChip, { backgroundColor: primaryColor + '12', borderColor: primaryColor + '20' }]}>
                                <ThemedText style={[styles.categoryChipUrduText, { color: primaryColor }]}>
                                    {urduCategory}
                                </ThemedText>
                            </View>
                        )}
                    </View>

                    {/* 3. Report button */}
                    <TouchableOpacity
                        style={styles.reportButton}
                        onPress={() => reportModalRef.current?.present()}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="flag-outline" size={14} color="#EF4444" />
                        <ThemedText style={styles.reportButtonText}>
                            Report Listing
                        </ThemedText>
                    </TouchableOpacity>
                </View>

                {/* 4. Banner Ad */}
                <View style={styles.adContainer}>
                    <BannerAd />
                </View>

                {/* 5. Rest of the info */}
                <View style={[styles.card, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF' }]}>
                    {/* Location Section */}
                    <View style={styles.locationInfo}>
                        <View style={styles.locationTextContainer}>
                            <ThemedText style={[styles.addressText, { color: colors.text }]}>{address}</ThemedText>
                            {(business.village || business.city) && (
                                <ThemedText style={[styles.areaText, { color: colors.textSecondary }]}>
                                    {[business.village, business.city].filter(Boolean).join(', ')}
                                </ThemedText>
                            )}
                        </View>
                    </View>

                    {/* Contact Section */}
                    <View style={styles.sectionSeparator}>
                        <View style={[styles.divider, { backgroundColor: colors.border }]} />
                        <View style={styles.contactInfo}>
                            <View style={styles.contactRow}>
                                <Ionicons name="person-outline" size={16} color={colors.textSecondary} />
                                <ThemedText style={[styles.contactText, { color: colors.text }]}>{ownerName}</ThemedText>
                            </View>

                            {business.phone && (
                                <TouchableOpacity
                                    style={styles.contactRow}
                                    onPress={handleCall}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons name="call-outline" size={16} color={colors.textSecondary} />
                                    <ThemedText style={[styles.contactText, { color: colors.text, fontWeight: '600' }]}>{business.phone}</ThemedText>
                                    <View style={[styles.callIconBadge, { backgroundColor: colors.primary + '15' }]}>
                                        <Ionicons name="call" size={14} color={colors.primary} />
                                    </View>
                                </TouchableOpacity>
                            )}

                            {business.phone2 && (
                                <TouchableOpacity
                                    style={styles.contactRow}
                                    onPress={() => Linking.openURL(`tel:${business.phone2}`)}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons name="call-outline" size={16} color={colors.textSecondary} />
                                    <ThemedText style={[styles.contactText, { color: colors.text }]}>{business.phone2}</ThemedText>
                                    <View style={[styles.callIconBadge, { backgroundColor: colors.primary + '15' }]}>
                                        <Ionicons name="call" size={14} color={colors.primary} />
                                    </View>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    {/* About Section */}
                    {business.description && (
                        <View style={styles.sectionSeparator}>
                            <View style={[styles.divider, { backgroundColor: colors.border }]} />
                            <ThemedText style={[styles.descriptionText, { color: colors.textSecondary }]}>
                                {business.description}
                            </ThemedText>
                        </View>
                    )}

                    {/* Additional Information */}
                    <View style={styles.sectionSeparator}>
                        <View style={[styles.divider, { backgroundColor: colors.border }]} />
                        <View style={styles.infoGrid}>
                            <View style={styles.infoItem}>
                                <ThemedText style={[styles.infoLabel, { color: colors.textSecondary }]}>Category</ThemedText>
                                <ThemedText style={[styles.infoValue, { color: colors.text }]}>{category}</ThemedText>
                            </View>
                            {business.createdAt && (
                                <View style={styles.infoItem}>
                                    <ThemedText style={[styles.infoLabel, { color: colors.textSecondary }]}>Listed On</ThemedText>
                                    <ThemedText style={[styles.infoValue, { color: colors.text }]}>
                                        {new Date(business.createdAt).toLocaleDateString(undefined, {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </ThemedText>
                                </View>
                            )}
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Floating Action Button */}
            {business.phone && (
                <TouchableOpacity
                    style={[styles.fab, { backgroundColor: primaryColor, bottom: insets.bottom + 16 }]}
                    onPress={handleCall}
                    activeOpacity={0.8}
                >
                    <Ionicons name="call" size={24} color="#FFF" />
                    <ThemedText style={styles.fabText}>Call Now</ThemedText>
                </TouchableOpacity>
            )}

            <ReportModal
                ref={reportModalRef}
                targetId={business._id}
                targetType="BUSINESS"
            />
        </View>
    );
};

export default BusinessDetailScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerWrap: {
        paddingBottom: 16,
        borderBottomLeftRadius: Layout.borderRadius,
        borderBottomRightRadius: Layout.borderRadius,
        zIndex: 10,
    },
    headerTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
    },
    headerBackBtn: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: 'rgba(255,255,255,0.18)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitleWrap: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 19,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    scrollView: {
        flex: 1,
        marginTop: -10,
    },
    imageHeaderWrapper: {
        width: '100%',
        height: 240,
        position: 'relative',
    },
    headerImage: {
        width: '100%',
        height: '100%',
    },
    heroContainer: {
        paddingHorizontal: 10,
        paddingTop: 24,
        paddingBottom: 10,
    },
    businessName: {
        fontSize: 26,
        fontWeight: '900',
        lineHeight: 32,
        marginBottom: 10,
        letterSpacing: -0.5,
    },
    chipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16,
    },
    categoryChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
        borderWidth: 1,
    },
    categoryChipText: {
        fontSize: 11,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    categoryChipUrduText: {
        fontSize: 13,
        fontWeight: '700',
    },
    reportButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
        backgroundColor: '#FEF2F2',
        alignSelf: 'flex-start',
    },
    reportButtonText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#EF4444',
    },
    adContainer: {
        paddingHorizontal: 10,
        marginBottom: 10,
        alignItems: 'center',
    },
    card: {
        marginHorizontal: 10,
        marginBottom: 10,
        borderRadius: 16,
        padding: 16,
        ...Platform.select({
            ios: {
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 10,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    sectionSeparator: {
        marginTop: 16,
    },
    divider: {
        height: 1,
        width: '100%',
        marginBottom: 16,
        opacity: 0.5,
    },
    locationInfo: {
        flexDirection: 'row',
        gap: 10,
    },
    locationTextContainer: {
        flex: 1,
        gap: 2,
    },
    addressText: {
        fontSize: 15,
        fontWeight: '500',
        lineHeight: 20,
    },
    areaText: {
        fontSize: 13,
        opacity: 0.7,
    },
    contactInfo: {
        gap: 12,
    },
    contactRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 4,
    },
    contactText: {
        fontSize: 15,
        flex: 1,
    },
    callIconBadge: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    descriptionText: {
        fontSize: 14,
        lineHeight: 22,
        letterSpacing: 0.1,
    },
    infoGrid: {
        gap: 14,
    },
    infoItem: {
        gap: 4,
    },
    infoLabel: {
        fontSize: 11,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        opacity: 0.6,
    },
    infoValue: {
        fontSize: 14,
        fontWeight: '500',
    },
    fab: {
        position: 'absolute',
        bottom: 16,
        left: 10,
        right: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 14,
        borderRadius: 14,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 10,
            },
            android: {
                elevation: 6,
            },
        }),
    },
    fabText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
});