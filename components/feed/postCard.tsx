import { Colors } from '@/constants/colors';
import { useLikePost } from '@/hooks/usePosts';
import { usePostCategories } from '@/hooks/useConfiguration';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { formatRelativeTime } from '@/utils/dateUtils';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { analyticsService, AnalyticsEvents } from '@/analytics';

import React, {
    memo,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';

import {
    ActionSheetIOS,
    Dimensions,
    FlatList,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    TouchableOpacity,
    View,
    ViewToken,
    Share
} from 'react-native';

import { ThemedText } from '../themedText';
import { ThemedView } from '../themedView';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 68;

/* -------------------------------------------------------------------------- */
/*                                    Types                                   */
/* -------------------------------------------------------------------------- */

export interface PostData {
    _id: string;
    content: string;
    images: string[];
    type: string;

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
    variant?: 'compact' | 'full';
    showFullContent?: boolean;

    onPress?: (postId: string) => void;
    onViewImage?: (
        images: string[],
        index: number
    ) => void;

    onEdit?: (post: PostData) => void;
    onDelete?: (postId: string) => void;
    onComment?: (post: PostData) => void;
    onReport?: () => void;
}

/* -------------------------------------------------------------------------- */
/*                            Like Button Custom Hook                         */
/* -------------------------------------------------------------------------- */

export const useLikeButtonState = (
    postId: string,
    initialLiked: boolean,
    initialLikes: number
) => {
    const [isLiked, setIsLiked] = useState(initialLiked);
    const [likesCount, setLikesCount] = useState(initialLikes);
    const likePostMutation = useLikePost();

    // Synchronize local state with fresh props from query/websocket updates
    useEffect(() => {
        setIsLiked(initialLiked);
    }, [initialLiked]);

    useEffect(() => {
        setLikesCount(initialLikes);
    }, [initialLikes]);

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
    }, [postId, likePostMutation]);

    return {
        isLiked,
        likesCount,
        handleLike,
    };
};

/* -------------------------------------------------------------------------- */
/*                              Like Button Memo                              */
/* -------------------------------------------------------------------------- */

const LikeButton = memo(
    ({
        postId,
        initialLiked,
        initialLikes,
    }: {
        postId: string;
        initialLiked: boolean;
        initialLikes: number;
    }) => {
        const { isLiked, likesCount, handleLike } = useLikeButtonState(
            postId,
            initialLiked,
            initialLikes
        );

        return (
            <TouchableOpacity
                onPress={handleLike}
                style={styles.likeButton}
                activeOpacity={0.7}
            >
                <Ionicons
                    name={
                        isLiked
                            ? 'heart'
                            : 'heart-outline'
                    }
                    size={18}
                    color={
                        isLiked
                            ? '#FF3B30'
                            : '#64748B'
                    }
                />

                <ThemedText style={styles.countText}>
                    {likesCount}
                </ThemedText>
            </TouchableOpacity>
        );
    }
);

LikeButton.displayName = 'LikeButton';

/* -------------------------------------------------------------------------- */
/*                               Post Content                                 */
/* -------------------------------------------------------------------------- */

const PostContent = memo(
    ({
        content,
        showFullContent,
        setShowFullContent,
        colors,
    }: any) => {
        const isLongContent =
            content.length > 120;

        const truncatedContent =
            isLongContent && !showFullContent
                ? `${content.substring(0, 120)}...`
                : content;

        return (
            <View style={styles.contentContainer}>
                <ThemedText
                    style={[
                        styles.headline,
                        {
                            color: colors.text,
                        },
                    ]}
                >
                    {truncatedContent}
                </ThemedText>

                {isLongContent &&
                    setShowFullContent && (
                        <TouchableOpacity
                            onPress={() =>
                                setShowFullContent(
                                    !showFullContent
                                )
                            }
                        >
                            <ThemedText
                                style={[
                                    styles.readMore,
                                    {
                                        color:
                                            colors.primary,
                                    },
                                ]}
                            >
                                {showFullContent
                                    ? 'Read Less'
                                    : 'Read More'}
                            </ThemedText>
                        </TouchableOpacity>
                    )}
            </View>
        );
    }
);

PostContent.displayName = 'PostContent';

/* -------------------------------------------------------------------------- */
/*                                Post Media                                  */
/* -------------------------------------------------------------------------- */

