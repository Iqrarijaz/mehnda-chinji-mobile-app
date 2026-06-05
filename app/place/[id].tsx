import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useRef, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Linking,
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
    FadeIn,
    FadeInUp,
} from 'react-native-reanimated';

import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/context/ThemeContext';
import { ReportModal } from '@/components/common/ReportModal';
import { ThemedText } from '@/components/themedText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TopperCard from '@/components/places/TopperCard';
import EventCard from '@/components/places/EventCard';
import { useAuth } from '@/context/AuthContext';
import BannerAd from '@/ads/components/BannerAd';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HEADER_IMAGE_HEIGHT = 200;

const PlaceDetailScreen = () => {
    const { id, placeData, color, category: categoryParam } = useLocalSearchParams<{
        id: string;
        placeData?: string;
        color?: string;
        category?: string;
    }>();

    const router = useRouter();
    const { theme, isDark } = useTheme();
    const { user: authData } = useAuth();
    const colors = Colors[theme];
    const insets = useSafeAreaInsets();
    const reportModalRef = useRef<any>(null);
    const [eduTab, setEduTab] = useState<'toppers' | 'events'>('toppers');

    const currentUserId = authData?.user?._id;
    const scrollY = useSharedValue(0);

    const place = useMemo(() => {
        try {
            return placeData ? JSON.parse(placeData) : null;
        } catch (e) {
            console.error('Failed to parse placeData', e);
            return null;
        }
    }, [placeData]);

    const primaryColor = color || colors.primary;

    const capitalize = (str?: string) =>
        str
            ? str
                .toLowerCase()
                .split(' ')
                .map(w => w.charAt(0).toUpperCase() + w.slice(1))
                .join(' ')
            : '';

    const renderFormattedText = useCallback((text?: string) => {
        if (!text) return null;
        return text.split('\n').map((line, index) => {
            const trimmed = line.trim();

            // Match Heading 2 first because ## starts with #
            const h2Match = trimmed.match(/^##\s*(.+)/);
            if (h2Match) {
                return (
                    <ThemedText
                        key={index}
                        style={[
                            styles.descriptionText,
                            {
                                color: colors.text,
                                fontSize: 13,
                                fontWeight: '700',
                                marginTop: index > 0 ? 10 : 4,
                                marginBottom: 4,
                                lineHeight: 18,
                            },
                        ]}
                    >
                        {h2Match[1]}
                    </ThemedText>
                );
            }

            const h1Match = trimmed.match(/^#\s*(.+)/);
            if (h1Match) {
                return (
                    <ThemedText
                        key={index}
                        style={[
                            styles.descriptionText,
                            {
                                color: colors.text,
                                fontSize: 15,
                                fontWeight: '800',
                                marginTop: index > 0 ? 12 : 4,
                                marginBottom: 6,
                                lineHeight: 20,
                            },
                        ]}
                    >
                        {h1Match[1]}
                    </ThemedText>
                );
            }

            const bulletMatch = trimmed.match(/^[*•-]\s*(.+)/);
            if (bulletMatch) {
                return (
                    <View key={index} style={{ flexDirection: 'row', alignItems: 'flex-start', marginLeft: 8, marginVertical: 3 }}>
                        <ThemedText style={[styles.descriptionText, { color: colors.textSecondary, marginRight: 8, fontSize: 12 }]}>•</ThemedText>
                        <ThemedText style={[styles.descriptionText, { color: colors.textSecondary, flex: 1, lineHeight: 18 }]}>
                            {bulletMatch[1]}
                        </ThemedText>
                    </View>
                );
            }

            return (
                <ThemedText
                    key={index}
                    style={[
                        styles.descriptionText,
                        {
                            color: colors.textSecondary,
                            lineHeight: 18,
                            marginBottom: trimmed === '' ? 8 : 4,
                        },
                    ]}
                >
                    {line}
                </ThemedText>
            );
        });
    }, [colors]);

    const sortedToppers = useMemo(() => {
        if (!place?.toppers?.length) return [];
        return [...place.toppers].sort((a: any, b: any) => parseInt(b.passingYear) - parseInt(a.passingYear));
    }, [place?.toppers]);

    const sortedEvents = useMemo(() => {
        if (!place?.events?.length) return [];
        return [...place.events].sort((a: any, b: any) => {
            if (!a.date || !b.date) return 0;
            return new Date(b.date).getTime() - new Date(a.date).getTime();
        });
    }, [place?.events]);

    const placeName = useMemo(() => capitalize(place?.name), [place?.name]);
    const address = capitalize(place?.address || place?.village || 'N/A');
    const category = categoryParam || capitalize(place?.category?.en || place?.category || '');
    const coordinates = place?.location?.coordinates;
    const hasValidCoordinates = coordinates && (coordinates[0] !== 0 || coordinates[1] !== 0);

    const handleCall = useCallback((phoneNumber: string) => {
        if (phoneNumber) {
            Linking.openURL(`tel:${phoneNumber}`);
        } else {
            Alert.alert('No Phone', 'Phone number not available.');
        }
    }, []);

    const handleShare = useCallback(async () => {
        try {
            const shareUrl = `https://api.rehbarapp.com/place/${id}`;
            const playStoreUrl = 'https://play.google.com/store/apps/details?id=com.rehbar.community';

            await Share.share({
                title: `Check out ${placeName} on Rehbar`,
                message: `Check out ${placeName} on Rehbar!\n\n📍 ${address}\n\nView details: ${shareUrl}\n\nDon't have the app? Get it here: ${playStoreUrl}`,
                url: shareUrl,
            });
        } catch (error: any) {
            Alert.alert(error.message);
        }
    }, [id, placeName, address]);

    const handleNavigate = useCallback(() => {
        if (coordinates) {
            const [lng, lat] = coordinates;
            const url = Platform.select({
                ios: `maps:0,0?q=${lat},${lng}(${place.name})`,
                android: `geo:0,0?q=${lat},${lng}(${place.name})`,
            });
            if (url) Linking.openURL(url);
        } else {
            const query = encodeURIComponent(place.address || place.name);
            const url = Platform.select({
                ios: `maps:0,0?q=${query}`,
                android: `geo:0,0?q=${query}`,
            });
            if (url) Linking.openURL(url);
        }
    }, [coordinates, place.address, place.name]);

    const handleEdit = useCallback(() => {
        router.push({
            pathname: '/(drawer)/place-submission',
            params: {
                category: place.category,
                editData: JSON.stringify(place)
            }
        });
    }, [place, router]);

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
            backgroundColor: primaryColor,
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

    const isOwner = currentUserId && place.createdBy === currentUserId;

    if (!place) {
        return (
            <View style={[styles.loaderContainer, { backgroundColor: colors.background }]}>
                <Stack.Screen options={{ title: 'Loading...', headerShown: false }} />
                <ActivityIndicator size="large" color={primaryColor} />
            </View>
        );
    }

    const contacts = place.contact || (place.phone ? [{ name: 'Primary', number: place.phone }] : []);
    const placeImage = place.images && place.images.length > 0 ? place.images[0] : null;

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
                            {placeName}
                        </ThemedText>
                    </View>

                    <View style={{ flexDirection: 'row', gap: 8 }}>
                        {isOwner && (
                            <TouchableOpacity
                                onPress={handleEdit}
                                style={[styles.headerBtn, { backgroundColor: isDark ? 'rgba(15,23,42,0.6)' : 'rgba(0,0,0,0.4)' }]}
                            >
                                <Ionicons name="pencil" size={18} color="#FFFFFF" />
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            onPress={handleShare}
                            style={[styles.headerBtn, { backgroundColor: isDark ? 'rgba(15,23,42,0.6)' : 'rgba(0,0,0,0.4)' }]}
                        >
                            <Ionicons name="share-outline" size={20} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>
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
                    {placeImage ? (
                        <Animated.View style={[styles.imageContainer, imageAnimatedStyle]}>
                            <Image
                                source={{ uri: placeImage }}
                                style={StyleSheet.absoluteFillObject}
                                contentFit="cover"
                            />
                            <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.2)' }]} />
                        </Animated.View>
                    ) : (
                        <Animated.View style={[styles.fallbackBanner, { backgroundColor: primaryColor }, imageAnimatedStyle]}>
                            <Ionicons name="location" size={64} color="rgba(255,255,255,0.4)" />
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
                                    {placeName}
                                </ThemedText>

                                {/* Categories Tags */}
                                <View style={styles.categoryRow}>
                                    <View style={[styles.tag, { backgroundColor: primaryColor + '10' }]}>
                                        <Ionicons name="pricetag-outline" size={10} color={primaryColor} />
                                        <ThemedText style={[styles.tagText, { color: primaryColor }]}>
                                            {category}
                                        </ThemedText>
                                    </View>
                                    {place.type && (
                                        <View style={[styles.tag, { backgroundColor: primaryColor + '10' }]}>
                                            <ThemedText style={[styles.tagText, { color: primaryColor }]}>
                                                {capitalize(place.type)}
                                            </ThemedText>
                                        </View>
                                    )}
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Quick Interactive Actions Row */}
                    <View style={[styles.actionRow, { borderBottomColor: isDark ? '#334155' : '#f1f5f9' }]}>
                        {hasValidCoordinates ? (
                            <TouchableOpacity
                                style={[styles.actionBtnPrimary, { backgroundColor: primaryColor }]}
                                onPress={handleNavigate}
                                activeOpacity={0.8}
                            >
                                <Ionicons name="navigate" size={16} color="#FFFFFF" />
                                <ThemedText style={styles.actionBtnTextPrimary}>Get Directions</ThemedText>
                            </TouchableOpacity>
                        ) : (
                            <View style={[styles.actionBtnPrimary, { backgroundColor: colors.border, opacity: 0.6 }]}>
                                <Ionicons name="navigate-outline" size={16} color={colors.textSecondary} />
                                <ThemedText style={[styles.actionBtnTextPrimary, { color: colors.textSecondary }]}>No Directions</ThemedText>
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
                        <BannerAd placement="essential" />
                    </View>

                    {/* Details Sections */}
                    <View style={styles.sectionsContainer}>

                        {/* Section: Description/About */}
                        {place.description && (
                            <View style={styles.detailSection}>
                                <ThemedText style={[styles.sectionHeading, { color: colors.textSecondary }]}>
                                    About Place
                                </ThemedText>
                                <View style={{ gap: 4 }}>
                                    {renderFormattedText(place.description)}
                                </View>
                            </View>
                        )}

                        {/* Education Specific Metadata */}
                        {category.toLowerCase() === 'education' && (place.metadata?.principalName || place.metadata?.totalStudents || place.metadata?.totalTeachers) && (
                            <View style={styles.detailSection}>
                                <ThemedText style={[styles.sectionHeading, { color: colors.textSecondary }]}>
                                    Institution Stats
                                </ThemedText>
                                <View style={styles.sectionsContainer}>
                                    {place.metadata?.principalName && (
                                        <View style={styles.infoListItem}>
                                            <View style={[styles.infoListIcon, { backgroundColor: primaryColor + '10' }]}>
                                                <MaterialCommunityIcons name="account-tie" size={12} color={primaryColor} />
                                            </View>
                                            <View style={styles.infoListContent}>
                                                <ThemedText style={[styles.infoListLabel, { color: colors.textSecondary }]}>Principal</ThemedText>
                                                <ThemedText style={[styles.infoListVal, { color: colors.text }]}>
                                                    {capitalize(place.metadata.principalName)}
                                                </ThemedText>
                                            </View>
                                        </View>
                                    )}

                                    {place.metadata?.totalStudents && (
                                        <View style={styles.infoListItem}>
                                            <View style={[styles.infoListIcon, { backgroundColor: '#10B98110' }]}>
                                                <Ionicons name="people" size={12} color="#10B981" />
                                            </View>
                                            <View style={styles.infoListContent}>
                                                <ThemedText style={[styles.infoListLabel, { color: colors.textSecondary }]}>Total Students</ThemedText>
                                                <ThemedText style={[styles.infoListVal, { color: colors.text }]}>
                                                    {place.metadata.totalStudents}
                                                </ThemedText>
                                            </View>
                                        </View>
                                    )}

                                    {place.metadata?.totalTeachers && (
                                        <View style={styles.infoListItem}>
                                            <View style={[styles.infoListIcon, { backgroundColor: '#F59E0B10' }]}>
                                                <MaterialCommunityIcons name="human-male-board" size={12} color="#F59E0B" />
                                            </View>
                                            <View style={styles.infoListContent}>
                                                <ThemedText style={[styles.infoListLabel, { color: colors.textSecondary }]}>Total Teachers</ThemedText>
                                                <ThemedText style={[styles.infoListVal, { color: colors.text }]}>
                                                    {place.metadata.totalTeachers}
                                                </ThemedText>
                                            </View>
                                        </View>
                                    )}
                                </View>
                            </View>
                        )}

                        {/* Travel Specific Fields */}
                        {category.toLowerCase() === 'travel' && Array.isArray(place.route) && place.route.length > 0 && (
                            <View style={styles.detailSection}>
                                <ThemedText style={[styles.sectionHeading, { color: colors.textSecondary }]}>
                                    Travel Route
                                </ThemedText>
                                <View style={styles.routeContainer}>
                                    {place.route.map((r: any, idx: number) => (
                                        <View key={idx} style={styles.routeItem}>
                                            <View style={styles.routeDotContainer}>
                                                <View style={[styles.routeDot, { backgroundColor: primaryColor }]} />
                                                {idx !== place.route.length - 1 && <View style={[styles.routeLine, { backgroundColor: colors.border }]} />}
                                            </View>
                                            <View style={styles.routeInfo}>
                                                <ThemedText style={[styles.routeCity, { color: colors.text }]}>{capitalize(r.city)}</ThemedText>
                                                <ThemedText style={[styles.routeTime, { color: colors.textSecondary }]}>{r.time}</ThemedText>
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}

                        {/* Section: Timing Info */}
                        {place.timing && (
                            <View style={styles.detailSection}>
                                <ThemedText style={[styles.sectionHeading, { color: colors.textSecondary }]}>
                                    Timing Info
                                </ThemedText>
                                <View style={styles.infoListItem}>
                                    <View style={[styles.infoListIcon, { backgroundColor: primaryColor + '10' }]}>
                                        <Ionicons name="time" size={12} color={primaryColor} />
                                    </View>
                                    <View style={styles.infoListContent}>
                                        <ThemedText style={[styles.infoListLabel, { color: colors.textSecondary }]}>Operational Hours</ThemedText>
                                        <ThemedText style={[styles.infoListVal, { color: colors.text }]}>{place.timing}</ThemedText>
                                    </View>
                                </View>
                            </View>
                        )}

                        {/* Section: Services */}
                        {place.services && (
                            <View style={styles.detailSection}>
                                <ThemedText style={[styles.sectionHeading, { color: colors.textSecondary }]}>
                                    Services Offered
                                </ThemedText>
                                <View style={{ gap: 4 }}>
                                    {renderFormattedText(place.services)}
                                </View>
                            </View>
                        )}

                        {/* Section: Contact & Location */}
                        <View style={styles.detailSection}>
                            <ThemedText style={[styles.sectionHeading, { color: colors.textSecondary }]}>
                                Contact & Location
                            </ThemedText>

                            <View style={styles.infoListItem}>
                                <View style={[styles.infoListIcon, { backgroundColor: primaryColor + '10' }]}>
                                    <Ionicons name="location" size={12} color={primaryColor} />
                                </View>
                                <View style={styles.infoListContent}>
                                    <ThemedText style={[styles.infoListLabel, { color: colors.textSecondary }]}>Address</ThemedText>
                                    <ThemedText style={[styles.infoListVal, { color: colors.text }]}>{address}</ThemedText>
                                    {(place.village || place.city) && (
                                        <ThemedText style={[styles.infoListSub, { color: colors.textSecondary }]}>
                                            {[place.village, place.city].filter(Boolean).join(', ')}
                                        </ThemedText>
                                    )}
                                </View>
                            </View>

                            {contacts.map((contact: any, index: number) => (
                                <TouchableOpacity
                                    key={index}
                                    style={styles.infoListItem}
                                    onPress={() => handleCall(contact.number)}
                                    activeOpacity={0.7}
                                >
                                    <View style={[styles.infoListIcon, { backgroundColor: primaryColor + '10' }]}>
                                        <Ionicons name="call" size={12} color={primaryColor} />
                                    </View>
                                    <View style={styles.infoListContent}>
                                        <ThemedText style={[styles.infoListLabel, { color: colors.textSecondary }]}>
                                            {capitalize(contact.name || 'Contact')}
                                        </ThemedText>
                                        <ThemedText style={[styles.infoListVal, { color: colors.text, fontWeight: '600' }]}>
                                            {contact.number}
                                        </ThemedText>
                                    </View>
                                </TouchableOpacity>
                            ))}

                            {place.createdAt && (
                                <View style={styles.infoListItem}>
                                    <View style={[styles.infoListIcon, { backgroundColor: primaryColor + '10' }]}>
                                        <Ionicons name="calendar" size={12} color={primaryColor} />
                                    </View>
                                    <View style={styles.infoListContent}>
                                        <ThemedText style={[styles.infoListLabel, { color: colors.textSecondary }]}>Listed On</ThemedText>
                                        <ThemedText style={[styles.infoListVal, { color: colors.text }]}>
                                            {new Date(place.createdAt).toLocaleDateString(undefined, {
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

                {/* Education: Toppers & Events — Separate Card */}
                {category.toLowerCase() === 'education' && (sortedToppers.length > 0 || sortedEvents.length > 0) && (
                    <View style={[styles.detailsCard, { backgroundColor: isDark ? '#1e293b' : '#FFFFFF', marginTop: 12, borderTopLeftRadius: 0, borderTopRightRadius: 0, paddingVertical: 16, flex: 0 }]}>

                        {/* Tab Switcher */}
                        <View style={[styles.eduTabContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F1F5F9', borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0' }]}>
                            <TouchableOpacity
                                onPress={() => setEduTab('toppers')}
                                style={[
                                    styles.eduTab,
                                    eduTab === 'toppers' && [
                                        styles.eduTabActive,
                                        { backgroundColor: isDark ? primaryColor + '30' : '#FFFFFF', borderColor: eduTab === 'toppers' ? primaryColor + '40' : 'transparent' }
                                    ]
                                ]}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="trophy" size={15} color={eduTab === 'toppers' ? primaryColor : colors.textSecondary} />
                                <ThemedText style={[styles.eduTabText, eduTab === 'toppers' && { color: primaryColor, fontWeight: '700' }]}>
                                    Toppers{sortedToppers.length > 0 ? ` (${sortedToppers.length})` : ''}
                                </ThemedText>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => setEduTab('events')}
                                style={[
                                    styles.eduTab,
                                    eduTab === 'events' && [
                                        styles.eduTabActive,
                                        { backgroundColor: isDark ? primaryColor + '30' : '#FFFFFF', borderColor: eduTab === 'events' ? primaryColor + '40' : 'transparent' }
                                    ]
                                ]}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="calendar" size={15} color={eduTab === 'events' ? primaryColor : colors.textSecondary} />
                                <ThemedText style={[styles.eduTabText, eduTab === 'events' && { color: primaryColor, fontWeight: '700' }]}>
                                    Events{sortedEvents.length > 0 ? ` (${sortedEvents.length})` : ''}
                                </ThemedText>
                            </TouchableOpacity>
                        </View>

                        {/* Toppers Tab Content */}
                        {eduTab === 'toppers' && (
                            <View style={styles.eduContentWrap}>
                                {sortedToppers.length > 0 ? (
                                    sortedToppers.map((topper: any, idx: number) => (
                                        <React.Fragment key={topper._id || idx}>
                                            <TopperCard topper={topper} primaryColor={primaryColor} />
                                            {idx < sortedToppers.length - 1 && (
                                                <View style={[styles.itemDivider, { backgroundColor: colors.border }]} />
                                            )}
                                        </React.Fragment>
                                    ))
                                ) : (
                                    <View style={styles.eduEmptyState}>
                                        <Ionicons name="trophy-outline" size={32} color={colors.textSecondary} />
                                        <ThemedText style={[styles.eduEmptyText, { color: colors.textSecondary }]}>No toppers added yet</ThemedText>
                                    </View>
                                )}
                            </View>
                        )}

                        {/* Events Tab Content */}
                        {eduTab === 'events' && (
                            <View style={styles.eduContentWrap}>
                                {sortedEvents.length > 0 ? (
                                    sortedEvents.map((event: any, idx: number) => (
                                        <React.Fragment key={event._id || idx}>
                                            <EventCard event={event} primaryColor={primaryColor} />
                                            {idx < sortedEvents.length - 1 && (
                                                <View style={[styles.itemDivider, { backgroundColor: colors.border }]} />
                                            )}
                                        </React.Fragment>
                                    ))
                                ) : (
                                    <View style={styles.eduEmptyState}>
                                        <Ionicons name="calendar-outline" size={32} color={colors.textSecondary} />
                                        <ThemedText style={[styles.eduEmptyText, { color: colors.textSecondary }]}>No events added yet</ThemedText>
                                    </View>
                                )}
                            </View>
                        )}
                    </View>
                )}
            </Animated.ScrollView>

            <ReportModal
                ref={reportModalRef}
                targetId={place._id}
                targetType="PLACE"
            />
        </View>
    );
};

export default PlaceDetailScreen;

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
        gap: 8,
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
    routeContainer: {
        marginTop: 4,
        marginLeft: 4,
    },
    routeItem: {
        flexDirection: 'row',
        gap: 16,
    },
    routeDotContainer: {
        alignItems: 'center',
        width: 12,
    },
    routeDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginTop: 6,
    },
    routeLine: {
        width: 2,
        flex: 1,
        marginVertical: 2,
    },
    routeInfo: {
        flex: 1,
        paddingBottom: 12,
    },
    routeCity: {
        fontSize: 11,
        fontWeight: '700',
        marginBottom: 2,
    },
    routeTime: {
        fontSize: 11,
        fontWeight: '500',
    },
    // ── Education Tabs ──
    eduTabContainer: {
        flexDirection: 'row',
        borderRadius: 12,
        padding: 4,
        marginBottom: 10,
        borderWidth: 1,
    },
    eduTab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 6,
        borderRadius: 10,
        gap: 6,
    },
    eduTabActive: {
        borderWidth: 1,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.08,
                shadowRadius: 4,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    eduTabText: {
        fontSize: 12,
        fontWeight: '600',
    },
    eduContentWrap: {
        // Gap removed for list dividers
    },
    itemDivider: {
        height: 1,
        width: '100%',
        opacity: 0.4,
    },
    eduEmptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 30,
        gap: 8,
    },
    eduEmptyText: {
        fontSize: 11,
        fontWeight: '500',
    },
});
