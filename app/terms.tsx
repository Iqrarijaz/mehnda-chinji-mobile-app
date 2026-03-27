import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Platform, ActivityIndicator, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown, FadeInUp, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { ThemedText } from '@/components/themedText';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/colors';

const termsData = [
    {
        id: '1',
        title: 'Acceptance of Terms',
        content: 'By accessing or using the Rehbar app, you agree to these Terms. If you do not agree with any part of these terms, you may not use our services. These terms form a legally binding agreement between you and Rehbar.',
    },
    {
        id: '2',
        title: 'User Accounts and Responsibilities',
        content: '• Account Registration: To use certain features of the app (such as registering a business, signing up as a blood donor, or submitting places), you must create an account. You agree to provide accurate, current, and complete information during registration.\n• Account Security: You are responsible for safeguarding your login credentials. You must notify us immediately of any unauthorized use of your account.',
    },
    {
        id: '3',
        title: 'App Features and User Submissions',
        content: 'Users are permitted to submit information regarding businesses, schools, mosques, hospitals, and other community categories to be added to the app directory. All user submissions are subject to review and approval by Rehbar Administrators.',
    },

    {
        id: '4',
        title: 'Blood Donor Registry',
        content: '• Role of Rehbar: The Rehbar Blood Donor feature is strictly a communication platform to connect potential blood donors with those in need. Rehbar is not a medical organization, hospital, or blood bank.\n• No Liability: Rehbar and its developers assume zero liability for any injury, illness, or complications resulting from blood donations coordinated through this app.',
    },
    {
        id: '5',
        title: 'Prohibited Conduct',
        content: 'When submitting businesses, places, or registering as a donor, you agree NOT to:\n• Provide false, misleading, or fraudulent information.\n• Submit content that is illegal, offensive, harassing, or discriminatory.\n• Attempt to manipulate, spam, or overload the application\'s forms.',
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
            maxHeight: heightValue.value === 0 ? withTiming(0) : withTiming(400),
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

export default function TermsAndConditionsScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { theme } = useTheme();
    const colors = Colors[theme];

    const [infoModalVisible, setInfoModalVisible] = useState(false);

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
                        <ThemedText style={styles.headerTitle}>Terms & Conditions</ThemedText>
                    </Animated.View>
                    <View style={{ width: 42 }} />
                </View>
                <Animated.View entering={FadeIn.delay(400).duration(500)} style={styles.headerSubtitleWrap}>
                    <ThemedText style={styles.headerSubtitle}>Please review and accept to continue</ThemedText>
                    <ThemedText style={styles.headerDate}>Last Updated: Feb 2026</ThemedText>
                </Animated.View>

                {/* Info button */}
                <TouchableOpacity onPress={() => setInfoModalVisible(true)} style={styles.infoBtn}>
                    <Ionicons name="information-circle-outline" size={16} color="rgba(255,255,255,0.8)" />
                    <ThemedText style={styles.infoBtnText}>Why do we need this?</ThemedText>
                </TouchableOpacity>
            </Animated.View>

            {/* ── Scrollable Content ──────────────────────────────── */}
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
                showsVerticalScrollIndicator={false}
            >
                <Animated.View entering={FadeInUp.delay(300).duration(500)} style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="document-text" size={24} color={colors.primary} />
                        <ThemedText style={styles.cardHeaderText}>Summary</ThemedText>
                    </View>
                    <ThemedText style={styles.welcomeText}>
                        Welcome to Rehbar! These community guidelines and terms are established to keep the platform safe and trustworthy for everyone.
                    </ThemedText>

                    <View style={styles.divider} />

                    {/* Accordion Sections */}
                    {termsData.map((item, index) => (
                        <AccordionItem key={item.id} item={item} index={index} />
                    ))}

                </Animated.View>
            </ScrollView>

            {/* ── Info Modal ───────────────────── */}
            <Modal visible={infoModalVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalIconWrap}>
                            <Ionicons name="shield-checkmark" size={32} color={colors.primary} />
                        </View>
                        <ThemedText style={styles.modalTitle}>Why do we need this?</ThemedText>
                            To maintain a safe and reliable community platform, we require all users to agree to our guidelines. This ensures that submitted listings, businesses, and blood requests are genuine and appropriate for everyone.

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
