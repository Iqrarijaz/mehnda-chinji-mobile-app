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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themedText';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import BusinessDetailModal from './businessDetailModal';

interface BusinessCardProps {
    business: any;
}

const isAndroid = Platform.OS === 'android';

const BusinessCard = React.memo(({ business }: BusinessCardProps) => {
    const { theme } = useTheme();
    const colors = Colors[theme];
    const insets = useSafeAreaInsets();
    const { user } = useAuth();

    const [modalVisible, setModalVisible] = useState(false);

    const cardFontColor = '#000000';

    const capitalize = (str?: string) =>
        str
            ? str
                .toLowerCase()
                .split(' ')
                .map(w => w.charAt(0).toUpperCase() + w.slice(1))
                .join(' ')
            : '';

    const businessName = useMemo(() => capitalize(business?.name), [business?.name]);
    const ownerName = useMemo(() => capitalize(business?.userId?.name || 'Owner'), [business?.userId?.name]);
    const ownerImage = business?.userId?.profileImage;
    const address = capitalize(business?.address || business?.village || '');
    const category = capitalize(business?.categoryEn || '');
    const urduCategory = business?.categoryUr;

    const handleCall = () => {
        if (business?.phone) {
            Linking.openURL(`tel:${business.phone}`);
        } else {
            Alert.alert('No Phone', 'Phone number not available.');
        }
    };

    const avatarContent = ownerImage ? (
        <Image
            source={{ uri: ownerImage }}
            style={styles.avatarImage}
            contentFit="cover"
            transition={200}
        />
    ) : (
        <ThemedText style={[styles.avatarLetter, { color: cardFontColor }]}>
            {ownerName?.charAt(0)?.toUpperCase()}
        </ThemedText>
    );

    return (
        <>
            <TouchableOpacity activeOpacity={0.9} onPress={() => setModalVisible(true)}>
                <View style={styles.card}>
                    <View style={styles.row}>
                        {/* Avatar */}
                        <View style={styles.avatar}>
                            {avatarContent}
                        </View>

                        {/* Content */}
                        <View style={styles.content}>
                            <ThemedText style={styles.title} numberOfLines={1}>
                                {businessName}
                            </ThemedText>

                            <View style={styles.categoryRow}>
                                <View style={styles.categoryBadge}>
                                    <ThemedText style={styles.categoryBadgeText} numberOfLines={1}>
                                        {category} {urduCategory ? `• ${urduCategory}` : ''}
                                    </ThemedText>
                                </View>
                            </View>

                            {business?.description ? (
                                <ThemedText style={styles.description} numberOfLines={1}>
                                    {business.description}
                                </ThemedText>
                            ) : null}

                            <View style={styles.locationRow}>
                                <Ionicons name="location" size={12} color="#64748B" />
                                <ThemedText style={styles.location} numberOfLines={1}>
                                    {address}
                                </ThemedText>
                            </View>
                        </View>

                        {/* Quick call button */}
                        <TouchableOpacity
                            style={styles.callBtn}
                            onPress={(e) => { e.stopPropagation(); handleCall(); }}
                        >
                            <Ionicons name="call" size={18} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableOpacity>

            {/* ── Detail Modal ── */}
            <BusinessDetailModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                business={business}
                businessName={businessName}
                ownerName={ownerName}
                ownerImage={ownerImage}
                address={address}
                category={category}
                urduCategory={urduCategory}
            />
        </>
    );
});

export default BusinessCard;

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        paddingHorizontal: 14,
        paddingVertical: 14,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
    },
    row: { flexDirection: 'row', alignItems: 'center' },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 14,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
        overflow: 'hidden',
    },
    avatarImage: { width: '100%', height: '100%', borderRadius: 14 },
    avatarLetter: { fontSize: 24, fontWeight: '800', color: '#94A3B8' },
    content: { flex: 1, justifyContent: 'center', gap: 2 },
    title: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
    categoryRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
    categoryBadge: {
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    categoryBadgeText: { fontSize: 12, fontWeight: '600', color: '#64748B' },
    description: { fontSize: 13, color: '#64748B', marginTop: 4, lineHeight: 18 },
    locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
    location: { fontSize: 12, color: '#64748B' },
    callBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#0F172A',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 10,
    },
});
