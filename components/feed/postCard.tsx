import { Colors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useAddComment, useDeleteComment, usePostComments, useUpdateComment } from '@/hooks/usePosts';
import { formatRelativeTime } from '@/utils/dateUtils';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, Share, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '../themedText';
import { ThemedView } from '../themedView';
import Avatar from '../ui/avatar';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 40;

export interface PostData {
    _id: string;
    content: string;
    images: string[];
    type: 'GENERAL' | 'DEATH' | 'ACCIDENT';
    likesCount: number;
    commentsCount: number;
    isLiked?: boolean;
    createdBy: {
        _id: string;
        name: string;
        profileImage?: string;
    };
    createdAt: string;
    metadata?: any;
}

interface PostCardProps {
    post: PostData;
    onLike?: (postId: string) => void;
    onPress?: (postId: string) => void;
    onViewImage?: (images: string[], index: number) => void;
}

export const PostCard: React.FC<PostCardProps> = React.memo(({ post, onLike, onPress, onViewImage }) => {
    const { theme } = useTheme();
    const { user } = useAuth();
    const colors = Colors[theme];
    const [isExpanded, setIsExpanded] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [showFullContent, setShowFullContent] = useState(false);

    const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
    const [editingText, setEditingText] = useState('');

    const displayContent = useMemo(() => {
        if (post.type === 'DEATH') {
            const prefix = "إِنَّا لِلّهِ وَإِنَّـا إِلَيْهِ رَاجِعونَ\n\n";
            // Prepend if not already present
            if (!post.content.startsWith("إِنَّا لِلّهِ وَإِنَّـا إِلَيْهِ رَاجِعونَ")) {
                return prefix + post.content;
            }
        }
        return post.content;
    }, [post.content, post.type]);

    const {
        data: commentsData,
        isLoading: commentsLoading,
        refetch: refetchComments
    } = usePostComments(post._id, null, isExpanded);

    const addCommentMutation = useAddComment();
    const deleteCommentMutation = useDeleteComment();
    const updateCommentMutation = useUpdateComment();

    const comments = useMemo(() => {
        return commentsData?.pages.flatMap((page: any) => page.data) || [];
    }, [commentsData]);

    const displayComments = useMemo(() => {
        if (isExpanded) return [...comments].reverse();
        return [...comments.slice(0, 2)].reverse();
    }, [comments, isExpanded]);

    const handleCommentToggle = useCallback(() => {
        setIsExpanded(!isExpanded);
    }, [isExpanded]);

    const handleDeleteComment = async (commentId: string) => {
        try {
            await deleteCommentMutation.mutateAsync(commentId);
        } catch (error) {
            console.error('Failed to delete comment:', error);
        }
    };

    const handleEditComment = (comment: any) => {
        setEditingCommentId(comment._id);
        setEditingText(comment.text);
    };

    const handleUpdateComment = async () => {
        if (!editingCommentId || !editingText.trim() || updateCommentMutation.isPending) return;
        try {
            await updateCommentMutation.mutateAsync({
                commentId: editingCommentId,
                text: editingText.trim()
            });
            setEditingCommentId(null);
            setEditingText('');
        } catch (error) {
            console.error('Failed to update comment:', error);
        }
    };

    const canEditComment = useCallback((comment: any) => {
        if (!user?.user) return false;
        const currentUserId = user.user._id || user.user.id;
        const commentUserId = comment.userId?._id || comment.userId;

        if (!currentUserId || !commentUserId) return false;
        if (currentUserId.toString() !== commentUserId.toString()) return false;

        const now = new Date();
        const commentTime = new Date(comment.createdAt);
        const diffInMinutes = (now.getTime() - commentTime.getTime()) / (1000 * 60);
        return diffInMinutes <= 30;
    }, [user]);

    const canDeleteComment = useCallback((comment: any) => {
        if (!user?.user) return false;
        const currentUserId = user.user._id || user.user.id;
        const commentUserId = comment.userId?._id || comment.userId;

        if (!currentUserId || !commentUserId) return false;
        if (currentUserId.toString() !== commentUserId.toString()) return false;

        const now = new Date();
        const commentTime = new Date(comment.createdAt);
        const diffInMinutes = (now.getTime() - commentTime.getTime()) / (1000 * 60);
        return diffInMinutes <= 30;
    }, [user]);

    const handleAddComment = async () => {
        if (!commentText.trim() || addCommentMutation.isPending) return;
        try {
            await addCommentMutation.mutateAsync({
                postId: post._id,
                text: commentText.trim()
            });
            setCommentText('');
            if (!isExpanded) setIsExpanded(true);
        } catch (error) {
            console.error('Failed to add comment:', error);
        }
    };

    const handleShare = async () => {
        try {
            let message = post.content;

            if (post.images && post.images.length > 0) {
                message += `\n\n${post.images[0]}`;
            }

            message += `\n\nShared from Rehbar App`;

            await Share.share({
                message,
                title: 'Share Post'
            });
        } catch (error) {
            console.error('Error sharing post:', error);
        }
    };

    const getTypeIcon = () => {
        switch (post.type) {
            case 'DEATH': return 'megaphone';
            case 'ACCIDENT': return 'warning';
            default: return 'megaphone';
        }
    };

    const getTypeColor = () => {
        switch (post.type) {
            case 'DEATH': return '#000000';
            case 'ACCIDENT': return '#EF4444';
            default: return colors.primary;
        }
    };

    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const onViewableItemsChanged = React.useRef(({ viewableItems }: any) => {
        if (viewableItems.length > 0) {
            setCurrentImageIndex(viewableItems[0].index || 0);
        }
    }).current;

    const viewabilityConfig = React.useRef({
        itemVisiblePercentThreshold: 50
    }).current;

    return (
        <ThemedView style={styles.container}>
            <TouchableOpacity activeOpacity={0.9} onPress={() => onPress?.(post._id)}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerInfo}>
                        <View style={[styles.typeBadge, { backgroundColor: post.type === 'DEATH' ? 'rgba(0,0,0,0.1)' : `${getTypeColor()}15`, alignSelf: 'flex-start' }]}>
                            <Ionicons name={getTypeIcon() as any} size={14} color={getTypeColor()} />
                            <ThemedText style={[styles.typeText, { color: getTypeColor() }]}>{post.type}</ThemedText>
                        </View>
                    </View>
                    <ThemedText style={styles.timeText}>
                        {formatRelativeTime(post.createdAt)}
                    </ThemedText>
                </View>

                {/* Content */}
                <View style={styles.contentContainer}>
                    <ThemedText style={styles.content}>
                        {displayContent.length > 100 && !showFullContent
                            ? `${displayContent.substring(0, 100)}...`
                            : displayContent}
                        {displayContent.length > 100 && (
                            <ThemedText
                                style={{ color: colors.primary, fontWeight: '600' }}
                                onPress={() => setShowFullContent(!showFullContent)}
                            >
                                {showFullContent ? ' Show less' : ' Show more'}
                            </ThemedText>
                        )}
                    </ThemedText>
                </View>

                {/* Images */}
                {post.images && post.images.length > 0 && (
                    <View style={styles.imageContainer}>
                        {post.images.length === 2 ? (
                            <View style={styles.splitImageContainer}>
                                <TouchableOpacity
                                    activeOpacity={0.9}
                                    style={styles.splitImageWrapper}
                                    onPress={() => onViewImage?.(post.images, 0)}
                                >
                                    <Image
                                        source={{ uri: post.images[0] }}
                                        style={styles.splitImage}
                                        contentFit="cover"
                                        transition={200}
                                    />
                                </TouchableOpacity>
                                <View style={styles.imageGap} />
                                <TouchableOpacity
                                    activeOpacity={0.9}
                                    style={styles.splitImageWrapper}
                                    onPress={() => onViewImage?.(post.images, 1)}
                                >
                                    <Image
                                        source={{ uri: post.images[1] }}
                                        style={styles.splitImage}
                                        contentFit="cover"
                                        transition={200}
                                    />
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <>
                                <FlatList
                                    data={post.images}
                                    horizontal
                                    pagingEnabled
                                    showsHorizontalScrollIndicator={false}
                                    onViewableItemsChanged={onViewableItemsChanged}
                                    viewabilityConfig={viewabilityConfig}
                                    keyExtractor={(img, index) => `${post._id} -img - ${index} `}
                                    renderItem={({ item, index }) => (
                                        <TouchableOpacity
                                            activeOpacity={0.9}
                                            onPress={() => onViewImage?.(post.images, index)}
                                            style={{ width: CARD_WIDTH, height: '100%' }}
                                        >
                                            <Image
                                                source={{ uri: item }}
                                                style={styles.mainImage}
                                                contentFit="cover"
                                                transition={200}
                                                cachePolicy="memory-disk"
                                            />
                                        </TouchableOpacity>
                                    )}
                                />
                                {post.images.length > 1 && (
                                    <View style={styles.imageBadge}>
                                        <ThemedText style={styles.imageBadgeText}>{currentImageIndex + 1} / {post.images.length}</ThemedText>
                                    </View>
                                )}
                            </>
                        )}
                    </View>
                )}

                {/* Footer */}
                <View style={styles.footer}>
                    <TouchableOpacity style={styles.footerAction} onPress={() => onLike?.(post._id)}>
                        <Ionicons
                            name={post.isLiked ? "heart" : "heart-outline"}
                            size={20}
                            color={post.isLiked ? "#EF4444" : colors.icon}
                        />
                        <ThemedText style={[styles.footerText, post.isLiked && { color: "#EF4444" }]}>
                            {post.likesCount || 0}
                        </ThemedText>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.footerAction} onPress={handleCommentToggle}>
                        <Ionicons name="chatbubble-outline" size={18} color={isExpanded ? colors.primary : colors.icon} />
                        <ThemedText style={[styles.footerText, isExpanded && { color: colors.primary }]}>{post.commentsCount || 0}</ThemedText>
                    </TouchableOpacity>

                    <View style={{ flex: 1 }} />

                    <TouchableOpacity style={styles.shareAction} onPress={handleShare}>
                        <Ionicons name="share-social-outline" size={18} color={colors.icon} />
                    </TouchableOpacity>
                </View>

                {/* Inline Comments Section */}
                {(isExpanded || post.commentsCount > 0) && (
                    <View style={styles.commentsSection}>
                        {displayComments.map((comment: any) => (
                            <View key={comment._id} style={styles.commentItem}>
                                <Avatar
                                    uri={comment.userId?.profileImage}
                                    name={comment.userId?.name}
                                    size={32}
                                    style={styles.commentAvatar}
                                />
                                <View style={styles.commentBubble}>
                                    <View style={styles.commentHeader}>
                                        <ThemedText style={styles.commentUser} numberOfLines={1}>
                                            {comment.userId?.name
                                                ? comment.userId.name.split(' ').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
                                                : 'Anonymous'}
                                        </ThemedText>
                                        <ThemedText style={styles.commentTime}>
                                            • {formatRelativeTime(comment.createdAt)}
                                        </ThemedText>

                                        <View style={{ flex: 1 }} />

                                        {canEditComment(comment) && (
                                            <TouchableOpacity
                                                style={styles.editButton}
                                                onPress={() => handleEditComment(comment)}
                                                disabled={updateCommentMutation.isPending}
                                            >
                                                <Ionicons name="create-outline" size={14} color={colors.primary} />
                                            </TouchableOpacity>
                                        )}

                                        {canDeleteComment(comment) && (
                                            <TouchableOpacity
                                                style={styles.deleteButton}
                                                onPress={() => handleDeleteComment(comment._id)}
                                                disabled={deleteCommentMutation.isPending}
                                            >
                                                <Ionicons name="trash-outline" size={14} color="#EF4444" />
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                    {editingCommentId === comment._id ? (
                                        <View style={styles.editInputContainer}>
                                            <TextInput
                                                style={[styles.editInput, { color: colors.text }]}
                                                value={editingText}
                                                onChangeText={setEditingText}
                                                multiline
                                                autoFocus
                                            />
                                            <View style={styles.editActions}>
                                                <TouchableOpacity onPress={() => setEditingCommentId(null)} style={styles.editCancel}>
                                                    <ThemedText style={styles.editCancelText}>Cancel</ThemedText>
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    onPress={handleUpdateComment}
                                                    style={[styles.editSave, { backgroundColor: colors.primary }]}
                                                    disabled={updateCommentMutation.isPending}
                                                >
                                                    {updateCommentMutation.isPending ? (
                                                        <ActivityIndicator size="small" color="#fff" />
                                                    ) : (
                                                        <ThemedText style={styles.editSaveText}>Save</ThemedText>
                                                    )}
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    ) : (
                                        <ThemedText style={styles.commentText}>{comment.text}</ThemedText>
                                    )}
                                </View>
                            </View>
                        ))}

                        {post.commentsCount > 3 && (
                            <TouchableOpacity style={styles.seeMoreButton} onPress={handleCommentToggle}>
                                <ThemedText style={[styles.seeMoreText, { color: colors.primary }]}>
                                    {isExpanded ? 'See less' : `See more ${post.commentsCount} comments`}
                                </ThemedText>
                            </TouchableOpacity>
                        )}

                        <View style={styles.inlineInputContainer}>
                            <Avatar
                                uri={user?.user?.profileImage}
                                name={user?.user?.name}
                                size={28}
                                style={styles.smallAvatar}
                            />
                            <View style={[styles.inputWrapper, { backgroundColor: theme === 'light' ? '#F1F5F9' : '#1E293B' }]}>
                                <TextInput
                                    style={[styles.inlineInput, { color: colors.text }]}
                                    placeholder="Write a comment..."
                                    placeholderTextColor={colors.icon}
                                    value={commentText}
                                    onChangeText={setCommentText}
                                    onSubmitEditing={handleAddComment}
                                />
                                {commentText.length > 0 && (
                                    <TouchableOpacity onPress={handleAddComment} disabled={addCommentMutation.isPending}>
                                        {addCommentMutation.isPending ? (
                                            <ActivityIndicator size="small" color={colors.primary} />
                                        ) : (
                                            <Ionicons name="send" size={16} color={colors.primary} />
                                        )}
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    </View>
                )}
            </TouchableOpacity>

            {/* Image Viewer Moved to FeedScreen */}
        </ThemedView>
    );
});

const styles = StyleSheet.create({
    container: {
        marginHorizontal: 16,
        marginTop: 12,
        marginBottom: 4,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingTop: 12,
        paddingBottom: 8,
    },
    headerInfo: {
        flex: 1,
    },
    timeText: {
        fontSize: 12,
        opacity: 0.6,
    },
    typeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 4,
    },
    typeText: {
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'lowercase',
    },
    contentContainer: {
        paddingHorizontal: 16,
        paddingBottom: 12,
    },
    content: {
        fontSize: 14,
        lineHeight: 20,
    },
    imageContainer: {
        width: '100%',
        height: width * 0.6,
        backgroundColor: '#f5f5f5',
        position: 'relative',
    },
    mainImage: {
        width: '100%',
        height: '100%',
    },
    imageBadge: {
        position: 'absolute',
        bottom: 12,
        right: 12,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
    },
    imageBadgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        paddingTop: 8,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: 'rgba(0,0,0,0.05)',
    },
    footerAction: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 24,
        gap: 6,
    },
    footerText: {
        fontSize: 13,
        fontWeight: '600',
        opacity: 0.8,
    },
    shareAction: {
        padding: 4,
    },
    commentsSection: {
        paddingHorizontal: 16,
        paddingBottom: 16,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: 'rgba(0,0,0,0.05)',
        paddingTop: 12,
    },
    commentItem: {
        flexDirection: 'row',
        marginBottom: 12,
        gap: 10,
    },
    commentAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
    },
    commentBubble: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.03)',
        padding: 10,
        borderRadius: 12,
    },
    commentHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 2,
        gap: 4,
    },
    commentUser: {
        fontSize: 13,
        fontWeight: '700',
    },
    commentTime: {
        fontSize: 10,
        opacity: 0.5,
    },
    commentText: {
        fontSize: 13,
        lineHeight: 18,
    },
    seeMoreButton: {
        paddingVertical: 4,
        marginBottom: 8,
    },
    seeMoreText: {
        fontSize: 13,
        fontWeight: '600',
    },
    deleteButton: {
        marginLeft: 8,
        padding: 4,
    },
    editButton: {
        marginLeft: 8,
        padding: 4,
    },
    editInputContainer: {
        marginTop: 4,
    },
    editInput: {
        fontSize: 13,
        padding: 8,
        borderRadius: 8,
        backgroundColor: 'rgba(0,0,0,0.05)',
        minHeight: 40,
    },
    editActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 8,
        gap: 8,
    },
    editCancel: {
        paddingHorizontal: 12,
        paddingVertical: 2,
    },
    editCancelText: {
        fontSize: 12,
        opacity: 0.6,
    },
    editSave: {
        paddingHorizontal: 12,
        paddingVertical: 2,
        borderRadius: 6,
    },
    editSaveText: {
        fontSize: 12,
        color: '#fff',
        fontWeight: '700',
    },
    inlineInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginTop: 4,
    },
    smallAvatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
    },
    inputWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    inlineInput: {
        flex: 1,
        fontSize: 13,
        paddingVertical: 4,
    },
    splitImageContainer: {
        flexDirection: 'row',
        height: '100%',
    },
    splitImageWrapper: {
        flex: 1,
        height: '100%',
    },
    splitImage: {
        width: '100%',
        height: '100%',
    },
    imageGap: {
        width: 2,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    viewerContainer: {
        flex: 1,
        backgroundColor: '#000',
    },
    viewerHeader: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        paddingTop: 50,
        paddingHorizontal: 20,
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    closeButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    viewerImageWrapper: {
        width: width,
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullImage: {
        width: '100%',
        height: '100%',
    },
});
