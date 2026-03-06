import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    StyleSheet,
    Switch,
    TouchableOpacity,
    View,
} from 'react-native';

import { ThemedText } from '@/components/themedText';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { TintedCard } from '../ui/tintedCard';

interface MyBloodDonorRegistrationCardProps {
    user: any;
    donorData: any;
    isAvailable: boolean;
    onToggleAvailability: () => void;
    onDelete: () => void;
    isProcessing: boolean;
}

const MyBloodDonorRegistrationCard = React.memo(({
    user,
    donorData,
    isAvailable,
    onToggleAvailability,
    onDelete,
    isProcessing
}: MyBloodDonorRegistrationCardProps) => {
    const { theme } = useTheme();
    const colors = Colors[theme];

    const primaryColor = "#000000";

    const address = (
        donorData.address
            ? `${donorData.address}, ${donorData.city || ''}`
            : donorData.city || 'N/A'
    ).toLowerCase().trim();

    return (
        <TintedCard
            tintColor={primaryColor}
            bgColor="#FFFFFF"
            style={styles.card}
        >
            <View style={styles.cardHeader}>
                <View style={styles.headerLeft}>
                    <View style={styles.avatarWrapper}>
                        {user?.user?.profileImage ? (
                            <Image
                                source={{ uri: user.user.profileImage }}
                                style={styles.avatarImage}
                                contentFit="cover"
                                transition={200}
                            />
                        ) : (
                            <View style={[styles.avatarInitial, { backgroundColor: primaryColor + '10' }]}>
                                <ThemedText style={[styles.avatarInitialText, { color: primaryColor }]}>
                                    {(user?.user?.name || 'U').charAt(0).toUpperCase()}
                                </ThemedText>
                            </View>
                        )}
                    </View>
                    <View style={styles.nameContainer}>
                        <View style={styles.nameRow}>
                            <ThemedText style={[styles.bizName, { color: primaryColor }]} numberOfLines={1}>
                                {user?.user?.name || "My Donor Profile"}
                            </ThemedText>
                            <View style={[
                                styles.statusBadge,
                                { backgroundColor: isAvailable ? '#DCFCE7' : '#FEE2E2' }
                            ]}>
                                <View style={[
                                    styles.statusDot,
                                    { backgroundColor: isAvailable ? '#16A34A' : '#DC2626' }
                                ]} />
                                <ThemedText style={[
                                    styles.statusText,
                                    { color: isAvailable ? '#166534' : '#991B1B' }
                                ]}>
                                    {donorData.bloodGroup}
                                </ThemedText>
                            </View>
                        </View>
                        <View style={styles.addressRow}>
                            <Ionicons name="location" size={12} color={primaryColor} style={{ opacity: 0.6, paddingTop: 2 }} />
                            <ThemedText style={[styles.addressText, { color: primaryColor, opacity: 0.6 }]} numberOfLines={2}>
                                {address}
                            </ThemedText>
                        </View>
                    </View>
                </View>
            </View>

            <View style={[styles.divider, { backgroundColor: primaryColor + '10', marginVertical: 8 }]} />

            <View style={styles.cardFooter}>
                <View style={styles.dateContainer}>
                    <Ionicons name="calendar-outline" size={14} color={primaryColor} style={{ opacity: 0.6 }} />
                    <ThemedText style={[styles.dateText, { color: primaryColor, opacity: 0.6 }]}>
                        Last Donated: {donorData.lastDonationDate ? new Date(donorData.lastDonationDate).toLocaleDateString() : 'Never'}
                    </ThemedText>
                </View>

                <View style={styles.actionButtons}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 4 }}>
                        <Switch
                            value={isAvailable}
                            onValueChange={onToggleAvailability}
                            trackColor={{ false: '#E2E8F0', true: '#DCFCE7' }}
                            thumbColor={isAvailable ? '#10B981' : '#94A3B8'}
                            ios_backgroundColor="#E2E8F0"
                            style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: '#FEE2E2' }]}
                        onPress={onDelete}
                        disabled={isProcessing}
                    >
                        <Ionicons name="trash-outline" size={16} color="#EF4444" />
                    </TouchableOpacity>
                </View>
            </View>
        </TintedCard>
    );
});

export default MyBloodDonorRegistrationCard;

const styles = StyleSheet.create({
    card: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginBottom: 16,
    },
    cardHeader: {
        marginBottom: 4,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    avatarWrapper: {
        width: 44,
        height: 44,
        borderRadius: 22,
        overflow: 'hidden',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    avatarInitial: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarInitialText: {
        fontSize: 18,
        fontWeight: '800',
    },
    nameContainer: {
        flex: 1,
    },
    nameRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    bizName: {
        fontSize: 16,
        fontWeight: '800',
        textTransform: 'capitalize',
        flex: 1,
        marginRight: 6,
    },
    addressRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 4,
        marginTop: 2,
    },
    addressText: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'capitalize',
        flex: 1,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        gap: 4,
    },
    statusDot: {
        width: 5,
        height: 5,
        borderRadius: 2.5,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    divider: {
        height: 1,
        width: '100%',
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    dateText: {
        fontSize: 12,
        fontWeight: '600',
    },
    actionButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    actionBtn: {
        padding: 6,
        borderRadius: 8,
    },
});
