import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useState } from 'react';
import {
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themedText';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/context/ThemeContext';
import { Linking, Platform, Alert } from 'react-native';

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
    type?: string;
    timing?: string;
    services?: string;
    route?: { city: string; time: string }[];
}

interface TravelCardProps {
    data: PlaceData;
    color?: string;
}

const TravelCard = React.memo(({ data, color }: TravelCardProps) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const colors = Colors[theme];
    const router = useRouter();

    // Default to Light Blue for Travel
    const primaryColor = color || '#60A5FA';

    const capitalize = (str: string) => {
        const words = str.toLowerCase().split(' ');
        return words.map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    const placeName = capitalize(data.name);
    const address = capitalize(data.village || data.address || "Address not available");
    const image = data.images?.[0];
    const coordinates = data.location?.coordinates;
    const hasValidLocation = coordinates && (coordinates[0] !== 0 || coordinates[1] !== 0);

    const handleNavigate = (e: any) => {
        e.stopPropagation();
        if (coordinates) {
            const [lng, lat] = coordinates;
            const url = Platform.select({
                ios: `maps:0,0?q=${lat},${lng}(${data.name})`,
                android: `geo:0,0?q=${lat},${lng}(${data.name})`,
            });
            if (url) Linking.openURL(url);
        }
    };

    return (
        <>
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => router.push({
                    pathname: '/place/[id]',
                    params: {
                        id: data._id,
                        placeData: JSON.stringify(data),
                        color: primaryColor,
                        category: 'Travel'
                    }
                })}
            >
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={styles.row}>
                        <View style={[styles.imageWrapper, { borderColor: primaryColor + '20' }]}>
                            {image ? (
                                <Image
                                    source={{ uri: image }}
                                    style={styles.cardImage}
                                    contentFit="cover"
                                    transition={200}
                                />
                            ) : (
                                <View style={[styles.placeholderContainer, { backgroundColor: primaryColor + '10' }]}>
                                    <Ionicons name="bus" size={32} color={isDark ? '#FFFFFF' : primaryColor} />
                                </View>
                            )}
                        </View>

                        <View style={styles.infoContainer}>
                            <ThemedText style={[styles.placeName, { color: isDark ? '#FFFFFF' : colors.text }]} numberOfLines={2}>
                                {placeName}
                            </ThemedText>

                            {data.type && (
                                <View style={[styles.typeBadge, { backgroundColor: primaryColor + '15' }]}>
                                    <ThemedText style={[styles.typeText, { color: primaryColor }]}>
                                        {capitalize(data.type)}
                                    </ThemedText>
                                </View>
                            )}
                        </View>

                        {hasValidLocation && (
                            <TouchableOpacity
                                style={[styles.directionBtn, { backgroundColor: primaryColor + '10' }]}
                                onPress={handleNavigate}
                            >
                                <Ionicons name="navigate" size={18} color={primaryColor} />
                            </TouchableOpacity>
                        )}
                        
                        <View style={styles.chevronContainer}>
                            <Ionicons name="chevron-forward" size={20} color={isDark ? '#FFFFFF' : colors.border} />
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        </>
    );
});

export default TravelCard;

const styles = StyleSheet.create({
    card: {
        borderRadius: Layout.borderRadius,
        padding: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    imageWrapper: {
        width: 80,
        height: 80,
        borderRadius: Layout.borderRadius,
        overflow: 'hidden',
        borderWidth: 1,
        marginRight: 14,
        position: 'relative',
    },
    cardImage: {
        width: '100%',
        height: '100%',
    },
    placeholderContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    infoContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    placeName: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 6,
    },
    addressRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 4,
        paddingRight: 8,
    },
    addressText: {
        flex: 1,
        fontSize: 13,
        fontWeight: '500',
        lineHeight: 18,
    },
    chevronContainer: {
        paddingLeft: 4,
        justifyContent: 'center',
    },
    typeBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        marginBottom: 6,
    },
    typeText: {
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    directionBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 4,
    },
});
