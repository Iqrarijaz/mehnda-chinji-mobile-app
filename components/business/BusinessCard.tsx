import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    Alert,
    Linking,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/colors';
import { getCategoryColor, getProfessionIcon } from '@/constants/professions';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

interface BusinessCardProps {
    business: {
        _id: string;
        name: string;
        category: {
            en: string;
            ur?: string;
        } | string;
        description?: string;
        phone?: string;
        address?: string;
        village?: string; // Kept for backward compatibility
        userId?: string | { _id: string }; // Added userId allowing populated object or string
    };
}

const BusinessCard = React.memo(({ business }: BusinessCardProps) => {
    const { theme, isDark } = useTheme();
    const colors = Colors[theme];
    const router = useRouter();
    const { user } = useAuth();

    // const handleChat = async () => {
    //     if (!user) {
    //         Alert.alert("Login Required", "Please login to start a chat.");
    //         return;
    //     }

    //     try {
    //         const ownerId = typeof business.userId === 'object' ? business.userId._id : business.userId;

    //         if (!ownerId) {
    //             console.error("Business owner ID not found");
    //             return;
    //         }

    //         // Prevent chatting with self
    //         if (user.user && user.user._id === ownerId) {
    //             Alert.alert("Action Not Allowed", "You cannot chat with yourself.");
    //             return;
    //         }

    //         const res = await CREATE_OR_GET_CONVERSATION(ownerId, ConversationSource.BUSINESS);
    //         if (res.success && res.data) {
    //             router.push(`/chat/${res.data._id}` as any);
    //         }
    //     } catch (error) {
    //         console.error("Failed to start chat", error);
    //         Alert.alert("Error", "Failed to start chat. Please try again.");
    //     }
    // };

    const handleCall = () => {
        if (business.phone) {
            Linking.openURL(`tel:${business.phone}`);
        } else {
            Alert.alert("No Phone", "Phone number is not available.");
        }
    };

    const capitalize = (str: string) => {
        return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    const businessName = capitalize(business.name);
    const categoryText = typeof business.category === 'string'
        ? capitalize(business.category)
        : capitalize(business.category.en);

    const urduCategory = typeof business.category !== 'string' ? business.category.ur : null;
    const englishCategoryRaw = typeof business.category === 'string' ? business.category : business.category.en;

    const iconName = getProfessionIcon(englishCategoryRaw);
    const categoryColor = getCategoryColor(englishCategoryRaw);

    return (
        <View style={[styles.cardContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {/* Header Section */}
            <View style={styles.header}>
                <View style={styles.iconContainer}>
                    <View style={styles.iconOuter}>
                        <View style={[styles.iconInner, { backgroundColor: categoryColor + '15' }]}>
                            <MaterialCommunityIcons name={iconName as any} size={24} color={categoryColor} />
                        </View>
                    </View>
                </View>

                <View style={styles.mainInfo}>
                    <View style={styles.titleRow}>
                        <ThemedText style={[styles.name, { color: colors.text }]} numberOfLines={1}>{businessName}</ThemedText>
                    </View>
                    <View style={styles.subHeader}>
                        <View style={[styles.categoryBadge, { backgroundColor: colors.background, borderColor: colors.border }]}>
                            <ThemedText style={[styles.categoryText, { color: colors.icon }]}>{categoryText}</ThemedText>
                        </View>
                        {urduCategory && (
                            <ThemedText style={[styles.urduText, { color: colors.icon }]}>{urduCategory}</ThemedText>
                        )}
                    </View>
                </View>
            </View>

            {/* Description Section */}
            {business.description ? (
                <View style={styles.descriptionBox}>
                    <ThemedText style={[styles.description, { color: colors.icon }]} numberOfLines={2}>
                        {business.description}
                    </ThemedText>
                </View>
            ) : null}

            {/* Footer Section */}
            <View style={[styles.footer, { borderTopColor: colors.border }]}>
                <View style={styles.locationContainer}>
                    <Ionicons name="location" size={14} color={colors.icon} />
                    <ThemedText style={[styles.locationText, { color: colors.icon }]} numberOfLines={1}>
                        {business.address || business.village}
                    </ThemedText>
                </View>

                <TouchableOpacity
                    style={styles.callActionButton}
                    onPress={handleCall}
                    activeOpacity={0.8}
                >
                    <LinearGradient
                        colors={[colors.primary, colors.primary]}
                        style={styles.callButtonGradient}
                    >
                        <Ionicons name="call" size={16} color="#FFFFFF" />
                        <ThemedText style={styles.callBtnText}>Call</ThemedText>
                    </LinearGradient>
                </TouchableOpacity>
            </View>

        </View>
    );
});

export default BusinessCard;

const styles = StyleSheet.create({
    cardContainer: {
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
        shadowColor: "#64748B",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3,
        borderWidth: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    iconContainer: {
        marginRight: 12,
    },
    iconOuter: {
        width: 48,
        height: 48,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconInner: {
        width: 48,
        height: 48,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    mainInfo: {
        flex: 1,
        gap: 4,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    name: {
        fontSize: 17,
        fontWeight: '700',
        color: '#1E293B',
        letterSpacing: -0.3,
    },
    subHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
    },
    categoryBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        borderWidth: 1,
    },
    categoryText: {
        fontSize: 11,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.3,
    },
    urduText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#94A3B8',
    },
    descriptionBox: {
        marginBottom: 16,
    },
    description: {
        fontSize: 13,
        lineHeight: 19,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        flex: 1,
    },
    locationText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#64748B',
        textTransform: 'capitalize',
    },
    callActionButton: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    callButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        gap: 6,
    },
    callBtnText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '700',
    },
});
