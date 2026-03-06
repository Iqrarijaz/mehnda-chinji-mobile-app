import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Platform, ActivityIndicator, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown, FadeInUp, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { ThemedText } from '@/components/themedText';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/colors';
import { acceptPrivacyPolicy } from '@/apis/profile';
import { useAuth } from '@/context/AuthContext';
import Toast from 'react-native-toast-message';

const privacyData = [
    {
        id: '1',
        title: 'Information We Collect',
        content: 'We collect information you directly provide to us when you register for an account or submit data:\n\n• Personal Profile Data: Your name, phone number, and email address required for account creation.\n• Public Directory Submissions: Information you submit regarding businesses, schools, mosques, or other public places.\n• Blood Donor Information: If you register as a blood donor, we collect your blood type, location, and contact availability.',
    },
    {
        id: '2',
        title: 'How We Use Your Information',
        content: 'Your data is used specifically to provide and improve Rehbar\'s community services:\n• To authenticate your account and secure your data.\n• To display your submitted businesses and places in our public directory.\n• To allow users in need of blood donations to contact you (only if you opted-in).\n• To send push notifications regarding account updates or relevant community alerts.',
    },
    {
        id: '3',
        title: 'Sharing of Information',
        content: '• Public Sharing: Any business details, mapped places, or blood donor profiles you submit are intended for public consumption and will be visible to other app users.\n• Third Parties: We do not sell, rent, or trade your personal private data to marketing agencies or third parties. Information is only shared when legally required or to protect our platform\'s integrity.',
    },
    {
        id: '4',
        title: 'Data Storage & Security',
        content: 'We implement standard security measures to protect your personal information from unauthorized access or disclosure. However, no internet-based service is 100% secure, and we cannot guarantee absolute security.',
    },
    {
        id: '5',
        title: 'Your Rights & Choices',
        content: 'You have the right to access, edit, or delete your personal information at any time.\n• You can opt out of the Blood Donor registry.\n• You can request the deletion of your entire account completely through the App Settings.',
    },
];

const AccordionItem = ({ item, index }: { item: any, index: number }) => {
    const [expanded, setExpanded] = useState(false);
    const heightValue = useSharedValue(0);

    const toggleAccordion = () => {
        setExpanded(!expanded);
        heightValue.value = withTiming(expanded ? 0 : 1, { duration: 300 });
    };

    const animatedStyle = useAnimatedStyle(() => {
        return {
            maxHeight: heightValue.value === 0 ? withTiming(0) : withTiming(500),
            opacity: withTiming(heightValue.value),
            marginTop: withTiming(heightValue.value > 0 ? 12 : 0)
        };
    });

    const iconAnimatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ rotate: withTiming(expanded ? '180deg' : '0deg') }]
        };
    });

    return (
        <Animated.View entering={FadeInDown.delay(100 * index).duration(500)} style={styles.accordionContainer}>
            <TouchableOpacity onPress={toggleAccordion} style={styles.accordionHeader} activeOpacity={0.7}>
                <View style={styles.accordionTitleWrap}>
                    <View style={styles.bulletPoint} />
                    <ThemedText style={[styles.accordionTitle, expanded && styles.accordionTitleActive]}>{item.title}</ThemedText>
                </View>
                <Animated.View style={iconAnimatedStyle}>
                    <Ionicons name="chevron-down" size={20} color={expanded ? '#0F172A' : '#94A3B8'} />
                </Animated.View>
            </TouchableOpacity>
            <Animated.View style={[styles.accordionContentWrap, animatedStyle]}>
                <View style={styles.accordionContentInner}>
                    <ThemedText style={styles.bodyText}>{item.content}</ThemedText>
                </View>
            </Animated.View>
        </Animated.View>
    );
};

