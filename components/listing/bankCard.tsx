import { Ionicons } from '@expo/vector-icons';
import { Layout } from '@/constants/layout';
import { Image } from 'expo-image';
import React, { useMemo, useState } from 'react';
import {
    Alert,
    Linking,
    Platform,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ListingCard } from './ListingCard';

import { ThemedText } from '@/components/ThemedText';
import { AnalyticsEvents, analyticsService } from '@/analytics';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/colors';

interface BankCardProps {
    business: any;
    onReport?: () => void;
}

const BankCard = React.memo(({ business, onReport }: BankCardProps) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const colors = Colors[theme];
    const router = useRouter();

    const capitalize = (str?: string) =>
        str
            ? str
                .toLowerCase()
                .split(' ')
                .map(w => w.charAt(0).toUpperCase() + w.slice(1))
                .join(' ')
            : '';

    const businessName = useMemo(() => capitalize(business?.name), [business?.name]);
    const ownerName = useMemo(() => {
        // Support both data shapes: business.userId.name and business.contact[0].name
        const name = business?.userId?.name || business?.contact?.[0]?.name || 'Owner';
        return capitalize(name);
    }, [business?.userId?.name, business?.contact]);
    const ownerImage = business?.userId?.profileImage;
    const address = capitalize(business?.address || business?.village || '');
    const category = capitalize(business?.categoryEn || business?.category || '');
    const urduCategory = business?.categoryUr;
    const bankImage = business?.images?.[0];

    return (
        <>
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => {
                    analyticsService.trackEvent(AnalyticsEvents.BUSINESS_CARD_CLICKED, { businessId: business._id, action: 'view' });
                    router.push({
                        pathname: '/place/[id]',
                        params: {
                            id: business._id,
                            placeData: JSON.stringify(business),
                            color: '#0F172A',
                            category: category
                        }
                    });
                }}
            >
                <ListingCard style={{ padding: 14, alignItems: 'center' }}>
                    {/* Bank Image */}
                    <View style={styles.imageContainer}>
                        {bankImage ? (
                            <Image
                                source={{ uri: bankImage }}
                                style={styles.bankImage}
                                contentFit="contain"
                                transition={200}
                            />
                        ) : (
                            <View style={styles.placeholderContainer}>
                                <ThemedText style={[styles.placeholderLetter, { color: isDark ? '#FFFFFF' : '#94A3B8' }]}>
                                    {businessName?.charAt(0)?.toUpperCase()}
                                </ThemedText>
                            </View>
                        )}
                    </View>

                    {/* Bank Info */}
                    <View style={styles.infoContainer}>
                        <ThemedText style={[styles.bankName, { color: isDark ? '#FFFFFF' : colors.text }]} numberOfLines={1}>
                            {businessName}
                        </ThemedText>
                        <ThemedText style={[styles.addressText, { color: isDark ? '#FFFFFF' : colors.textSecondary }]} numberOfLines={1}>
                            {address}
                        </ThemedText>

                        {onReport && (
                            <TouchableOpacity
                                style={styles.reportBtn}
                                onPress={(e) => {
                                    e.stopPropagation();
                                    onReport();
                                }}
                            >
                                <Ionicons name="flag-outline" size={12} color="#EF4444" />
                                <ThemedText style={styles.reportText}>Report</ThemedText>
                            </TouchableOpacity>
                        )}
                    </View>
                </ListingCard>
            </TouchableOpacity>
        </>
    );
});

export default BankCard;

const styles = StyleSheet.create({
    imageContainer: {
        width: 70,
        height: 70,
        borderRadius: 35,
        marginBottom: 10,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    bankImage: {
        width: '80%',
        height: '80%',
    },
    placeholderContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    placeholderLetter: {
        fontSize: 22,
        fontWeight: '800',
        color: '#94A3B8',
    },
    infoContainer: {
        alignItems: 'center',
        width: '100%',
    },
    bankName: {
        fontSize: 14,
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: 4,
    },
    addressText: {
        fontSize: 11,
        fontWeight: '500',
        textAlign: 'center',
    },
    reportBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 10,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        backgroundColor: 'rgba(239, 68, 68, 0.08)',
    },
    reportText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#EF4444',
    },
});