const PostMedia = memo(
    ({
        images,
        postId,
        onViewImage,
    }: any) => {
        const [currentImageIndex, setCurrentImageIndex] =
            useState(0);

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

        const renderItem = useCallback(
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
                        onViewImage?.(
                            images,
                            index
                        )
                    }
                    style={styles.imageWrapper}
                >
                    <Image
                        source={{ uri: item }}
                        style={styles.mainImage}
                        contentFit="cover"
                        transition={200}
                        cachePolicy="memory-disk"
                    />
                </TouchableOpacity>
            ),
            [images, onViewImage]
        );

        if (!images?.length) return null;

        return (
            <View style={styles.imageContainer}>
                <FlatList
                    data={images}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={
                        false
                    }
                    renderItem={renderItem}
                    keyExtractor={(_, index) =>
                        `${postId}-img-${index}`
                    }
                    onViewableItemsChanged={
                        onViewableItemsChanged
                    }
                    viewabilityConfig={
                        viewabilityConfig
                    }
                    removeClippedSubviews
                    initialNumToRender={1}
                    maxToRenderPerBatch={2}
                    windowSize={3}
                />

                {images.length > 1 && (
                    <View style={styles.imageBadge}>
                        <ThemedText
                            style={
                                styles.imageBadgeText
                            }
                        >
                            {currentImageIndex + 1}/
                            {images.length}
                        </ThemedText>
                    </View>
                )}
            </View>
        );
    }
);

PostMedia.displayName = 'PostMedia';

/* -------------------------------------------------------------------------- */
/*                             Post Type Header                               */
/* -------------------------------------------------------------------------- */

const PostTypeHeader = memo(
    ({
        post,
        colors,
        onMenuPress,
        showMenu,
    }: any) => {
        const { data: categoriesData } =
            usePostCategories();

        const categories =
            categoriesData?.data?.data || [];

        const postCategory = useMemo(
            () =>
                categories.find(
                    (c: any) =>
                        c.name.toLowerCase() ===
                        post.type?.toLowerCase()
                ),
            [categories, post.type]
        );

        if (!postCategory) return null;

        return (
            <View
                style={[
                    styles.typeHeader,
                    {
                        flexDirection: 'row',
                        justifyContent:
                            'space-between',
                        alignItems: 'center',
                    },
                ]}
            >
                <View
                    style={[
                        styles.typePill,
                        {
                            backgroundColor:
                                colors.primary +
                                '10',
                        },
                    ]}
                >
                    <Image
                        source={{
                            uri: postCategory.icon,
                        }}
                        style={styles.typeIcon}
                        contentFit="contain"
                    />

                    <ThemedText
                        style={[
                            styles.typeText,
                            {
                                color:
                                    colors.primary,
                            },
                        ]}
                    >
                        {postCategory.name}
                    </ThemedText>
                </View>

                {showMenu && (
                    <TouchableOpacity
                        onPress={onMenuPress}
                        style={
                            styles.menuButton
                        }
                    >
                        <Ionicons
                            name="ellipsis-horizontal"
                            size={20}
                            color={colors.text}
                        />
                    </TouchableOpacity>
                )}
            </View>
        );
    }
);

PostTypeHeader.displayName = 'PostTypeHeader';

/* -------------------------------------------------------------------------- */
/*                                Post Footer                                 */
/* -------------------------------------------------------------------------- */

const PostFooter = memo(
    ({
        postId,
        initialLiked,
        initialLikes,
        createdAt,
    }: any) => {
        const handleShare = async () => {
            try {
                const shareUrl = `https://api.rehbarapp.com/post/${postId}`;
                const playStoreUrl = 'https://play.google.com/store/apps/details?id=com.rehbar.community';
                
                await Share.share({
                    title: 'Check out this post on Rehbar',
                    message: `Check out this post on Rehbar: ${shareUrl}\n\nDon't have the app? Get it here: ${playStoreUrl}`,
                    url: shareUrl,
                });
                
                analyticsService.trackEvent(AnalyticsEvents.POST_SHARED, { postId: postId });
            } catch (error) {
                console.error('Error sharing post:', error);
            }
        };

        return (
            <View style={styles.footer}>
                <LikeButton
                    postId={postId}
                    initialLiked={initialLiked}
                    initialLikes={initialLikes}
                />

                <TouchableOpacity 
                    onPress={handleShare}
                    style={styles.shareButton}
                    activeOpacity={0.7}
                >
                    <Ionicons name="share-outline" size={18} color="#64748B" />
                </TouchableOpacity>

                <View style={{ flex: 1 }} />

                <ThemedText style={styles.timeText}>
                    {formatRelativeTime(createdAt)}
                </ThemedText>
            </View>
        );
    }
);

