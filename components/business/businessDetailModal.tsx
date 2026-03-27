import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useCallback, useRef } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Linking,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
    Share,
} from 'react-native';

import { ThemedText } from '../themedText';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/colors';
import { ReportModal, ReportModalRef } from '../common/ReportModal';

const { height } = Dimensions.get('window');

export interface BusinessDetailModalProps {
    visible: boolean;
    onClose: () => void;
    business: any;
    businessName: string;
    ownerName: string;
    ownerImage?: string;
    address: string;
    category: string;
    urduCategory?: string;
}

const BusinessDetailModal: React.FC<BusinessDetailModalProps> = ({
    visible,
    onClose,
    business,
    businessName,
    ownerName,
    ownerImage, // unused in this design but passed typically
    address,
    category,
    urduCategory,
}) => {
    const { theme, isDark } = useTheme();
    const colors = Colors[theme];
    const reportModalRef = useRef<ReportModalRef>(null);

    const primaryColor = colors.primary;
    const softBorder = primaryColor + '20';

    const handleCall = useCallback(() => {
        if (business?.phone) {
            Linking.openURL(`tel:${business.phone}`);
        } else {
            Alert.alert('No Phone', 'Phone number not available.');
        }
    }, [business?.phone]);

    const handleShare = useCallback(async () => {
        try {
            const result = await Share.share({
                message: `Check out ${businessName} (${category}) on Rehbar! \nLocation: ${address}`,
                title: businessName,
            });
            // Handle share success if needed
        } catch (error: any) {
            Alert.alert(error.message);
        }
    }, [businessName, category, address]);

    // Use the first photo as the header image if available
    const headerImage = business?.photos && business.photos.length > 0 ? business.photos[0] : null;

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: isDark ? '#0F172A' : '#FFFFFF', borderColor: isDark ? 'rgba(255,255,255,0.1)' : softBorder, borderWidth: 1 }]}>
                    {business ? (
                        <>
                            {/* Header Image with Gradient Overlays */}
                            <View style={styles.headerImageContainer}>
                                {headerImage ? (
                                    <Image
                                        source={{ uri: headerImage }}
                                        style={styles.headerImage}
                                        contentFit="cover"
                                        transition={300}
                                    />
                                ) : (
                                    <View style={[styles.placeholderContainer, { backgroundColor: primaryColor + '10' }]}>
                                        <Ionicons name="business" size={48} color={primaryColor} style={{ opacity: 0.5 }} />
                                    </View>
                                )}

                                {/* Top Gradient for readability of controls */}
                                <View style={[styles.gradientOverlay, { top: 0, height: '30%', backgroundColor: 'rgba(0,0,0,0.3)' }]} />
                                
                                {/* Bottom Gradient for title block */}
                                <View style={styles.gradientOverlay} />

                                {/* Top Controls */}
                                <View style={styles.topControls}>
                                    <TouchableOpacity 
                                        style={styles.controlBtn} 
                                        onPress={handleShare}
                                        activeOpacity={0.8}
                                    >
                                        <Ionicons name="share-social" size={20} color="#FFFFFF" />
                                    </TouchableOpacity>
                                    <View style={{ flexDirection: 'row', gap: 8 }}>
                                        <TouchableOpacity 
                                            style={styles.controlBtn} 
                                            onPress={() => reportModalRef.current?.present()}
                                            activeOpacity={0.8}
                                        >
                                            <Ionicons name="flag" size={18} color="#EF4444" />
                                        </TouchableOpacity>
                                        <TouchableOpacity 
                                            style={styles.controlBtn} 
                                            onPress={onClose}
                                            activeOpacity={0.8}
                                        >
                                            <Ionicons name="close" size={22} color="#FFFFFF" />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                {/* Title Block positioned over the image */}
                                <View style={styles.titleOverlay}>
                                    <View style={[styles.categoryBadge, { backgroundColor: primaryColor }]}>
                                        <ThemedText style={styles.categoryText}>
                                            {category}{urduCategory ? ` • ${urduCategory}` : ''}
                                        </ThemedText>
                                    </View>
                                    <ThemedText style={styles.heroName} numberOfLines={2}>
                                        {businessName}
                                    </ThemedText>
                                </View>
                            </View>

                            {/* Scrollable Details */}
                            <ScrollView 
                                contentContainerStyle={styles.scrollContent}
                                showsVerticalScrollIndicator={false}
                                bounces={false}
                            >
                                {/* Location & Basic Info Section */}
                                <View style={[styles.cardSection, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC', borderColor: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9' }]}>
                                    <View style={styles.sectionHeaderRow}>
                                        <Ionicons name="location" size={18} color={primaryColor} />
                                        <ThemedText style={[styles.sectionTitle, { color: isDark ? '#F8FAFC' : '#0F172A' }]}>Location</ThemedText>
                                    </View>
                                    <ThemedText style={[styles.descText, { color: isDark ? '#94A3B8' : '#475569', marginBottom: 0 }]}>
                                        {address}
                                    </ThemedText>
                                </View>

                                {/* About Section */}
                                {business.description && (
                                    <View style={[styles.cardSection, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC', borderColor: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9' }]}>
                                        <View style={styles.sectionHeaderRow}>
                                            <Ionicons name="information-circle" size={18} color={primaryColor} />
                                            <ThemedText style={[styles.sectionTitle, { color: isDark ? '#F8FAFC' : '#0F172A' }]}>About</ThemedText>
                                        </View>
                                        <ThemedText style={[styles.descText, { color: isDark ? '#94A3B8' : '#475569', marginBottom: 0 }]}>
                                            {business.description}
                                        </ThemedText>
                                    </View>
                                )}

                                {/* Photos Grid if any */}
                                {business?.photos?.length > 1 && (
                                     <View style={[styles.cardSection, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC', borderColor: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9' }]}>
                                         <View style={styles.sectionHeaderRow}>
                                             <Ionicons name="images" size={18} color={primaryColor} />
                                             <ThemedText style={[styles.sectionTitle, { color: isDark ? '#F8FAFC' : '#0F172A' }]}>More Photos</ThemedText>
                                         </View>
                                         <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                                            {business.photos.slice(1).map((photo: string, idx: number) => (
                                                <Image key={idx} source={{ uri: photo }} style={{ width: 100, height: 100, borderRadius: 12 }} />
                                            ))}
                                         </ScrollView>
                                     </View>
                                )}

                                {/* Contact Directory */}
                                <View style={[styles.cardSection, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC', borderColor: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9' }]}>
                                    <View style={styles.sectionHeaderRow}>
                                        <Ionicons name="call" size={18} color={primaryColor} />
                                        <ThemedText style={[styles.sectionTitle, { color: isDark ? '#F8FAFC' : '#0F172A' }]}>Contact Directory</ThemedText>
                                    </View>

                                    {/* Owner Row */}
                                    <View style={[styles.contactRow, { borderBottomWidth: 0 }]}>
                                        <View style={styles.contactInfo}>
                                            <ThemedText style={[styles.contactName, { color: isDark ? '#F8FAFC' : '#1E293B' }]}>
                                                {ownerName || 'Owner'}
                                            </ThemedText>
                                        </View>
                                        {business.phone ? (
                                            <TouchableOpacity 
                                                style={[styles.callIconBtn, { backgroundColor: primaryColor + '15' }]} 
                                                onPress={handleCall}
                                                activeOpacity={0.7}
                                            >
                                                <Ionicons name="call" size={18} color={primaryColor} />
                                            </TouchableOpacity>
                                        ) : (
                                            <ThemedText style={{ color: colors.icon, fontSize: 13, fontStyle: 'italic' }}>
                                                No Phone
                                            </ThemedText>
                                        )}
                                    </View>
                                </View>
                                
                                {/* Bottom Spacer */}
                                <View style={{ height: 8 }} />
                            </ScrollView>
                        </>
                    ) : (
                        <View style={styles.loaderContainer}>
                            <ActivityIndicator size="large" color={primaryColor} />
                        </View>
                    )}
                </View>
            </View>

            {business?._id && (
                <ReportModal
                    ref={reportModalRef}
                    targetId={business._id}
                    targetType="BUSINESS" 
                />
            )}
        </Modal>
    );
};

export default BusinessDetailModal;

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '90%',
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
    callIconBtn: {
        width: 38,
        height: 38,
        borderRadius: 19,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loaderContainer: {
        height: 200,
        justifyContent: 'center',
        alignItems: 'center',
    }
});