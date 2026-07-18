import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useMemo } from 'react';
import {
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { AnalyticsEvents, analyticsService } from '@/analytics';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { useRouter } from 'expo-router';
import { ListingCard } from '@/components/essentials/ListingCard';

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
    const { theme, isDark } = useTheme();
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
            <ThemedText style={[styles.avatarLetter, { color: isDark ? colors.text : '#94A3B8' }]}>
                {businessName?.charAt(0)?.toUpperCase()}
            </ThemedText>
        );
    }, [businessImage, businessName, isDark, colors.text]);

    return (
        <TouchableOpacity
            activeOpacity={0.9}
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
            <ListingCard style={{ padding: 8 }}>
                <View style={styles.topRow}>
                    {/* Business Image/Avatar */}
                    <View style={[styles.avatarContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : colors.primary + '10' }]}>
                        {avatarContent}
                    </View>

                    <View style={styles.content}>
                        <ThemedText style={[styles.title, { color: colors.text }]} numberOfLines={1}>
                            {businessName}
                        </ThemedText>

                        {categoryLineText ? (
                            <ThemedText style={[styles.categoryLine, { color: colors.primary }]} numberOfLines={1}>
                                {categoryLineText}
                            </ThemedText>
                        ) : null}

                        <View style={styles.locationRow}>
                            <Ionicons name="location-outline" size={11} color={colors.textSecondary} />
                            <ThemedText style={[styles.location, { color: colors.textSecondary }]} numberOfLines={1}>
                                {address}
                            </ThemedText>
                        </View>
                    </View>
                </View>
            </ListingCard>
        </TouchableOpacity>
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
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
        overflow: 'hidden',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    avatarLetter: {
        fontSize: 16,
        fontWeight: '700',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        gap: 4,
    },
    title: {
        fontSize: 14,
        fontWeight: '700',
    },
    categoryLine: {
        fontSize: 10,
        fontWeight: '600',
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
