import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, Linking, StyleSheet, TouchableOpacity, View } from 'react-native';

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
        city: string;
        address?: string;
        village?: string; // Kept for backward compatibility
        available: boolean;
    };
}

const DonorCard = React.memo(({ donor }: DonorCardProps) => {
    const { theme, isDark } = useTheme();
    const colors = Colors[theme];
    const router = useRouter();
    const { user } = useAuth();

    const isAvailable = donor.available;
    const location = [donor.address || donor.village, donor.city].filter(Boolean).join(', ');

    const formatLastDonated = (dateString?: string | null) => {
        if (!dateString) return 'Never';
        const date = new Date(dateString);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays < 30) return `${diffDays} days ago`;
        const diffMonths = Math.floor(diffDays / 30);
        return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
    };



    // const handleChat = async () => {
    //     if (!user) {
    //         Alert.alert("Login Required", "Please login to start a chat.");
    //         return;
    //     }

    //     // don't allow chatting with self
    //     if (user.user?._id === donor.userId._id) {
    //         Alert.alert("Action Not Allowed", "You cannot chat with yourself.");
    //         return;
    //     }

    //     try {
    //         const res = await CREATE_OR_GET_CONVERSATION(donor.userId._id, ConversationSource.DONOR);
    //         if (res.success && res.data) {
    //             router.push(`/chat/${res.data._id}` as any);
    //         }
    //     } catch (error) {
    //         console.error("Failed to start chat", error);
    //         Alert.alert("Error", "Failed to start chat. Please try again.");
    //     }
    // };

    const handleCall = () => {
        if (donor.userId.phone) {
            Linking.openURL(`tel:${donor.userId.phone}`);
        } else {
            Alert.alert("No Phone", "Phone number is not available.");
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
                        <ThemedText style={[styles.name, { color: colors.text }]}>{donor.userId.name}</ThemedText>
                        <View style={styles.locationContainer}>
                            <View style={styles.locationRow}>
                                <Ionicons name="location" size={12} color="#ef4444" />
                                <ThemedText style={[styles.locationText, { color: colors.icon }]} numberOfLines={1}>{donor.city}</ThemedText>
                            </View>
                            {(donor.address || donor.village) && (
                                <View style={styles.locationRow}>
                                    <Ionicons name="home" size={12} color={colors.icon} />
                                    <ThemedText style={[styles.locationText, { color: colors.icon }]} numberOfLines={1}>
                                        {donor.address || donor.village}
                                    </ThemedText>
                                </View>
                            )}
                        </View>
                        <View style={styles.statusRow}>
                            {isAvailable && (
                                <View style={[styles.statusBadge, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                                    <View style={[styles.indicator, { backgroundColor: '#10B981' }]} />
                                    <ThemedText style={[styles.statusText, { color: '#10B981' }]}>
                                        AVAILABLE
                                    </ThemedText>
                                </View>
                            )}
                            {formatLastDonated(donor.lastDonationDate) !== 'Never' && (
                                <ThemedText style={styles.lastDonated}>{formatLastDonated(donor.lastDonationDate)}</ThemedText>
                            )}
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
                                colors={['#10B981', '#059669']} // Green for call
                                style={styles.actionBtn}
                            >
                                <Ionicons name="call" size={16} color="#FFFFFF" />
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
        width: 46, // Reduced by 4px
        height: 46, // Reduced by 4px
        borderRadius: 16,
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
    locationContainer: {
        marginTop: 2,
        gap: 2,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
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
