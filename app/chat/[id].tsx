import { blockConversation, getConversationDetails, getMessages, markMessagesSeen, sendMessage, unblockConversation } from '@/apis/chat/chat';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import Avatar from '@/components/ui/avatar';
import { BlockConfirmationModal } from '@/components/ui/BlockConfirmationModal';
import { ChatInput, ChatInputRef } from '@/components/chat/ChatInput';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { useSocket } from '@/context/SocketContext';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Message } from '@/types/chat';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ViewStyle
} from 'react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';
import { FlashList, FlashListRef } from '@shopify/flash-list';
import { useChatUiStore } from '@/store/chatUiStore';
// ─── P2-2: Module-level utility — not recreated on every handleSend call ────
const generateObjectId = (): string => {
    const timestamp = Math.floor(Date.now() / 1000).toString(16);
    return (
        timestamp +
        'xxxxxxxxxxxxxxxx'
            .replace(/[x]/g, () => Math.floor(Math.random() * 16).toString(16))
            .toLowerCase()
    );
};

// ─── P2-1: Time formatter with capped LRU-style eviction ────────────────────
const TIME_CACHE_MAX = 500;
const timeCache = new Map<string, string>();
const formatMessageTime = (dateString: string): string => {
    if (!dateString) return '';
    if (timeCache.has(dateString)) return timeCache.get(dateString)!;
    if (timeCache.size >= TIME_CACHE_MAX) {
        // Evict the oldest entry (Map preserves insertion order)
        timeCache.delete(timeCache.keys().next().value as string);
    }
    const timeStr = new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    timeCache.set(dateString, timeStr);
    return timeStr;
};

// ─── Memoized Message Item ────────────────────────────────────────────────────
// P1-6: Uses plain Text instead of ThemedText — eliminates 60+ ThemeContext
//        subscriptions from the list (messageText + timeText per bubble).
const MessageItem = React.memo(
    ({ item, currentUserId, isDark }: { item: Message; currentUserId: string | undefined; isDark: boolean }) => {
        const senderId = typeof item.sender === 'string' ? item.sender : item.sender._id;
        const isMyMessage = senderId?.toString() === currentUserId;

        const sentBg = '#222831';
        const receivedBg = '#FF9B51';

        const bubbleStyle: ViewStyle[] = isMyMessage
            ? [styles.sentBubble, { backgroundColor: sentBg }]
            : [styles.receivedBubble, { backgroundColor: receivedBg }];

        const textColor = isMyMessage ? '#ffffff' : isDark ? '#F8FAFC' : '#1E293B';
        const timeColor = isMyMessage ? 'rgba(255,255,255,0.7)' : isDark ? '#94a3b8' : '#64748b';

        const isSeen = item.seenBy && item.seenBy.length > 1;
        const isRead = item.status === 'read' || isSeen;

        return (
            <View
                style={[
                    styles.messageRow,
                    isMyMessage ? { justifyContent: 'flex-end' } : { justifyContent: 'flex-start' },
                ]}
            >
                {!isMyMessage && (
                    <Avatar
                        uri={
                            typeof item.sender === 'object' && item.sender?.profileImage
                                ? item.sender.profileImage
                                : undefined
                        }
                        name={typeof item.sender === 'object' ? item.sender?.name : undefined}
                        size={28}
                        style={styles.messageAvatar}
                    />
                )}
                <View style={[styles.bubbleContainer, bubbleStyle]}>
                    {/* Plain Text — no ThemeContext subscription per bubble */}
                    <Text style={[styles.messageText, { color: textColor }]}>
                        {String(item.text || '')}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 4 }}>
                        <Text style={[styles.timeText, { color: timeColor, marginTop: 0, marginRight: isMyMessage ? 4 : 0 }]}>
                            {formatMessageTime(item.createdAt)}
                        </Text>
                        {isMyMessage && (
                            <Ionicons
                                name={isRead ? 'checkmark-done' : 'checkmark'}
                                size={16}
                                color={isRead ? '#93C5FD' : 'rgba(255,255,255,0.6)'}
                            />
                        )}
                    </View>
                </View>
            </View>
        );
    },
    (prevProps, nextProps) =>
        prevProps.item._id === nextProps.item._id &&
        prevProps.currentUserId === nextProps.currentUserId &&
        prevProps.isDark === nextProps.isDark &&
        prevProps.item.text === nextProps.item.text &&
        prevProps.item.status === nextProps.item.status &&
        (prevProps.item.seenBy?.length || 0) === (nextProps.item.seenBy?.length || 0)
);

