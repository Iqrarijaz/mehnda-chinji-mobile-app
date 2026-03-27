import { Ionicons } from '@expo/vector-icons';
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

import { ThemedText } from '@/components/themedText';
import { AnalyticsEvents, analyticsService } from '@/analytics';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/colors';
import PlacesDetailsModal from './placesDetailsModal';

interface BankCardProps {
    business: any;
}

const BankCard = React.memo(({ business }: BankCardProps) => {
    const { theme } = useTheme();
    const colors = Colors[theme];
    const [modalVisible, setModalVisible] = useState(false);

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
                    setModalVisible(true);
                }}
            >
                <View style={styles.card}>
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
                                <ThemedText style={styles.placeholderLetter}>
                                    {businessName?.charAt(0)?.toUpperCase()}
                                </ThemedText>
                            </View>
                        )}
                    </View>

                    {/* Bank Info */}
                    <View style={styles.infoContainer}>
                        <ThemedText style={styles.bankName} numberOfLines={1}>
                            {businessName}
                        </ThemedText>
                        <ThemedText style={styles.addressText} numberOfLines={1}>
                            {address}
                        </ThemedText>
                    </View>
                </View>
            </TouchableOpacity>

            {/* Detail Modal */}
            <PlacesDetailsModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                data={business}
                category={category}
                color="#0F172A"
            />
        </>
    );
});

export default BankCard;

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 14,
        marginBottom: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 10,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    imageContainer: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#F8FAFC',
        marginBottom: 10,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#E2E8F0',
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
        fontSize: 32,
        fontWeight: '800',
        color: '#94A3B8',
    },
    infoContainer: {
        alignItems: 'center',
        width: '100%',
    },
    bankName: {
        fontSize: 18,
        fontWeight: '800',
        color: '#0F172A',
        textAlign: 'center',
        marginBottom: 4,
    },
    addressText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#64748B',
        textAlign: 'center',
    },
});
