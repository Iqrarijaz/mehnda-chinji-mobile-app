import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { formatRelativeTime } from '@/utils/dateUtils';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { memo, useCallback, useMemo, useRef, useState } from 'react';
import {
    Dimensions,
    FlatList,
    Platform,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
    ViewToken,
    Share,
    Linking
} from 'react-native';

import { useAuth } from '@/context/AuthContext';
import { useLikePost } from '@/hooks/usePosts';
import { PostData } from './postCard';
import { ThemedText } from '../themedText';
import { ThemedView } from '../themedView';
import { analyticsService, AnalyticsEvents } from '@/analytics';

const { width } = Dimensions.get('window');

interface PostDetailProps {
    post: PostData;
    onViewImage?: (images: string[], index: number) => void;
    onEdit?: (post: PostData) => void;
    onDelete?: (postId: string) => void;
    onReport?: () => void;
    isOwner?: boolean;
}

interface AvatarProps {
    name?: string;
    image?: string;
    colors: any;
    size?: number;
}

interface LikeButtonProps {
    postId: string;
    initialLiked: boolean;
    initialLikes: number;
    colors: any;
}

/* -------------------------------------------------------------------------- */
/*                                   Avatar                                   */
/* -------------------------------------------------------------------------- */

const Avatar = memo(({ name, image, colors, size = 44 }: AvatarProps) => {
    const initial = name?.charAt(0).toUpperCase() || '?';

    if (image) {
        return (
            <Image
                source={{ uri: image }}
                style={[
                    styles.avatar,
                    {
                        width: size,
                        height: size,
                        borderRadius: size / 2,
                    },
                ]}
            />
        );
    }

    return (
        <View
            style={[
                styles.avatarPlaceholder,
                {
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    backgroundColor: colors.primary + '15',
                },
            ]}
        >
            <ThemedText
                style={[
                    styles.avatarInitial,
                    {
                        color: colors.primary,
                        fontSize: size * 0.4,
                    },
                ]}
            >
                {initial}
            </ThemedText>
        </View>
    );
});

Avatar.displayName = 'Avatar';

/* -------------------------------------------------------------------------- */
/*                                Like Button                                 */
/* -------------------------------------------------------------------------- */

const LikeButton = memo(
    ({
        postId,
        initialLiked,
        initialLikes,
        colors,
    }: LikeButtonProps) => {
        const [isLiked, setIsLiked] = useState(initialLiked);
        const [likesCount, setLikesCount] = useState(initialLikes);

        const likePostMutation = useLikePost();

        const handleLike = useCallback(() => {
            setIsLiked(prevLiked => {
                const nextLiked = !prevLiked;

                setLikesCount(prevCount =>
                    nextLiked
                        ? prevCount + 1
                        : Math.max(prevCount - 1, 0)
                );

                if (nextLiked) {
                    analyticsService.trackEvent(AnalyticsEvents.POST_LIKED, { postId });
                }

                return nextLiked;
            });

            likePostMutation.mutate(postId);
        }, [likePostMutation, postId]);

        return (
            <TouchableOpacity
                onPress={handleLike}
                style={styles.interactionButton}
                activeOpacity={0.7}
            >
                <Ionicons
                    name={isLiked ? 'heart' : 'heart-outline'}
                    size={22}
                    color={isLiked ? '#FF3B30' : colors.text + '80'}
                />

                <ThemedText
                    style={[
                        styles.interactionText,
                        {
                            color: isLiked
                                ? '#FF3B30'
                                : colors.text + '80',
                        },
                    ]}
                >
                    {likesCount} Likes
                </ThemedText>
            </TouchableOpacity>
        );
    }
);

LikeButton.displayName = 'LikeButton';

/* -------------------------------------------------------------------------- */
/*                                Post Detail                                 */
/* -------------------------------------------------------------------------- */

