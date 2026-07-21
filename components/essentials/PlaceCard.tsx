import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { getAuthenticatedConfiguration } from '@/apis/configuration';
import { ThemedText } from '@/components/ThemedText';
import { ListingCard } from '@/components/essentials/ListingCard';
import { PressableScale } from '@/components/essentials/shared/PressableScale';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { capitalizeString } from '@/utils/string';

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
    description?: {
        en: string;
        ur?: string;
    } | string;
    phone?: string;
    village?: string;
    address?: string;
    location?: {
        coordinates: [number, number];
    };
    contact?: Contact[];
    images?: string[];
    type?: string;
    route?: { city: string; time: string }[];
    returnRoute?: { city: string; time: string }[];
    createdBy?: string | { _id: string };
}

interface PlaceCardProps {
    data: PlaceData;
    category: string;
    color?: string;
    onReport?: () => void;
    /** List position, used only to stagger the entrance animation. */
    index?: number;
}

const TILE_SIZE = 72;

const PlaceCard = React.memo(({ data, category, color, index = 0 }: PlaceCardProps) => {
    const { theme } = useTheme();
    const colors = Colors[theme];
    const router = useRouter();

    const primaryColor = color || colors.primary;

    const { data: essentialsConfig } = useQuery({
        queryKey: ['configuration', 'ESSENTIALS_ICONS'],
        queryFn: () => getAuthenticatedConfiguration('ESSENTIALS_ICONS'),
        staleTime: 1000 * 60 * 60 * 24,
    });

    const configData = useMemo(() => {
        let val = essentialsConfig?.data?.data || essentialsConfig?.data?.value || essentialsConfig?.data || essentialsConfig;
        if (val && typeof val === 'object' && val.value) val = val.value;
        if (typeof val === 'string') {
            try { val = JSON.parse(val); } catch (e) { console.log('Config parse error:', e); }
        }
        return Array.isArray(val) ? val : [];
    }, [essentialsConfig]);

    const categoryConfig = useMemo(() => {
        return configData.find((c: any) => c.category?.toLowerCase() === category.toLowerCase());
    }, [configData, category]);

    const normalize = (value: string = '') => value.toLowerCase().trim().replace(/[_\s-]+/g, '');

    const typeConfig = useMemo(() => {
        if (!data.type || !categoryConfig?.types) return null;
        const normalizedType = normalize(data.type);
        return categoryConfig.types.find((t: any) => normalize(t.key) === normalizedType || normalize(t.label) === normalizedType);
    }, [data.type, categoryConfig]);

    const getString = (val: any) => {
        if (!val) return '';
        if (typeof val === 'string') return val;
        return val.en;
    };

    const placeName = capitalizeString(getString(data.name));
    const address = capitalizeString(getString(data.village) || getString(data.address) || 'Address not available');
    const placeImage = data.images?.[0];
    const typeLabel = typeConfig?.label || capitalizeString(data.type || '');
    const defaultIcon = categoryConfig?.icon || 'business';

    const isTravel = category?.toLowerCase() === 'travel';
    const route = Array.isArray(data.route) ? data.route : [];
    const hasReturn = Array.isArray(data.returnRoute) && data.returnRoute.length > 0;
    const routePreview =
        isTravel && route.length > 0
            ? route.length > 1
                ? `${capitalizeString(route[0]?.city)}  ${hasReturn ? '↔' : '→'}  ${capitalizeString(route[route.length - 1]?.city)}`
                : capitalizeString(route[0]?.city)
            : '';

    return (
        <Animated.View entering={FadeInDown.delay(Math.min(index, 6) * 55).duration(350)}>
            <PressableScale
                intensity={0.02}
                onPress={() => router.push({
                    pathname: '/place/[id]',
                    params: {
                        id: data._id,
                        placeData: JSON.stringify(data),
                        color: primaryColor,
                        category: capitalizeString(category)
                    }
                })}
            >
                <ListingCard style={styles.card}>
                    <View style={styles.row}>
                        {/* Image / icon tile */}
                        {placeImage ? (
                            <Image
                                source={{ uri: placeImage }}
                                style={styles.tile}
                                contentFit="cover"
                                transition={300}
                            />
                        ) : (
                            <View style={[styles.tile, styles.tilePlaceholder, { backgroundColor: `${primaryColor}0D` }]}>
                                <View style={[styles.tileHalo, { backgroundColor: `${primaryColor}14` }]} />
                                <View style={[styles.tileIconCircle, { backgroundColor: `${primaryColor}1F` }]}>
                                    <Ionicons name={defaultIcon as any} size={24} color={primaryColor} />
                                </View>
                            </View>
                        )}

                        {/* Info */}
                        <View style={styles.info}>
                            <ThemedText style={[styles.name, { color: colors.text }]} numberOfLines={2}>
                                {placeName}
                            </ThemedText>
                            <View style={styles.metaRow}>
                                <Ionicons
                                    name={isTravel && routePreview ? 'navigate' : 'location'}
                                    size={12}
                                    color={colors.secondary}
                                />
                                <ThemedText style={[styles.metaText, { color: colors.textSecondary }]} numberOfLines={2}>
                                    {isTravel && routePreview ? routePreview : address}
                                </ThemedText>
                            </View>
                        </View>
                    </View>

                    {/* Type badge — top-right absolute */}
                    {typeLabel ? (
                        <View style={[styles.typeBadge, { backgroundColor: colors.secondary }]}>
                            <ThemedText style={styles.typeBadgeText}>{typeLabel}</ThemedText>
                        </View>
                    ) : null}
                </ListingCard>
            </PressableScale>
        </Animated.View>
    );
});

PlaceCard.displayName = 'PlaceCard';

export default PlaceCard;

const styles = StyleSheet.create({
    card: {
        marginBottom: 10,
        overflow: 'hidden',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        gap: 10,
    },
    tile: {
        width: TILE_SIZE,
        height: TILE_SIZE,
        borderRadius: 14,
    },
    tilePlaceholder: {
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    tileHalo: {
        position: 'absolute',
        width: TILE_SIZE * 0.82,
        height: TILE_SIZE * 0.82,
        borderRadius: TILE_SIZE * 0.41,
    },
    tileIconCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    info: {
        flex: 1,
        gap: 4,
    },
    typeChip: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 2.5,
        borderRadius: 999,
    },
    typeChipText: {
        fontSize: 9,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    typeBadge: {
        position: 'absolute',
        top: 0,
        right: 0,
        paddingHorizontal: 10,
        borderRadius: 999,
        borderTopRightRadius: 12,
        borderBottomLeftRadius: 12,
        borderTopLeftRadius: 0,
        borderBottomRightRadius: 12,
    },
    typeBadgeText: {
        fontSize: 9,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        color: '#FFFFFF',
    },
    name: {
        fontSize: 14.5,
        fontWeight: '800',
        letterSpacing: 0.1,
        lineHeight: 18,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingRight: 8,
    },
    metaText: {
        fontSize: 11.5,
        fontWeight: '500',
        flexShrink: 1,
        lineHeight: 15,
    },
});
