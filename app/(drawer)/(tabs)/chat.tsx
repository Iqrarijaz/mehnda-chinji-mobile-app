import { getConversationsLines } from '@/apis/chat/chat';
import { analyticsService, AnalyticsEvents } from '@/analytics';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useSocket } from '@/context/SocketContext';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Conversation, ConversationSource } from '@/types/chat';
import { StorageKeys, getStorageData, setStorageData } from '@/utils/storage';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect, useRouter, Stack } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, TextInput, TouchableOpacity, View, Platform } from 'react-native';
import { ChatCardSkeleton } from '@/components/common/CardSkeletons';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { ScreenHeader } from '@/components/common/ScreenHeader';
import Avatar from '@/components/ui/avatar';
import { useChatUiStore } from '@/store/chatUiStore';



export default function ChatListScreen() {
    const { theme, isDark } = useTheme();
    const { user } = useAuth();
    const router = useRouter();
    const queryClient = useQueryClient();
    const { socket } = useSocket();
    const [searchQuery, setSearchQuery] = useState('');
    const colors = Colors[theme];

    const { data: conversations = [], isLoading, refetch, isRefetching } = useQuery({
        queryKey: ['conversations'],
        queryFn: async () => {
            const res = await getConversationsLines() as any;
            if (res.success) {
                setStorageData(StorageKeys.CONVERSATIONS, res.data);
                return res.data;
            }
            return [];
        },
        initialData: () => {
            const cached = getStorageData<Conversation[]>(StorageKeys.CONVERSATIONS);
            return cached || undefined;
        },
        enabled: !!user?.user?._id,
    });

    const setChatActive = useChatUiStore((s) => s.setChatActive);

    useFocusEffect(
        useCallback(() => {
            setChatActive(true);
            return () => setChatActive(false);
        }, [setChatActive])
    );

    useFocusEffect(
        useCallback(() => {
            refetch();
        }, [])
    );

    const filteredConversations = useMemo(() => {
        if (!searchQuery.trim()) return conversations;

        return conversations.filter((item: Conversation) => {
            const currentUserId = user?.user?._id?.toString();
            let otherParticipant = item.participants.find((p: any) => {
                const pId = typeof p === 'string' ? p : p._id;
                return pId && pId.toString() !== currentUserId;
            }) as any;

            if (!otherParticipant && item.participants.length > 0) {
                otherParticipant = item.participants[0];
            }

            const displayName = (typeof otherParticipant === 'object' ? otherParticipant?.name : 'Unknown User') || 'Unknown User';
            const matchesName = displayName.toLowerCase().includes(searchQuery.toLowerCase());

            // Optional: Filter by source if query matches source name (e.g. "Business")
            const matchesSource = item.source && typeof item.source === 'string' && item.source.toLowerCase().includes(searchQuery.toLowerCase());

            return matchesName || matchesSource;
        });
    }, [conversations, searchQuery, user]);

    useEffect(() => {
        if (searchQuery.trim()) {
            const timer = setTimeout(() => {
                analyticsService.trackEvent(AnalyticsEvents.SEARCH_USED, { query: searchQuery, category: 'chat' });
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [searchQuery]);

    useEffect(() => {
        if (socket) {
            socket.on('new_message', (data: any) => {
                updateConversation(data);
            });

            return () => {
                socket.off('new_message');
            };
        }
    }, [socket]);

    const updateConversation = (data: any) => {
        queryClient.setQueryData(['conversations'], (oldData: Conversation[] | undefined) => {
            if (!oldData) return [];

            const newConvos = [...oldData];
            const index = newConvos.findIndex(c => c._id === data.conversationId);

            if (index > -1) {
                const updated = { ...newConvos[index], ...data.conversationUpdate };
                // Move to top
                newConvos.splice(index, 1);
                newConvos.unshift(updated);
                setStorageData(StorageKeys.CONVERSATIONS, newConvos); // Update cache
                return newConvos;
            } else {
                queryClient.invalidateQueries({ queryKey: ['conversations'] });
                return oldData;
            }
        });
    };

    const onRefresh = () => {
        refetch();
    };

    const renderItem = ({ item }: { item: Conversation }) => {
        const currentUserId = user?.user?._id?.toString();

        let otherParticipant = item.participants.find((p: any) => {
            const pId = typeof p === 'string' ? p : p._id;
            return pId && pId.toString() !== currentUserId;
        }) as any;

        if (!otherParticipant && item.participants.length > 0) {
            otherParticipant = item.participants[0];
        }

        const displayName = (typeof otherParticipant === 'object' ? otherParticipant?.name : 'Unknown User') || 'Unknown User';
        const profileImage = typeof otherParticipant === 'object' ? otherParticipant?.profileImage : null;

        const isUnread = item.unreadCount && currentUserId && item.unreadCount[currentUserId] > 0;

        // Safety check for unread count access
        const unreadCount = (item.unreadCount && currentUserId) ? (item.unreadCount[currentUserId] || 0) : 0;


        return (
            <TouchableOpacity
                onPress={() => router.push({
                    pathname: '/chat/[id]',
                    params: {
                        id: item._id,
                        name: displayName,
                        profileImage: profileImage || ''
                    }
                })}
                activeOpacity={0.8}
            >
                <View style={[styles.card, { backgroundColor: colors.card }]}>
                    <View style={styles.cardContent}>
                        <Avatar
                            uri={profileImage as string}
                            name={displayName}
                            size={50}
                        />
                        <View style={styles.contentContainer}>
                            <View style={styles.headerRow}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                                    <ThemedText style={styles.name} numberOfLines={1}>{displayName}</ThemedText>
                                    {item.source && item.source !== 'NONE' && (
                                        <View style={[
                                            styles.sourceBadge,
                                            // @ts-ignore
                                            {
                                                backgroundColor:
                                                    item.source === ConversationSource.BUSINESS ? '#3b82f6' :
                                                        item.source === ConversationSource.DONOR ? '#ef4444' : '#a855f7' // Purple for MULTIPLE/Others
                                            }
                                        ]}>
                                            <ThemedText style={styles.sourceText}>
                                                {/* @ts-ignore */}
                                                {
                                                    item.source === ConversationSource.BUSINESS ? 'BUS' :
                                                        item.source === ConversationSource.DONOR ? 'DNR' : 'MUL'
                                                }
                                            </ThemedText>
                                        </View>
                                    )}
                                </View>
                                <ThemedText style={styles.time}>
                                    {new Date(item.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </ThemedText>
                            </View>
                            <View style={styles.messageRow}>
                                <ThemedText
                                    style={[styles.message, { color: isUnread ? Colors[theme].text : Colors[theme].icon }]}
                                    numberOfLines={1}
                                >
                                    {item.lastMessageBy === currentUserId ? 'You: ' : ''}{item.lastMessage || 'Start a conversation'}
                                </ThemedText>
                                {isUnread && (
                                    <View style={styles.badge}>
                                        <ThemedText style={styles.badgeText}>{unreadCount}</ThemedText>
                                    </View>
                                )}
                            </View>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const loading = isLoading || (isRefetching && filteredConversations.length === 0);

    if (loading) {
        return (
            <ThemedView style={styles.container}>
                <Stack.Screen options={{ headerShown: false }} />
                <View style={styles.listContent}>
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <ChatCardSkeleton key={i} />
                    ))}
                </View>
            </ThemedView>
        );
    }

    return (
        <ErrorBoundary>
            <ThemedView style={styles.container}>
                <Stack.Screen options={{ headerShown: false }} />

                <ScreenHeader>
                    {/* Search Bar */}
                    <View style={styles.searchSection}>
                        <View style={styles.searchRow}>
                            <View style={[styles.searchInputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                <Ionicons name="search" size={20} color="#94A3B8" style={{ marginRight: 10 }} />
                                <TextInput
                                    style={[styles.searchInput, { color: colors.text }]}
                                    placeholder="Search chats..."
                                    placeholderTextColor="#94A3B8"
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                    returnKeyType="search"
                                    clearButtonMode="while-editing"
                                />
                            </View>
                        </View>
                    </View>
                </ScreenHeader>

                <FlatList
                    data={filteredConversations}
                    renderItem={renderItem}
                    keyExtractor={item => item._id}
                    onRefresh={onRefresh}
                    refreshing={isRefetching}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="chatbubbles-outline" size={64} color={Colors[theme].icon} />
                            <ThemedText style={styles.emptyText}>No conversations yet</ThemedText>
                        </View>
                    }
                />
            </ThemedView>
        </ErrorBoundary>
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
        padding: 16,
    },
    card: {
        borderRadius: 16,
        padding: 12,
        marginBottom: 8,
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#e2e8f0',
    },
    contentContainer: {
        flex: 1,
        marginLeft: 12,
        justifyContent: 'center',
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    name: {
        fontSize: 16,
        textTransform: 'capitalize',
        fontWeight: '600',
    },
    time: {
        fontSize: 12,
        color: '#94a3b8',
    },
    messageRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    message: {
        fontSize: 14,
        flex: 1,
    },
    badge: {
        backgroundColor: '#ef4444',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 6,
        marginLeft: 8,
    },
    badgeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    },
    sourceBadge: {
        paddingHorizontal: 4,
        paddingVertical: 2,
        borderRadius: 4,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sourceText: {
        color: 'white',
        fontSize: 8,
        fontWeight: '800',
        letterSpacing: 0.2,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 100,
    },
    emptyText: {
        marginTop: 16,
        color: '#94a3b8',
    },
    searchSection: {
        marginBottom: 8,
    },
    searchRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    searchInputContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        height: 42,
        borderWidth: 1,
        borderRadius: 22,
        paddingHorizontal: 16,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        paddingVertical: 8,
    },
});
