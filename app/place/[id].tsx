import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useRef, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Linking,
    StyleSheet,
    TouchableOpacity,
    View,
    Platform,
    Dimensions,
    ScrollView,
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
import TopperCard from '@/components/places/TopperCard';
import EventCard from '@/components/places/EventCard';
import { useAuth } from '@/context/AuthContext';
import BannerAd from '@/ads/components/BannerAd';
import { TravelRoute } from '@/components/essentials/TravelRoute';
import { ContactAndLocation } from '@/components/essentials/ContactAndLocation';
import { ContactEssentialDetails } from '@/components/essentials/ContactEssentialDetails';
import { TravelHeroHeader } from '@/components/essentials/travel/TravelHeroHeader';
import { EmergencyHeroHeader } from '@/components/essentials/emergency/EmergencyHeroHeader';
import { HealthHeroHeader } from '@/components/essentials/health/HealthHeroHeader';
import { EducationHeroHeader } from '@/components/essentials/education/EducationHeroHeader';
import { ContactSection } from '@/components/essentials/shared/ContactSection';
import { LocationSection } from '@/components/essentials/shared/LocationSection';
import { TagChips } from '@/components/essentials/shared/TagChips';
import { QuickActionsBar } from '@/components/essentials/shared/QuickActionsBar';
import { capitalizeString } from '@/utils/string';

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

    const place = useMemo(() => {
        try {
            return placeData ? JSON.parse(placeData) : null;
        } catch (e) {
            console.error('Failed to parse placeData', e);
            return null;
        }
    }, [placeData]);

    const primaryColor = color || colors.primary;


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

    const placeName = useMemo(() => capitalizeString(place?.name), [place?.name]);
    const address = capitalizeString(place?.address || place?.village || 'N/A');
    const category = categoryParam || capitalizeString(place?.category?.en || place?.category || '');
    const coordinates = place?.location?.coordinates;
    const hasValidCoordinates = coordinates && (coordinates[0] !== 0 || coordinates[1] !== 0);
    const hasDirections = !!(place?.googleAddress?.trim()) || hasValidCoordinates;

    const handleCall = useCallback((phoneNumber: string) => {
        if (phoneNumber) {
            Linking.openURL(`tel:${phoneNumber}`);
        } else {
            Alert.alert('No Phone', 'Phone number not available.');
        }
    }, []);



    const handleNavigate = useCallback(() => {
        if (place?.googleAddress?.trim()) {
            const url = place.googleAddress.trim();
            if (url.startsWith('http://') || url.startsWith('https://')) {
                Linking.openURL(url).catch(err => {
                    console.error("Failed to open URL", err);
                    Alert.alert('Error', 'Could not open the directions link.');
                });
            } else {
                const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(url)}`;
                Linking.openURL(mapsUrl).catch(err => {
                    console.error("Failed to open maps query", err);
                    Alert.alert('Error', 'Could not open Google Maps.');
                });
            }
            return;
        }

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
    }, [coordinates, place.address, place.name, place?.googleAddress]);

    const handleEdit = useCallback(() => {
        router.push({
            pathname: '/(drawer)/place-submission',
            params: {
                category: place.category,
                editData: JSON.stringify(place)
            }
        });
    }, [place, router]);

    const isOwner = currentUserId && place?.createdBy === currentUserId;

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
    const isTravel = category.toLowerCase() === 'travel';
    const isEmergency = category.toLowerCase() === 'emergency';
    const isHealth = category.toLowerCase() === 'health';
    const isEducation = category.toLowerCase() === 'education';

    return (
        <View style={[styles.container, { backgroundColor: isDark ? '#1e293b' : '#FFFFFF' }]}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* ── Hero Header ─────────────────────────────────────────── */}
            {isTravel ? (
                <TravelHeroHeader
                    place={place}
                    placeName={placeName}
                    isOwner={!!isOwner}
                    onBack={() => router.back()}
                    onReport={() => reportModalRef.current?.present()}
                    onEdit={handleEdit}
                />
            ) : isEmergency ? (
                <EmergencyHeroHeader
                    place={place}
                    placeName={placeName}
                    isOwner={!!isOwner}
                    onBack={() => router.back()}
                    onReport={() => reportModalRef.current?.present()}
                    onEdit={handleEdit}
                />
            ) : isHealth ? (
                <HealthHeroHeader
                    place={place}
                    placeName={placeName}
                    isOwner={!!isOwner}
                    onBack={() => router.back()}
                    onReport={() => reportModalRef.current?.present()}
                    onEdit={handleEdit}
                />
            ) : isEducation ? (
                <EducationHeroHeader
                    place={place}
                    placeName={placeName}
                    isOwner={!!isOwner}
                    onBack={() => router.back()}
                    onReport={() => reportModalRef.current?.present()}
                    onEdit={handleEdit}
                />
            ) : (
            <Animated.View entering={FadeInUp.duration(500)} style={styles.heroHeader}>
                <LinearGradient
                    colors={[primaryColor, primaryColor + 'dd']}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                />

                {/* Nav row */}
                <View style={[styles.heroHeaderTop, { justifyContent: 'space-between', paddingTop: insets.top + (Platform.OS === 'android' ? 16 : 8) }]}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.heroBackButton}>
                        <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                        <TouchableOpacity
                            style={[styles.heroBackButton, { backgroundColor: '#FFFFFF' }]}
                            onPress={() => reportModalRef.current?.present()}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="flag" size={18} color="#EF4444" />
                        </TouchableOpacity>
                        {isOwner && (
                            <TouchableOpacity
                                style={[styles.heroBackButton, { backgroundColor: '#FFFFFF' }]}
                                onPress={handleEdit}
                                activeOpacity={0.8}
                            >
                                <Ionicons name="pencil" size={18} color={primaryColor} />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* Hero icon + text */}
                <Animated.View entering={FadeInDown.delay(150).duration(500)} style={styles.heroContent}>
                    <View style={styles.heroIconWrap}>
                        {placeImage ? (
                            <Image source={{ uri: placeImage }} style={styles.heroBusinessLogo} contentFit="cover" />
                        ) : (
                            <Ionicons name="location" size={32} color={primaryColor} />
                        )}
                    </View>
                    <ThemedText style={styles.heroTitle} numberOfLines={2}>
                        {placeName}
                    </ThemedText>
                    <ThemedText style={styles.heroSubtitle} numberOfLines={2}>
                        {category} {place.type ? `| ${capitalizeString(place.type)}` : ''}
                    </ThemedText>
                </Animated.View>
            </Animated.View>
            )}

            <ScrollView
                showsVerticalScrollIndicator={false}
                style={[styles.scrollView, { backgroundColor: isDark ? '#1e293b' : '#FFFFFF' }]}
                contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 40 }}
            >
                {/* Detail Card Container */}
                <View style={[styles.detailsCard, { backgroundColor: isDark ? '#1e293b' : '#FFFFFF', flex: 1 }]}>

                    {/* Quick Interactive Actions Row */}
                    {isEmergency || isHealth || isEducation ? (
                        <QuickActionsBar
                            onCall={() => handleCall(contacts[0]?.number)}
                            onDirections={handleNavigate}
                            hasContact={!!contacts[0]?.number}
                            hasDirections={!!hasDirections}
                        />
                    ) : (
                    <View style={[styles.actionRow, { borderBottomColor: isDark ? '#334155' : '#f1f5f9' }]}>


                        {category.toLowerCase() !== 'travel' && (
                            hasDirections ? (
                                <TouchableOpacity
                                    style={[styles.actionBtnPrimary, { backgroundColor: primaryColor }]}
                                    onPress={handleNavigate}
                                    activeOpacity={0.8}
                                >
                                    <Ionicons name="navigate" size={16} color="#FFFFFF" />
                                    <ThemedText style={styles.actionBtnTextPrimary}>Directions</ThemedText>
                                </TouchableOpacity>
                            ) : (
                                <View style={[styles.actionBtnPrimary, { backgroundColor: colors.border, opacity: 0.6 }]}>
                                    <Ionicons name="navigate-outline" size={16} color={colors.textSecondary} />
                                    <ThemedText style={[styles.actionBtnTextPrimary, { color: colors.textSecondary }]}>No Directions</ThemedText>
                                </View>
                            )
                        )}


                    </View>
                    )}

                    {/* Banner Ad */}
                    <View style={styles.detailAdWrapper}>
                        <BannerAd placement="essential" />
                    </View>

                    {/* Details Sections */}
                    <View style={styles.sectionsContainer}>

                        {/* Contacts List */}
                        {isTravel ? (
                            <ContactSection contacts={contacts} />
                        ) : isEmergency ? (
                            <ContactSection
                                contacts={contacts}
                                title="Emergency Contacts"
                                hint="Tap to call"
                                size="large"
                                iconTint="secondary"
                            />
                        ) : isHealth || isEducation ? (
                            <ContactSection contacts={contacts} />
                        ) : (
                            <ContactEssentialDetails contacts={contacts} primaryColor={primaryColor} />
                        )}

                        {/* Section: Tags */}
                        {(isTravel || isEducation) && place.tags && place.tags.length > 0 && (
                            <TagChips tags={place.tags} accentDots />
                        )}
                        {(isEmergency || isHealth) && place.tags && place.tags.length > 0 && (
                            <TagChips tags={place.tags} highlightAvailability />
                        )}
                        {!isTravel && !isEmergency && !isHealth && !isEducation && place.tags && place.tags.length > 0 && (
                            <View style={styles.detailSection}>
                                <ThemedText style={[styles.sectionHeading, { color: colors.textSecondary }]}>
                                    Tags
                                </ThemedText>
                                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                                    {place.tags.map((tag: any, index: number) => {
                                        let displayText = '';
                                        if (typeof tag === 'string') {
                                            displayText = capitalizeString(tag);
                                        } else {
                                            const en = tag.eng || tag.en;
                                            const ur = tag.ur;
                                            if (en && ur) {
                                                displayText = `${capitalizeString(en)} | ${ur}`;
                                            } else if (en) {
                                                displayText = capitalizeString(en);
                                            } else if (ur) {
                                                displayText = ur;
                                            }
                                        }
                                        if (!displayText) return null;
                                        return (
                                            <View key={index} style={{ backgroundColor: primaryColor + '15', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                                                <ThemedText style={{ color: primaryColor, fontSize: 11, fontWeight: '600' }}>{displayText}</ThemedText>
                                            </View>
                                        );
                                    })}
                                </View>
                            </View>
                        )}

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



                        {/* Travel Specific Fields */}
                        {category.toLowerCase() === 'travel' && (
                            <TravelRoute route={place.route} primaryColor={primaryColor} />
                        )}

                        {/* Section: Contact & Location */}
                        {isEmergency && (
                            <LocationSection
                                place={place}
                                address={address}
                                onDirections={handleNavigate}
                                hasDirections={!!hasDirections}
                                timingLabel="Availability"
                            />
                        )}
                        {isHealth && (
                            <LocationSection
                                place={place}
                                address={address}
                                onDirections={handleNavigate}
                                hasDirections={!!hasDirections}
                                timingLabel="Working Hours"
                            />
                        )}
                        {isEducation && (
                            <LocationSection
                                place={place}
                                address={address}
                                onDirections={handleNavigate}
                                hasDirections={!!hasDirections}
                                timingLabel="Office Hours"
                            />
                        )}
                        {!isTravel && !isEmergency && !isHealth && !isEducation && (
                            <ContactAndLocation place={place} address={address} primaryColor={primaryColor} />
                        )}
                    </View>
                </View>

                {/* Education: Toppers & Events — Separate Card */}
                {category.toLowerCase() === 'education' && (sortedToppers.length > 0 || sortedEvents.length > 0) && (
                    <View style={[styles.detailsCard, { backgroundColor: isDark ? '#1e293b' : '#FFFFFF', marginTop: 12, borderTopLeftRadius: 0, borderTopRightRadius: 0, paddingVertical: 16, flex: 0 }]}>

                        {/* Tab Switcher */}
                        <View style={[styles.eduTabContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F1F5F9', borderColor: 'transparent' }]}>
                            <TouchableOpacity
                                onPress={() => setEduTab('toppers')}
                                style={[
                                    styles.eduTab,
                                    eduTab === 'toppers' && { backgroundColor: primaryColor }
                                ]}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="trophy" size={15} color={eduTab === 'toppers' ? '#FFFFFF' : colors.textSecondary} />
                                <ThemedText style={[styles.eduTabText, { color: eduTab === 'toppers' ? '#FFFFFF' : colors.textSecondary, fontWeight: eduTab === 'toppers' ? '700' : '500' }]}>
                                    Toppers{sortedToppers.length > 0 ? ` (${sortedToppers.length})` : ''}
                                </ThemedText>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => setEduTab('events')}
                                style={[
                                    styles.eduTab,
                                    eduTab === 'events' && { backgroundColor: primaryColor }
                                ]}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="calendar" size={15} color={eduTab === 'events' ? '#FFFFFF' : colors.textSecondary} />
                                <ThemedText style={[styles.eduTabText, { color: eduTab === 'events' ? '#FFFFFF' : colors.textSecondary, fontWeight: eduTab === 'events' ? '700' : '500' }]}>
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
            </ScrollView>

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
        flexWrap: 'wrap',
        gap: 12,
        paddingBottom: 12,
        paddingTop: 0,
        borderBottomWidth: 1,
        marginBottom: 10,
    },
    actionBtnPrimary: {
        flex: 1,
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
    actionBtnIconOnly: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    detailAdWrapper: {
        marginBottom: 10,
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
        borderRadius: 24,
        padding: 4,
        marginBottom: 16,
        borderWidth: 0,
        height: 42,
    },
    eduTab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 20,
        gap: 6,
        height: '100%',
    },
    eduTabText: {
        fontSize: 12,
    },
    eduContentWrap: {
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
