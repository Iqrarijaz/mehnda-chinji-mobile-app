import { blockConversation, getConversationDetails, getMessages, markMessagesSeen, sendMessage, unblockConversation } from '@/apis/chat/chat';
import { ThemedText } from '@/components/themedText';
import { ThemedView } from '@/components/themedView';
import Avatar from '@/components/ui/avatar';
import { GlassConfirmationModal } from '@/components/ui/glassConfirmationModal';
import { baseUrl } from '@/configs';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Message } from '@/types/chat';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
    ViewStyle
} from 'react-native';
import { GestureHandlerRootView, PanGestureHandler } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Socket, io } from 'socket.io-client';

// Memoized Message Item Component
const MessageItem = React.memo(({ item, currentUserId, isDark, userProfileImage }: { item: Message, currentUserId: string | undefined, isDark: boolean, userProfileImage?: string }) => {
    const senderId = typeof item.sender === 'string' ? item.sender : item.sender._id;
    // Robust ID comparison
    const isMyMessage = senderId?.toString() === currentUserId;

    // Dynamic Colors
    const sentBg = '#222831';
    const receivedBg = '#FF9B51';

    const bubbleStyle: ViewStyle[] = isMyMessage
        ? [styles.sentBubble, { backgroundColor: sentBg }]
        : [styles.receivedBubble, { backgroundColor: receivedBg }];

    const textColor = isMyMessage
        ? '#ffffff'
        : (isDark ? '#F8FAFC' : '#1E293B');

    const timeColor = isMyMessage
        ? 'rgba(255,255,255,0.7)'
        : (isDark ? '#94a3b8' : '#64748b');

    // Check Status
    const isSeen = item.seenBy && item.seenBy.length > 1;
    const isRead = item.status === 'read' || isSeen;

    return (
        <View style={[
            styles.messageRow,
            isMyMessage ? { justifyContent: 'flex-end' } : { justifyContent: 'flex-start' }
        ]}>
            {!isMyMessage && (
                <Avatar
                    uri={(typeof item.sender === 'object' && item.sender?.profileImage) ? item.sender.profileImage : undefined}
                    name={typeof item.sender === 'object' ? item.sender?.name : undefined}
                    size={28}
                    style={styles.messageAvatar}
                />
            )}
            <View style={[styles.bubbleContainer, bubbleStyle]}>
                <ThemedText style={[styles.messageText, { color: textColor }]}>
                    {String(item.text || '')}
                </ThemedText>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 4 }}>
                    <ThemedText style={[styles.timeText, { color: timeColor, marginTop: 0, marginRight: isMyMessage ? 4 : 0 }]}>
                        {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </ThemedText>
                    {isMyMessage && (
                        <Ionicons
                            name={isRead ? "checkmark-done" : "checkmark"}
                            size={16}
                            color={isRead ? '#93C5FD' : 'rgba(255,255,255,0.6)'}
                        />
                    )}
                </View>
            </View>
            {isMyMessage && (
                <Avatar
                    uri={userProfileImage}
                    name="Me"
                    size={28}
                    style={[styles.messageAvatar, { marginRight: 0, marginLeft: 8 }]}
                />
            )}
        </View>
    );
}, (prevProps, nextProps) => {
    return (
        prevProps.item._id === nextProps.item._id &&
        prevProps.currentUserId === nextProps.currentUserId &&
        prevProps.isDark === nextProps.isDark &&
        prevProps.userProfileImage === nextProps.userProfileImage &&
        prevProps.item.seenBy?.length === nextProps.item.seenBy?.length &&
        prevProps.item.status === nextProps.item.status
    );
});

