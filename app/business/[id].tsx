import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useRef, useMemo, useEffect } from 'react';
import {
    ActivityIndicator,
    Alert,
    Linking,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
    Platform,
} from 'react-native';
import { Image } from 'expo-image';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import Animated, {
    Easing,
    FadeInDown,
    FadeInUp,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from 'react-native-reanimated';

import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { ReportModal } from '@/components/common/ReportModal';
import { ThemedText } from '@/components/ThemedText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BannerAd from '@/ads/components/BannerAd';
import InterstitialService from '@/ads/interstitial.service';
import { capitalizeString } from '@/utils/string';
import { ContactSection } from '@/components/essentials/shared/ContactSection';
import { LocationSection } from '@/components/essentials/shared/LocationSection';
import { TagChips } from '@/components/essentials/shared/TagChips';
import { SectionHeading } from '@/components/essentials/shared/SectionHeading';
import { PressableScale } from '@/components/essentials/shared/PressableScale';


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

    // The logo tile gently floats, matching the essentials hero language.
    const bob = useSharedValue(0);
    useEffect(() => {
        bob.value = withRepeat(
            withTiming(1, { duration: 2100, easing: Easing.inOut(Easing.sin) }),
            -1,
            true
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    const bobStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: -3 + bob.value * 6 }],
    }));

    if (!business) {
        return (
            <View style={[styles.loaderContainer, { backgroundColor: colors.background }]}>
                <Stack.Screen options={{ title: 'Loading...', headerShown: false }} />
                <ActivityIndicator size="large" color={primaryColor} />
            </View>
        );
    }

    const businessImage = (business.images && business.images.length > 0 ? business.images[0] : null) || business.logo || null;

    const contacts = [
        business.phone ? { name: 'Business Phone', number: business.phone } : null,
        business.phone2 ? { name: 'Secondary Contact', number: business.phone2 } : null,
    ].filter(Boolean) as { name: string; number: string }[];

    return (
        <View style={[styles.container, { backgroundColor: isDark ? '#1e293b' : '#FFFFFF' }]}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* ── Business Hero ───────────────────────────────────────── */}
            <Animated.View entering={FadeInUp.duration(450)} style={[styles.heroHeader, { backgroundColor: colors.primary }]}>
                {/* Storefront decor, matching the shared BusinessHero */}
                <Svg
                    style={StyleSheet.absoluteFill}
                    viewBox="0 0 375 170"
                    preserveAspectRatio="xMinYMin slice"
                >
                    <Circle cx={355} cy={5} r={90} fill="rgba(255,255,255,0.05)" />
                    <Circle cx={10} cy={170} r={65} fill="rgba(255,255,255,0.05)" />
                    <Path
                        d="M255 130 Q285 95 315 105 T380 65"
                        stroke="rgba(255,255,255,0.08)"
                        strokeWidth={2}
                        fill="none"
                    />
                    <Path
                        d="M40 78 L100 78 L95 93 L85 93 L80 78 L70 78 L65 93 L55 93 L50 78 L40 78 Z"
                        fill="rgba(255,255,255,0.07)"
                    />
                    <Rect x={48} y={93} width={44} height={28} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={1.5} />
                    <Circle cx={150} cy={45} r={3} fill={colors.lime} opacity={0.5} />
                    <Circle cx={265} cy={55} r={2.5} fill={colors.secondary} opacity={0.55} />
                </Svg>

                {/* Nav row */}
                <View style={[styles.heroHeaderTop, { paddingTop: insets.top + (Platform.OS === 'android' ? 16 : 8) }]}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.heroBackButton}>
                        <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.heroBackButton, { backgroundColor: '#FFFFFF' }]}
                        onPress={() => reportModalRef.current?.present()}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="flag" size={18} color="#EF4444" />
                    </TouchableOpacity>
                </View>

                {/* Identity row */}
                <Animated.View entering={FadeInDown.delay(100).duration(450)} style={styles.identityRow}>
                    <View style={styles.identityText}>
                        {category ? (
                            <View style={styles.chipRow}>
                                <View style={[styles.typeChip, { backgroundColor: colors.lime }]}>
                                    <Ionicons name="storefront" size={11} color="#1E293B" />
                                    <ThemedText style={styles.typeChipText} numberOfLines={1}>
                                        {category}{urduCategory ? ` | ${urduCategory}` : ''}
                                    </ThemedText>
                                </View>
                            </View>
                        ) : null}
                        <ThemedText style={styles.heroTitle} numberOfLines={2}>
                            {businessName}
                        </ThemedText>
                        <View style={styles.subtitleRow}>
                            <Ionicons name="person" size={12} color={colors.secondary} />
                            <ThemedText style={styles.heroSubtitle} numberOfLines={1}>
                                By {ownerName}
                            </ThemedText>
                        </View>
                    </View>

                    <Animated.View style={[styles.logoTile, bobStyle]}>
                        {businessImage ? (
                            <Image source={{ uri: businessImage }} style={styles.logoImage} contentFit="cover" />
                        ) : (
                            <Ionicons name="business" size={26} color="#FFFFFF" />
                        )}
                    </Animated.View>
                </Animated.View>
            </Animated.View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                style={[styles.scrollView, { backgroundColor: isDark ? '#1e293b' : '#FFFFFF' }]}
                contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 40 }}
            >
                {/* Detail Card Container */}
                <View style={[styles.detailsCard, { backgroundColor: isDark ? '#1e293b' : '#FFFFFF', flex: 1 }]}>

                    {/* Primary action */}
                    <Animated.View entering={FadeInDown.duration(400)} style={styles.actionRow}>
                        {business.phone ? (
                            <PressableScale
                                onPress={handleCall}
                                intensity={0.04}
                                containerStyle={{ flex: 1 }}
                                style={[styles.callButton, { backgroundColor: colors.primary }]}
                            >
                                <View style={[styles.callIcon, { backgroundColor: colors.lime }]}>
                                    <Ionicons name="call" size={15} color="#FFFFFF" />
                                </View>
                                <ThemedText style={styles.callButtonText}>Call Business</ThemedText>
                            </PressableScale>
                        ) : (
                            <View style={[styles.callButton, { flex: 1, backgroundColor: `${colors.primary}10`, opacity: 0.6 }]}>
                                <Ionicons name="call-outline" size={16} color={colors.primary} />
                                <ThemedText style={[styles.callButtonText, { color: colors.primary }]}>No Phone</ThemedText>
                            </View>
                        )}
                    </Animated.View>

                    {/* Banner Ad */}
                    <View style={styles.detailAdWrapper}>
                        <BannerAd placement="business_detail" />
                    </View>

                    {/* Details Sections */}
                    <View style={styles.sectionsContainer}>

                        {/* About */}
                        {business.description && (
                            <View style={styles.detailSection}>
                                <SectionHeading icon="storefront" label="About Business" />
                                <ThemedText style={[styles.descriptionText, { color: colors.textSecondary }]}>
                                    {business.description}
                                </ThemedText>
                            </View>
                        )}

                        {/* Contacts (shared component, same tel: behavior) */}
                        <ContactSection contacts={contacts} />

                        {/* Location + business hours (shared component) */}
                        <LocationSection
                            place={business}
                            address={address}
                            timingLabel="Business Hours"
                        />

                        {/* Specialties & services */}
                        {business.tags && business.tags.length > 0 && (
                            <TagChips
                                tags={business.tags}
                                title="Specialties & Services"
                                accentDots
                            />
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
        paddingBottom: 20,
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
        overflow: 'hidden',
    },
    heroHeaderTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 4,
    },
    heroBackButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(0,0,0,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    identityRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginTop: 8,
        gap: 14,
    },
    identityText: {
        flex: 1,
    },
    chipRow: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    typeChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        maxWidth: '100%',
    },
    typeChipText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#1E293B',
        textTransform: 'uppercase',
        letterSpacing: 0.6,
        flexShrink: 1,
    },
    heroTitle: {
        fontSize: 21,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 0.2,
        lineHeight: 26,
    },
    subtitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        marginTop: 5,
    },
    heroSubtitle: {
        fontSize: 12.5,
        color: 'rgba(255,255,255,0.85)',
        fontWeight: '600',
        flexShrink: 1,
    },
    logoTile: {
        width: 58,
        height: 58,
        borderRadius: 29,
        backgroundColor: 'rgba(255,255,255,0.16)',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    logoImage: {
        width: '100%',
        height: '100%',
    },
    scrollView: {
        flex: 1,
    },
    detailsCard: {
        paddingHorizontal: 16,
        paddingTop: 12,
        flex: 1,
    },
    actionRow: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    callButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        height: 52,
        borderRadius: 26,
    },
    callIcon: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    callButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '800',
        letterSpacing: 0.3,
    },
    detailAdWrapper: {
        marginBottom: 10,
        alignItems: 'center',
    },
    sectionsContainer: {
        gap: 16,
    },
    detailSection: {
        gap: 8,
    },
    descriptionText: {
        fontSize: 12.5,
        lineHeight: 19,
    },
});
