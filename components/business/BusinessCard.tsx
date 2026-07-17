import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useMemo } from 'react';
import {
    StyleSheet,
    View,
} from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { AnalyticsEvents, analyticsService } from '@/analytics';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { useRouter } from 'expo-router';
import { ListingCard } from '@/components/listing/ListingCard';
import { PressableScale } from '@/components/ui/PressableScale';

interface BusinessCardProps {
    business: any;
    onReport?: () => void;
}

const capitalize = (str?: string) =>
    str
        ? str
            .toLowerCase()
            .split(' ')
            .map(w => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ')
        : '';

const BusinessCard = React.memo(({ business }: BusinessCardProps) => {
    const { theme } = useTheme();
    const colors = Colors[theme];
    const router = useRouter();

    const businessName = useMemo(() => capitalize(business?.name), [business?.name]);
    const address = useMemo(() => capitalize(business?.address || business?.village || ''), [business?.address, business?.village]);

    const categoryLineText = useMemo(() => {
        const parts = [];
        const engCat = capitalize(business?.categoryEn || '');
        if (engCat) parts.push(engCat);
        if (business?.categoryUr) parts.push(business.categoryUr);
        return parts.join(' | ');
    }, [business?.categoryEn, business?.categoryUr]);

    const businessImage = business?.logo || business?.images?.[0];

    const avatarContent = useMemo(() => {
        if (businessImage) {
            return (
                <Image
                    source={{ uri: businessImage }}
                    style={styles.avatarImage}
                    contentFit="cover"
                    transition={200}
                />
            );
        }
        return (
            <ThemedText style={[styles.avatarLetter, { color: colors.primary }]}>
                {businessName?.charAt(0)?.toUpperCase()}
            </ThemedText>
        );
    }, [businessImage, businessName, colors.primary]);

    return (
        <PressableScale
            pressedScale={0.98}
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
            style={styles.cardWrapper}
        >
            <ListingCard style={{ padding: 12 }}>
                <View style={styles.topRow}>
                    {/* Business Image/Avatar */}
                    <View style={[styles.avatarContainer, { backgroundColor: colors.limeSoft }]}>
                        {avatarContent}
                    </View>

                    <View style={styles.content}>
                        <ThemedText style={[styles.title, { color: colors.text }]} numberOfLines={1}>
                            {businessName}
                        </ThemedText>

                        {categoryLineText ? (
                            <View style={[styles.categoryChip, { backgroundColor: colors.limeSoft }]}>
                                <ThemedText style={[styles.categoryLine, { color: colors.limeDark }]} numberOfLines={1}>
                                    {categoryLineText}
                                </ThemedText>
                            </View>
                        ) : null}

                        <View style={styles.locationRow}>
                            <Ionicons name="location-outline" size={11} color={colors.textSecondary} />
                            <ThemedText style={[styles.location, { color: colors.textSecondary }]} numberOfLines={1}>
                                {address}
                            </ThemedText>
                        </View>
                    </View>

                    <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} style={styles.chevron} />
                </View>
            </ListingCard>
        </PressableScale>
    );
});

export default BusinessCard;

const styles = StyleSheet.create({
    cardWrapper: {
        flex: 1,
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarContainer: {
        width: 60,
        height: 60,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
        overflow: 'hidden',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    avatarLetter: {
        fontSize: 20,
        fontWeight: '800',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        gap: 4,
    },
    title: {
        fontSize: 15,
        fontWeight: '700',
    },
    categoryChip: {
        alignSelf: 'flex-start',
        borderRadius: 999,
        paddingHorizontal: 8,
        paddingVertical: 2,
        maxWidth: '100%',
    },
    categoryLine: {
        fontSize: 10,
        fontWeight: '700',
    },
    chevron: {
        marginLeft: 8,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    location: {
        fontSize: 11,
        fontWeight: '500',
    },
});