export default function ChatScreen() {
    const { id, name, profileImage } = useLocalSearchParams();
    const { theme, isDark } = useTheme();
    const { user } = useAuth();
    const router = useRouter();
    const navigation = useNavigation();
    const queryClient = useQueryClient();

    const [inputText, setInputText] = useState('');
    const [sending, setSending] = useState(false);
    const [isBlocked, setIsBlocked] = useState(false);
    const [blockedByMe, setBlockedByMe] = useState(false);

    // Modal State
    const [modalVisible, setModalVisible] = useState(false);
    const [modalConfig, setModalConfig] = useState<{
        title: string;
        message: string;
        confirmText: string;
        type: 'danger' | 'info';
        onConfirm: () => void;
    }>({
        title: '',
        message: '',
        confirmText: '',
        type: 'info',
        onConfirm: () => { },
    });

    const flatListRef = useRef<FlatList>(null);
    const socketRef = useRef<Socket | null>(null);

    // Derived State
    const currentUserId = useMemo(() => {
        return user?.user?._id?.toString() || user?.user?.id?.toString();
    }, [user]);

    // Fetch conversation details
    useQuery({
        queryKey: ['conversationDetails', id],
        queryFn: async () => {
            if (!id) return null;
            const res = await getConversationDetails(id as string);
            if (res.success) {
                const blockedBy = res.data.blockedBy || [];
                setIsBlocked(blockedBy.length > 0);
                setBlockedByMe(blockedBy.includes(currentUserId));
                return res.data;
            }
            return null;
        },
        enabled: !!id && !!currentUserId,
    });

    const { data: messages = [], isLoading } = useQuery({
        queryKey: ['messages', id],
        queryFn: async () => {
            const res = await getMessages(id as string);
            return res.success ? res.data.reverse() : [];
        },
        enabled: !!id,
    });

    // Socket Lifecycle
    useEffect(() => {
        let socket: Socket | null = null;
        const userId = user?.user?.id || user?.user?._id;

        if (userId && id) {
            console.log('Initializing socket for user:', userId);

            socket = io(baseUrl, {
                transports: ['websocket'],
                query: { userId }
            });
            socketRef.current = socket;

            socket.on('connect', () => {
                console.log('Socket Connected:', socket?.id);
                socket?.emit('join', userId);
            });

            socket.on('new_message', (data: any) => {
                if (data.conversationId === id) {
                    queryClient.setQueryData(['messages', id], (oldData: Message[] | undefined) => {
                        if (!oldData) return [data.message];
                        if (oldData.find(m => m._id === data.message._id)) return oldData;
                        return [data.message, ...oldData];
                    });

                    const senderId = typeof data.message.sender === 'string' ? data.message.sender : data.message.sender._id;
                    if (senderId !== userId) {
                        markMessagesSeen(id as string);
                    }
                }
            });

            socket.on('messages_seen', (data: any) => {
                if (data.conversationId === id) {
                    queryClient.setQueryData(['messages', id], (oldData: Message[] | undefined) => {
                        if (!oldData) return [];
                        return oldData.map(msg => {
                            const senderId = typeof msg.sender === 'string' ? msg.sender : msg.sender._id;
                            if (senderId === userId && !msg.seenBy.includes(data.seenBy)) {
                                return { ...msg, seenBy: [...msg.seenBy, data.seenBy], status: 'read' };
                            }
                            return msg;
                        });
                    });
                }
            });
        }

        if (id) {
            markMessagesSeen(id as string);
        }

        return () => {
            if (socket) {
                socket.disconnect();
                socketRef.current = null;
            }
        };
    }, [id, user]);

    const handleSend = useCallback(async () => {
        if (!inputText.trim()) return;
        const text = inputText;
        setInputText('');
        setSending(true);

        try {
            const res = await sendMessage(id as string, text, 'text');
            if (res.success) {
                queryClient.setQueryData(['messages', id], (oldData: Message[] | undefined) => {
                    if (!oldData) return [res.data];
                    if (oldData.find(m => m._id === res.data._id)) return oldData;
                    return [res.data, ...oldData];
                });
            }
        } catch (error) {
            console.error(error);
            setInputText(text);
            Alert.alert("Error", "Failed to send message. Conversation might be blocked.");
        } finally {
            setSending(false);
        }
    }, [id, inputText, queryClient]);

    const handleBack = useCallback(() => {
        router.push('/(tabs)/chat');
    }, [router]);

    const handleBlockAction = async () => {
        if (!id) return;

        if (blockedByMe) {
            setModalConfig({
                title: "Unblock User",
                message: "Are you sure you want to unblock this user?",
                confirmText: "Unblock",
                type: 'info',
                onConfirm: async () => {
                    setModalVisible(false);
                    try {
                        const res = await unblockConversation(id as string);
                        if (res.success) {
                            setBlockedByMe(false);
                            queryClient.invalidateQueries({ queryKey: ['conversationDetails', id] });
                        }
                    } catch (e) {
                        Alert.alert("Error", "Failed to unblock user");
                    }
                }
            });
            setModalVisible(true);
        } else {
            setModalConfig({
                title: "Block User",
                message: "Are you sure you want to block this user? You won't be able to send or receive messages.",
                confirmText: "Block",
                type: 'danger',
                onConfirm: async () => {
                    setModalVisible(false);
                    try {
                        const res = await blockConversation(id as string);
                        if (res.success) {
                            setBlockedByMe(true);
                            setIsBlocked(true);
                            queryClient.invalidateQueries({ queryKey: ['conversationDetails', id] });
                        }
                    } catch (e) {
                        Alert.alert("Error", "Failed to block user");
                    }
                }
            });
            setModalVisible(true);
        }
    };

    const renderItem = useCallback(({ item }: { item: Message }) => {
        return <MessageItem item={item} currentUserId={currentUserId} isDark={isDark} userProfileImage={user?.user?.profileImage} />;
    }, [currentUserId, isDark, user]);

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <GlassConfirmationModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                onConfirm={modalConfig.onConfirm}
                title={modalConfig.title}
                message={modalConfig.message}
                confirmText={modalConfig.confirmText}
                type={modalConfig.type}
            />

            <PanGestureHandler
                onGestureEvent={(event) => {
                    if (event.nativeEvent.translationX > 50) {
                        handleBack();
                    }
                }}
                activeOffsetX={[0, 20]}
            >
                <ThemedView style={styles.container}>
                    {/* Custom Header */}
                    <SafeAreaView style={{ backgroundColor: isDark ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)' }} edges={['top']}>
                        <View style={[styles.header, { borderBottomColor: Colors[theme].border }]}>
                            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                                <Ionicons name="arrow-back" size={24} color={Colors[theme].text} />
                            </TouchableOpacity>

                            <View style={styles.headerInfo}>
                                <Avatar
                                    uri={profileImage as string}
                                    name={name as string}
                                    size={36}
                                    style={styles.headerAvatar}
                                />
                                <ThemedText style={styles.headerName} numberOfLines={1}>
                                    {String(name || 'Chat')}
                                </ThemedText>
                            </View>

                            <TouchableOpacity onPress={handleBlockAction} style={styles.blockButton}>
                                <Ionicons
                                    name={blockedByMe ? "ban" : "ban-outline"}
                                    size={24}
                                    color={blockedByMe ? "#ef4444" : Colors[theme].text}
                                />
                            </TouchableOpacity>
                        </View>
                    </SafeAreaView>

                    {isLoading ? (
                        <View style={styles.center}>
                            <ActivityIndicator size="large" color={Colors[theme].tint} />
                        </View>
                    ) : (
                        <FlatList
                            ref={flatListRef}
                            data={messages}
                            renderItem={renderItem}
                            keyExtractor={item => item._id}
                            inverted
                            contentContainerStyle={styles.listContent}
                            keyboardShouldPersistTaps="handled"
                        />
                    )}

                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
                        keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 20}
                    >
                        {isBlocked ? (
                            <View style={[styles.blockedContainer, { backgroundColor: isDark ? '#0f172a' : '#f1f5f9' }]}>
                                <ThemedText style={styles.blockedText}>
                                    {blockedByMe ? "You have blocked this user." : "You cannot reply to this conversation."}
                                </ThemedText>
                                {blockedByMe && (
                                    <TouchableOpacity onPress={handleBlockAction}>
                                        <ThemedText style={{ color: Colors[theme].tint, fontWeight: '600', marginTop: 4 }}>Unblock</ThemedText>
                                    </TouchableOpacity>
                                )}
                            </View>
                        ) : (
                            <View style={[styles.inputContainer, { borderTopColor: Colors[theme].border, backgroundColor: isDark ? '#0f172a' : '#ffffff' }]}>
                                <TextInput
                                    style={[styles.input, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9', color: Colors[theme].text }]}
                                    value={inputText}
                                    onChangeText={setInputText}
                                    placeholder="Type a message..."
                                    placeholderTextColor="#94a3b8"
                                    multiline
                                />
                                <TouchableOpacity
                                    style={[styles.sendButton, { backgroundColor: Colors[theme].tint, opacity: sending || !inputText.trim() ? 0.5 : 1 }]}
                                    onPress={handleSend}
                                    disabled={sending || !inputText.trim()}
                                >
                                    {sending ? (
                                        <ActivityIndicator color="white" size="small" />
                                    ) : (
                                        <Ionicons name="send" size={20} color="white" />
                                    )}
                                </TouchableOpacity>
                            </View>
                        )}
                    </KeyboardAvoidingView>
                </ThemedView>
            </PanGestureHandler>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    backButton: {
        padding: 4,
        marginRight: 8,
    },
    blockButton: {
        padding: 4,
        marginLeft: 8,
    },
    headerInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
    },
    headerAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        marginRight: 10,
        backgroundColor: '#cbd5e1',
    },
    headerName: {
        fontSize: 18,
        fontWeight: '600',
        textTransform: 'capitalize',
        flex: 1,
    },
    listContent: {
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    messageRow: {
        flexDirection: 'row',
        marginBottom: 12,
        alignItems: 'flex-end',
    },
    messageAvatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
        marginRight: 8,
        marginBottom: 2,
        backgroundColor: '#cbd5e1',
    },
    bubbleContainer: {
        maxWidth: '80%',
        padding: 12,
        borderRadius: 18,
    },
    sentBubble: {
        backgroundColor: 'rgba(59, 130, 246, 0.85)',
        borderBottomRightRadius: 4,
        shadowColor: "#3b82f6",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    receivedBubble: {
        backgroundColor: 'rgba(148, 163, 184, 0.2)',
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    messageText: {
        fontSize: 16,
        lineHeight: 22,
    },
    timeText: {
        fontSize: 10,
        marginTop: 4,
        alignSelf: 'flex-end',
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 12,
        borderTopWidth: 1,
        alignItems: 'center',
    },
    blockedContainer: {
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 80,
    },
    blockedText: {
        color: '#94a3b8',
        textAlign: 'center'
    },
    input: {
        flex: 1,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        maxHeight: 60,
        marginRight: 12,
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
