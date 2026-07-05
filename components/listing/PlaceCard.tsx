import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo } from 'react';
import {
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

import { getAuthenticatedConfiguration } from '@/apis/configuration';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { ListingCard } from './ListingCard';

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
    createdBy?: string | { _id: string };
}

interface PlaceCardProps {
    data: PlaceData;
    category: string;
    color?: string;
    onReport?: () => void;
}

const PlaceCard = React.memo(({ data, category, color, onReport }: PlaceCardProps) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const colors = Colors[theme];
    const router = useRouter();
    
    const getDefaultColor = () => {
        switch (category.toLowerCase()) {
            case 'religious': return '#10B981';
            case 'health': return '#EF4444';
            case 'education': return '#3B82F6';
            case 'emergency': return '#F59E0B';
            case 'govt': return '#8B5CF6';
            case 'travel': return '#EC4899';
            default: return '#3B82F6';
        }
    };
    
    const primaryColor = color || getDefaultColor();

    const primaryAlpha10 = primaryColor + '1A';
    const primaryAlpha20 = primaryColor + '33';

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

    const capitalize = (str: string) => {
        if (!str || typeof str !== 'string') return '';
        const words = str.toLowerCase().split(' ');
        return words.map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    const getString = (val: any) => {
        if (!val) return '';
        if (typeof val === 'string') return val;
        return val.en;
    };

    const placeName = capitalize(getString(data.name));
    const address = capitalize(getString(data.village) || getString(data.address) || 'Address not available');
    const placeImage = data.images?.[0];
    const typeLabel = typeConfig?.label || capitalize(data.type || '');
    const defaultIcon = categoryConfig?.icon || 'business';

    return (
        <TouchableOpacity
            activeOpacity={0.92}
            onPress={() => router.push({
                pathname: '/place/[id]',
                params: {
                    id: data._id,
                    placeData: JSON.stringify(data),
                    color: primaryColor,
                    category: capitalize(category)
                }
            })}
        >
            <ListingCard>
                {/* Hero */}
                <View style={styles.heroSection}>
                    {placeImage ? (
                        <Image
                            source={{ uri: placeImage }}
                            style={styles.heroImage}
                            contentFit="cover"
                            transition={400}
                        />
                    ) : (
                        <LinearGradient
                            colors={[
                                isDark ? '#0F1420' : primaryAlpha10,
                                isDark ? '#1A2035' : '#F8FAFF',
                            ]}
                            style={styles.placeholderContainer}
                        >
                            <View style={[styles.ring, styles.ringOuter, { borderColor: primaryAlpha20 }]} />
                            <View style={[styles.ring, styles.ringInner, { borderColor: primaryAlpha20 }]} />
                            <View style={[styles.iconCircle, { backgroundColor: primaryAlpha20 }]}>
                                <Ionicons name={defaultIcon as any} size={28} color={primaryColor} />
                            </View>
                        </LinearGradient>
                    )}

                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.55)']}
                        style={[StyleSheet.absoluteFillObject, styles.bottomFade]}
                    />

                    <View style={[styles.topActions, !typeLabel && { justifyContent: 'flex-end' }]}>
                        {typeLabel ? (
                            <View style={[styles.typePill, { backgroundColor: primaryColor }]}>
                                <Ionicons name="ribbon" size={9} color="#fff" style={{ marginRight: 3 }} />
                                <ThemedText style={styles.typePillText}>{typeLabel}</ThemedText>
                            </View>
                        ) : null}
                        
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

                    {placeImage && (
                        <View style={styles.imageLabel}>
                            <Ionicons name="images-outline" size={11} color="rgba(255,255,255,0.75)" />
                            <ThemedText style={styles.imageLabelText}>
                                {(data.images?.length ?? 0) > 1 ? `${data.images!.length} Photos` : '1 Photo'}
                            </ThemedText>
                        </View>
                    )}
                </View>

                {/* Content */}
                <View style={[styles.contentSection, { backgroundColor: colors.card }]}>
                    <ThemedText style={[styles.placeName, { color: colors.text }]} numberOfLines={2}>
                        {placeName}
                    </ThemedText>



                    <View style={styles.locationRow}>
                        <View style={[styles.locationIconWrap, { backgroundColor: primaryAlpha10 }]}>
                            <Ionicons name="location" size={13} color={primaryColor} />
                        </View>
                        <ThemedText style={[styles.locationText, { color: colors.icon }]} numberOfLines={2}>
                            {address}
                        </ThemedText>
                    </View>
                </View>
            </ListingCard>
        </TouchableOpacity>
    );
});

PlaceCard.displayName = 'PlaceCard';

export default PlaceCard;

const styles = StyleSheet.create({
    heroSection: {
        height: 110,
        width: '100%',
        position: 'relative',
        backgroundColor: '#E2E8F0',
    },
    heroImage: {
        width: '100%',
        height: '100%',
    },
    placeholderContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    ring: {
        position: 'absolute',
        borderRadius: 999,
        borderWidth: 1,
    },
    ringOuter: {
        width: 140,
        height: 140,
        opacity: 0.5,
    },
    ringInner: {
        width: 90,
        height: 90,
        opacity: 0.8,
    },
    iconCircle: {
        width: 54,
        height: 54,
        borderRadius: 27,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    bottomFade: {
        top: '40%',
        height: '60%',
    },
    topActions: {
        position: 'absolute',
        top: 12,
        left: 12,
        right: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    actionBtn: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(0,0,0,0.3)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    typePill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    typePillText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    imageLabel: {
        position: 'absolute',
        bottom: 12,
        left: 12,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    imageLabelText: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 10,
        fontWeight: '600',
    },
    contentSection: {
        padding: 12,
    },
    placeName: {
        fontSize: 14,
        fontWeight: '800',
        lineHeight: 20,
        marginBottom: 8,
    },

    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingRight: 16,
    },
    locationIconWrap: {
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
    },
    locationText: {
        fontSize: 12,
        fontWeight: '500',
        flex: 1,
        lineHeight: 16,
    },
});
