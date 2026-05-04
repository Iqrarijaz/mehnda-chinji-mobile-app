import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useRef, useMemo, useState } from 'react';
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
import TopperCard from '@/components/places/TopperCard';
import EventCard from '@/components/places/EventCard';
import { useAuth } from '@/context/AuthContext';

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

    const capitalize = (str?: string) =>
        str
            ? str
                .toLowerCase()
                .split(' ')
                .map(w => w.charAt(0).toUpperCase() + w.slice(1))
                .join(' ')
            : '';

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
            await Share.share({
                message: `Check out ${placeName} on Rehbar!\n📍 ${address}\n📞 ${place?.phone || 'Contact for details'}`,
                title: placeName,
            });
        } catch (error: any) {
            Alert.alert(error.message);
        }
    }, [placeName, address, place?.phone]);

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

    const isOwner = currentUserId && place.createdBy === currentUserId;

    if (!place) {
        return (
            <View style={[styles.loaderContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={primaryColor} />
            </View>
        );
    }

    const contacts = place.contact || (place.phone ? [{ name: 'Primary', number: place.phone }] : []);

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Solid Header like Settings */}
            <Animated.View entering={FadeInUp.duration(600)} style={[styles.headerWrap, { backgroundColor: colors.primary }]}>
                <View style={[styles.headerTopRow, { paddingTop: insets.top + 8 }]}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={styles.headerBackBtn}
                    >
                        <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
                    </TouchableOpacity>
                    <View style={styles.headerTitleWrap}>
                        <View style={styles.headerTitleRow}>
                            {place.images && place.images.length > 0 && (
                                <Image
                                    source={{ uri: place.images[0] }}
                                    style={styles.headerThumbnail}
                                />
                            )}
                            <ThemedText style={styles.headerTitle}>Details</ThemedText>
                        </View>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                        {isOwner && (
                            <TouchableOpacity
                                onPress={handleEdit}
                                style={styles.headerBackBtn}
                            >
                                <Ionicons name="pencil" size={20} color="#FFFFFF" />
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            onPress={handleShare}
                            style={styles.headerBackBtn}
                        >
                            <Ionicons name="share-outline" size={22} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>
                </View>
            </Animated.View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                style={styles.scrollView}
                contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
            >
                {/* Image Header if available */}
                {place.images && place.images.length > 0 && (
                    <View style={styles.imageHeaderWrapper}>
                        <Image
                            source={{ uri: place.images[0] }}
                            style={styles.headerImage}
                            contentFit="cover"
                            transition={300}
                        />
                        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.2)' }]} />
                    </View>
                )}

                {/* Hero Section */}
                <View style={styles.heroContainer}>
                    <ThemedText style={[styles.placeName, { color: colors.text }]}>
                        {placeName}
                    </ThemedText>

                    <View style={styles.chipRow}>
                        <View style={[styles.categoryChip, { backgroundColor: primaryColor + '12', borderColor: primaryColor + '20' }]}>
                            <Ionicons name="pricetag" size={12} color={primaryColor} />
                            <ThemedText style={[styles.categoryChipText, { color: primaryColor }]}>
                                {category}
                            </ThemedText>
                        </View>

                        {place.type && (
                            <View style={[styles.categoryChip, { backgroundColor: primaryColor + '12', borderColor: primaryColor + '20' }]}>
                                <ThemedText style={[styles.categoryChipText, { color: primaryColor }]}>
                                    {capitalize(place.type)}
                                </ThemedText>
                            </View>
                        )}
                    </View>

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

                {/* Consolidated Details Card */}
                <View style={[styles.card, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF' }]}>
                    {/* Location Section */}
                    <View style={styles.locationInfo}>
                        <View style={styles.locationTextContainer}>
                            <ThemedText style={[styles.addressText, { color: colors.text }]}>{address}</ThemedText>
                            {(place.village || place.city) && (
                                <ThemedText style={[styles.areaText, { color: colors.textSecondary }]}>
                                    {[place.village, place.city].filter(Boolean).join(', ')}
                                </ThemedText>
                            )}
                        </View>
                    </View>

                    {hasValidCoordinates && (
                        <TouchableOpacity
                            style={[styles.navigationBtn, { backgroundColor: primaryColor }]}
                            onPress={handleNavigate}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="navigate" size={18} color="#FFF" />
                            <ThemedText style={styles.navigationBtnText}>Get Directions</ThemedText>
                        </TouchableOpacity>
                    )}

                    {/* About Section */}
                    {place.description && (
                        <View style={styles.sectionSeparator}>
                            <View style={[styles.divider, { backgroundColor: colors.border }]} />
                            <ThemedText style={[styles.descriptionText, { color: colors.textSecondary }]}>
                                {place.description}
                            </ThemedText>
                        </View>
                    )}

                    {/* Education Specific Metadata */}
                    {category.toLowerCase() === 'education' && (place.metadata?.principalName || place.metadata?.totalStudents || place.metadata?.totalTeachers) && (
                        <View style={styles.sectionSeparator}>
                            <View style={[styles.divider, { backgroundColor: colors.border }]} />
                            <View style={styles.eduStatsContainer}>
                                {place.metadata?.principalName ? (
                                    <View style={styles.principalBox}>
                                        <View style={[styles.statIconCircle, { backgroundColor: primaryColor + '12' }]}>
                                            <MaterialCommunityIcons name="account-tie" size={18} color={primaryColor} />
                                        </View>
                                        <View>
                                            <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>Principal</ThemedText>
                                            <ThemedText style={[styles.statValue, { color: colors.text }]}>{capitalize(place.metadata.principalName)}</ThemedText>
                                        </View>
                                    </View>
                                ) : null}

                                <View style={styles.statsGrid}>
                                    {place.metadata?.totalStudents ? (
                                        <View style={styles.statBox}>
                                            <View style={[styles.statIconCircle, { backgroundColor: '#10B98112' }]}>
                                                <Ionicons name="people" size={16} color="#10B981" />
                                            </View>
                                            <View>
                                                <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>Students</ThemedText>
                                                <ThemedText style={[styles.statValue, { color: colors.text }]}>{place.metadata.totalStudents}</ThemedText>
                                            </View>
                                        </View>
                                    ) : null}
                                    {place.metadata?.totalTeachers ? (
                                        <View style={styles.statBox}>
                                            <View style={[styles.statIconCircle, { backgroundColor: '#F59E0B12' }]}>
                                                <MaterialCommunityIcons name="human-male-board" size={16} color="#F59E0B" />
                                            </View>
                                            <View>
                                                <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>Teachers</ThemedText>
                                                <ThemedText style={[styles.statValue, { color: colors.text }]}>{place.metadata.totalTeachers}</ThemedText>
                                            </View>
                                        </View>
                                    ) : null}
                                </View>
                            </View>
                        </View>
                    )}

                    {/* Travel Specific Fields */}
                    {category.toLowerCase() === 'travel' && (
                        <View>
                            {Array.isArray(place.route) && place.route.length > 0 && (
                                <View style={styles.sectionSeparator}>
                                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                                    <View style={styles.cardHeader}>
                                        <Ionicons name="git-branch-outline" size={20} color={primaryColor} />
                                        <ThemedText style={[styles.cardTitle, { color: colors.text }]}>Travel Route</ThemedText>
                                    </View>
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

                            {place.timing && (
                                <View style={styles.sectionSeparator}>
                                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                                    <View style={styles.cardHeader}>
                                        <Ionicons name="time-outline" size={20} color={primaryColor} />
                                        <ThemedText style={[styles.cardTitle, { color: colors.text }]}>Timing Info</ThemedText>
                                    </View>
                                    <ThemedText style={[styles.descriptionText, { color: colors.textSecondary }]}>
                                        {place.timing}
                                    </ThemedText>
                                </View>
                            )}

                            {place.services && (
                                <View style={styles.sectionSeparator}>
                                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                                    <View style={styles.cardHeader}>
                                        <Ionicons name="cog-outline" size={20} color={primaryColor} />
                                        <ThemedText style={[styles.cardTitle, { color: colors.text }]}>Services</ThemedText>
                                    </View>
                                    <ThemedText style={[styles.descriptionText, { color: colors.textSecondary }]}>
                                        {place.services}
                                    </ThemedText>
                                </View>
                            )}
                        </View>
                    )}


                    {/* Contacts Section */}
                    {contacts.length > 0 && (
                        <View style={styles.sectionSeparator}>
                            <View style={[styles.divider, { backgroundColor: colors.border }]} />
                            <View style={styles.contactList}>
                                {contacts.map((contact: any, index: number) => (
                                    <View key={index} style={[styles.contactRow, index !== contacts.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
                                        <View style={styles.contactInfo}>
                                            <ThemedText style={[styles.contactName, { color: colors.text }]}>{capitalize(contact.name || 'Contact')}</ThemedText>
                                            <ThemedText style={[styles.contactNumber, { color: colors.textSecondary }]}>{contact.number}</ThemedText>
                                        </View>
                                        <TouchableOpacity
                                            style={[styles.callIconBtn, { backgroundColor: primaryColor + '15' }]}
                                            onPress={() => handleCall(contact.number)}
                                        >
                                            <Ionicons name="call" size={18} color={primaryColor} />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}
                </View>

                {/* Education: Toppers & Events — Separate Card */}
                {category.toLowerCase() === 'education' && (sortedToppers.length > 0 || sortedEvents.length > 0) && (
                    <View style={[styles.card, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF' }]}>

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
    headerWrap: {
        paddingBottom: 16,
        borderBottomLeftRadius: Layout.borderRadius,
        borderBottomRightRadius: Layout.borderRadius,
        zIndex: 10,
    },
    headerTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
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
        paddingHorizontal: 20,
        paddingTop: 24,
        paddingBottom: 24,
    },
    placeName: {
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
    reportButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 20,
        backgroundColor: '#FEF2F2',
        alignSelf: 'flex-start',
    },
    reportButtonText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#EF4444',
    },
    card: {
        marginHorizontal: 20,
        marginBottom: 16,
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
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 14,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: -0.2,
    },
    sectionSeparator: {
        marginTop: 16,
    },
    eduStatsContainer: {
        gap: 16,
    },
    principalBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 4,
    },
    statsGrid: {
        flexDirection: 'row',
        gap: 12,
    },
    statBox: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    statIconCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statLabel: {
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 1,
    },
    statValue: {
        fontSize: 14,
        fontWeight: '700',
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
        marginBottom: 16,
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
    navigationBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 10,
        gap: 8,
    },
    navigationBtnText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '700',
    },
    contactList: {
        gap: 0,
    },
    contactRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
    },
    contactInfo: {
        flex: 1,
    },
    contactName: {
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 2,
    },
    contactNumber: {
        fontSize: 12,
        fontWeight: '600',
    },
    callIconBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    descriptionText: {
        fontSize: 14,
        lineHeight: 22,
        letterSpacing: 0.1,
    },
    headerTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    headerThumbnail: {
        width: 28,
        height: 28,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.4)',
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
        paddingBottom: 20,
    },
    routeCity: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 2,
    },
    routeTime: {
        fontSize: 13,
        fontWeight: '500',
    },
    // ── Education Tabs ──
    eduTabContainer: {
        flexDirection: 'row',
        borderRadius: 12,
        padding: 4,
        marginBottom: 16,
        borderWidth: 1,
    },
    eduTab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
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
        fontSize: 13,
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
        fontSize: 13,
        fontWeight: '500',
    },
});
