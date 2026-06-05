import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useState } from 'react';
import {
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themedText';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
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
}

interface GovtOfficeCardProps {
    data: PlaceData;
    color?: string;
}

const GovtOfficeCard = React.memo(({ data, color }: GovtOfficeCardProps) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const colors = Colors[theme];
    const router = useRouter();

    // Default to Indigo for Govt Offices
    const primaryColor = color || '#6366F1';

    const capitalize = (str: string) => {
        if (!str || typeof str !== 'string') return '';
        const words = str.toLowerCase().split(' ');
        return words.map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    const placeName = capitalize(data.name);
    const address = capitalize(data.village || data.address || "Address not available");
    const image = data.images?.[0];
    const typeLabel = data.type ? capitalize(data.type) : '';

    return (
        <>
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => router.push({
                    pathname: '/place/[id]',
                    params: {
                        id: data._id,
                        placeData: JSON.stringify(data),
                        color: primaryColor,
                        category: 'Govt Office'
                    }
                })}
            >
                <View style={[styles.card, { backgroundColor: colors.card }]}>
                    <View style={styles.row}>
                        <View style={styles.imageWrapper}>
                            {image ? (
                                <Image
                                    source={{ uri: image }}
                                    style={styles.cardImage}
                                    contentFit="cover"
                                    transition={200}
                                />
                            ) : (
                                <View style={[styles.placeholderContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9' }]}>
                                    <Ionicons name="business" size={22} color={isDark ? '#94A3B8' : primaryColor} />
                                </View>
                            )}
                        </View>

                        <View style={styles.infoContainer}>
                            <View style={styles.headerTitleRow}>
                                <ThemedText style={[styles.placeName, { color: isDark ? '#F1F5F9' : '#0F172A' }]} numberOfLines={1}>
                                    {placeName}
                                </ThemedText>
                                {typeLabel ? (
                                    <View style={[styles.badge, { backgroundColor: primaryColor + '20' }]}>
                                        <ThemedText style={[styles.badgeText, { color: primaryColor }]}>
                                            {typeLabel}
                                        </ThemedText>
                                    </View>
                                ) : null}
                            </View>
                            
                            <View style={styles.addressRow}>
                                <Ionicons name="location" size={14} color={isDark ? '#FFFFFF' : primaryColor} style={{ marginTop: 2 }} />
                                <ThemedText style={[styles.addressText, { color: isDark ? '#94A3B8' : '#475569' }]} numberOfLines={2}>
                                    {address}
                                </ThemedText>
                            </View>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        </>
    );
});

export default GovtOfficeCard;

const styles = StyleSheet.create({
    card: {
        borderRadius: Layout.borderRadius,
        padding: 10,
        marginBottom: 16,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    imageWrapper: {
        width: 60,
        height: 60,
        borderRadius: Layout.borderRadius,
        overflow: 'hidden',
        marginRight: 10,
        position: 'relative',
    },
    cardImage: {
        width: '100%',
        height: '100%',
    },
    placeholderContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    infoContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    headerTitleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    placeName: {
        fontSize: 14,
        fontWeight: '800',
        flex: 1,
        marginRight: 8,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
    },
    badgeText: {
        fontSize: 9,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    addressRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 4,
        paddingRight: 8,
    },
    addressText: {
        flex: 1,
        fontSize: 11,
        fontWeight: '600',
        lineHeight: 16,
    },
});