export const PostDetail: React.FC<PostDetailProps> = memo(
    ({
        post,
        onViewImage,
        onEdit,
        onDelete,
        onReport,
        isOwner,
    }) => {
        const { theme } = useTheme();
        const { user } = useAuth();

        const colors = Colors[theme];

        const [currentImageIndex, setCurrentImageIndex] = useState(0);

        const displayContent = useMemo(() => {
            if (post.type === 'DEATH') {
                const prefix =
                    'إِنَّا لِلّهِ وَإِنَّـا إِلَيْهِ رَاجِعونَ\n\n';

                if (
                    !post.content.startsWith(
                        'إِنَّا لِلّهِ وَإِنَّـا إِلَيْهِ رَاجِعونَ'
                    )
                ) {
                    return prefix + post.content;
                }
            }

            return post.content;
        }, [post.content, post.type]);

        const getTypeIcon = useCallback(() => {
            switch (post.type) {
                case 'DEATH':
                    return 'megaphone';

                case 'ACCIDENT':
                    return 'warning';

                case 'SPORTS':
                    return 'football';

                default:
                    return 'bookmark';
            }
        }, [post.type]);

        const getTypeColor = useCallback(() => {
            switch (post.type) {
                case 'DEATH':
                    return '#000000';

                case 'ACCIDENT':
                    return '#EF4444';

                case 'SPORTS':
                    return '#4CD964';

                default:
                    return colors.primary;
            }
        }, [post.type, colors.primary]);

        const onViewableItemsChanged = useRef(
            ({
                viewableItems,
            }: {
                viewableItems: ViewToken[];
            }) => {
                if (viewableItems.length > 0) {
                    setCurrentImageIndex(
                        viewableItems[0]?.index || 0
                    );
                }
            }
        ).current;

        const viewabilityConfig = useRef({
            itemVisiblePercentThreshold: 50,
        }).current;

        const canManage =
            isOwner || user?.user?.role === 'APP_ADMIN';

        const renderImage = useCallback(
            ({
                item,
                index,
            }: {
                item: string;
                index: number;
            }) => (
                <TouchableOpacity
                    activeOpacity={0.95}
                    onPress={() =>
                        onViewImage?.(post.images, index)
                    }
                    style={styles.imageWrapper}
                >
                    <Image
                        source={{ uri: item }}
                        style={styles.image}
                        contentFit="cover"
                        transition={300}
                    />
                </TouchableOpacity>
            ),
            [onViewImage, post.images]
        );

        const handleShare = async () => {
            try {
                const shareUrl = `https://api.rehbarapp.com/post/${post._id}`;
                const playStoreUrl = 'https://play.google.com/store/apps/details?id=com.rehbar.community';
                
                await Share.share({
                    title: 'Check out this post on Rehbar',
                    message: `Check out this post on Rehbar: ${shareUrl}\n\nDon't have the app? Get it here: ${playStoreUrl}`,
                    url: shareUrl,
                });
                
                analyticsService.trackEvent(AnalyticsEvents.POST_SHARED, { postId: post._id });
            } catch (error) {
                console.error('Error sharing post:', error);
            }
        };

        return (
            <ThemedView
                style={{
                    flex: 1,
                    backgroundColor: colors.background,
                }}
            >
                <ScrollView
                    style={styles.container}
                    contentContainerStyle={styles.content}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <View
                            style={[
                                styles.typeBadge,
                                {
                                    backgroundColor:
                                        getTypeColor() + '12',
                                },
                            ]}
                        >
                            <Ionicons
                                name={getTypeIcon() as any}
                                size={14}
                                color={getTypeColor()}
                            />

                            <ThemedText
                                style={[
                                    styles.typeText,
                                    {
                                        color: getTypeColor(),
                                    },
                                ]}
                            >
                                {post.type}
                            </ThemedText>
                        </View>

                        <ThemedText style={styles.timeText}>
                            {formatRelativeTime(post.createdAt)}
                        </ThemedText>
                    </View>

                    {/* Content */}
                    <View style={styles.body}>
                        <ThemedText
                            style={[
                                styles.contentBody,
                                {
                                    color: colors.text,
                                },
                            ]}
                        >
                            {displayContent}
                        </ThemedText>
                    </View>

                    {/* Media */}
                    {!!post.images?.length && (
                        <View style={styles.mediaContainer}>
                            <FlatList
                                data={post.images}
                                horizontal
                                pagingEnabled
                                showsHorizontalScrollIndicator={false}
                                onViewableItemsChanged={
                                    onViewableItemsChanged
                                }
                                viewabilityConfig={
                                    viewabilityConfig
                                }
                                keyExtractor={(_, index) =>
                                    `detail-img-${index}`
                                }
                                renderItem={renderImage}
                                removeClippedSubviews
                                initialNumToRender={1}
                                maxToRenderPerBatch={2}
                                windowSize={3}
                            />

                            {post.images.length > 1 && (
                                <View style={styles.imageBadge}>
                                    <ThemedText
                                        style={
                                            styles.imageBadgeText
                                        }
                                    >
                                        {currentImageIndex + 1} /{' '}
                                        {post.images.length}
                                    </ThemedText>
                                </View>
                            )}
                        </View>
                    )}

                    {/* Interactions */}
                    <View
                        style={[
                            styles.interactions,
                            {
                                borderColor:
                                    colors.border + '40',
                            },
                        ]}
                    >
                        <LikeButton
                            postId={post._id}
                            initialLiked={
                                post.isLiked || false
                            }
                            initialLikes={
                                post.likesCount || 0
                            }
                            colors={colors}
                        />

                        <View style={{ flex: 1 }} />

                        <TouchableOpacity
                            style={styles.interactionButton}
                            onPress={handleShare}
                        >
                            <Ionicons
                                name="share-outline"
                                size={20}
                                color={colors.text + '80'}
                            />
                        </TouchableOpacity>

                        {onReport && (
                            <TouchableOpacity
                                style={styles.interactionButton}
                                onPress={onReport}
                            >
                                <Ionicons
                                    name="flag-outline"
                                    size={20}
                                    color="#FF9500"
                                />
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Contributor */}
                    <View
                        style={[
                            styles.contributorCard,
                            {
                                backgroundColor:
                                    colors.card,
                                borderColor:
                                    colors.border + '40',
                            },
                        ]}
                    >
                        <View style={styles.contributorInfo}>
                            <Avatar
                                name={post.createdBy?.name}
                                image={
                                    post.createdBy
                                        ?.profileImage
                                }
                                colors={colors}
                                size={48}
                            />

                            <View
                                style={
                                    styles.contributorTextContainer
                                }
                            >
                                <ThemedText
                                    style={
                                        styles.contributorName
                                    }
                                >
                                    {post.createdBy?.name}
                                </ThemedText>

                                <ThemedText
                                    style={
                                        styles.contributorLabel
                                    }
                                >
                                    Verified Contributor
                                </ThemedText>
                            </View>
                        </View>

                        {canManage && (
                            <View
                                style={
                                    styles.managementActions
                                }
                            >
                                <View
                                    style={[
                                        styles.divider,
                                        {
                                            backgroundColor:
                                                colors.border +
                                                '20',
                                        },
                                    ]}
                                />

                                <View style={styles.actionRow}>
                                    <TouchableOpacity
                                        style={[
                                            styles.actionButton,
                                            {
                                                backgroundColor:
                                                    colors.primary +
                                                    '10',
                                            },
                                        ]}
                                        onPress={() =>
                                            onEdit?.(post)
                                        }
                                    >
                                        <Ionicons
                                            name="create-outline"
                                            size={18}
                                            color={
                                                colors.primary
                                            }
                                        />

                                        <ThemedText
                                            style={[
                                                styles.actionButtonText,
                                                {
                                                    color:
                                                        colors.primary,
                                                },
                                            ]}
                                        >
                                            Edit Post
                                        </ThemedText>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[
                                            styles.actionButton,
                                            {
                                                backgroundColor:
                                                    '#FF3B3010',
                                            },
                                        ]}
                                        onPress={() =>
                                            onDelete?.(post._id)
                                        }
                                    >
                                        <Ionicons
                                            name="trash-outline"
                                            size={18}
                                            color="#FF3B30"
                                        />

                                        <ThemedText
                                            style={[
                                                styles.actionButtonText,
                                                {
                                                    color:
                                                        '#FF3B30',
                                                },
                                            ]}
                                        >
                                            Delete
                                        </ThemedText>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </View>
                </ScrollView>
            </ThemedView>
        );
    }
);

PostDetail.displayName = 'PostDetail';

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },

    content: {
        paddingBottom: 20,
    },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 12,
    },

    typeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
        gap: 6,
    },

    typeText: {
        fontSize: 11,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },

    timeText: {
        fontSize: 12,
        opacity: 0.5,
        fontWeight: '600',
    },

    body: {
        paddingHorizontal: 20,
        paddingBottom: 16,
    },

    contentBody: {
        fontSize: 16,
        lineHeight: 24,
        fontWeight: '400',
        letterSpacing: 0.2,
    },

    mediaContainer: {
        width: '100%',
        aspectRatio: 1.2,
        paddingHorizontal: 20,
        marginBottom: 16,
    },

    imageWrapper: {
        width: width - 40,
        height: '100%',
        borderRadius: 16,
        overflow: 'hidden',
    },

    image: {
        width: '100%',
        height: '100%',
    },

    imageBadge: {
        position: 'absolute',
        bottom: 16,
        right: 16,
        backgroundColor: 'rgba(0,0,0,0.7)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
    },

    imageBadgeText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '700',
    },

    interactions: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 20,
        paddingVertical: 12,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },

    interactionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 6,
        paddingHorizontal: 4,
    },

    interactionText: {
        fontSize: 14,
        fontWeight: '600',
    },

    contributorCard: {
        margin: 20,
        padding: 16,
        borderRadius: 20,
        borderWidth: StyleSheet.hairlineWidth,

        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: {
                    width: 0,
                    height: 4,
                },
                shadowOpacity: 0.05,
                shadowRadius: 10,
            },

            android: {
                elevation: 2,
            },
        }),
    },

    contributorInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },

    avatar: {
        backgroundColor: '#f1f5f9',
    },

    avatarPlaceholder: {
        alignItems: 'center',
        justifyContent: 'center',
    },

    avatarInitial: {
        fontWeight: '700',
    },

    contributorTextContainer: {
        flex: 1,
    },

    contributorName: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 2,
    },

    contributorLabel: {
        fontSize: 12,
        opacity: 0.5,
        fontWeight: '500',
    },

    managementActions: {
        marginTop: 16,
    },

    divider: {
        height: 1,
        marginBottom: 16,
    },

    actionRow: {
        flexDirection: 'row',
        gap: 12,
    },

    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 12,
        gap: 8,
    },

    actionButtonText: {
        fontSize: 13,
        fontWeight: '700',
    },
});