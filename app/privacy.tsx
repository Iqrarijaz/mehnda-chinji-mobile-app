import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Platform, ActivityIndicator, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown, FadeInUp, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/context/ThemeContext';
import { Layout } from '@/constants/layout';
import { Colors } from '@/constants/colors';

const privacyData = [
    {
        id: '1',
        title: 'Information We Collect',
        content: 'We collect information you directly provide to us when you register for an account or submit data:\n\n• Personal Profile Data: Your name, phone number, and email address required for account creation.\n• Manual City Selection: Your city and village name that you set manually in your profile for Azaan and weather updates. The app does NOT request, access, or use your GPS location or any automatic location tracking technology.\n• Public Directory Submissions: Information you submit regarding businesses, schools, mosques, or other public places.\n• Marketplace Submissions: Information you provide when listing items or vehicles for sale, including photos, descriptions, and contact details.' },
    {
        id: '2',
        title: 'How We Use Your Information',
        content: 'Your data is used specifically to provide and improve Rehbar\'s community services:\n• To authenticate your account and secure your data.\n• To display your submitted businesses and places in our public directory.\n• To allow interested buyers to contact you regarding your marketplace listings.\n• To send push notifications regarding account updates or relevant community alerts.' },
    {
        id: '3',
        title: 'Sharing of Information',
        content: '• Public Sharing: Any business details, community places, or marketplace listings you submit are intended for public consumption and will be visible to other app users.\n• Third Parties: We do not sell, rent, or trade your personal private data to marketing agencies or third parties. Information is only shared when legally required or to protect our platform\'s integrity.' },

    {
        id: '4',
        title: 'Analytics and Performance',
        content: 'We use Firebase Analytics to understand how users interact with our app. This helps us improve the user experience and troubleshoot technical issues. The data collected is pseudonymized and includes app interactions, screen views, and device model information. We do NOT use this data for personalized advertising or cross-app tracking.' },
    {
        id: '5',
        title: 'Data Storage & Security',
        content: 'We implement standard security measures to protect your personal information from unauthorized access or disclosure. However, no internet-based service is 100% secure, and we cannot guarantee absolute security.' },
    {
        id: '6',
        title: 'Your Rights & Choices',
        content: 'You have the right to access, edit, or delete your personal information at any time.\n• You can delete your marketplace listings at any time.\n• You can request the deletion of your entire account completely through the App Settings.' },
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

    const { theme } = useTheme();
    const colors = Colors[theme];

    return (
        <Animated.View entering={FadeInDown.delay(100 * index).duration(500)} style={[styles.accordionContainer, { backgroundColor: colors.card }]}>
            <TouchableOpacity style={styles.accordionHeader} onPress={toggleAccordion} activeOpacity={0.7}>
                <View style={styles.accordionTitleWrap}>
                    <View style={[styles.bulletPoint, { backgroundColor: colors.border }]} />
                    <ThemedText style={[styles.accordionTitle, { color: colors.textSecondary }, expanded && { color: colors.text, fontWeight: '700' }]}>{item.title}</ThemedText>
                </View>
                <Animated.View style={iconAnimatedStyle}>
                    <Ionicons name="chevron-down" size={20} color={expanded ? colors.text : colors.textSecondary} />
                </Animated.View>
            </TouchableOpacity>
            <Animated.View style={[styles.accordionContentWrap, animatedStyle]}>
                <View style={styles.accordionContentInner}>
                    <ThemedText style={[styles.bodyText, { color: colors.textSecondary }]}>{item.content}</ThemedText>
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

    const [infoModalVisible, setInfoModalVisible] = useState(false);

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
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
                contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
                showsVerticalScrollIndicator={false}
            >
                <Animated.View entering={FadeInUp.delay(300).duration(500)} style={[styles.card, { backgroundColor: colors.card }]}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="lock-closed" size={24} color={colors.primary} />
                        <ThemedText style={[styles.cardHeaderText, { color: colors.text }]}>Summary</ThemedText>
                    </View>
                    <ThemedText style={[styles.welcomeText, { color: colors.textSecondary }]}>
                        At Rehbar, protecting your personal data is a top priority. This Privacy Policy explains how we collect, use, and safeguard your information when you use our application.
                    </ThemedText>

                    <View style={[styles.divider, { backgroundColor: colors.border }]} />

                    {/* Accordion Sections */}
                    {privacyData.map((item, index) => (
                        <AccordionItem key={item.id} item={item} index={index} />
                    ))}

                </Animated.View>
            </ScrollView>

            {/* ── Info Modal ───────────────────── */}
            <Modal visible={infoModalVisible} transparent animationType="fade">
                <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
                    <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                        <View style={[styles.modalIconWrap, { backgroundColor: colors.background }]}>
                            <Ionicons name="server" size={32} color={colors.primary} />
                        </View>
                        <ThemedText style={[styles.modalTitle, { color: colors.text }]}>Why we need your data?</ThemedText>
                        <ThemedText style={[styles.modalBody, { color: colors.textSecondary }]}>
                            We collect specific data to authenticate your account and display your community listings, such as businesses, mosques, and marketplace listings. Your private data is never sold to third parties.
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
        paddingBottom: 20,
        borderBottomLeftRadius: Layout.borderRadius,
        borderBottomRightRadius: Layout.borderRadius,
        overflow: 'hidden',
        zIndex: 2 },
    headerTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16 },
    backBtn: {
        width: 42,
        height: 42,
        borderRadius: Layout.borderRadius,
        backgroundColor: 'rgba(255,255,255,0.18)',
        justifyContent: 'center',
        alignItems: 'center' },
    headerTitleWrap: {
        flex: 1,
        alignItems: 'center' },
    headerTitle: {
        fontSize: 13.5,
        fontWeight: '700',
        color: '#FFFFFF' },
    headerSubtitleWrap: {
        alignItems: 'center',
        marginTop: 12 },
    headerSubtitle: {
        fontSize: 10,
        color: '#FFFFFF',
        fontWeight: '600' },
    headerDate: {
        fontSize: 9,
        color: 'rgba(255,255,255,0.7)',
        marginTop: 4,
        fontWeight: '500' },
    infoBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'center',
        marginTop: 16,
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingHorizontal: 11,
        paddingVertical: 5,
        borderRadius: Layout.borderRadius,
        gap: 6
    },
    infoBtnText: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 10,
        fontWeight: '600'
    },

    // Scroll
    scrollView: {
        flex: 1,
        marginTop: -20,
        zIndex: 0 },
    scrollContent: {
        paddingHorizontal: 13,
        paddingTop: 36 },

    // Card Content
    card: {
        borderRadius: Layout.borderRadius,
        padding: 13 },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 16 },
    cardHeaderText: {
        fontSize: 12.5,
        fontWeight: '700',
        color: '#0F172A' },
    welcomeText: {
        fontSize: 10.5,
        lineHeight: 18,
        color: '#64748B' },
    divider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginVertical: 20 },

    // Accordion
    accordionContainer: {
        marginBottom: 16,
        backgroundColor: '#F8FAFC',
        borderRadius: Layout.borderRadius,
        overflow: 'hidden'
    },
    accordionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 13 },
    accordionTitleWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        paddingRight: 10 },
    bulletPoint: {
        width: 6,
        height: 6,
        borderRadius: Layout.borderRadius,
        backgroundColor: '#CBD5E1',
        marginRight: 10 },
    accordionTitle: {
        fontSize: 10.5,
        fontWeight: '600',
        color: '#334155',
        flex: 1 },
    accordionTitleActive: {
        color: '#0F172A',
        fontWeight: '700' },
    accordionContentWrap: {
        overflow: 'hidden' },
    accordionContentInner: {
        paddingHorizontal: 13,
        paddingBottom: 13 },
    bodyText: {
        fontSize: 10,
        lineHeight: 18,
        color: '#475569' },

    // Sticky Footer
    stickyFooter: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF',




        paddingHorizontal: 16,
        paddingTop: 13,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28 },
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16 },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: Layout.borderRadius,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12 },
    checkboxText: {
        fontSize: 10,
        fontWeight: '500',
        color: '#334155',
        flex: 1 },
    acceptButton: {
        height: 52,
        borderRadius: Layout.borderRadius,
        justifyContent: 'center',
        alignItems: 'center' },
    acceptButtonText: {
        fontSize: 10.5,
        fontWeight: '700' },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15,23,42,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20 },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: Layout.borderRadius,
        padding: 20,
        width: '100%',
        alignItems: 'center' },
    modalIconWrap: {
        width: 64,
        height: 64,
        borderRadius: Layout.borderRadius,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16 },
    modalTitle: {
        fontSize: 13.5,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 12,
        textAlign: 'center' },
    modalBody: {
        fontSize: 10,
        lineHeight: 18,
        color: '#475569',
        textAlign: 'center',
        marginBottom: 24 },
    modalBtn: {
        width: '100%',
        height: 50,
        borderRadius: Layout.borderRadius,
        justifyContent: 'center',
        alignItems: 'center' },
    modalBtnText: {
        color: '#FFFFFF',
        fontSize: 10.5,
        fontWeight: '700' }
});
