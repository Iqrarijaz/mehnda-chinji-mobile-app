import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
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

interface MosqueCardProps {
    data: {
        _id: string;
        name: string;
        category: {
            en: string;
            ur?: string;
        } | string;
        type?: string;
        description?: string;
        phone?: string;
        village?: string;
        address?: string;
        location?: {
            coordinates: [number, number];
        };
        contact?: Contact[];
        images?: string[];
    };
    color?: string;
}

const MosqueCard = React.memo(({ data, color }: MosqueCardProps) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const colors = Colors[theme];
    const router = useRouter();

    const primaryColor = color || '#10B981';
    const primaryAlpha10 = primaryColor + '1A';
    const primaryAlpha20 = primaryColor + '33';

    const capitalize = (str: string) =>
        str
            .toLowerCase()
            .split(' ')
            .map(w => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ');

    const mosqueName = capitalize(data.name);
    const address = capitalize(data.village || data.address || 'Address not available');
    const mosqueImage = data.images?.[0];

    const typeLabel = data.type || '';

    return (
        <>
            {/* Wrapper gives us a stacking context outside overflow:hidden */}
            <View style={styles.wrapper}>
                <TouchableOpacity
                    activeOpacity={0.88}
                    onPress={() => router.push({
                        pathname: '/place/[id]',
                        params: {
                            id: data._id,
                            placeData: JSON.stringify(data),
                            color: primaryColor,
                            category: 'Mosque'
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
                    {/* ── Left: Image (30%) ── */}
                    <View style={styles.imageCol}>
                        {mosqueImage ? (
                            <Image
                                source={{ uri: mosqueImage }}
                                style={styles.image}
                                contentFit="cover"
                                transition={250}
                            />
                        ) : (
                            <View style={[styles.imagePlaceholder, { backgroundColor: primaryAlpha10 }]}>
                                <MaterialCommunityIcons
                                    name="mosque"
                                    size={32}
                                    color={primaryColor}
                                    style={{ opacity: 0.85 }}
                                />
                            </View>
                        )}
                    </View>

                    {/* ── Right: Content (70%) ── */}
                    <View style={styles.contentCol}>
                        {/* Name at top */}
                        <ThemedText
                            style={[styles.mosqueName, { color: isDark ? '#F1F5F9' : '#0F172A' }]}
                            numberOfLines={2}
                        >
                            {mosqueName}
                        </ThemedText>

                        {/* Divider */}
                        <View style={styles.dividerRow}>
                            <View style={[styles.dividerAccent, { backgroundColor: primaryColor }]} />
                            <View style={[styles.dividerLine, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]} />
                        </View>

                        {/* Location */}
                        <View style={styles.locationRow}>
                            <View style={[styles.locationIconWrap, { backgroundColor: primaryAlpha10 }]}>
                                <Ionicons name="location" size={12} color={primaryColor} />
                            </View>
                            <ThemedText
                                style={[styles.locationText, { color: isDark ? '#94A3B8' : '#475569' }]}
                                numberOfLines={2}
                            >
                                {address}
                            </ThemedText>
                        </View>
                    </View>
                </TouchableOpacity>

                {/* Type pill — only shown when data.type exists */}
                {typeLabel ? (
                    <View style={[styles.typePill, { backgroundColor: primaryColor }]}>
                        <ThemedText style={styles.typePillText}>{typeLabel}</ThemedText>
                    </View>
                ) : null}
            </View>
        </>
    );
});

export default MosqueCard;

const styles = StyleSheet.create({
    wrapper: {
        position: 'relative',
        marginBottom: 14,
    },
    card: {
        flexDirection: 'row',
        borderRadius: 13,
        overflow: 'hidden',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
        height: 100,
    },

    // ── Image column ──
    imageCol: {
        width: '30%',
        position: 'relative',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    imagePlaceholder: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Education-card style pill — absolute on top-right of the whole card
    typePill: {
        position: 'absolute',
        top: 8,
        right: 8,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 7,
        paddingVertical: 4,
        borderRadius: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 6,
    },
    typePillText: {
        color: '#FFFFFF',
        fontSize: 8,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },

    // ── Content column ──
    contentCol: {
        flex: 1,
        paddingHorizontal: 12,
        paddingTop: 12,
        paddingBottom: 12,
        justifyContent: 'center',
    },
    mosqueName: {
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: -0.2,
        lineHeight: 20,
        marginBottom: 8,
    },
    dividerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        marginBottom: 8,
    },
    dividerAccent: {
        width: 18,
        height: 2.5,
        borderRadius: 0,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        borderRadius: -1,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    locationIconWrap: {
        width: 20,
        height: 20,
        borderRadius: 4,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    locationText: {
        flex: 1,
        fontSize: 11,
        fontWeight: '500',
        lineHeight: 15,
    },
});
