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
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    FadeInDown,
    FadeInUp,
    FadeIn,
} from 'react-native-reanimated';

import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { ReportModal } from '@/components/common/ReportModal';
import { ThemedText } from '@/components/ThemedText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BannerAd from '@/ads/components/BannerAd';
import InterstitialService from '@/ads/interstitial.service';
import { capitalizeString } from '@/utils/string';


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

    const businessName = useMemo(() => capitalizeString(business?.name), [business?.name]);
    const ownerName = useMemo(() => capitalizeString(business?.userId?.name || 'Owner'), [business?.userId?.name]);
    const address = capitalizeString(business?.address || business?.village || 'N/A');
    const category = capitalizeString(business?.categoryEn || '');
    const urduCategory = business?.categoryUr;

    const handleCall = useCallback(() => {
        if (business?.phone) {
            Linking.openURL(`tel:${business.phone}`);
        } else {
            Alert.alert('No Phone', 'Phone number not available.');
        }
    }, [business?.phone]);

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

            {/* ── Hero Header ─────────────────────────────────────────── */}
            <Animated.View entering={FadeInUp.duration(500)} style={styles.heroHeader}>
                <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.primary }]} />

                {/* Nav row */}
                <View style={[styles.heroHeaderTop, { paddingTop: insets.top + (Platform.OS === 'android' ? 16 : 8) }]}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.heroBackButton}>
                        <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Animated.View entering={FadeIn.delay(200).duration(400)} style={{ flex: 1, alignItems: 'center', paddingRight: 40 }}>
                        <ThemedText style={styles.heroHeaderNavTitle} numberOfLines={1}>
                            {businessName}
                        </ThemedText>
                    </Animated.View>
                </View>

                {/* Hero icon + text */}
                <Animated.View entering={FadeInDown.delay(150).duration(500)} style={styles.heroContent}>
                    <View style={styles.heroIconWrap}>
                        {businessImage ? (
                            <Image source={{ uri: businessImage }} style={styles.heroBusinessLogo} contentFit="cover" />
                        ) : (
                            <Ionicons name="business" size={32} color="#0D9488" />
                        )}
                    </View>
                    <ThemedText style={styles.heroTitle} numberOfLines={1}>
                        {businessName}
                    </ThemedText>
                    <ThemedText style={styles.heroSubtitle} numberOfLines={2}>
                        {category} {urduCategory ? `| ${urduCategory}` : ''}
                    </ThemedText>
                </Animated.View>
            </Animated.View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                style={[styles.scrollView, { backgroundColor: isDark ? '#1e293b' : '#FFFFFF' }]}
                contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 40 }}
            >
                {/* Detail Card Container */}
                <View style={[styles.detailsCard, { backgroundColor: isDark ? '#1e293b' : '#FFFFFF', flex: 1 }]}>

                    {/* Quick Interactive Actions Row */}
                    <View style={[styles.actionRow, { borderBottomColor: isDark ? '#334155' : '#f1f5f9' }]}>
                        {business.phone ? (
                            <TouchableOpacity
                                style={[styles.actionBtnPrimary, { backgroundColor: colors.primary }]}
                                onPress={handleCall}
                                activeOpacity={0.8}
                            >
                                <Ionicons name="call" size={20} color="#FFFFFF" />
                                <ThemedText style={styles.actionBtnTextPrimary}>Call Business</ThemedText>
                            </TouchableOpacity>
                        ) : (
                            <View style={[styles.actionBtnPrimary, { backgroundColor: colors.border, opacity: 0.6 }]}>
                                <Ionicons name="call-outline" size={20} color={colors.textSecondary} />
                                <ThemedText style={[styles.actionBtnTextPrimary, { color: colors.textSecondary }]}>No Phone</ThemedText>
                            </View>
                        )}

                        <TouchableOpacity
                            style={[styles.actionBtnSec, { backgroundColor: isDark ? '#334155' : '#f1f5f9' }]}
                            onPress={() => reportModalRef.current?.present()}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="flag-outline" size={20} color="#EF4444" />
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

                        </View>

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
                                                { backgroundColor: colors.primary + '15' }
                                            ]}
                                        >
                                            <ThemedText style={[styles.detailTagText, { color: colors.primary }]}>
                                                {tag.eng} {tag.ur ? `• ${tag.ur}` : ''}
                                            </ThemedText>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}
                    </View>
                </View>
            </ScrollView>

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
    heroHeader: {
        width: '100%',
        paddingBottom: 24,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        overflow: 'hidden',
    },
    heroHeaderTop: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 8,
    },
    scrollView: {
        flex: 1,
    },
    detailsCard: {
        paddingHorizontal: 16,
        paddingTop: 12,
        flex: 1,
    },
    heroBackButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(0,0,0,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },

    heroHeaderNavTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: 0.2,
    },
    heroContent: {
        alignItems: 'center',
        paddingHorizontal: 24,
        marginTop: 16,
    },
    heroIconWrap: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: 'rgba(255,255,255,0.95)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
        overflow: 'hidden',
    },
    heroBusinessLogo: {
        width: '100%',
        height: '100%',
    },
    heroTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#FFFFFF',
        textAlign: 'center',
        letterSpacing: 0.2,
    },
    heroSubtitle: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.8)',
        textAlign: 'center',
        marginTop: 6,
        lineHeight: 18,
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 12,
        paddingBottom: 12,
        paddingTop: 0,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
        marginBottom: 10,
    },
    actionBtnPrimary: {
        width: 140,
        height: 40,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    actionBtnTextPrimary: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700',
    },
    actionBtnSec: {
        width: 140,
        height: 40,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    actionBtnTextSec: {
        fontSize: 14,
        fontWeight: '700',
    },
    detailAdWrapper: {
        marginBottom: 10,
        alignItems: 'center',
    },
    sectionsContainer: {
        gap: 12,
    },
    detailSection: {
        gap: 4,
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
        paddingVertical: 2,
        gap: 8,
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
    },
    detailsTagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 4,
    },
    detailTagChip: {
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 6,
        flexDirection: 'row',
        alignItems: 'center',
    },
    detailTagText: {
        fontSize: 12,
        fontWeight: '600',
    },
});