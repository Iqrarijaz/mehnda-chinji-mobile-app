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
    Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    useAnimatedScrollHandler,
    interpolate,
    Extrapolate,
    FadeInDown,
} from 'react-native-reanimated';

import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/context/ThemeContext';
import { ReportModal } from '@/components/common/ReportModal';
import { ThemedText } from '@/components/themedText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BannerAd from '@/ads/components/BannerAd';
import InterstitialService from '@/ads/interstitial.service';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HEADER_IMAGE_HEIGHT = 200;

const BusinessDetailScreen = () => {
    const { id, businessData } = useLocalSearchParams<{ id: string; businessData?: string }>();
    const router = useRouter();
    const { theme, isDark } = useTheme();
    const colors = Colors[theme];
    const insets = useSafeAreaInsets();
    const reportModalRef = useRef<any>(null);

    const scrollY = useSharedValue(0);

    // Preload Interstitial Ad
    useEffect(() => {
        InterstitialService.getInstance().load();
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

    const scrollHandler = useAnimatedScrollHandler({
        onScroll: (event) => {
            scrollY.value = event.contentOffset.y;
        },
    });

    const headerAnimatedStyle = useAnimatedStyle(() => {
        const opacity = interpolate(
            scrollY.value,
            [0, HEADER_IMAGE_HEIGHT - 80],
            [0, 1],
            Extrapolate.CLAMP
        );
        return {
            opacity,
            backgroundColor: colors.primary,
        };
    });

    const imageAnimatedStyle = useAnimatedStyle(() => {
        const scale = interpolate(
            scrollY.value,
            [-HEADER_IMAGE_HEIGHT, 0],
            [2, 1],
            Extrapolate.CLAMP
        );
        const translateY = interpolate(
            scrollY.value,
            [-HEADER_IMAGE_HEIGHT, 0, HEADER_IMAGE_HEIGHT],
            [-HEADER_IMAGE_HEIGHT / 2, 0, HEADER_IMAGE_HEIGHT * 0.4],
            Extrapolate.CLAMP
        );
        return {
            transform: [{ scale }, { translateY }],
        };
    });

    if (!business) {
        return (
            <View style={[styles.loaderContainer, { backgroundColor: colors.background }]}>
                <Stack.Screen options={{ title: 'Loading...', headerShown: false }} />
                <ActivityIndicator size="large" color={primaryColor} />
            </View>
        );
    }

    const businessImage = (business.images && business.images.length > 0 ? business.images[0] : null) || business.logo || null;

    return (
        <View style={[styles.container, { backgroundColor: isDark ? '#1e293b' : '#FFFFFF' }]}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Custom Dynamic Header */}
            <View style={[styles.headerContainer, { height: insets.top + 48 }]}>
                <Animated.View style={[StyleSheet.absoluteFillObject, headerAnimatedStyle]} />
                <View style={[styles.headerContent, { paddingTop: insets.top }]}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={[styles.headerBtn, { backgroundColor: isDark ? 'rgba(15,23,42,0.6)' : 'rgba(0,0,0,0.4)' }]}
                    >
                        <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
                    </TouchableOpacity>

                    <View style={styles.headerTitleContainer}>
                        <ThemedText style={styles.headerTitleText} numberOfLines={1}>
                            {businessName}
                        </ThemedText>
                    </View>

                    <TouchableOpacity
                        onPress={handleShare}
                        style={[styles.headerBtn, { backgroundColor: isDark ? 'rgba(15,23,42,0.6)' : 'rgba(0,0,0,0.4)' }]}
                    >
                        <Ionicons name="share-outline" size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>
            </View>

            <Animated.ScrollView
                onScroll={scrollHandler}
                scrollEventThrottle={16}
                showsVerticalScrollIndicator={false}
                style={[styles.scrollView, { backgroundColor: isDark ? '#1e293b' : '#FFFFFF' }]}
                contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 40 }}
            >
                {/* Hero Cover Banner */}
                <View style={styles.bannerWrapper}>
                    {businessImage ? (
                        <Animated.View style={[styles.imageContainer, imageAnimatedStyle]}>
                            <Image
                                source={{ uri: businessImage }}
                                style={StyleSheet.absoluteFillObject}
                                contentFit="cover"
                            />
                            <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.2)' }]} />
                        </Animated.View>
                    ) : (
                        <Animated.View style={[styles.fallbackBanner, { backgroundColor: colors.primary }, imageAnimatedStyle]}>
                            <Ionicons name="business" size={64} color="rgba(255,255,255,0.4)" />
                        </Animated.View>
                    )}
                </View>

                {/* Overlapping Detail Card Container */}
                <View style={[styles.detailsCard, { backgroundColor: isDark ? '#1e293b' : '#FFFFFF', flex: 1 }]}>

                    {/* Header info */}
                    <View style={styles.cardHeader}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                            <View style={{ flex: 1 }}>
                                <ThemedText style={[styles.businessTitle, { color: colors.text }]} numberOfLines={2}>
                                    {businessName}
                                </ThemedText>

                                {/* Combined Categories list */}
                                <View style={styles.categoryRow}>
                                    <View style={[styles.tag, { backgroundColor: colors.primary + '10' }]}>
                                        <Ionicons name="pricetag-outline" size={10} color={colors.primary} />
                                        <ThemedText style={[styles.tagText, { color: colors.primary }]}>
                                            {category} {urduCategory ? `| ${urduCategory}` : ''}
                                        </ThemedText>
                                    </View>
                                </View>
                            </View>

                            {(business.logo || (business.images && business.images.length > 0)) && (
                                <Image
                                    source={{ uri: business.logo || business.images[0] }}
                                    style={[styles.detailLogo, { borderColor: isDark ? '#334155' : 'rgba(0,0,0,0.08)' }]}
                                    contentFit="cover"
                                />
                            )}
                        </View>
                    </View>

                    {/* Quick Interactive Actions Row */}
                    <View style={[styles.actionRow, { borderBottomColor: isDark ? '#334155' : '#f1f5f9' }]}>
                        {business.phone ? (
                            <TouchableOpacity
                                style={[styles.actionBtnPrimary, { backgroundColor: colors.primary }]}
                                onPress={handleCall}
                                activeOpacity={0.8}
                            >
                                <Ionicons name="call" size={16} color="#FFFFFF" />
                                <ThemedText style={styles.actionBtnTextPrimary}>Call Business</ThemedText>
                            </TouchableOpacity>
                        ) : (
                            <View style={[styles.actionBtnPrimary, { backgroundColor: colors.border, opacity: 0.6 }]}>
                                <Ionicons name="call-outline" size={16} color={colors.textSecondary} />
                                <ThemedText style={[styles.actionBtnTextPrimary, { color: colors.textSecondary }]}>No Phone</ThemedText>
                            </View>
                        )}

                        <TouchableOpacity
                            style={[styles.actionBtnSec, { backgroundColor: isDark ? '#334155' : '#f1f5f9' }]}
                            onPress={() => reportModalRef.current?.present()}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="flag-outline" size={14} color="#EF4444" />
                            <ThemedText style={[styles.actionBtnTextSec, { color: '#EF4444' }]}>Report</ThemedText>
                        </TouchableOpacity>
                    </View>

                    {/* Banner Ad */}
                    <View style={styles.detailAdWrapper}>
                        <BannerAd placement="business_detail" />
                    </View>

                    {/* Details Sections */}
                    <View style={styles.sectionsContainer}>

                        {/* Section: Description/About */}
                        {business.description && (
                            <View style={styles.detailSection}>
                                <ThemedText style={[styles.sectionHeading, { color: colors.textSecondary }]}>
                                    About Business
                                </ThemedText>
                                <ThemedText style={[styles.descriptionText, { color: colors.text }]}>
                                    {business.description}
                                </ThemedText>
                            </View>
                        )}

                        {/* Section: Tags/Specialties */}
                        {business.tags && business.tags.length > 0 && (
                            <View style={styles.detailSection}>
                                <ThemedText style={[styles.sectionHeading, { color: colors.textSecondary }]}>
                                    Specialties & Services
                                </ThemedText>
                                <View style={styles.detailsTagsContainer}>
                                    {business.tags.map((tag: any, index: number) => (
                                        <View
                                            key={index}
                                            style={[
                                                styles.detailTagChip,
                                                {
                                                    backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC',
                                                    borderColor: colors.border,
                                                }
                                            ]}
                                        >
                                            <ThemedText style={[styles.detailTagText, { color: colors.text }]}>
                                                {tag.eng} | {tag.ur}
                                            </ThemedText>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}

                        {/* Section: Info Details */}
                        <View style={styles.detailSection}>
                            <ThemedText style={[styles.sectionHeading, { color: colors.textSecondary }]}>
                                Contact & Location
                            </ThemedText>

                            <View style={styles.infoListItem}>
                                <View style={[styles.infoListIcon, { backgroundColor: colors.primary + '10' }]}>
                                    <Ionicons name="person" size={12} color={colors.primary} />
                                </View>
                                <View style={styles.infoListContent}>
                                    <ThemedText style={[styles.infoListLabel, { color: colors.textSecondary }]}>Owner Name</ThemedText>
                                    <ThemedText style={[styles.infoListVal, { color: colors.text }]}>{ownerName}</ThemedText>
                                </View>
                            </View>

                            <View style={styles.infoListItem}>
                                <View style={[styles.infoListIcon, { backgroundColor: colors.primary + '10' }]}>
                                    <Ionicons name="location" size={12} color={colors.primary} />
                                </View>
                                <View style={styles.infoListContent}>
                                    <ThemedText style={[styles.infoListLabel, { color: colors.textSecondary }]}>Address</ThemedText>
                                    <ThemedText style={[styles.infoListVal, { color: colors.text }]}>{address}</ThemedText>
                                    {(business.village || business.city) && (
                                        <ThemedText style={[styles.infoListSub, { color: colors.textSecondary }]}>
                                            {[business.village, business.city].filter(Boolean).join(', ')}
                                        </ThemedText>
                                    )}
                                </View>
                            </View>

                            {business.phone && (
                                <TouchableOpacity style={styles.infoListItem} onPress={handleCall} activeOpacity={0.7}>
                                    <View style={[styles.infoListIcon, { backgroundColor: colors.primary + '10' }]}>
                                        <Ionicons name="call" size={12} color={colors.primary} />
                                    </View>
                                    <View style={styles.infoListContent}>
                                        <ThemedText style={[styles.infoListLabel, { color: colors.textSecondary }]}>Primary Contact</ThemedText>
                                        <ThemedText style={[styles.infoListVal, { color: colors.text, fontWeight: '600' }]}>{business.phone}</ThemedText>
                                    </View>
                                </TouchableOpacity>
                            )}

                            {business.phone2 && (
                                <TouchableOpacity style={styles.infoListItem} onPress={() => Linking.openURL(`tel:${business.phone2}`)} activeOpacity={0.7}>
                                    <View style={[styles.infoListIcon, { backgroundColor: colors.primary + '10' }]}>
                                        <Ionicons name="call" size={12} color={colors.primary} />
                                    </View>
                                    <View style={styles.infoListContent}>
                                        <ThemedText style={[styles.infoListLabel, { color: colors.textSecondary }]}>Secondary Contact</ThemedText>
                                        <ThemedText style={[styles.infoListVal, { color: colors.text }]}>{business.phone2}</ThemedText>
                                    </View>
                                </TouchableOpacity>
                            )}

                            {business.timing && (
                                <View style={styles.infoListItem}>
                                    <View style={[styles.infoListIcon, { backgroundColor: colors.primary + '10' }]}>
                                        <Ionicons name="time" size={12} color={colors.primary} />
                                    </View>
                                    <View style={styles.infoListContent}>
                                        <ThemedText style={[styles.infoListLabel, { color: colors.textSecondary }]}>Business Hours</ThemedText>
                                        <ThemedText style={[styles.infoListVal, { color: colors.text }]}>{business.timing}</ThemedText>
                                    </View>
                                </View>
                            )}

                            {business.createdAt && (
                                <View style={styles.infoListItem}>
                                    <View style={[styles.infoListIcon, { backgroundColor: colors.primary + '10' }]}>
                                        <Ionicons name="calendar" size={12} color={colors.primary} />
                                    </View>
                                    <View style={styles.infoListContent}>
                                        <ThemedText style={[styles.infoListLabel, { color: colors.textSecondary }]}>Listed On</ThemedText>
                                        <ThemedText style={[styles.infoListVal, { color: colors.text }]}>
                                            {new Date(business.createdAt).toLocaleDateString(undefined, {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </ThemedText>
                                    </View>
                                </View>
                            )}
                        </View>
                    </View>
                </View>
            </Animated.ScrollView>

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
    headerContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
    },
    headerContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
    },
    headerBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitleContainer: {
        flex: 1,
        marginHorizontal: 16,
        alignItems: 'center',
    },
    headerTitleText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    scrollView: {
        flex: 1,
    },
    bannerWrapper: {
        height: HEADER_IMAGE_HEIGHT,
        width: '100%',
        overflow: 'hidden',
    },
    imageContainer: {
        width: '100%',
        height: '100%',
    },
    fallbackBanner: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    detailsCard: {
        marginTop: -20,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingHorizontal: 16,
        paddingTop: 20,
        flex: 1,
    },
    cardHeader: {
        marginBottom: 12,
    },
    businessTitle: {
        fontSize: 18,
        fontWeight: '800',
        lineHeight: 24,
        marginBottom: 6,
    },
    categoryRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    tag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    tagText: {
        fontSize: 10,
        fontWeight: '700',
    },
    actionRow: {
        flexDirection: 'row',
        gap: 8,
        paddingBottom: 16,
        borderBottomWidth: 1,
        marginBottom: 16,
    },
    actionBtnPrimary: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        height: 38,
        borderRadius: 10,
    },
    actionBtnTextPrimary: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '700',
    },
    actionBtnSec: {
        paddingHorizontal: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        height: 38,
        borderRadius: 10,
    },
    actionBtnTextSec: {
        fontSize: 12,
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
        fontSize: 10,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: 4,
    },
    descriptionText: {
        fontSize: 12,
        lineHeight: 18,
    },
    infoListItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        gap: 12,
    },
    infoListIcon: {
        width: 26,
        height: 26,
        borderRadius: 13,
        justifyContent: 'center',
        alignItems: 'center',
    },
    infoListContent: {
        flex: 1,
    },
    infoListLabel: {
        fontSize: 9,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 1,
    },
    infoListVal: {
        fontSize: 12,
        fontWeight: '500',
    },
    infoListSub: {
        fontSize: 11,
        marginTop: 1,
    },
    detailLogo: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(0,0,0,0.05)',
        borderWidth: 1,
    },
    detailsTagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginTop: 4,
    },
    detailTagChip: {
        borderRadius: 20,
        borderWidth: 1,
        paddingHorizontal: 10,
        paddingVertical: 5,
    },
    detailTagText: {
        fontSize: 10,
        fontWeight: '600',
    },
});