import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Platform, ActivityIndicator, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown, FadeInUp, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { ThemedText } from '@/components/themedText';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/colors';
import { acceptCommunityGuidelines } from '@/apis/profile';
import { useAuth } from '@/context/AuthContext';
import Toast from 'react-native-toast-message';

const guidelinesData = [
    {
        id: '1',
        title: 'Respectful Communication',
        content: 'We expect all users to communicate respectfully. Harassment, bullying, or hate speech directed at any individual or group will not be tolerated and may result in permanent account suspension.',
    },
    {
        id: '2',
        title: 'Authentic Representation',
        content: 'When registering a business or community place, provide accurate and truthful information. Impersonating individuals, businesses, or official organizations is strictly prohibited.',
    },
    {
        id: '3',
        title: 'Safety and Integrity',
        content: 'Do not use the platform to coordinate illegal activities, share harmful content, or engage in fraudulent schemes. Our community thrives on trust and safety.',
    },
    {
        id: '4',
        title: 'Blood Donation Ethics',
        content: 'The blood donor feature is a selfless community service. Do not solicit payment, trade, or any form of compensation for blood donations. Users found engaging in such practices will be banned immediately.',
    },
    {
        id: '5',
        title: 'Content Moderation',
        content: 'All submissions are reviewed by administrators. We reserve the right to remove any content that violates these guidelines or is deemed inappropriate for the community without prior notice.',
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

export default function CommunityGuidelinesScreen() {
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

    const handleAcceptGuidelines = async () => {
        if (!accepted) return;
        setSubmitting(true);
        try {
            const version = "1.0";
            const response = await acceptCommunityGuidelines({ version });
            if (response.data?.success) {
                // Update local context
                await updateUser({
                    guidelinesAccepted: true,
                    guidelinesVersionAccepted: version,
                    guidelinesAcceptedAt: new Date().toISOString()
                });

                Toast.show({
                    type: 'success',
                    text1: 'Accepted',
                    text2: 'Community Guidelines accepted successfully.',
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
                text2: error.response?.data?.message || 'Failed to accept Community Guidelines. Please try again.',
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: '#F8FAFC' }]}>
            {/* ── Header ──────────────────────────────────────── */}
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
                        <ThemedText style={styles.headerTitle}>Community Guidelines</ThemedText>
                    </Animated.View>
                    <View style={{ width: 42 }} />
                </View>
                <Animated.View entering={FadeIn.delay(400).duration(500)} style={styles.headerSubtitleWrap}>
                    <ThemedText style={styles.headerSubtitle}>Rules for a safe and respectful community</ThemedText>
                    <ThemedText style={styles.headerDate}>Last Updated: March 2026</ThemedText>
                </Animated.View>

                {/* Info button */}
                <TouchableOpacity onPress={() => setInfoModalVisible(true)} style={styles.infoBtn}>
                    <Ionicons name="people-outline" size={16} color="rgba(255,255,255,0.9)" />
                    <ThemedText style={styles.infoBtnText}>Why these rules?</ThemedText>
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
                        <Ionicons name="shield-checkmark" size={24} color={colors.primary} />
                        <ThemedText style={styles.cardHeaderText}>Our Code of Conduct</ThemedText>
                    </View>
                    <ThemedText style={styles.welcomeText}>
                        Rehbar is a platform built on mutual respect and helpfulness. By following these guidelines, you help us maintain a safe environment for everyone.
                    </ThemedText>

                    <View style={styles.divider} />

                    {/* Accordion Sections */}
                    {guidelinesData.map((item, index) => (
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
                        I agree to follow the Community Guidelines
                    </ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.acceptButton, { backgroundColor: accepted ? colors.primary : '#E2E8F0' }]}
                    disabled={!accepted || submitting}
                    onPress={handleAcceptGuidelines}
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
                            <Ionicons name="heart" size={32} color={colors.primary} />
                        </View>
                        <ThemedText style={styles.modalTitle}>Community Trust</ThemedText>
                        <ThemedText style={styles.modalBody}>
                            These guidelines ensure that every interaction—whether listing a business or requesting blood—is safe, ethical, and helpful for the entire Mehnda Chinji community.
                        </ThemedText>
                        <TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.primary }]} onPress={() => setInfoModalVisible(false)}>
                            <ThemedText style={styles.modalBtnText}>I Understand</ThemedText>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
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
    scrollView: {
        flex: 1,
        marginTop: -20,
        zIndex: 0,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 40,
    },
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
