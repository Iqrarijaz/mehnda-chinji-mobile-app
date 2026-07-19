import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { AnalyticsEvents, analyticsService } from '@/analytics';
import { ThemedText } from '@/components/ThemedText';
import { ListingCard } from '@/components/essentials/ListingCard';
import { PressableScale } from '@/components/essentials/shared/PressableScale';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { capitalizeString } from '@/utils/string';
import { useRouter } from 'expo-router';

interface BusinessCardProps {
    business: any;
    onReport?: () => void;
    /** List position, used only to stagger the entrance animation. */
    index?: number;
}

const TILE_SIZE = 84;

const BusinessCard = React.memo(({ business, index = 0 }: BusinessCardProps) => {
    const { theme } = useTheme();
    const colors = Colors[theme];
    const router = useRouter();

    const businessName = useMemo(() => capitalizeString(business?.name), [business?.name]);
    const address = useMemo(() => capitalizeString(business?.address || business?.village || ''), [business?.address, business?.village]);

    const categoryLineText = useMemo(() => {
        const parts = [];
        const engCat = capitalizeString(business?.categoryEn || '');
        if (engCat) parts.push(engCat);
        if (business?.categoryUr) parts.push(business.categoryUr);
        return parts.join(' | ');
    }, [business?.categoryEn, business?.categoryUr]);

    const businessImage = business?.logo || business?.images?.[0];

    return (
        <Animated.View entering={FadeInDown.delay(Math.min(index, 6) * 55).duration(350)}>
            <PressableScale
                intensity={0.02}
                onPress={() => {
                    analyticsService.trackEvent(AnalyticsEvents.BUSINESS_CARD_CLICKED, { businessId: business._id, action: 'view' });
                    router.push({
                        pathname: '/business/[id]',
                        params: {
                            id: business._id,
                            businessData: JSON.stringify(business)
                        }
                    });
                }}
            >
                <ListingCard style={styles.card}>
                    <View style={styles.row}>
                        {/* Logo / initial tile */}
                        {businessImage ? (
                            <Image
                                source={{ uri: businessImage }}
                                style={styles.tile}
                                contentFit="cover"
                                transition={300}
                            />
                        ) : (
                            <View style={[styles.tile, styles.tilePlaceholder, { backgroundColor: `${colors.primary}0D` }]}>
                                <View style={[styles.tileHalo, { backgroundColor: `${colors.primary}14` }]} />
                                <View style={[styles.initialCircle, { backgroundColor: `${colors.primary}1F` }]}>
                                    <ThemedText style={[styles.initialText, { color: colors.primary }]}>
                                        {businessName?.charAt(0)?.toUpperCase() || 'B'}
                                    </ThemedText>
                                </View>
                            </View>
                        )}

                        {/* Info */}
                        <View style={styles.info}>
                            <ThemedText style={[styles.name, { color: colors.text }]} numberOfLines={2}>
                                {businessName}
                            </ThemedText>
                            {address ? (
                                <View style={styles.metaRow}>
                                    <Ionicons name="location" size={12} color={colors.secondary} />
                                    <ThemedText style={[styles.metaText, { color: colors.textSecondary }]} numberOfLines={2}>
                                        {address}
                                    </ThemedText>
                                </View>
                            ) : null}
                        </View>
                    </View>

                    {/* Category badge — top-right absolute, like PlaceCard */}
                    {categoryLineText ? (
                        <View style={[styles.typeBadge, { backgroundColor: colors.secondary }]}>
                            <ThemedText style={styles.typeBadgeText} numberOfLines={1}>
                                {categoryLineText}
                            </ThemedText>
                        </View>
                    ) : null}
                </ListingCard>
            </PressableScale>
        </Animated.View>
    );
});

BusinessCard.displayName = 'BusinessCard';

export default BusinessCard;

const styles = StyleSheet.create({
    card: {
        marginBottom: 16,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        gap: 12,
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
    initialCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    initialText: {
        fontSize: 18,
        fontWeight: '800',
    },
    info: {
        flex: 1,
        gap: 2,
        paddingTop: 10,
    },
    typeBadge: {
        position: 'absolute',
        top: 0,
        right: 0,
        maxWidth: '60%',
        paddingHorizontal: 10,
        borderTopRightRadius: 12,
        borderBottomLeftRadius: 12,
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
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        paddingRight: 8,
    },
    metaText: {
        fontSize: 11.5,
        fontWeight: '500',
        flexShrink: 1,
    },
});
