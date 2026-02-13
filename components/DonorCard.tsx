import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Linking from 'expo-linking';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';

interface DonorCardProps {
    donor: {
        _id: string;
        userId: {
            name: string;
            phone: string;
            profileImage?: string;
        };
        bloodGroup: string;
        lastDonationDate?: string | null;
        city: string;
        village?: string;
        available: boolean;
    };
}

const DonorCard = React.memo(({ donor }: DonorCardProps) => {
    const { theme, isDark } = useTheme();
    const colors = Colors[theme];

    const isAvailable = donor.available;
    const location = [donor.village, donor.city].filter(Boolean).join(', ');

    const formatLastDonated = (dateString?: string | null) => {
        if (!dateString) return 'Never';
        const date = new Date(dateString);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays < 30) return `${diffDays} days ago`;
        const diffMonths = Math.floor(diffDays / 30);
        return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
    };

    const handleCall = () => {
        if (donor.userId.phone) {
            Linking.openURL(`tel:${donor.userId.phone}`);
        }
    };

    return (
        <View style={styles.cardWrapper}>
            <LinearGradient
                colors={isDark
                    ? ['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.02)']
                    : ['rgba(15, 23, 42, 0.05)', 'rgba(15, 23, 42, 0.02)']}
                style={[
                    styles.card,
                    { borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(15, 23, 42, 0.1)' }
                ]}
            >
                {/* Specular Highlight */}
                <View style={[styles.specularHandle, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.4)' }]} />

                <View style={styles.content}>
                    {/* Blood Group Badge */}
                    <View style={styles.bloodBadgeWrapper}>
                        <LinearGradient
                            colors={['#ef4444', '#991b1b']}
                            style={styles.bloodBadge}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <View style={styles.bloodBadgeInner}>
                                <View style={styles.bloodReflect} />
                                <ThemedText style={styles.bloodType}>{donor.bloodGroup}</ThemedText>
                            </View>
                        </LinearGradient>
                    </View>

                    {/* Info Section */}
                    <View style={styles.info}>
                        <ThemedText style={styles.name}>{donor.userId.name}</ThemedText>
                        <View style={styles.locationRow}>
                            <Ionicons name="location" size={13} color="#ef4444" />
                            <ThemedText style={styles.locationText} numberOfLines={1}>{location}</ThemedText>
                        </View>
                        <View style={styles.statusRow}>
                            <View style={[styles.statusBadge, { backgroundColor: isAvailable ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)' }]}>
                                <View style={[styles.indicator, { backgroundColor: isAvailable ? '#10B981' : '#F59E0B' }]} />
                                <ThemedText style={[styles.statusText, { color: isAvailable ? '#10B981' : '#F59E0B' }]}>
                                    {isAvailable ? 'AVAILABLE' : 'BUSY'}
                                </ThemedText>
                            </View>
                            <ThemedText style={styles.lastDonated}>{formatLastDonated(donor.lastDonationDate)}</ThemedText>
                        </View>
                    </View>

                    {/* Actions */}
                    <View style={styles.actions}>
                        <TouchableOpacity
                            onPress={handleCall}
                            activeOpacity={0.7}
                            style={styles.actionBtnWrapper}
                        >
                            <LinearGradient
                                colors={['#ef4444', '#b91c1c']}
                                style={styles.actionBtn}
                            >
                                <Ionicons name="call" size={18} color="#FFFFFF" />
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </LinearGradient>
        </View>
    );
});

export default DonorCard;

const styles = StyleSheet.create({
    cardWrapper: {
        marginVertical: 4,
        marginBottom: 8,
        borderRadius: 24,
        overflow: 'hidden',
    },
    card: {
        borderRadius: 24,
        padding: 12,
        borderWidth: 1,
        position: 'relative',
    },
    specularHandle: {
        position: 'absolute',
        top: 0,
        left: '15%',
        right: '15%',
        height: 1,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    bloodBadgeWrapper: {
        shadowColor: '#ef4444',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    bloodBadge: {
        width: 50,
        height: 50,
        borderRadius: 18,
        padding: 1.5,
    },
    bloodBadgeInner: {
        flex: 1,
        borderRadius: 16.5,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.1)',
        overflow: 'hidden',
    },
    bloodReflect: {
        position: 'absolute',
        top: 4,
        left: 6,
        width: 12,
        height: 6,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.3)',
        transform: [{ rotate: '-15deg' }],
    },
    bloodType: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '900',
        textShadowColor: 'rgba(0, 0, 0, 0.2)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    info: {
        flex: 1,
        marginLeft: 14,
    },
    name: {
        fontSize: 15,
        textTransform: 'capitalize',
        fontWeight: '800',
        letterSpacing: -0.2,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },
    locationText: {
        fontSize: 12,
        color: '#64748b',
        textTransform: 'capitalize',
        marginLeft: 5,
        fontWeight: '600',
        flex: 1,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
        gap: 8,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 10,
    },
    indicator: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 6,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.2,
    },
    lastDonated: {
        fontSize: 10,
        color: '#94a3b8',
        fontWeight: '600',
    },
    actions: {
        marginLeft: 4,
    },
    actionBtnWrapper: {
        shadowColor: '#ef4444',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 4,
    },
    actionBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