PostFooter.displayName = 'PostFooter';

/* -------------------------------------------------------------------------- */
/*                              Action Menu                                   */
/* -------------------------------------------------------------------------- */

const PostActionMenu = memo(
    ({
        visible,
        onClose,
        onEdit,
        onDelete,
        onReport,
        showManageActions,
        colors,
    }: any) => {
        return (
            <Modal
                visible={visible}
                transparent
                animationType="fade"
                onRequestClose={onClose}
            >
                <TouchableOpacity
                    style={styles.menuOverlay}
                    activeOpacity={1}
                    onPress={onClose}
                >
                    <ThemedView
                        style={
                            styles.menuContent
                        }
                    >
                        {showManageActions && (
                            <>
                                <TouchableOpacity
                                    style={
                                        styles.menuItem
                                    }
                                    onPress={() => {
                                        onEdit();
                                        onClose();
                                    }}
                                >
                                    <Ionicons
                                        name="create-outline"
                                        size={20}
                                        color={
                                            colors.text
                                        }
                                    />

                                    <ThemedText
                                        style={
                                            styles.menuItemText
                                        }
                                    >
                                        Edit Post
                                    </ThemedText>
                                </TouchableOpacity>

                                <View
                                    style={[
                                        styles.menuDivider,
                                        {
                                            backgroundColor:
                                                colors.border,
                                        },
                                    ]}
                                />

                                <TouchableOpacity
                                    style={
                                        styles.menuItem
                                    }
                                    onPress={() => {
                                        onDelete();
                                        onClose();
                                    }}
                                >
                                    <Ionicons
                                        name="trash-outline"
                                        size={20}
                                        color="#FF3B30"
                                    />

                                    <ThemedText
                                        style={[
                                            styles.menuItemText,
                                            {
                                                color:
                                                    '#FF3B30',
                                            },
                                        ]}
                                    >
                                        Delete Post
                                    </ThemedText>
                                </TouchableOpacity>

                                <View
                                    style={[
                                        styles.menuDivider,
                                        {
                                            backgroundColor:
                                                colors.border,
                                        },
                                    ]}
                                />
                            </>
                        )}

                        <TouchableOpacity
                            style={styles.menuItem}
                            onPress={() => {
                                onReport?.();
                                onClose();
                            }}
                        >
                            <Ionicons
                                name="flag-outline"
                                size={20}
                                color="#FF9500"
                            />
                            <ThemedText style={styles.menuItemText}>
                                Report Post
                            </ThemedText>
                        </TouchableOpacity>

                        <View
                            style={[
                                styles.menuDivider,
                                {
                                    backgroundColor:
                                        colors.border,
                                },
                            ]}
                        />

                        <TouchableOpacity
                            style={[
                                styles.menuItem,
                                {
                                    paddingBottom: 0,
                                },
                            ]}
                            onPress={onClose}
                        >
                            <ThemedText
                                style={[
                                    styles.menuItemText,
                                    {
                                        textAlign:
                                            'center',
                                        width: '100%',
                                        opacity: 0.6,
                                    },
                                ]}
                            >
                                Cancel
                            </ThemedText>
                        </TouchableOpacity>
                    </ThemedView>
                </TouchableOpacity>
            </Modal>
        );
    }
);

PostActionMenu.displayName = 'PostActionMenu';

/* -------------------------------------------------------------------------- */
/*                                Main Card                                   */
/* -------------------------------------------------------------------------- */

