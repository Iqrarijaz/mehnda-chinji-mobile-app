import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useState } from 'react';
import {
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';

import { ThemedText } from '@/components/themedText';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import PlacesDetailsModal from './placesDetailsModal';

interface Contact {
    name: string;
    number: string;
}

interface MosqueCardProps {
    data: {
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
    };
    color?: string;
}

const MosqueCard = React.memo(({ data, color }: MosqueCardProps) => {
    const { theme } = useTheme();
    const colors = Colors[theme];
    const [modalVisible, setModalVisible] = useState(false);

    // Use passed color or default to Emerald (Religious default)
    const primaryColor = color || '#10B981';

    const capitalize = (str: string) => {
        const words = str.toLowerCase().split(' ');
        return words.map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    const mosqueName = capitalize(data.name);
    const address = capitalize(data.village || data.address || "Address not available");
    const mosqueImage = data.images?.[0];

    return (
        <>
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setModalVisible(true)}
            >
                <View style={styles.card}>
                    <View style={styles.row}>
                        {/* Image or Icon Container */}
                        <View style={[styles.imageWrapper, { borderColor: primaryColor + '20' }]}>
                            {mosqueImage ? (
                                <Image
                                    source={{ uri: mosqueImage }}
                                    style={styles.mosqueImage}
                                    contentFit="cover"
                                    transition={200}
                                />
                            ) : (
                                <View style={[styles.placeholderContainer, { backgroundColor: primaryColor + '10' }]}>
                                    <MaterialCommunityIcons name="mosque" size={32} color={primaryColor} style={{ opacity: 0.8 }} />
                                </View>
                            )}
                        </View>

                        {/* Text Container */}
                        <View style={styles.infoContainer}>
                            <ThemedText style={styles.mosqueName} numberOfLines={2}>
                                {mosqueName}
                            </ThemedText>
                            
                            <View style={styles.addressRow}>
                                <Ionicons name="location" size={14} color={primaryColor} style={{ marginTop: 2 }} />
                                <ThemedText style={styles.addressText} numberOfLines={2}>
                                    {address}
                                </ThemedText>
                            </View>
                        </View>
                        
                        <View style={styles.chevronContainer}>
                            <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
                        </View>
                    </View>
                </View>
            </TouchableOpacity>

            <PlacesDetailsModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                data={data}
                category="Mosque"
                color={primaryColor}
            />
        </>
    );
});

export default MosqueCard;

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    imageWrapper: {
        width: 80,
        height: 80,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        marginRight: 14,
        position: 'relative',
        backgroundColor: '#F8FAFC',
    },
    mosqueImage: {
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
    mosqueName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#000000', // Explicitly Black
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
        color: '#000000', // Explicitly Black
        lineHeight: 18,
    },
    chevronContainer: {
        paddingLeft: 4,
        justifyContent: 'center',
    }
});
