import { ThemedText } from '@/components/ThemedText';
import { AnalyticsEvents, analyticsService } from '@/analytics';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Alert, Linking, StyleSheet, TouchableOpacity, View } from 'react-native';
import { TintedCard } from '../ui/tintedCard';

interface DonorCardProps {
    donor: {
        _id: string;
        userId: {
            _id: string;
            name: string;
            phone: string;
            profileImage?: string;
        };
        bloodGroup: string;
        lastDonationDate?: string | null;
        createdAt?: string;
        city: string;
        address?: string;
        village?: string;
        available: boolean;
    };
    onReportPress?: (donorId: string) => void;
}

const DonorCard = React.memo(({ donor }: DonorCardProps) => {
    const { theme, isDark } = useTheme();
    const colors = Colors[theme];

    const location = [donor.address || donor.village, donor.city].filter(Boolean).join(', ');
    const primaryColor = colors.primary;

    const handleCall = () => {
        if (donor.userId.phone) {
            analyticsService.trackEvent(AnalyticsEvents.DONOR_CARD_CLICKED, { donorId: donor._id });
            Linking.openURL(`tel:${donor.userId.phone}`);
        } else {
            Alert.alert("No Phone", "Phone number is not available.");
        }
    };

    return (
        <View style={styles.cardContainer}>
            <TintedCard tintColor={primaryColor} bgColor={colors.card} style={styles.cardWrapper}>
                <View style={styles.cardMain}>
                    {/* Left: Blood Group */}
                    <View style={styles.bloodCircle}>
                        <ThemedText style={styles.bloodText}>
                            {donor.bloodGroup}
                        </ThemedText>
                    </View>

                    {/* Center: Info */}
                    <View style={styles.contentContainer}>
                        <View style={styles.nameRow}>
                            <ThemedText style={[styles.name, { color: colors.text }]} numberOfLines={1}>
                                {donor.userId.name}
                            </ThemedText>
                        </View>

                        <View style={styles.locationRow}>
                            <Ionicons name="location" size={12} color={colors.textSecondary} style={{ marginTop: 5 }} />
                            <ThemedText style={[styles.locationText, { color: colors.textSecondary }]} numberOfLines={2}>
                                {location}
                            </ThemedText>
                        </View>
                    </View>
                    <TouchableOpacity
                        style={[styles.callBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : primaryColor + '10' }]}
                        onPress={handleCall}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="call" size={14} color={isDark ? colors.text : primaryColor} />
                    </TouchableOpacity>
                </View>

                <View style={[styles.divider, { backgroundColor: primaryColor + '10' }]} />

                <View style={styles.cardFooter}>
                    <View style={styles.footerLeft}>
                        <Ionicons name="calendar-outline" size={12} color={colors.textSecondary} />
                        <ThemedText style={[styles.dateText, { color: colors.textSecondary }]}>
                            {new Date(donor.createdAt || donor.lastDonationDate || Date.now()).toLocaleDateString()}
                        </ThemedText>
                    </View>
                </View>
            </TintedCard>
        </View>
    );
});

export default DonorCard;

const styles = StyleSheet.create({
    cardContainer: {
        marginBottom: 16,
    },
    cardWrapper: {
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    cardMain: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    bloodCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#a91111ff',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        marginRight: 10,
    },
    bloodText: {
        fontSize: 12,
        fontWeight: '900',
        color: '#ffffffff',
        textAlign: 'center',
        textAlignVertical: 'center',
        includeFontPadding: false,
    },
    contentContainer: {
        flex: 1,
        gap: 0,
    },
    nameRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    name: {
        fontSize: 16,
        fontWeight: '800',
        textTransform: 'capitalize',
        flex: 1,
        marginRight: 6,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 4,
    },
    locationText: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'capitalize',
        flex: 1,
    },
    divider: {
        height: 1,
        width: '100%',
        marginVertical: 8,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    footerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    dateText: {
        fontSize: 11,
        fontWeight: '600',
    },
    callBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
