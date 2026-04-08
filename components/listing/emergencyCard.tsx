import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Alert,
    Linking,
    Platform,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themedText';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/context/ThemeContext';

interface Contact {
    name: string;
    number: string;
}

interface PlaceData {
    _id: string;
    name: string;
    category: {
        en: string;
        ur?: string;
    } | string;
    description?: string;
    phone?: string;
    village?: string;
    address?: string;
    location?: {
        coordinates: [number, number];
    };
    contact?: Contact[];
    images?: string[];
}

interface EmergencyCardProps {
    data: PlaceData;
    color?: string;
}

const EmergencyCard = React.memo(({ data, color }: EmergencyCardProps) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const colors = Colors[theme];
    const router = useRouter();

    // Default to Red for emergency
    const primaryColor = color || '#EF4444';

    const capitalize = (str: string) => {
        const words = str.toLowerCase().split(' ');
        return words.map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    const placeName = capitalize(data.name);
    const address = capitalize(data.village || data.address || "Address not available");
    const hasPhone = !!data.phone || (data.contact && data.contact.length > 0);

    const handleCall = () => {
        const phone = data.phone || data.contact?.[0]?.number;
        if (phone) {
            Linking.openURL(`tel:${phone}`);
        } else {
            Alert.alert("No Phone", "Phone number is not available.");
        }
    };

    const handleNavigate = () => {
        if (data.location?.coordinates) {
            const [lng, lat] = data.location.coordinates;
            const url = Platform.select({
                ios: `maps:0,0?q=${lat},${lng}(${data.name})`,
                android: `geo:0,0?q=${lat},${lng}(${data.name})`,
            });
            if (url) Linking.openURL(url);
        } else {
            const query = encodeURIComponent(data.address || data.name);
            const url = Platform.select({
                ios: `maps:0,0?q=${query}`,
                android: `geo:0,0?q=${query}`,
            });
            if (url) Linking.openURL(url);
        }
    };

    return (
        <>
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => router.push({
                    pathname: '/place/[id]',
                    params: {
                        id: data._id,
                        placeData: JSON.stringify(data),
                        color: primaryColor,
                        category: 'Emergency'
                    }
                })}
                style={styles.cardWrapper}
            >
                <View style={[styles.cardContainer, {
                    backgroundColor: colors.card,
                    borderColor: 'transparent',
                    borderLeftColor: primaryColor,
                }]}>
                    <View style={styles.topRow}>
                        <View style={[styles.iconContainer, { backgroundColor: primaryColor + '15' }]}>
                            <MaterialCommunityIcons name="ambulance" size={26} color={isDark ? '#FFFFFF' : primaryColor} />
                        </View>

                        <View style={styles.detailsContainer}>
                            <View style={styles.headerTitleRow}>
                                <ThemedText style={[styles.name, { color: isDark ? '#FFFFFF' : colors.text }]} numberOfLines={1}>
                                    {placeName}
                                </ThemedText>
                                <View style={[styles.badge, { backgroundColor: primaryColor + '20' }]}>
                                    <ThemedText style={[styles.badgeText, { color: isDark ? '#FFFFFF' : primaryColor }]}>Emergency</ThemedText>
                                </View>
                            </View>

                            <View style={styles.addressRow}>
                                <Ionicons name="location" size={12} color={isDark ? '#FFFFFF' : colors.textSecondary} style={{ marginTop: 2 }} />
                                <ThemedText style={[styles.address, { color: isDark ? '#FFFFFF' : colors.textSecondary }]} numberOfLines={2}>
                                    {address}
                                </ThemedText>
                            </View>
                        </View>
                    </View>

                    <View style={[styles.separator, { backgroundColor: colors.border }]} />

                    <View style={styles.actionsRow}>
                        {hasPhone ? (
                            <TouchableOpacity
                                style={[styles.callBtn, { backgroundColor: primaryColor }]}
                                activeOpacity={0.7}
                                onPress={handleCall}
                            >
                                <Ionicons name="call" size={16} color="#FFFFFF" />
                                <ThemedText style={styles.callText}>Call Now</ThemedText>
                            </TouchableOpacity>
                        ) : null}

                        <TouchableOpacity
                            style={[styles.navBtn, {
                                borderColor: primaryColor + '50',
                                backgroundColor: primaryColor + '10'
                            }]}
                            activeOpacity={0.7}
                            onPress={handleNavigate}
                        >
                            <Ionicons name="navigate" size={16} color={isDark ? '#FFFFFF' : primaryColor} />
                            <ThemedText style={[styles.navText, { color: isDark ? '#FFFFFF' : primaryColor }]}>Directions</ThemedText>
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableOpacity>
        </>
    );
});

export default EmergencyCard;

const isAndroid = Platform.OS === 'android';

const styles = StyleSheet.create({
    cardWrapper: {
        marginBottom: isAndroid ? 10 : 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 3,
    },
    cardContainer: {
        borderRadius: Layout.borderRadius,
        borderWidth: 1,
        borderLeftWidth: 4,
        padding: 16,
        paddingBottom: 14,
        overflow: 'hidden',
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    detailsContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    headerTitleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    name: {
        fontSize: 16,
        fontWeight: '800',
        flex: 1,
        marginRight: 8,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 12,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    addressRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 4,
        paddingRight: 8,
    },
    address: {
        fontSize: 13,
        flex: 1,
        lineHeight: 18,
    },
    separator: {
        height: 1,
        width: '100%',
        marginVertical: 14,
        opacity: 0.6,
    },
    actionsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    callBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        borderRadius: Layout.borderRadius,
        gap: 6,
    },
    callText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700',
    },
    navBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        borderRadius: Layout.borderRadius,
        borderWidth: 1,
        gap: 6,
    },
    navText: {
        fontSize: 14,
        fontWeight: '700',
    },
});
