import React, { useEffect, useState, useCallback, memo } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { LoaderOverlay } from '@/components/common/LoaderOverlay';
import { FlashList } from '@shopify/flash-list';
import { Stack, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import moment from '@/utils/dayjs';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { Layout } from '@/constants/layout';
import { analyticsService, AnalyticsEvents } from '@/analytics';
import { EmptyFeedBackModal } from '@/components/feedback/EmptyFeedBackModal';
import { ThankYouFeedBackModal } from '@/components/feedback/ThankYouFeedBackModal';
import { submitFeedback, getMyFeedback } from '@/apis/feedback';
import Toast from 'react-native-toast-message';

export default function FeedbackScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { theme } = useTheme();
    const colors = Colors[theme];

    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<'submit' | 'history'>('submit');

    // Submit state
    const [feedbackType, setFeedbackType] = useState<'bug' | 'suggestion' | 'other'>('suggestion');
    const [message, setMessage] = useState('');
    const [showEmptyModal, setShowEmptyModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    const { data: feedbacks = [], isLoading: isLoadingHistory } = useQuery({
        queryKey: ['myFeedback'],
        queryFn: async () => {
            const res = await getMyFeedback();
            if (res?.success) return res.data || [];
            throw new Error(res?.message || 'Failed to fetch feedback history');
        },
        enabled: activeTab === 'history'
    });

    const submitMutation = useMutation({
        mutationFn: submitFeedback,
        onSuccess: () => {
            setShowSuccessModal(true);
            setMessage('');
            queryClient.invalidateQueries({ queryKey: ['myFeedback'] });
        },
        onError: (error: any) => {
            console.error('Submit Feedback Error:', error);
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error?.message || 'Failed to submit feedback. Please try again.' });
        }
    });

    const handleGoBack = useCallback(() => {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace('/(drawer)/(tabs)' as any);
        }
    }, [router]);

    const handleSubmit = useCallback(() => {
        if (!message.trim()) {
            setShowEmptyModal(true);
            return;
        }

        analyticsService.trackEvent(AnalyticsEvents.GLOBAL_FEEDBACK_SUBMITTED, {
            type: feedbackType,
            text: message,
            component_name: 'global_drawer'
        });

        submitMutation.mutate({
            type: feedbackType,
            text: message,
            component_name: 'global_drawer'
        });
    }, [message, feedbackType, submitMutation]);

    const renderHistoryItem = useCallback(({ item }: { item: any }) => {
        const isSubmitted = item.status === 'SUBMITTED';
        const isReviewed = item.status === 'REVIEWED';

        return (
            <View style={[styles.card, { backgroundColor: colors.cardBg }]}>
                <View style={styles.cardHeader}>
                    <View style={styles.typeBadge}>
                        <ThemedText style={styles.typeText}>{item.type}</ThemedText>
                    </View>
                    <View style={[
                        styles.statusBadge,
                        isSubmitted ? { backgroundColor: 'rgba(245, 158, 11, 0.1)' } :
                            isReviewed ? { backgroundColor: 'rgba(59, 130, 246, 0.1)' } :
                                { backgroundColor: 'rgba(16, 185, 129, 0.1)' }
                    ]}>
                        <ThemedText style={[
                            styles.statusText,
                            isSubmitted ? { color: '#D97706' } :
                                isReviewed ? { color: '#2563EB' } :
                                    { color: '#059669' }
                        ]}>
                            {item.status.replace(/_/g, ' ')}
                        </ThemedText>
                    </View>
                </View>

                <ThemedText style={[styles.feedbackText, { color: colors.text }]}>
                    "{item.text}"
                </ThemedText>

                <View style={styles.cardFooter}>
                    <ThemedText style={[styles.dateText, { color: colors.textSecondary }]}>
                        {moment(item.createdAt).format('MMM DD, YYYY')}
                    </ThemedText>
                    {item.component_name && (
                        <ThemedText style={[styles.sourceText, { color: colors.textSecondary }]}>
                            via {item.component_name.replace(/_/g, ' ')}
                        </ThemedText>
                    )}
                </View>
            </View>
        );
    }, [colors]);

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.root, { backgroundColor: colors.background }]}
        >
            <Stack.Screen options={{ headerShown: false, presentation: 'modal', animation: 'slide_from_bottom' }} />

            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 12, backgroundColor: colors.background }]}>
                <TouchableOpacity onPress={handleGoBack} style={styles.iconBtn}>
                    <Ionicons name="arrow-back" size={20} color={colors.text} />
                </TouchableOpacity>
                <View style={{ flex: 1, marginLeft: 12 }}>
                    <ThemedText style={styles.screenTitle}>Feedback</ThemedText>
                </View>
            </View>

            {/* Tab Selector */}
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tabItem, activeTab === 'submit' && { borderBottomWidth: 2, borderBottomColor: colors.primary }]}
                    onPress={() => setActiveTab('submit')}
                >
                    <ThemedText style={[styles.tabText, activeTab === 'submit' ? { color: colors.primary, fontWeight: '700' } : { color: colors.textSecondary }]}>
                        Give Feedback
                    </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tabItem, activeTab === 'history' && { borderBottomWidth: 2, borderBottomColor: colors.primary }]}
                    onPress={() => setActiveTab('history')}
                >
                    <ThemedText style={[styles.tabText, activeTab === 'history' ? { color: colors.primary, fontWeight: '700' } : { color: colors.textSecondary }]}>
                        My History
                    </ThemedText>
                </TouchableOpacity>
            </View>

            {activeTab === 'submit' ? (
                <ScrollView
                    contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <ThemedText style={[styles.sectionLabel, { color: colors.textSecondary }]}>WHAT KIND OF FEEDBACK DO YOU HAVE?</ThemedText>

                    <View style={styles.typeContainer}>
                        {(['suggestion', 'bug', 'other'] as const).map((type) => {
                            const isActive = feedbackType === type;
                            const label = type === 'suggestion' ? 'Suggestion 💡' : type === 'bug' ? 'Bug Report 🐛' : 'Other 💬';
                            return (
                                <TouchableOpacity
                                    key={type}
                                    onPress={() => setFeedbackType(type)}
                                    style={[
                                        styles.typeButton,
                                        { backgroundColor: isActive ? colors.primary : colors.card }
                                    ]}>
                                    <ThemedText style={[styles.typeButtonText, { color: isActive ? '#fff' : colors.text }]}>
                                        {label}
                                    </ThemedText>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    <ThemedText style={[styles.sectionLabel, { color: colors.textSecondary, marginTop: 24 }]}>YOUR MESSAGE</ThemedText>
                    <TextInput
                        style={[
                            styles.textInput,
                            {
                                backgroundColor: colors.cardBg,
                                color: colors.text,
                            }
                        ]}
                        multiline
                        placeholder="Tell us what's on your mind..."
                        placeholderTextColor={colors.textSecondary}
                        value={message}
                        onChangeText={setMessage}
                        textAlignVertical="top"
                    />

                    <TouchableOpacity
                        style={[
                            styles.submitButton,
                            { backgroundColor: colors.primary },
                            submitMutation.isPending && { opacity: 0.7 }
                        ]}
                        onPress={handleSubmit}
                        disabled={submitMutation.isPending}
                    >
                        <ThemedText style={styles.submitButtonText}>
                            {submitMutation.isPending ? 'Sending...' : 'Send Feedback'}
                        </ThemedText>
                    </TouchableOpacity>
                </ScrollView>
            ) : (
                <View style={{ flex: 1 }}>
                    {isLoadingHistory ? (
                        <View style={styles.center}>
                            <ActivityIndicator size="large" color={colors.primary} />
                        </View>
                    ) : (
                        <FlashList
                            data={feedbacks}
                            keyExtractor={item => item._id}
                            renderItem={renderHistoryItem}
                            contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 20 }]}
                            showsVerticalScrollIndicator={false}
                            ListEmptyComponent={() => (
                                <View style={styles.emptyContainer}>
                                    <Ionicons name="chatbubbles-outline" size={48} color={colors.textSecondary} style={{ marginBottom: 16 }} />
                                    <ThemedText style={[styles.emptyTitle, { color: colors.text }]}>No Feedback Yet</ThemedText>
                                    <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>
                                        You haven't submitted any feedback.
                                    </ThemedText>
                                    <TouchableOpacity
                                        style={[styles.btn, { backgroundColor: colors.primary }]}
                                        onPress={() => setActiveTab('submit')}
                                    >
                                        <ThemedText style={styles.btnText}>Give Feedback</ThemedText>
                                    </TouchableOpacity>
                                </View>
                            )}
                        />
                    )}
                </View>
            )}

            {/* Custom Empty Message Modal */}
            <EmptyFeedBackModal
                visible={showEmptyModal}
                onClose={() => setShowEmptyModal(false)}
            />

            {/* Custom Success Message Modal */}
            <ThankYouFeedBackModal
                visible={showSuccessModal}
                onClose={() => { setShowSuccessModal(false); setActiveTab('history'); }}
            />

            <LoaderOverlay visible={submitMutation.isPending} text="Submitting feedback..." />
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 11 },
    iconBtn: {
        width: 38,
        height: 38,
        borderRadius: Layout.borderRadius,
        justifyContent: 'center',
        alignItems: 'center' },
    screenTitle: { fontSize: 16.5, fontWeight: '700' },
    tabContainer: {
        flexDirection: 'row' },
    tabItem: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 11 },
    tabText: {
        fontSize: 12.5,
        fontWeight: '600' },
    scroll: {
        paddingHorizontal: 16,
        paddingTop: 20 },
    sectionLabel: {
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 1,
        marginBottom: 12 },
    typeContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10 },
    typeButton: {
        paddingVertical: 8,
        paddingHorizontal: 13,
        borderRadius: Layout.borderRadius },
    typeButtonText: {
        fontSize: 11.5,
        fontWeight: '600' },
    textInput: {
        borderRadius: Layout.borderRadius,
        padding: 13,
        height: 150,
        fontSize: 12.5,
        marginBottom: 24 },
    submitButton: {
        height: 52,
        borderRadius: Layout.borderRadius,
        justifyContent: 'center',
        alignItems: 'center' },
    submitButtonText: {
        color: '#FFFFFF',
        fontSize: 13.5,
        fontWeight: '700' },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    listContent: {
        padding: 13 },
    card: {
        padding: 13,
        borderRadius: Layout.borderRadius,
        marginBottom: 12 },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12 },
    typeBadge: {
        backgroundColor: '#E2E8F0',
        paddingHorizontal: 7,
        paddingVertical: 4,
        borderRadius: Layout.borderRadius },
    typeText: {
        fontSize: 9,
        fontWeight: '700',
        color: '#475569',
        textTransform: 'uppercase'
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: Layout.borderRadius },
    statusText: {
        fontSize: 9,
        fontWeight: '700',
        textTransform: 'uppercase'
    },
    feedbackText: {
        fontSize: 12.5,
        lineHeight: 22,
        marginBottom: 16,
        fontStyle: 'italic'
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center' },
    dateText: {
        fontSize: 10.5 },
    sourceText: {
        fontSize: 10,
        textTransform: 'capitalize'
    },
    emptyContainer: {
        flex: 1,
        marginTop: 60,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20 },
    emptyTitle: {
        fontSize: 15.5,
        fontWeight: '700',
        marginBottom: 8 },
    emptyText: {
        fontSize: 12.5,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20 },
    btn: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: Layout.borderRadius },
    btnText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 12.5 }
});
