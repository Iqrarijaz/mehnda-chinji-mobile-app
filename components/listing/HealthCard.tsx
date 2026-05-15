import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themedText';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';

interface Contact {
    name: string;
    number: string;
}

interface PlaceData {
    _id: string;
    name: string;
    category: {
        en: string;
        ur?: string;
    } | string;
    description?: string;
    phone?: string;
    village?: string;
    address?: string;
    location?: {
        coordinates: [number, number];
    };
    contact?: Contact[];
    images?: string[];
    type?: string;
    timing?: {
        en: string;
        ur?: string;
    } | string;
    services?: {
        en: string;
        ur?: string;
    } | string;
}

interface HealthCardProps {
    data: PlaceData;
    color?: string;
    onReport?: () => void;
}

const HealthCard = React.memo(({ data, color, onReport }: HealthCardProps) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const colors = Colors[theme];
    const router = useRouter();
    const primaryColor = color || '#EF4444';

    const primaryAlpha10 = primaryColor + '1A';
    const primaryAlpha20 = primaryColor + '33';

    const capitalize = (str: string) => {
        if (!str || typeof str !== 'string') return '';
        const words = str.toLowerCase().split(' ');
        return words.map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    const placeName = capitalize(data.name);
    const address = capitalize(data.village || data.address || 'Address not available');
    const healthImage = data.images?.[0];

    return (
        <>
            <TouchableOpacity
                activeOpacity={0.92}
                onPress={() => router.push({
                    pathname: '/place/[id]',
                    params: {
                        id: data._id,
                        placeData: JSON.stringify(data),
                        color: primaryColor,
                        category: 'Health'
                    }
                })}
                style={[
                    styles.card,
                    {
                        backgroundColor: isDark ? '#1A1F2E' : '#FFFFFF',
                        borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                        shadowColor: isDark ? '#000' : primaryColor,
                    },
                ]}
            >
                {/* ── Hero ── */}
                <View style={styles.heroSection}>
                    {healthImage ? (
                        <Image
                            source={{ uri: healthImage }}
                            style={styles.heroImage}
                            contentFit="cover"
                            transition={400}
                        />
                    ) : (
                        <LinearGradient
                            colors={[
                                isDark ? '#0F1420' : primaryAlpha10,
                                isDark ? '#1A2035' : '#FFF5F5',
                            ]}
                            style={styles.placeholderContainer}
                        >
                            {/* Decorative rings behind icon */}
                            <View style={[styles.ring, styles.ringOuter, { borderColor: primaryAlpha20 }]} />
                            <View style={[styles.ring, styles.ringInner, { borderColor: primaryAlpha20 }]} />
                            <View style={[styles.iconCircle, { backgroundColor: primaryAlpha20 }]}>
                                <MaterialCommunityIcons name="medical-bag" size={36} color={primaryColor} />
                            </View>
                        </LinearGradient>
                    )}

                    {/* Bottom fade for text legibility */}
                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.55)']}
                        style={[StyleSheet.absoluteFillObject, styles.bottomFade]}
                    />

                    {/* Top actions bar */}
                    <View style={[styles.topActions, !data.type && { justifyContent: 'flex-end' }]}>
                        {data.type && (
                            <View style={[styles.typePill, { backgroundColor: primaryColor }]}>
                                <MaterialCommunityIcons name="hospital-box-outline" size={9} color="#fff" style={{ marginRight: 3 }} />
                                <ThemedText style={styles.typePillText}>{data.type}</ThemedText>
                            </View>
                        )}
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                            <TouchableOpacity style={styles.actionBtn} activeOpacity={0.8}>
                                <Ionicons name="share-social-outline" size={15} color="#FFFFFF" />
                            </TouchableOpacity>
                            {onReport && (
                                <TouchableOpacity 
                                    style={[styles.actionBtn, { backgroundColor: 'rgba(239,68,68,0.4)' }]} 
                                    activeOpacity={0.8}
                                    onPress={(e) => {
                                        e.stopPropagation();
                                        onReport();
                                    }}
                                >
                                    <Ionicons name="flag" size={15} color="#FFFFFF" />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    {/* Bottom-left image label when image exists */}
                    {healthImage && (
                        <View style={styles.imageLabel}>
                            <Ionicons name="images-outline" size={11} color="rgba(255,255,255,0.75)" />
                            <ThemedText style={styles.imageLabelText}>
                                {(data.images?.length ?? 0) > 1
                                    ? `${data.images!.length} Photos`
                                    : '1 Photo'}
                            </ThemedText>
                        </View>
                    )}
                </View>

                {/* ── Content ── */}
                <View
                    style={[
                        styles.contentSection,
                        { backgroundColor: isDark ? '#1A1F2E' : '#FFFFFF' },
                    ]}
                >
                    {/* Name */}
                    <ThemedText
                        style={[styles.healthName, { color: isDark ? '#F1F5F9' : '#0F172A' }]}
                        numberOfLines={2}
                    >
                        {placeName}
                    </ThemedText>

                    {/* Divider strip */}
                    <View style={styles.dividerRow}>
                        <View style={[styles.dividerAccent, { backgroundColor: primaryColor }]} />
                        <View
                            style={[
                                styles.dividerLine,
                                { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' },
                            ]}
                        />
                    </View>

                    {/* Location row */}
                    <View style={styles.locationRow}>
                        <View style={[styles.locationIconWrap, { backgroundColor: primaryAlpha10 }]}>
                            <Ionicons name="location" size={13} color={primaryColor} />
                        </View>
                        <ThemedText
                            style={[styles.locationText, { color: isDark ? '#94A3B8' : '#475569' }]}
                            numberOfLines={1}
                        >
                            {address}
                        </ThemedText>
                    </View>

                    {/* Footer CTA row */}
                    <View style={styles.footerRow}>
                        <View style={[styles.detailsPill, { backgroundColor: primaryAlpha10, borderColor: primaryAlpha20 }]}>
                            <ThemedText style={[styles.detailsPillText, { color: primaryColor }]}>
                                View Details
                            </ThemedText>
                            <Ionicons name="chevron-forward" size={12} color={primaryColor} />
                        </View>

                        {data.phone && (
                            <View style={[styles.contactChip, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9' }]}>
                                <Ionicons
                                    name="call-outline"
                                    size={12}
                                    color={isDark ? '#94A3B8' : '#475569'}
                                />
                                <ThemedText style={[styles.contactChipText, { color: isDark ? '#94A3B8' : '#475569' }]}>
                                    Contact
                                </ThemedText>
                            </View>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        </>
    );
});

export default HealthCard;

const styles = StyleSheet.create({
    card: {
        borderRadius: 20,
        marginBottom: 16,
        overflow: 'hidden',
        borderWidth: 1,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 20,
        elevation: 8,
    },

    // ── Hero ──
    heroSection: {
        width: '100%',
        height: 180,
        position: 'relative',
    },
    heroImage: {
        width: '100%',
        height: '100%',
    },
    placeholderContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    ring: {
        position: 'absolute',
        borderRadius: 999,
        borderWidth: 1,
    },
    ringOuter: {
        width: 120,
        height: 120,
    },
    ringInner: {
        width: 80,
        height: 80,
    },
    iconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    bottomFade: {
        top: '40%',
        bottom: 0,
        left: 0,
        right: 0,
        position: 'absolute',
    },
    topActions: {
        position: 'absolute',
        top: 12,
        left: 12,
        right: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    typePill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 4,
    },
    typePillText: {
        color: '#FFFFFF',
        fontSize: 9,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    actionBtn: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: 'rgba(0,0,0,0.38)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: 'rgba(255,255,255,0.25)',
    },
    imageLabel: {
        position: 'absolute',
        bottom: 10,
        left: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    imageLabelText: {
        color: 'rgba(255,255,255,0.75)',
        fontSize: 11,
        fontWeight: '600',
    },

    // ── Content ──
    contentSection: {
        paddingHorizontal: 16,
        paddingTop: 14,
        paddingBottom: 14,
    },
    healthName: {
        fontSize: 17,
        fontWeight: '800',
        letterSpacing: -0.4,
        lineHeight: 23,
        marginBottom: 10,
    },
    dividerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        gap: 6,
    },
    dividerAccent: {
        width: 24,
        height: 3,
        borderRadius: 2,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        borderRadius: 1,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
        marginBottom: 8,
    },
    locationIconWrap: {
        width: 24,
        height: 24,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    locationText: {
        flex: 1,
        fontSize: 13,
        fontWeight: '600',
        letterSpacing: 0.1,
    },
    footerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 2,
    },
    detailsPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 10,
        borderWidth: 1,
    },
    detailsPillText: {
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 0.2,
    },
    contactChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 7,
        borderRadius: 10,
    },
    contactChipText: {
        fontSize: 12,
        fontWeight: '600',
    },
});