// ─── Chat Screen ──────────────────────────────────────────────────────────────
export default function ChatScreen() {
    const { id, name, profileImage } = useLocalSearchParams();
    const { theme, isDark } = useTheme();
    const { user } = useAuth();
    const router = useRouter();
    const queryClient = useQueryClient();

    // P0-4: Removed unused `sending` state — it was set but never read in JSX,
    //        causing 2 renders per sent message for zero UI benefit.

    const myTypingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const chatInputRef = useRef<ChatInputRef>(null);
    const soundRef = useRef<Audio.Sound | null>(null);

    // P2-8: onConfirmAction migrated to useRef — setting it no longer triggers a render.
    //        Only setModalVisible(true) needs to cause a render to show the modal.
    const [modalVisible, setModalVisible] = useState(false);
    const onConfirmActionRef = useRef<() => void>(() => { });

    // P1-4: Stable close handler — inline arrow was breaking BlockConfirmationModal's memo.
    const handleModalClose = useCallback(() => setModalVisible(false), []);

    const flatListRef = useRef<FlashListRef<Message>>(null);
    const { socket } = useSocket();

    // P3-2: currentUserId — useMemo removed since toString() on a string is trivial.
    //        user?.user?._id is typed as string from the backend.
    const currentUserId = user?.user?._id as string | undefined;

    // ─── Tab bar hide/show ────────────────────────────────────────────────────
    const setChatActive = useChatUiStore((s) => s.setChatActive);
    useFocusEffect(
        useCallback(() => {
            setChatActive(true);
            return () => setChatActive(false);
        }, [setChatActive])
    );

    // Preload audio sound on mount
    useEffect(() => {
        const loadSound = async () => {
            try {
                const { sound } = await Audio.Sound.createAsync(
                    require('../../assets/sounds/message_sent.mp3')
                );
                soundRef.current = sound;
            } catch (error) {
                console.error('Failed to preload sound', error);
            }
        };
        loadSound();
        return () => {
            if (soundRef.current) {
                soundRef.current.unloadAsync();
            }
        };
    }, []);

    const playSendSound = async () => {
        try {
            if (soundRef.current) {
                await soundRef.current.replayAsync();
            }
        } catch (error) {
            console.error('Failed to play sound', error);
        }
    };

    // P1-8: Safety check for corrupted cache data moved from useMemo to useEffect.
    //        useMemo is for derived values — running cache mutations inside it is
    //        semantically wrong and unsafe in React concurrent mode.
    useEffect(() => {
        if (!id) return;
        const cached: any = queryClient.getQueryData(['messages', id]);
        if (cached && !cached.pages) {
            console.warn('[Chat] Corrupted infinite query cache detected, removing...');
            queryClient.removeQueries({ queryKey: ['messages', id] });
        }
    }, [id]); // queryClient is a stable singleton

    // P1-1: Conversation details — block state derived from query data, not local useState.
    //        Previously: setState inside queryFn caused 2 extra renders per fetch and
    //        is an anti-pattern (data already lives in the query cache).
    const { data: conversationDetails } = useQuery({
        queryKey: ['conversationDetails', id],
        queryFn: async () => {
            if (!id) return null;
            const res = await getConversationDetails(id as string);
            return res.success ? res.data : null;
        },
        enabled: !!id && !!currentUserId,
    });

    // Derived synchronously — no local state, no extra renders
    const blockedBy: string[] = conversationDetails?.blockedBy ?? [];
    const isBlocked = blockedBy.length > 0;
    const blockedByMe = !!currentUserId && blockedBy.includes(currentUserId);

    const {
        data: messages = [],
        isLoading,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useInfiniteQuery({
        queryKey: ['messages', id],
        queryFn: async ({ pageParam = 1 }) => {
            const res = await getMessages(id as string, pageParam, 30);
            return res.success ? res.data.reverse() : [];
        },
        initialPageParam: 1,
        getNextPageParam: (lastPage, allPages) => {
            if (!lastPage || !allPages) return undefined;
            return lastPage.length === 30 ? allPages.length + 1 : undefined;
        },
        enabled: !!id,
        // P3-1: Removed redundant useCallback wrapper — TanStack Query already
        //        memoizes the select function internally.
        select: (data: any) => data.pages.flat(),
    });

    // ─── Socket Lifecycle ──────────────────────────────────────────────────────
    // P1-2: Dependency scoped to currentUserId (primitive string) instead of the
    //        entire user object. Previously, any profile update (avatar, prefs)
    //        would reattach all 4 socket listeners unnecessarily.
    useEffect(() => {
        if (!socket || !id) return;
        console.log('[Chat] Attaching listeners for conversation:', id);

        const handleNewMessage = (data: any) => {
            if (data.conversationId !== id) return;
            queryClient.setQueryData(['messages', id], (oldData: any) => {
                if (!oldData || !oldData.pages) return { pages: [[data.message]], pageParams: [1] };
                const firstPage = oldData.pages[0];
                if (firstPage.find((m: Message) => m._id === data.message._id)) return oldData;
                return {
                    ...oldData,
                    pages: [[data.message, ...firstPage], ...oldData.pages.slice(1)],
                };
            });

            const senderId =
                typeof data.message.sender === 'string'
                    ? data.message.sender
                    : data.message.sender._id;
            if (senderId !== currentUserId) {
                markMessagesSeen(id as string);
            }
        };

        // P0-3: Fixed O(n×m) scan — added mutated bail-out so React Query skips
        //        re-render when nothing actually changed (e.g., duplicate event).
        const handleMessagesSeen = (data: any) => {
            if (data.conversationId !== id) return;
            const seenByUserId = data.seenBy;
            queryClient.setQueryData(['messages', id], (oldData: any) => {
                if (!oldData?.pages) return oldData;
                let mutated = false;
                const newPages = oldData.pages.map((page: Message[]) =>
                    page.map((msg: Message) => {
                        const senderId =
                            typeof msg.sender === 'string' ? msg.sender : msg.sender._id;
                        if (senderId === currentUserId && !msg.seenBy.includes(seenByUserId)) {
                            mutated = true;
                            return { ...msg, seenBy: [...msg.seenBy, seenByUserId], status: 'read' };
                        }
                        return msg;
                    })
                );
                // Bail out — returning the same reference prevents a re-render
                return mutated ? { ...oldData, pages: newPages } : oldData;
            });
        };

        // P0-2: Fixed O(n×m) scan — early-exit once the target message is found.
        //        Previously iterated every page and every message for a single delivery ack.
        const handleMessageDelivered = (data: any) => {
            if (data.conversationId !== id) return;
            queryClient.setQueryData(['messages', id], (oldData: any) => {
                if (!oldData?.pages) return oldData;
                let found = false;
                const newPages = oldData.pages.map((page: Message[]) => {
                    if (found) return page; // skip remaining pages once located
                    const newPage = page.map((msg: Message) => {
                        if (msg._id === data.temporaryId) {
                            found = true;
                            return { ...data.message, status: data.status };
                        }
                        return msg;
                    });
                    return found ? newPage : page;
                });
                return found ? { ...oldData, pages: newPages } : oldData;
            });
        };

        const handleMessageFailed = (data: any) => {
            if (data.conversationId !== id) return;
            queryClient.setQueryData(['messages', id], (oldData: any) => {
                if (!oldData || !oldData.pages) return oldData;
                return {
                    ...oldData,
                    pages: oldData.pages.map((page: Message[]) =>
                        page.filter((msg) => msg._id !== data.temporaryId)
                    ),
                };
            });
            Alert.alert('Error', 'Failed to send message.');
        };

        socket.on('new_message', handleNewMessage);
        socket.on('messages_seen', handleMessagesSeen);
        socket.on('message_delivered', handleMessageDelivered);
        socket.on('message_failed', handleMessageFailed);

        return () => {
            console.log('[Chat] Detaching listeners for conversation:', id);
            socket.off('new_message', handleNewMessage);
            socket.off('messages_seen', handleMessagesSeen);
            socket.off('message_delivered', handleMessageDelivered);
            socket.off('message_failed', handleMessageFailed);
        };
    }, [id, currentUserId, socket]); // P1-2: currentUserId, not user

    useEffect(() => {
        if (id) {
            markMessagesSeen(id as string);
        }
    }, [id]);

    // P0-4: Removed setSending(true/false) — `sending` was never consumed in JSX.
    const handleSend = useCallback(
        async (text: string) => {
            if (!text.trim()) return;
            playSendSound();

            // P2-2: generateObjectId is now module-level — not recreated per call
            const temporaryId = generateObjectId();

            const optimisticMessage: Message = {
                _id: temporaryId,
                conversationId: id as string,
                sender: currentUserId || '',
                text,
                type: 'text',
                status: 'sent',
                seenBy: [currentUserId || ''],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            // 1. Optimistic Update — immediate UI feedback
            queryClient.setQueryData(['messages', id], (oldData: any) => {
                if (!oldData || !oldData.pages)
                    return { pages: [[optimisticMessage]], pageParams: [1] };
                return {
                    ...oldData,
                    pages: [[optimisticMessage, ...oldData.pages[0]], ...oldData.pages.slice(1)],
                };
            });

            // 2. Try Socket Emit first
            if (socket && socket.connected) {
                socket.emit('send_message', {
                    temporaryId,
                    senderId: currentUserId,
                    conversationId: id,
                    text,
                    type: 'text',
                });
                socket.emit('typing_end', { conversationId: id });
                if (myTypingTimeoutRef.current) clearTimeout(myTypingTimeoutRef.current);
            } else {
                // 3. Fallback to REST API
                try {
                    const res = await sendMessage(id as string, text, 'text', temporaryId);
                    if (res.success) {
                        queryClient.setQueryData(['messages', id], (oldData: any) => {
                            if (!oldData || !oldData.pages)
                                return { pages: [[res.data]], pageParams: [1] };
                            return {
                                ...oldData,
                                pages: oldData.pages.map((page: Message[]) =>
                                    page.map((m) => (m._id === temporaryId ? res.data : m))
                                ),
                            };
                        });
                    }
                } catch (error) {
                    console.error(error);
                    queryClient.setQueryData(['messages', id], (oldData: any) => {
                        if (!oldData || !oldData.pages) return oldData;
                        return {
                            ...oldData,
                            pages: oldData.pages.map((page: Message[]) =>
                                page.filter((m) => m._id !== temporaryId)
                            ),
                        };
                    });
                    chatInputRef.current?.setText(text);
                    Alert.alert('Error', 'Failed to send message. Conversation might be blocked.');
                }
            }
        },
        [id, queryClient, socket, currentUserId]
    );

    // P1-7: router.back() instead of router.push() — push() added a new entry to
    //        the navigation stack on every back press, growing it without bound.
    const handleBack = useCallback(() => {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace('/(drawer)/(tabs)/chat' as any);
        }
    }, [router]);


    //        derived from query cache. invalidateQueries refreshes the derived values.
    const handleBlockAction = useCallback(async () => {
        if (!id) return;

        if (blockedByMe) {
            onConfirmActionRef.current = async () => {
                handleModalClose();
                try {
                    const res = await unblockConversation(id as string);
                    if (res.success) {
                        queryClient.invalidateQueries({ queryKey: ['conversationDetails', id] });
                    }
                } catch (e) {
                    Alert.alert('Error', 'Failed to unblock user');
                }
            };
            setModalVisible(true);
        } else {
            onConfirmActionRef.current = async () => {
                handleModalClose();
                try {
                    const res = await blockConversation(id as string);
                    if (res.success) {
                        queryClient.invalidateQueries({ queryKey: ['conversationDetails', id] });
                    }
                } catch (e) {
                    Alert.alert('Error', 'Failed to block user');
                }
            };
            setModalVisible(true);
        }
    }, [id, blockedByMe, queryClient, handleModalClose]);

    const renderItem = useCallback(
        ({ item }: { item: Message }) => (
            <MessageItem item={item} currentUserId={currentUserId} isDark={isDark} />
        ),
        [currentUserId, isDark]
    );

    const keyExtractor = useCallback((item: Message) => item._id, []);

    const handleTyping = useCallback(() => {
        if (socket && socket.connected) {
            socket.emit('typing_start', { conversationId: id });
            if (myTypingTimeoutRef.current) clearTimeout(myTypingTimeoutRef.current);
            myTypingTimeoutRef.current = setTimeout(() => {
                socket.emit('typing_end', { conversationId: id });
            }, 2000);
        }
    }, [id, socket]);

    // P2-4: Stabilize PanGestureHandler props — both were new references every render.
    const panActiveOffset = useMemo<[number, number]>(() => [0, 20], []);
    const handleGestureEvent = useCallback(
        ({ nativeEvent }: any) => {
            if (nativeEvent.translationX > 50) handleBack();
        },
        [handleBack]
    );

    // P2-5: Stable maintainVisibleContentPosition config.
    //        FlashList v2 uses its own type (not RN ScrollView's minIndexForVisible).
    //        autoscrollToTopThreshold keeps the viewport anchored when older messages
    //        are prepended at the top during pagination.
    const maintainPosition = useMemo(
        () => ({
            autoscrollToTopThreshold: 10,
            startRenderingFromBottom: true
        }),
        []
    );

    // P2-5: Stable onEndReached handler
    const handleEndReached = useCallback(() => {
        if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    return (
        // P2-3: GestureHandlerRootView REMOVED — it already exists in app/_layout.tsx (L281).
        //        Mounting it per-screen created a redundant gesture context on every chat mount.
        <>
            <BlockConfirmationModal
                visible={modalVisible}
                onClose={handleModalClose}
                onConfirm={onConfirmActionRef.current}
                isBlockedByMe={blockedByMe}
            />

            <PanGestureHandler
                onGestureEvent={handleGestureEvent}
                activeOffsetX={panActiveOffset}
            >
                <ThemedView style={styles.container}>
                    <ChatHeader
                        conversationId={id as string}
                        name={name as string}
                        profileImage={profileImage as string}
                        currentUserId={currentUserId}
                        blockedByMe={blockedByMe}
                        onBack={handleBack}
                        onBlock={handleBlockAction}
                    />

                    {/* P0-1 (loading): Keep FlashList mounted; overlay spinner to avoid cold-mount flash */}
                    <View style={{ flex: 1 }}>
                        {isLoading && (
                            <View style={[StyleSheet.absoluteFillObject, styles.center]}>
                                <ActivityIndicator size="large" color={Colors[theme].tint} />
                            </View>
                        )}
                        <FlashList
                            ref={flatListRef}
                            data={isLoading ? [] : messages}
                            renderItem={renderItem}
                            keyExtractor={keyExtractor}
                            contentContainerStyle={styles.listContent}
                            keyboardShouldPersistTaps="handled"
                            onEndReached={handleEndReached}
                            onEndReachedThreshold={0.3}
                            maintainVisibleContentPosition={maintainPosition}
                        />
                    </View>

                    {/* P1-5: Fixed Android behavior — both branches previously returned 'padding' */}
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
                    >
                        {isBlocked ? (
                            <View
                                style={[
                                    styles.blockedContainer,
                                    { backgroundColor: isDark ? '#0f172a' : '#f1f5f9' },
                                ]}
                            >
                                <ThemedText style={styles.blockedText}>
                                    {blockedByMe
                                        ? 'You have blocked this user.'
                                        : 'You cannot reply to this conversation.'}
                                </ThemedText>
                                {blockedByMe && (
                                    <TouchableOpacity onPress={handleBlockAction}>
                                        <ThemedText
                                            style={{ color: Colors[theme].tint, fontWeight: '600', marginTop: 4 }}
                                        >
                                            Unblock
                                        </ThemedText>
                                    </TouchableOpacity>
                                )}
                            </View>
                        ) : (
                            <ChatInput ref={chatInputRef} onSend={handleSend} onTyping={handleTyping} />
                        )}
                    </KeyboardAvoidingView>
                </ThemedView>
            </PanGestureHandler>
        </>
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
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    receivedBubble: {
        backgroundColor: 'rgba(148, 163, 184, 0.2)',
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        shadowColor: '#000',
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
    blockedContainer: {
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 80,
    },
    blockedText: {
        color: '#94a3b8',
        textAlign: 'center',
    },
});
