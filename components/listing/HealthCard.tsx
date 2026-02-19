import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Alert,
    Linking,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/colors';
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
    timing?: {
        en: string;
        ur?: string;
    } | string;
    services?: {
        en: string;
        ur?: string;
    } | string;
}

interface HealthCardProps {
    data: PlaceData;
}

const HealthCard = React.memo(({ data }: HealthCardProps) => {
    const { theme } = useTheme();
    const colors = Colors[theme];
    const [modalVisible, setModalVisible] = useState(false);

    const handleCall = (phoneNumber: string) => {
        if (phoneNumber) {
            Linking.openURL(`tel:${phoneNumber}`);
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
    }

    const capitalize = (str: string) => {
        return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    const getString = (val: string | { en: string; ur?: string } | undefined) => {
        if (!val) return '';
        if (typeof val === 'string') return val;
        return val.en;
    };

    const placeName = capitalize(data.name);
    const address = data.village || data.address || "Address not available";
    const contacts = data.contact || (data.phone ? [{ name: 'Primary', number: data.phone }] : []);
    const timing = getString(data.timing);
    const services = getString(data.services);

    return (
        <>
            <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setModalVisible(true)}
                style={[styles.cardContainer, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
                <View style={styles.contentRow}>
                    <View style={[styles.iconContainer, { backgroundColor: '#EF4444' + '15' }]}>
                        <MaterialCommunityIcons name="medical-bag" size={24} color="#EF4444" />
                    </View>

                    <View style={[styles.detailsContainer, { marginRight: 12 }]}>
                        <ThemedText style={[styles.name, { color: colors.text }]} numberOfLines={2}>
                            {placeName}
                        </ThemedText>

                        <View style={styles.addressRow}>
                            <ThemedText style={[styles.address, { color: colors.icon }]} numberOfLines={2}>
                                {address}
                            </ThemedText>
                        </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.icon} />
                </View>
            </TouchableOpacity>

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
                    <View style={[styles.modalContent, { backgroundColor: colors.card }]}>

                        {/* Header */}
                        <View style={styles.modalHeader}>
                            <ThemedText style={[styles.modalTitle, { color: colors.text }]}>
                                {placeName}
                            </ThemedText>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView contentContainerStyle={styles.modalScrollContent}>
                            {/* Address Section */}
                            <View style={styles.sectionContainer}>
                                <ThemedText style={[styles.sectionTitle, { color: colors.primary }]}>Location</ThemedText>
                                <View style={styles.modalAddressRow}>
                                    <Ionicons name="location" size={18} color={colors.primary} />
                                    <ThemedText style={[styles.modalAddressText, { color: colors.text }]}>
                                        {address}
                                    </ThemedText>
                                </View>
                                <TouchableOpacity
                                    style={[styles.navigateButton, { backgroundColor: colors.primary }]}
                                    onPress={handleNavigate}
                                >
                                    <Ionicons name="navigate" size={18} color="#FFF" />
                                    <ThemedText style={styles.navigateButtonText}>Get Directions</ThemedText>
                                </TouchableOpacity>
                            </View>

                            <View style={[styles.divider, { backgroundColor: colors.border }]} />

                            {/* Timing Section */}
                            {timing ? (
                                <View style={styles.sectionContainer}>
                                    <ThemedText style={[styles.sectionTitle, { color: colors.primary }]}>Timing</ThemedText>
                                    <View style={styles.infoRow}>
                                        <Ionicons name="time-outline" size={18} color={colors.border} />
                                        <ThemedText style={[styles.infoText, { color: colors.text }]}>{timing}</ThemedText>
                                    </View>
                                    <View style={[styles.divider, { backgroundColor: colors.border, marginTop: 15 }]} />
                                </View>
                            ) : null}

                            {/* Services Section */}
                            {services ? (
                                <View style={styles.sectionContainer}>
                                    <ThemedText style={[styles.sectionTitle, { color: colors.primary }]}>Services</ThemedText>
                                    <View style={styles.infoRow}>
                                        <MaterialCommunityIcons name="stethoscope" size={18} color={colors.border} />
                                        <ThemedText style={[styles.infoText, { color: colors.text }]}>{services}</ThemedText>
                                    </View>
                                    <View style={[styles.divider, { backgroundColor: colors.border, marginTop: 15 }]} />
                                </View>
                            ) : null}

                            {/* Contacts Section */}
                            {contacts.length > 0 && (
                                <View style={styles.sectionContainer}>
                                    <ThemedText style={[styles.sectionTitle, { color: colors.primary }]}>Contacts</ThemedText>
                                    {contacts.map((contact, index) => (
                                        <View key={index} style={[styles.contactRow, { borderBottomColor: colors.border, borderBottomWidth: index === contacts.length - 1 ? 0 : 1 }]}>
                                            <View>
                                                <ThemedText style={[styles.contactName, { color: colors.text }]}>{capitalize(contact.name || 'Contact')}</ThemedText>
                                                <ThemedText style={[styles.contactNumber, { color: colors.icon }]}>{contact.number}</ThemedText>
                                            </View>
                                            <TouchableOpacity
                                                style={[styles.callButton, { backgroundColor: colors.primary + '20' }]}
                                                onPress={() => handleCall(contact.number)}
                                            >
                                                <Ionicons name="call" size={20} color={colors.primary} />
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                </View>
                            )}

                            {/* Fallback if no contacts */}
                            {contacts.length === 0 && (
                                <View style={styles.sectionContainer}>
                                    <ThemedText style={{ color: colors.icon, fontStyle: 'italic' }}>No contact information available.</ThemedText>
                                </View>
                            )}

                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </>
    );
});

export default HealthCard;

const styles = StyleSheet.create({
    cardContainer: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
    },
    contentRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    detailsContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    name: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 4,
        textTransform: 'capitalize',
    },
    addressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    address: {
        fontSize: 13,
        textTransform: 'capitalize',
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingTop: 20,
        paddingBottom: 40,
        maxHeight: '85%',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 10,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        flex: 1,
        textTransform: 'capitalize',
    },
    closeButton: {
        padding: 4,
    },
    modalScrollContent: {
        paddingHorizontal: 24,
    },
    sectionContainer: {
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
    },
    modalAddressRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        marginBottom: 16,
    },
    modalAddressText: {
        flex: 1,
        fontSize: 15,
        lineHeight: 22,
        textTransform: 'capitalize',
    },
    navigateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        gap: 8,
    },
    navigateButtonText: {
        color: '#FFF',
        fontWeight: '600',
        fontSize: 15,
    },
    divider: {
        height: 1,
        marginBottom: 5,
        opacity: 0.5,
    },
    contactRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
    },
    contactName: {
        fontSize: 15,
        fontWeight: '500',
        marginBottom: 2,
    },
    contactNumber: {
        fontSize: 13,
    },
    callButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    infoRow: {
        flexDirection: 'row',
        gap: 10,
        alignItems: 'flex-start'
    },
    infoText: {
        flex: 1,
        fontSize: 15,
        lineHeight: 22
    }
});
