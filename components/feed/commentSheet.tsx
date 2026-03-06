import { CommentData } from '@/apis/posts';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { useAddComment, useDeleteComment, usePostComments } from '@/hooks/usePosts';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '../themedText';
import { ThemedView } from '../themedView';

interface CommentSheetProps {
    isVisible: boolean;
    onClose: () => void;
    postId: string;
}

export const CommentSheet: React.FC<CommentSheetProps> = React.memo(({ isVisible, onClose, postId }) => {
    const { theme } = useTheme();
    const colors = Colors[theme];
    const insets = useSafeAreaInsets();
    const [commentText, setCommentText] = useState('');
    const [replyTo, setReplyTo] = useState<CommentData | null>(null);

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        refetch
    } = usePostComments(postId);

    const addCommentMutation = useAddComment();
    const deleteCommentMutation = useDeleteComment();

    const comments = data?.pages.flatMap((page: any) => page.data) || [];

    const handleSubmit = async () => {
        if (!commentText.trim() || addCommentMutation.isPending) return;

        try {
            await addCommentMutation.mutateAsync({
                postId,
                text: commentText.trim(),
                parentCommentId: replyTo?._id
            });
            setCommentText('');
            setReplyTo(null);
        } catch (error) {
            console.error('Failed to add comment:', error);
        }
    };

    const handleDelete = (commentId: string) => {
        deleteCommentMutation.mutate(commentId);
    };

    const renderComment = ({ item }: { item: CommentData }) => (
        <View style={styles.commentItem}>
            <ThemedView style={styles.commentContent}>
                <View style={styles.commentHeader}>
                    <ThemedText style={styles.commentUser}>{item.userId.name}</ThemedText>
                    <ThemedText style={styles.commentTime}>
                        {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                    </ThemedText>
                </View>
                <ThemedText style={styles.commentText}>{item.text}</ThemedText>

                <View style={styles.commentActions}>
                    <TouchableOpacity onPress={() => setReplyTo(item)}>
                        <ThemedText style={[styles.actionText, { color: colors.primary }]}>Reply</ThemedText>
                    </TouchableOpacity>
                    {/* Add delete button if user is owner - for now assuming user info is available */}
                    <TouchableOpacity onPress={() => handleDelete(item._id)}>
                        <ThemedText style={[styles.actionText, { color: '#EF4444' }]}>Delete</ThemedText>
                    </TouchableOpacity>
                </View>

                {item.repliesCount > 0 && (
                    <TouchableOpacity style={styles.viewReplies}>
                        <Ionicons name="return-down-forward" size={14} color={colors.primary} />
                        <ThemedText style={[styles.repliesText, { color: colors.primary }]}>
                            View {item.repliesCount} replies
                        </ThemedText>
                    </TouchableOpacity>
                )}
            </ThemedView>
        </View>
    );

    return (
        <Modal
            visible={isVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <TouchableOpacity
                style={styles.overlay}
                activeOpacity={1}
                onPress={onClose}
            />
            <ThemedView style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
                <View style={[styles.handle, { backgroundColor: colors.border }]} />

                <View style={styles.header}>
                    <ThemedText style={styles.headerTitle}>Comments</ThemedText>
                    <TouchableOpacity onPress={onClose}>
                        <Ionicons name="close" size={24} color={colors.text} />
                    </TouchableOpacity>
                </View>

                {isLoading ? (
                    <ActivityIndicator style={styles.loader} color={colors.primary} />
                ) : (
                    <FlatList
                        data={comments}
                        renderItem={renderComment}
                        keyExtractor={(item) => item._id}
                        contentContainerStyle={styles.listContent}
                        onEndReached={() => hasNextPage && fetchNextPage()}
                        ListEmptyComponent={() => (
                            <View style={styles.emptyContainer}>
                                <ThemedText style={styles.emptyText}>No comments yet. Be the first to comment!</ThemedText>
                            </View>
                        )}
                    />
                )}

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
                >
                    {replyTo && (
                        <View style={[styles.replyStatus, { backgroundColor: colors.primary + '10' }]}>
                            <ThemedText style={styles.replyStatusText}>
                                Replying to <ThemedText style={{ fontWeight: '700' }}>{replyTo.userId.name}</ThemedText>
                            </ThemedText>
                            <TouchableOpacity onPress={() => setReplyTo(null)}>
                                <Ionicons name="close-circle" size={18} color={colors.primary} />
                            </TouchableOpacity>
                        </View>
                    )}
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                            placeholder="Add a comment..."
                            placeholderTextColor={colors.text + '50'}
                            value={commentText}
                            onChangeText={setCommentText}
                            multiline
                        />
                        <TouchableOpacity
                            style={[styles.sendButton, { backgroundColor: colors.primary }]}
                            onPress={handleSubmit}
                            disabled={!commentText.trim() || addCommentMutation.isPending}
                        >
                            {addCommentMutation.isPending ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Ionicons name="send" size={18} color="#fff" />
                            )}
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </ThemedView>
        </Modal>
    );
});

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    sheet: {
        height: '80%',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        overflow: 'hidden',
    },
    handle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        alignSelf: 'center',
        marginVertical: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 15,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(0,0,0,0.1)',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    loader: {
        marginTop: 40,
    },
    listContent: {
        padding: 20,
        paddingBottom: 100,
    },
    commentItem: {
        marginBottom: 20,
    },
    commentContent: {
        flex: 1,
    },
    commentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    commentUser: {
        fontWeight: '700',
        fontSize: 14,
    },
    commentTime: {
        fontSize: 12,
        opacity: 0.5,
    },
    commentText: {
        fontSize: 14,
        lineHeight: 20,
    },
    commentActions: {
        flexDirection: 'row',
        gap: 16,
        marginTop: 8,
    },
    actionText: {
        fontSize: 13,
        fontWeight: '600',
    },
    viewReplies: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 10,
        paddingLeft: 4,
    },
    repliesText: {
        fontSize: 13,
        fontWeight: '600',
    },
    emptyContainer: {
        alignItems: 'center',
        padding: 40,
    },
    emptyText: {
        textAlign: 'center',
        opacity: 0.5,
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 12,
        paddingHorizontal: 20,
        alignItems: 'center',
        gap: 12,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: 'rgba(0,0,0,0.1)',
    },
    input: {
        flex: 1,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        maxHeight: 100,
        borderWidth: 1,
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    replyStatus: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 8,
    },
    replyStatusText: {
        fontSize: 13,
    }
});
