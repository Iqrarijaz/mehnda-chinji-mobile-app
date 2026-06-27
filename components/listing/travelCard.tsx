import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React from 'react';
import {
    Alert,
    Linking,
    Platform,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/context/ThemeContext';
import { useQuery } from '@tanstack/react-query';
import { getAuthenticatedConfiguration } from '@/apis/configuration';

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

interface TravelCardProps {
    data: PlaceData;
    color?: string;
}

const TravelCard = React.memo(({ data, color }: TravelCardProps) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const colors = Colors[theme];
    const router = useRouter();

    // Default to Blue for travel
    const primaryColor = color || '#60A5FA';

    // Fetch configuration for fallback icons
    const { data: essentialsConfig } = useQuery({
        queryKey: ['configuration', 'ESSENTIALS_ICONS'],
        queryFn: () => getAuthenticatedConfiguration('ESSENTIALS_ICONS'),
        staleTime: 1000 * 60 * 60 * 24,
    });

    const getConfigArray = (resp: any) => {
        let val = resp?.data?.data || resp?.data?.value || resp?.data || resp;
        if (val && typeof val === 'object' && val.value) val = val.value;
        if (typeof val === 'string') {
            try { val = JSON.parse(val); } catch (e) { }
        }
        return Array.isArray(val) ? val : [];
    };

    const configData = getConfigArray(essentialsConfig);
    const categoryKey = typeof data.category === 'string' ? data.category.toLowerCase() : data.category?.en?.toLowerCase();
    const categoryConfig = configData.find((c: any) => c.category === categoryKey || c.key === categoryKey);
    const typeConfig = categoryConfig?.types?.find((t: any) => t.key === data.type);
    const fallbackImage = typeConfig?.icon;

    const capitalize = (str: string) => {
        if (!str || typeof str !== 'string') return '';
        const words = str.toLowerCase().split(' ');
        return words.map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    const placeName = capitalize(data.name);
    const address = capitalize(data.village || data.address || "Address not available");

    return (
        <>
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => router.push({
                    pathname: '/place/[id]',
                    params: {
                        id: data._id,
                        placeData: JSON.stringify(data),
                        color: primaryColor,
                        category: 'Travel'
                    }
                })}
                style={styles.cardWrapper}
            >
                <View style={[styles.cardContainer, {
                    backgroundColor: colors.card,
                    borderColor: 'transparent',
                    borderLeftColor: primaryColor,
                }]}>
                    <View style={styles.cardContentRow}>
                        <View style={[styles.imageCol, { backgroundColor: primaryColor + '10' }]}>
                            {data.images?.[0] || fallbackImage ? (
                                <Image
                                    source={{ uri: data.images?.[0] || fallbackImage }}
                                    style={styles.fullImage}
                                    contentFit="cover"
                                    transition={200}
                                />
                            ) : (
                                <View style={styles.placeholderCol}>
                                    <MaterialCommunityIcons name="bus-side" size={28} color={isDark ? '#FFFFFF' : primaryColor} />
                                </View>
                            )}
                        </View>

                        <View style={styles.detailsCol}>
                            <View style={styles.detailsInner}>
                                <View style={styles.headerTitleRow}>
                                    <ThemedText style={[styles.name, { color: isDark ? '#FFFFFF' : colors.text }]} numberOfLines={1}>
                                        {placeName}
                                    </ThemedText>
                                    <View style={[styles.badge, { backgroundColor: primaryColor + '20' }]}>
                                        <ThemedText style={[styles.badgeText, { color: isDark ? '#FFFFFF' : primaryColor }]}>
                                            {capitalize(data.type || 'Travel')}
                                        </ThemedText>
                                    </View>
                                </View>

                                <View style={styles.addressRow}>
                                    <Ionicons name="location" size={12} color={isDark ? '#FFFFFF' : colors.textSecondary} style={{ marginTop: 2 }} />
                                    <ThemedText style={[styles.address, { color: isDark ? '#FFFFFF' : colors.textSecondary }]} numberOfLines={1}>
                                        {address}
                                    </ThemedText>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        </>
    );
});

export default TravelCard;

const isAndroid = Platform.OS === 'android';

const styles = StyleSheet.create({
    cardWrapper: {
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 3,
    },
    cardContainer: {
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderLeftWidth: 4,
    },
    cardContentRow: {
        flexDirection: 'row',
        height: 70,
    },
    imageCol: {
        width: '28%',
        height: '100%',
        padding: 4,
    },
    fullImage: {
        width: '100%',
        height: '100%',
        borderRadius: 8,
    },
    placeholderCol: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    detailsCol: {
        flex: 1,
        padding: 8,
    },
    detailsInner: {
        flex: 1,
        justifyContent: 'center',
    },
    headerTitleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    name: {
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
        alignItems: 'center',
        gap: 4,
    },
    address: {
        fontSize: 11,
        flex: 1,
    },
});