export default function PrivacyPolicyScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { theme } = useTheme();
    const colors = Colors[theme];
    const { updateUser } = useAuth();

    const [accepted, setAccepted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [infoModalVisible, setInfoModalVisible] = useState(false);

    const checkScale = useSharedValue(1);

    const toggleAccept = () => {
        setAccepted(!accepted);
        checkScale.value = withSpring(accepted ? 1 : 1.2, {}, () => {
            checkScale.value = withSpring(1);
        });
    };

    const animatedCheckStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: checkScale.value }],
            backgroundColor: withTiming(accepted ? colors.primary : '#FFFFFF', { duration: 200 }),
            borderColor: withTiming(accepted ? colors.primary : '#CBD5E1', { duration: 200 })
        };
    });

    const handleAcceptPrivacy = async () => {
        if (!accepted) return;
        setSubmitting(true);
        try {
            const version = "1.0";
            const response = await acceptPrivacyPolicy({ version });
            if (response.data?.success) {
                // Update local context
                await updateUser({
                    privacyPolicyAccepted: true,
                    privacyPolicyVersionAccepted: version,
                    privacyPolicyAcceptedAt: new Date().toISOString()
                });

                Toast.show({
                    type: 'success',
                    text1: 'Accepted',
                    text2: 'Privacy Policy accepted successfully.',
                });

                setTimeout(() => {
                    if (router.canGoBack()) {
                        router.back();
                    } else {
                        router.replace('/settings');
                    }
                }, 500);
            }
        } catch (error: any) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error.response?.data?.message || 'Failed to accept Privacy Policy. Please try again.',
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: '#F8FAFC' }]}>
            {/* ── Modern Header ──────────────────────────────────────── */}
            <Animated.View entering={FadeInUp.duration(600)} style={[styles.headerWrap, { backgroundColor: colors.primary }]}>
                <View style={[styles.headerTopRow, { paddingTop: insets.top + 8 }]}>
                    <TouchableOpacity
                        onPress={() => {
                            if (router.canGoBack()) router.back();
                            else router.replace('/settings');
                        }}
                        style={styles.backBtn}
                    >
                        <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Animated.View entering={FadeIn.delay(200).duration(500)} style={styles.headerTitleWrap}>
                        <ThemedText style={styles.headerTitle}>Privacy Policy</ThemedText>
                    </Animated.View>
                    <View style={{ width: 42 }} />
                </View>
                <Animated.View entering={FadeIn.delay(400).duration(500)} style={styles.headerSubtitleWrap}>
                    <ThemedText style={styles.headerSubtitle}>How we collect, use, and protect your data</ThemedText>
                    <ThemedText style={styles.headerDate}>Last Updated: Feb 2026</ThemedText>
                </Animated.View>

                {/* Info button */}
                <TouchableOpacity onPress={() => setInfoModalVisible(true)} style={styles.infoBtn}>
                    <Ionicons name="shield-checkmark-outline" size={16} color="rgba(255,255,255,0.9)" />
                    <ThemedText style={styles.infoBtnText}>Why we need your data?</ThemedText>
                </TouchableOpacity>
            </Animated.View>

            {/* ── Scrollable Content ──────────────────────────────── */}
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 140 }]} // extra padding for sticky footer
                showsVerticalScrollIndicator={false}
            >
                <Animated.View entering={FadeInUp.delay(300).duration(500)} style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="lock-closed" size={24} color={colors.primary} />
                        <ThemedText style={styles.cardHeaderText}>Summary</ThemedText>
                    </View>
                    <ThemedText style={styles.welcomeText}>
                        At Rehbar, protecting your personal data is a top priority. This Privacy Policy explains how we collect, use, and safeguard your information when you use our application.
                    </ThemedText>

                    <View style={styles.divider} />

                    {/* Accordion Sections */}
                    {privacyData.map((item, index) => (
                        <AccordionItem key={item.id} item={item} index={index} />
                    ))}

                </Animated.View>
            </ScrollView>

            {/* ── Sticky Checkbox & Accept Footer ───────────────────── */}
            <Animated.View entering={FadeInDown.delay(700).duration(500)} style={[styles.stickyFooter, { paddingBottom: insets.bottom > 0 ? insets.bottom : 20 }]}>
                <TouchableOpacity style={styles.checkboxRow} onPress={toggleAccept} activeOpacity={0.8}>
                    <Animated.View style={[styles.checkbox, animatedCheckStyle]}>
                        {accepted && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
                    </Animated.View>
                    <ThemedText style={styles.checkboxText}>
                        I have read and agree to the Privacy Policy
                    </ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.acceptButton, { backgroundColor: accepted ? colors.primary : '#E2E8F0' }]}
                    disabled={!accepted || submitting}
                    onPress={handleAcceptPrivacy}
                    activeOpacity={0.8}
                >
                    {submitting ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                        <ThemedText style={[styles.acceptButtonText, { color: accepted ? '#FFFFFF' : '#94A3B8' }]}>
                            Agree & Continue
                        </ThemedText>
                    )}
                </TouchableOpacity>
            </Animated.View>

            {/* ── Info Modal ───────────────────── */}
            <Modal visible={infoModalVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalIconWrap}>
                            <Ionicons name="server" size={32} color={colors.primary} />
                        </View>
                        <ThemedText style={styles.modalTitle}>Why we need your data?</ThemedText>
                        <ThemedText style={styles.modalBody}>
                            We collect specific data to authenticate your account and accurately display your businesses, mosques, and blood donor listings to the community. Your private data is never sold to third parties.
                        </ThemedText>
                        <TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.primary }]} onPress={() => setInfoModalVisible(false)}>
                            <ThemedText style={styles.modalBtnText}>Got it!</ThemedText>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },

    // Header 
    headerWrap: {
        paddingBottom: 24,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        overflow: 'hidden',
        zIndex: 2,
    },
    headerTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    backBtn: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: 'rgba(255,255,255,0.18)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitleWrap: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: Platform.OS === 'android' ? 19 : 21,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    headerSubtitleWrap: {
        alignItems: 'center',
        marginTop: 12,
    },
    headerSubtitle: {
        fontSize: 15,
        color: '#FFFFFF',
        fontWeight: '600',
    },
    headerDate: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.7)',
        marginTop: 4,
        fontWeight: '500',
    },
    infoBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'center',
        marginTop: 16,
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6
    },
    infoBtnText: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 12,
        fontWeight: '600'
    },

    // Scroll
    scrollView: {
        flex: 1,
        marginTop: -20,
        zIndex: 0,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 40,
    },

    // Card Content
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.04,
        shadowRadius: 16,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 16,
    },
    cardHeaderText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0F172A',
    },
    welcomeText: {
        fontSize: 15,
        lineHeight: 24,
        color: '#64748B',
    },
    divider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginVertical: 20,
    },

    // Accordion
    accordionContainer: {
        marginBottom: 16,
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#F1F5F9'
    },
    accordionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
    },
    accordionTitleWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        paddingRight: 12,
    },
    bulletPoint: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#CBD5E1',
        marginRight: 10,
    },
    accordionTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#334155',
        flex: 1,
    },
    accordionTitleActive: {
        color: '#0F172A',
        fontWeight: '700',
    },
    accordionContentWrap: {
        overflow: 'hidden',
    },
    accordionContentInner: {
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    bodyText: {
        fontSize: 14,
        lineHeight: 22,
        color: '#475569',
    },

    // Sticky Footer
    stickyFooter: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 10,
        paddingHorizontal: 20,
        paddingTop: 16,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
    },
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    checkboxText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#334155',
        flex: 1,
    },
    acceptButton: {
        height: 52,
        borderRadius: 26,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    acceptButtonText: {
        fontSize: 16,
        fontWeight: '700',
    },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15,23,42,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 24,
        width: '100%',
        alignItems: 'center',
    },
    modalIconWrap: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 12,
        textAlign: 'center',
    },
    modalBody: {
        fontSize: 15,
        lineHeight: 24,
        color: '#475569',
        textAlign: 'center',
        marginBottom: 24,
    },
    modalBtn: {
        width: '100%',
        height: 50,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalBtnText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    }
});
