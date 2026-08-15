import { Image } from 'expo-image';
import { getTicketById, replyToSupportTicket } from '@/apis/support';
import { ThemedText } from '@/components/ThemedText';
import { BackButton } from '@/components/common/BackButton';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { LoaderOverlay } from '@/components/common/LoaderOverlay';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

const { width } = Dimensions.get('window');

interface Message {
    sender: 'user' | 'admin';
    senderId: string;
    message: string;
    attachments: string[];
    createdAt: string;
}

interface Ticket {
    _id: string;
    ticketId: string;
    subject: string;
    description: string;
    status: 'open' | 'in-progress' | 'closed';
    attachments: string[];
    messages: Message[];
    createdAt: string;
}

export default function TicketDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { theme } = useTheme();
    const colors = Colors[theme];
    const queryClient = useQueryClient();
    const scrollRef = useRef<ScrollView>(null);

    const handleBack = () => {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace('/support/tickets' as any);
        }
    };

    const [replyText, setReplyText] = useState('');

    const { data: response, isLoading, isError, refetch, isRefetching } = useQuery({
        queryKey: ['ticket_detail', id],
        queryFn: () => getTicketById(id),
        enabled: !!id });

    const ticket: Ticket | null = response?.data || null;

    useEffect(() => {
        if (ticket?.messages) {
            setTimeout(() => {
                scrollRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }
    }, [ticket?.messages?.length]);

    const replyMutation = useMutation({
        mutationFn: (formData: FormData) => replyToSupportTicket(id, formData),
        onSuccess: () => {
            setReplyText('');
            queryClient.invalidateQueries({ queryKey: ['ticket_detail', id] });
            queryClient.invalidateQueries({ queryKey: ['support_tickets'] });
            Toast.show({ type: 'success', text1: 'Reply Sent' });
        },
        onError: (error: any) => {
            Alert.alert('Error', error.message || 'Failed to send reply.');
        }
    });

    const handleReply = () => {
        if (!replyText.trim()) return;

        const formData = new FormData();
        formData.append('message', replyText);

        replyMutation.mutate(formData);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (isLoading) {
        return (
            <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (isError || !ticket) {
        return (
            <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
                <ThemedText style={{ marginBottom: 20 }}>Failed to load ticket details</ThemedText>
                <TouchableOpacity onPress={() => refetch()} style={styles.retryButton}>
                    <ThemedText style={{ color: colors.primary, fontWeight: '700' }}>Retry</ThemedText>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <ErrorBoundary>
        <KeyboardAvoidingView
            style={{ flex: 1, backgroundColor: colors.background }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
            <View style={[styles.container, { paddingTop: insets.top }]}>
                {/* Header */}
                <View style={styles.header}>
                    <BackButton backgroundColor="rgba(255,255,255,0.18)" color="#FFFFFF" size={22} />
                    <View style={styles.headerTitleContainer}>
                        <ThemedText style={styles.headerTitle} numberOfLines={1}>{ticket.ticketId}</ThemedText>
                        <View style={styles.statusRow}>
                            <View style={[styles.statusDot, { backgroundColor: ticket.status === 'open' ? '#F59E0B' : ticket.status === 'in-progress' ? '#3B82F6' : '#10B981' }]} />
                            <ThemedText style={styles.statusText}>{ticket.status.toUpperCase()}</ThemedText>
                        </View>
                    </View>
                </View>

                <ScrollView
                    ref={scrollRef}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
                    }
                >
                    {/* Ticket Metadata */}
                    <View style={[styles.metadataContainer, { backgroundColor: theme === 'dark' ? '#1E1E1E' : '#F5F7FA' }]}>
                        <ThemedText style={styles.subject}>{ticket.subject}</ThemedText>
                        <ThemedText style={[styles.description, { color: colors.textSecondary }]}>{ticket.description}</ThemedText>

                        {ticket.attachments && ticket.attachments.length > 0 && (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.attachmentScroll}>
                                {ticket.attachments.map((url, index) => (
                                    <TouchableOpacity key={index} onPress={() => {/* Lightbox logic */ }}>
                                        <Image
                                            source={{ uri: url }}
                                            style={styles.attachmentImage}
                                            contentFit="cover"
                                            transition={200}
                                        />
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        )}
                        <ThemedText style={[styles.createdAt, { color: colors.textSecondary }]}>{formatDate(ticket.createdAt)}</ThemedText>
                    </View>

                    <View style={styles.threadDivider}>
                        <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                        <ThemedText style={[styles.dividerText, { color: colors.textSecondary }]}>Conversation</ThemedText>
                        <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                    </View>

                    {/* Thread Messages */}
                    <View style={styles.threadContainer}>
                        {(ticket.messages || []).map((msg, index) => (
                            <View
                                key={index}
                                style={[
                                    styles.messageWrapper,
                                    msg.sender === 'user' ? styles.userMessageWrapper : styles.adminMessageWrapper
                                ]}
                            >
                                <View
                                    style={[
                                        styles.messageBubble,
                                        msg.sender === 'user'
                                            ? [styles.userBubble, { backgroundColor: colors.primary }]
                                            : [styles.adminBubble, { backgroundColor: theme === 'dark' ? '#2A2A2A' : '#F0F2F5' }]
                                    ]}
                                >
                                    {msg.sender === 'admin' && (
                                        <ThemedText style={styles.senderLabel}>Admin Support</ThemedText>
                                    )}
                                    <ThemedText
                                        style={[
                                            styles.messageText,
                                            { color: msg.sender === 'user' ? '#FFFFFF' : colors.text }
                                        ]}
                                    >
                                        {msg.message}
                                    </ThemedText>
                                    {msg.attachments && msg.attachments.length > 0 && (
                                        <View style={styles.messageAttachments}>
                                            {msg.attachments.map((url, i) => (
                                                <Image
                                                    key={i}
                                                    source={{ uri: url }}
                                                    style={styles.messageImage}
                                                    contentFit="cover"
                                                    transition={200}
                                                />
                                            ))}
                                        </View>
                                    )}
                                    <ThemedText
                                        style={[
                                            styles.messageTime,
                                            { color: msg.sender === 'user' ? 'rgba(255,255,255,0.7)' : colors.textSecondary }
                                        ]}
                                    >
                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </ThemedText>
                                </View>
                            </View>
                        ))}
                    </View>
                </ScrollView>

                {/* Reply Input */}
                {ticket.status !== 'closed' ? (
                    <View style={[styles.replyContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
                        <TextInput
                            style={[styles.replyInput, { backgroundColor: theme === 'dark' ? '#2A2A2A' : '#F0F2F5', color: colors.text }]}
                            placeholder="Type your message..."
                            placeholderTextColor={colors.textSecondary}
                            value={replyText}
                            onChangeText={setReplyText}
                            multiline
                        />
                        <TouchableOpacity
                            style={[styles.sendButton, { backgroundColor: colors.primary }]}
                            onPress={handleReply}
                            disabled={replyMutation.isPending || !replyText.trim()}
                        >
                            {replyMutation.isPending ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <Ionicons name="send" size={20} color="#FFFFFF" />
                            )}
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={[styles.closedMessage, { paddingBottom: Math.max(insets.bottom, 16), backgroundColor: colors.card }]}>
                        <ThemedText style={styles.closedText}>This ticket is closed. You cannot reply anymore.</ThemedText>
                    </View>
                )}
            </View>
            <LoaderOverlay visible={replyMutation.isPending} text="Sending reply..." />
        </KeyboardAvoidingView>
        </ErrorBoundary>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1 },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 36
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10 },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: Layout.borderRadius,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10 },
    headerTitleContainer: {
        flex: 1 },
    headerTitle: {
        fontSize: 15.5,
        fontWeight: 'bold' },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2 },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: Layout.borderRadius,
        marginRight: 6 },
    statusText: {
        fontSize: 9,
        fontWeight: '700',
        opacity: 0.6 },
    scrollContent: {
        paddingBottom: 36 },
    metadataContainer: {
        margin: 20,
        padding: 16,
        borderRadius: Layout.borderRadius },
    subject: {
        fontSize: 16.5,
        fontWeight: '800',
        marginBottom: 10 },
    description: {
        fontSize: 12.5,
        lineHeight: 22,
        marginBottom: 15 },
    attachmentScroll: {
        marginBottom: 15 },
    attachmentImage: {
        width: width * 0.4,
        height: 120,
        borderRadius: Layout.borderRadius,
        marginRight: 12,
        backgroundColor: '#eee' },
    createdAt: {
        fontSize: 10.5,
        opacity: 0.7 },
    threadDivider: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginVertical: 10
    },
    dividerLine: {
        flex: 1,
        height: StyleSheet.hairlineWidth },
    dividerText: {
        fontSize: 10.5,
        fontWeight: '700',
        marginHorizontal: 15,
        opacity: 0.5,
        textTransform: 'uppercase' },
    threadContainer: {
        paddingHorizontal: 16 },
    messageWrapper: {
        flexDirection: 'row',
        marginBottom: 16,
        width: '100%' },
    userMessageWrapper: {
        justifyContent: 'flex-end' },
    adminMessageWrapper: {
        justifyContent: 'flex-start' },
    messageBubble: {
        maxWidth: '85%',
        padding: 10,
        borderRadius: Layout.borderRadius },
    userBubble: {
        borderBottomRightRadius: 28 },
    adminBubble: {
        borderBottomLeftRadius: 28 },
    senderLabel: {
        fontSize: 9,
        fontWeight: '800',
        marginBottom: 4,
        opacity: 0.5,
        textTransform: 'uppercase'
    },
    messageText: {
        fontSize: 12.5,
        lineHeight: 20 },
    messageAttachments: {
        marginTop: 8,
        flexDirection: 'row',
        flexWrap: 'wrap' },
    messageImage: {
        width: 100,
        height: 100,
        borderRadius: Layout.borderRadius,
        marginRight: 8,
        marginBottom: 8 },
    messageTime: {
        fontSize: 9,
        marginTop: 4,
        alignSelf: 'flex-end' },
    replyContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: 13,
        paddingTop: 10,
        backgroundColor: 'transparent' },
    replyInput: {
        flex: 1,
        borderRadius: Layout.borderRadius,
        paddingHorizontal: 13,
        paddingVertical: 8,
        paddingTop: 8,
        maxHeight: 120,
        fontSize: 12.5 },
    sendButton: {
        width: 42,
        height: 42,
        borderRadius: Layout.borderRadius,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8 },
    closedMessage: {
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center' },
    closedText: {
        fontSize: 12.5,
        fontWeight: '600',
        opacity: 0.6 },
    retryButton: {
        padding: 8 }
});
