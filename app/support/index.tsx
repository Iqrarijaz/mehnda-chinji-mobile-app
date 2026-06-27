import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    Platform,
    StatusBar,
    RefreshControl
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
    FadeIn,
    FadeInUp,
    FadeInDown
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/context/ThemeContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createSupportTicket } from '@/apis/support';

// New Modular Components
import FAQAccordion from '@/components/support/FAQAccordion';
import SupportContactCard from '@/components/support/SupportContactCard';
import FeedbackForm from '@/components/support/FeedbackForm';

const FAQ_DATA = [
    {
        question: "How do I register my business?",
        answer: "Go to the Business tab and click on 'Register Business'. Fill in your details and submit for approval. Our team usually reviews applications within 24-48 hours."
    },
    {
        question: "How can I find blood donors?",
        answer: "Use the 'Blood' module on the home screen. You can filter by blood group and location to find compatible donors near you instantly."
    },
    {
        question: "What is the 'Remember Me' feature?",
        answer: "It safely encrypts your credentials locally on your device, allowing you to bypass the login screen for 30 days for a faster experience."
    },
    {
        question: "How do I update my profile?",
        answer: "Open the side drawer, tap on 'Profile', and select 'Edit Profile'. You can change your name, profession, and upload a new profile picture."
    },
    {
        question: "Is my data secure?",
        answer: "Yes, we use industry-standard encryption for all personal data and secure JWT tokens for session management. Your privacy is our priority."
    }
];

export default function SupportScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { theme } = useTheme();
    const colors = Colors[theme];
    const queryClient = useQueryClient();
    const [refreshing, setRefreshing] = useState(false);

    const createTicketMutation = useMutation({
        mutationFn: async ({ subject, description }: { subject: string; description: string }) => {
            const formData = new FormData();
            formData.append('subject', subject);
            formData.append('description', description);
            return await createSupportTicket(formData);
        },
        onSuccess: () => {
            Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'Feedback submitted successfully!'
            });
            queryClient.invalidateQueries({ queryKey: ['support_tickets'] });
        },
        onError: (error: any) => {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error.message || 'Failed to submit feedback'
            });
        }
    });

    const handleBack = () => {
        router.canGoBack() ? router.back() : router.replace('/(drawer)/(tabs)' as any);
    };

    const handleRefresh = () => {
        setRefreshing(true);
        setTimeout(() => setRefreshing(false), 1000);
    };

    const handleFeedbackSubmit = async (subject: string, description: string) => {
        createTicketMutation.mutate({ subject, description });
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar barStyle="light-content" />

            {/* ── Header ──────────────────────────────────────────── */}
            <Animated.View
                entering={FadeInUp.duration(600)}
                style={[styles.headerWrap, { backgroundColor: colors.primary }]}
            >
                <View style={[styles.headerTopRow, { paddingTop: insets.top + 8 }]}>
                    <TouchableOpacity
                        onPress={handleBack}
                        style={styles.backBtn}
                    >
                        <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
                    </TouchableOpacity>
                    <View style={styles.headerTitleWrap}>
                        <ThemedText style={styles.headerTitle}>Support & FAQ</ThemedText>
                    </View>
                    <TouchableOpacity
                        style={styles.historyBtn}
                        onPress={() => router.push('/support/tickets')}
                    >
                        <Ionicons name="time-outline" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>
                <Animated.View entering={FadeIn.delay(400).duration(500)} style={styles.headerSubtitleWrap}>
                    <ThemedText style={styles.headerSubtitle}>Get help or find answers quickly</ThemedText>
                </Animated.View>
            </Animated.View>

            {/* ── Content ─────────────────────────────────────────── */}
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={[
                    styles.scrollContent,
                    { paddingBottom: insets.bottom + 40 }
                ]}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor={colors.primary}
                    />
                }
            >
                {/* Tickets Quick Actions */}
                <View style={styles.actionsGrid}>
                    <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.actionItem}>
                        <TouchableOpacity
                            style={styles.actionCard}
                            onPress={() => router.push('/support/create-ticket')}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: `${colors.primary}15` }]}>
                                <Ionicons name="add-circle" size={28} color={colors.primary} />
                            </View>
                            <ThemedText style={styles.actionText}>New Ticket</ThemedText>
                        </TouchableOpacity>
                    </Animated.View>

                    <Animated.View entering={FadeInDown.delay(300).duration(500)} style={styles.actionItem}>
                        <TouchableOpacity
                            style={styles.actionCard}
                            onPress={() => router.push('/support/tickets')}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: `${colors.primary}10` }]}>
                                <Ionicons name="list" size={28} color={colors.primary} />
                            </View>
                            <ThemedText style={styles.actionText}>My Tickets</ThemedText>
                        </TouchableOpacity>
                    </Animated.View>
                </View>

                {/* Contact Section */}
                <Animated.View entering={FadeInDown.delay(400).duration(500)}>
                    <Text style={styles.sectionTitle}>Contact Support</Text>
                    <SupportContactCard
                        type="whatsapp"
                        title="WhatsApp Chat"
                        subtitle="Instant support via chat"
                        value="03431511788"
                        icon="logo-whatsapp"
                        color="#25D366"
                        hideValue={true}
                    />
                    <SupportContactCard
                        type="email"
                        title="Email Support"
                        subtitle="Detailed queries & feedback"
                        value="rehbarmobileapp@gmail.com"
                        icon="mail-outline"
                        color="#6366F1"
                    />
                </Animated.View>

                {/* FAQ Section */}
                <FAQAccordion data={FAQ_DATA} />

                {/* Feedback Form */}
                <FeedbackForm
                    onSubmit={handleFeedbackSubmit}
                    isSubmitting={createTicketMutation.isPending}
                />

                <Text style={styles.footerNote}>
                    Our support team is available Monday to Friday, 9AM - 6PM. Responses may take up to 24 hours.
                </Text>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerWrap: {
        paddingBottom: 24,
        borderBottomLeftRadius: Layout.headerBorderRadius,
        borderBottomRightRadius: Layout.headerBorderRadius,
        overflow: 'hidden',
        zIndex: 2,
    },
    headerTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitleWrap: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    historyBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerSubtitleWrap: {
        alignItems: 'center',
        marginTop: 10,
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.85)',
        fontWeight: '500',
    },
    scrollView: {
        flex: 1,
        marginTop: -30,
        zIndex: 0,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 46,
    },
    actionsGrid: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 24,
    },
    actionItem: {
        flex: 1,
    },
    actionCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: Layout.borderRadius,
        padding: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
    },
    actionIcon: {
        width: 56,
        height: 56,
        borderRadius: Layout.borderRadius,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    actionText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1E293B',
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#64748B',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 16,
        marginLeft: 4,
    },
    footerNote: {
        fontSize: 12,
        color: '#94A3B8',
        textAlign: 'center',
        marginTop: 24,
        lineHeight: 18,
        paddingHorizontal: 20,
    },
});
