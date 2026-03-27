import React, { useRef } from 'react';
import {
    Modal,
    View,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Platform,
    Linking,
    Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { ThemedText } from '@/components/themedText';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { ReportModal, ReportModalRef } from '../common/ReportModal';

const { height } = Dimensions.get('window');

interface PlacesDetailsModalProps {
    visible: boolean;
    onClose: () => void;
    data: any;
    color?: string;
    category?: string;
}

const PlacesDetailsModal: React.FC<PlacesDetailsModalProps> = ({
    visible,
    onClose,
    data,
    color = '#3B82F6',
    category
}) => {
    const { theme } = useTheme();
    const colors = Colors[theme];
    const reportModalRef = useRef<ReportModalRef>(null);

    if (!data) return null;

    const capitalize = (str?: string) => {
        if (!str) return '';
        const words = str.toLowerCase().split(' ');
        return words.map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    const getString = (val: string | { en: string; ur?: string } | undefined) => {
        if (!val) return '';
        if (typeof val === 'string') return val;
        return val.en;
    };

    const name = capitalize(data.name);
    const address = capitalize(data.address || data.village || '');
    const contacts = data.contact || (data.phone ? [{ name: 'Primary', number: data.phone }] : []);
    const description = getString(data.description);
    const images = data.images || [];
    const bannerImage = images[0];
    const coordinates = data.location?.coordinates;

    const handleCall = (phoneNumber: string) => {
        if (phoneNumber) Linking.openURL(`tel:${phoneNumber}`);
    };

    const handleNavigate = () => {
        if (coordinates) {
            const [lng, lat] = coordinates;
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
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: colors.background }]}>

                    {/* Header Image Area */}
                    <View style={[styles.headerImageContainer, { backgroundColor: color + '20' }]}>
                        {bannerImage ? (
                            <Image
                                source={{ uri: bannerImage }}
                                style={styles.headerImage}
                                contentFit="cover"
                            />
                        ) : (
                            <View style={styles.placeholderContainer}>
                                <Ionicons name="business" size={64} color={color} style={{ opacity: 0.5 }} />
                            </View>
                        )}

                        <View style={styles.gradientOverlay} />

                        {/* Top Controls */}
                        <View style={styles.topControls}>
                            <TouchableOpacity onPress={() => reportModalRef.current?.present()} style={styles.controlBtn}>
                                <Ionicons name="flag" size={20} color="#FFFFFF" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={onClose} style={styles.controlBtn}>
                                <Ionicons name="close" size={24} color="#FFFFFF" />
                            </TouchableOpacity>
                        </View>

                        {/* Title overlay */}
                        <View style={styles.titleOverlay}>
                            {/* {category && (
                               <View style={[styles.categoryBadge, { backgroundColor: color }]}>
                                   <ThemedText style={styles.categoryText}>{category}</ThemedText>
                               </View>
                           )} */}
                            <ThemedText style={styles.heroName} numberOfLines={2}>{name}</ThemedText>
                        </View>
                    </View>

                    {/* Scrollable Content */}
                    <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>

                        {/* Address & Navigation */}
                        <View style={[styles.cardSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <View style={styles.sectionHeaderRow}>
                                <Ionicons name="location" size={20} color={color} />
                                <ThemedText style={styles.sectionTitle}>Location</ThemedText>
                            </View>
                            <ThemedText style={[styles.descText, { color: colors.text }]}>{address}</ThemedText>

                            <TouchableOpacity style={[styles.actionButton, { backgroundColor: color }]} onPress={handleNavigate}>
                                <Ionicons name="navigate" size={18} color="#FFFFFF" />
                                <ThemedText style={styles.actionButtonText}>Get Directions</ThemedText>
                            </TouchableOpacity>
                        </View>

                        {/* About */}
                        {!!description && (
                            <View style={[styles.cardSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                <View style={styles.sectionHeaderRow}>
                                    <Ionicons name="information-circle" size={20} color={color} />
                                    <ThemedText style={styles.sectionTitle}>About</ThemedText>
                                </View>
                                <ThemedText style={[styles.descText, { color: colors.textSecondary }]}>{description}</ThemedText>
                            </View>
                        )}

                        {/* Contacts */}
                        {contacts.length > 0 && (
                            <View style={[styles.cardSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                <View style={styles.sectionHeaderRow}>
                                    <Ionicons name="call" size={20} color={color} />
                                    <ThemedText style={styles.sectionTitle}>Contact Directory</ThemedText>
                                </View>

                                {contacts.map((contact: any, index: number) => (
                                    <View key={index} style={[styles.contactRow, index !== contacts.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
                                        <View style={styles.contactInfo}>
                                            <ThemedText style={[styles.contactName, { color: colors.text }]}>{capitalize(contact.name || 'Contact')}</ThemedText>
                                            <ThemedText style={[styles.contactNumber, { color: colors.textSecondary }]}>{contact.number}</ThemedText>
                                        </View>
                                        <TouchableOpacity
                                            style={[styles.callIconBtn, { backgroundColor: color + '15' }]}
                                            onPress={() => handleCall(contact.number)}
                                        >
                                            <Ionicons name="call" size={20} color={color} />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* Spacer for bottom */}
                        <View style={{ height: 8 }} />
                    </ScrollView>
                </View>
            </View>

            <ReportModal
                ref={reportModalRef}
                targetId={data._id}
                targetType="PLACE"
            />
        </Modal>
    );
};

export default PlacesDetailsModal;

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '95%',
        maxHeight: height * 0.85,
        borderRadius: 24,
        overflow: 'hidden',
    },
    headerImageContainer: {
        width: '100%',
        height: 180,
        position: 'relative',
    },
    headerImage: {
        width: '100%',
        height: '100%',
    },
    placeholderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    gradientOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '50%',
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    topControls: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 16 : 12,
        left: 12,
        right: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 10,
    },
    controlBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    titleOverlay: {
        position: 'absolute',
        bottom: 16,
        left: 16,
        right: 16,
    },
    categoryBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
        marginBottom: 6,
    },
    categoryText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    heroName: {
        fontSize: 24,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    scrollContent: {
        padding: 16,
        gap: 12,
    },
    cardSection: {
        padding: 14,
        borderRadius: 16,
        borderWidth: 1,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 8,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
    },
    descText: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 12,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        gap: 6,
    },
    actionButtonText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 14,
    },
    contactRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
    },
    contactInfo: {
        flex: 1,
    },
    contactName: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 2,
    },
    contactNumber: {
        fontSize: 13,
        fontWeight: '500',
    },
    callIconBtn: {
        width: 38,
        height: 38,
        borderRadius: 19,
        justifyContent: 'center',
        alignItems: 'center',
    }
});