export const PostCard: React.FC<PostCardProps> =
    memo(
        ({
            post,
            showFullContent:
            propShowFullContent,
            onPress,
            onViewImage,
            onEdit,
            onDelete,
            onReport,
        }) => {
            const { theme } = useTheme();
            const { user } = useAuth();

            const colors = Colors[theme];

            const [
                showFullContent,
                setShowFullContent,
            ] = useState(
                propShowFullContent ||
                false
            );

            const [menuVisible, setMenuVisible] =
                useState(false);

            useEffect(() => {
                if (
                    propShowFullContent !==
                    undefined
                ) {
                    setShowFullContent(
                        propShowFullContent
                    );
                }
            }, [propShowFullContent]);

            const isAdmin = useMemo(
                () =>
                    user?.user?.role ===
                    'APP_ADMIN',
                [user?.user?.role]
            );

            const handleMenuPress =
                useCallback(() => {
                    if (
                        Platform.OS === 'ios'
                    ) {
                        ActionSheetIOS.showActionSheetWithOptions(
                            {
                                options: [
                                    'Cancel',
                                    'Edit Post',
                                    'Delete Post',
                                    'Report Post'
                                ],
                                destructiveButtonIndex:
                                    2,
                                cancelButtonIndex:
                                    0,
                            },
                            buttonIndex => {
                                if (
                                    buttonIndex === 1
                                ) {
                                    onEdit?.(post);
                                } else if (
                                    buttonIndex === 2
                                ) {
                                    onDelete?.(
                                        post._id
                                    );
                                } else if (
                                    buttonIndex === 3
                                ) {
                                    onReport?.();
                                }
                            }
                        );
                    } else {
                        setMenuVisible(true);
                    }
                }, [
                    onEdit,
                    onDelete,
                    post,
                ]);

            return (
                <>
                    <Pressable
                        onPress={() =>
                            onPress?.(post._id)
                        }
                        style={({ pressed }) => ({
                            opacity: pressed
                                ? 0.96
                                : 1,
                        })}
                    >
                        <View
                            style={[
                                styles.card,
                                {
                                    backgroundColor:
                                        colors.card,
                                },
                            ]}
                        >
                            <PostTypeHeader
                                post={post}
                                colors={colors}
                                onMenuPress={
                                    handleMenuPress
                                }
                                showMenu={true}
                            />

                            <PostContent
                                content={
                                    post.content
                                }
                                showFullContent={
                                    showFullContent
                                }
                                setShowFullContent={
                                    setShowFullContent
                                }
                                colors={colors}
                            />

                            <PostMedia
                                images={post.images}
                                postId={post._id}
                                onViewImage={
                                    onViewImage
                                }
                            />

                            <PostFooter
                                postId={post._id}
                                initialLiked={
                                    post.isLiked ||
                                    false
                                }
                                initialLikes={
                                    post.likesCount ||
                                    0
                                }
                                createdAt={
                                    post.createdAt
                                }
                            />
                        </View>
                    </Pressable>

                    <PostActionMenu
                        visible={menuVisible}
                        onClose={() =>
                            setMenuVisible(false)
                        }
                        onEdit={() =>
                            onEdit?.(post)
                        }
                        onDelete={() =>
                            onDelete?.(post._id)
                        }
                        onReport={onReport}
                        showManageActions={
                            isAdmin
                        }
                        colors={colors}
                    />
                </>
            );
        }
    );

PostCard.displayName = 'PostCard';

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
    card: {
        borderRadius: 16,
        marginBottom: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3,
    },

    timeText: {
        fontSize: 11,
        color: '#64748B',
        fontWeight: '500',
        opacity: 0.7,
    },

    menuButton: {
        padding: 4,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: 'rgba(0,0,0,0.05)',
    },
    shareButton: {
        marginLeft: 16,
        padding: 4,
    },

    typeHeader: {
        marginBottom: 8,
    },

    typePill: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },

    typeIcon: {
        width: 14,
        height: 14,
        marginRight: 6,
    },

    typeText: {
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
    },

    contentContainer: {
        marginBottom: 12,
    },

    headline: {
        fontSize: 14,
        lineHeight: 20,
        fontWeight: '400',
        color: '#1E293B',
    },

    readMore: {
        fontSize: 14,
        fontWeight: '600',
        marginTop: 4,
    },

    imageContainer: {
        width: '100%',
        aspectRatio: 16 / 9,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: '#F1F5F9',
        marginBottom: 12,
    },

    imageWrapper: {
        width: CARD_WIDTH,
        height: '100%',
    },

    mainImage: {
        width: '100%',
        height: '100%',
    },

    imageBadge: {
        position: 'absolute',
        bottom: 12,
        right: 12,
        backgroundColor:
            'rgba(0,0,0,0.6)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },

    imageBadgeText: {
        fontSize: 11,
        color: '#FFF',
        fontWeight: '600',
    },

    likeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 4,
        paddingRight: 12,
    },

    countText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748B',
    },

    menuOverlay: {
        flex: 1,
        backgroundColor:
            'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
    },

    menuContent: {
        width: '100%',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
        paddingBottom:
            Platform.OS === 'ios'
                ? 40
                : 20,
    },

    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        gap: 12,
    },

    menuItemText: {
        fontSize: 16,
        fontWeight: '600',
    },

    menuDivider: {
        height: 1,
        width: '100%',
        opacity: 0.1,
    },
});