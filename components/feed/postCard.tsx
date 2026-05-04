import { Colors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { formatRelativeTime } from '@/utils/dateUtils';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActionSheetIOS, Animated, Dimensions, FlatList, Modal, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '../themedText';
import { ThemedView } from '../themedView';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 32; // Compact width

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
    variant?: 'compact' | 'full';
    showFullContent?: boolean;
    onPress?: (postId: string) => void;
    onViewImage?: (images: string[], index: number) => void;
    onEdit?: (post: PostData) => void;
    onDelete?: (postId: string) => void;
}

// --- Sub-Components ---

const PostHeader = ({ type, createdAt, getTypeIcon, getTypeColor }: any) => {
    return (
        <View style={styles.header}>
            <View style={styles.headerLeft}>
                <View style={[styles.typeBadge, { backgroundColor: `${getTypeColor()}12` }]}>
                    <Ionicons name={getTypeIcon() as any} size={11} color={getTypeColor()} />
                    <ThemedText style={[styles.typeText, { color: getTypeColor() }]}>
                        {type}
                    </ThemedText>
                </View>
                <ThemedText style={styles.timeText}>
                    {formatRelativeTime(createdAt)}
                </ThemedText>
            </View>
        </View>
    );
};

const PostContent = ({ content, showFullContent, setShowFullContent, colors }: any) => {
    const isLongContent = content.length > 120;
    const truncatedContent = isLongContent && !showFullContent
        ? `${content.substring(0, 120)}...`
        : content;

    return (
        <View style={styles.contentContainer}>
            <ThemedText style={[styles.headline, { color: colors.text }]}>
                {truncatedContent}
            </ThemedText>
            {isLongContent && setShowFullContent && (
                <TouchableOpacity onPress={() => setShowFullContent(!showFullContent)}>
                    <ThemedText style={[styles.readMore, { color: colors.primary }]}>
                        {showFullContent ? 'Read Less' : 'Read More'}
                    </ThemedText>
                </TouchableOpacity>
            )}
        </View>
    );
};

const PostMedia = ({ images, postId, onViewImage, currentImageIndex, onViewableItemsChanged, viewabilityConfig }: any) => {
    if (!images || images.length === 0) return null;

    return (
        <View style={styles.imageContainer}>
            <FlatList
                data={images}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
                keyExtractor={(img, index) => `${postId}-img-${index}`}
                renderItem={({ item, index }) => (
                    <TouchableOpacity
                        activeOpacity={0.95}
                        onPress={() => onViewImage?.(images, index)}
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
                )}
            />
            {images.length > 1 && (
                <View style={styles.imageBadge}>
                    <ThemedText style={styles.imageBadgeText}>{currentImageIndex + 1}/{images.length}</ThemedText>
                </View>
            )}
        </View>
    );
};


const PostActionMenu = ({ visible, onClose, onEdit, onDelete, colors }: any) => {
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
                <ThemedView style={styles.menuContent}>
                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => { onEdit(); onClose(); }}
                    >
                        <Ionicons name="create-outline" size={20} color={colors.text} />
                        <ThemedText style={styles.menuItemText}>Edit Post</ThemedText>
                    </TouchableOpacity>

                    <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />

                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => { onDelete(); onClose(); }}
                    >
                        <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                        <ThemedText style={[styles.menuItemText, { color: '#FF3B30' }]}>Delete Post</ThemedText>
                    </TouchableOpacity>

                    <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />

                    <TouchableOpacity
                        style={[styles.menuItem, { paddingBottom: 0 }]}
                        onPress={onClose}
                    >
                        <ThemedText style={[styles.menuItemText, { textAlign: 'center', width: '100%', opacity: 0.6 }]}>Cancel</ThemedText>
                    </TouchableOpacity>
                </ThemedView>
            </TouchableOpacity>
        </Modal>
    );
};

const CompactLayout = ({ post, getTypeIcon, getTypeColor, onPress, onLongPress, colors }: any) => {
    console.log(`[PostCard Debug] CompactLayout rendered for ${post._id}. onLongPress present: ${!!onLongPress}`);
    return (
        <TouchableOpacity
            activeOpacity={0.7}
            onPress={onPress}
            onLongPress={() => {
                console.log(`[PostCard Debug] TouchableOpacity onLongPress fired for ${post._id}`);
                onLongPress?.();
            }}
            delayLongPress={500}
            style={[styles.compactContainer, { backgroundColor: colors.card }]}
        >
            {post.images && post.images.length > 0 ? (
                <Image
                    source={{ uri: post.images[0] }}
                    style={styles.compactImage}
                    contentFit="cover"
                />
            ) : (
                <View style={[styles.compactImage, styles.placeholderImage]}>
                    <Ionicons name="newspaper-outline" size={32} color={colors.icon} />
                </View>
            )}

            <View style={styles.compactContent}>
                <View style={styles.compactHeader}>
                    <View style={[styles.typeBadge, { backgroundColor: `${getTypeColor()}12`, paddingHorizontal: 6, paddingVertical: 2 }]}>
                        <Ionicons name={getTypeIcon() as any} size={9} color={getTypeColor()} />
                        <ThemedText style={[styles.typeText, { color: getTypeColor(), fontSize: 9 }]}>
                            {post.type}
                        </ThemedText>
                    </View>
                    <ThemedText style={[styles.timeText, { fontSize: 10 }]}>
                        {formatRelativeTime(post.createdAt)}
                    </ThemedText>
                </View>

                <ThemedText style={styles.compactHeadline} numberOfLines={3}>
                    {post.content}
                </ThemedText>
            </View>
        </TouchableOpacity>
    );
};

export const PostCard: React.FC<PostCardProps> = React.memo(({ post, variant = 'compact', showFullContent: propShowFullContent, onPress, onViewImage, onEdit, onDelete }) => {
    const { theme } = useTheme();
    const { user } = useAuth();
    const colors = Colors[theme];
    const [showFullContent, setShowFullContent] = useState(propShowFullContent || false);
    const [menuVisible, setMenuVisible] = useState(false);

    // Sync prop changes to state if needed
    useEffect(() => {
        if (propShowFullContent !== undefined) {
            setShowFullContent(propShowFullContent);
        }
    }, [propShowFullContent]);

    // --- Animations ---
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(10)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            }),
            Animated.timing(translateY, {
                toValue: 0,
                duration: 400,
                useNativeDriver: true,
            })
        ]).start();
    }, []);

    const isOwner = useMemo(() => {
        const currentUserId = user?.user?._id;
        const ownerId = typeof post.createdBy === 'string' ? post.createdBy : (post.createdBy as any)?._id;
        return !!currentUserId && !!ownerId && currentUserId === ownerId;
    }, [user?.user?._id, post.createdBy]);

    // Debug logs
    useEffect(() => {
        const ownerId = typeof post.createdBy === 'string' ? post.createdBy : (post.createdBy as any)?._id;
        console.log(`[PostCard Debug] Post: ${post._id}`);
        console.log(`[PostCard Debug] Current User ID: ${user?.user?._id}`);
        console.log(`[PostCard Debug] Post Owner ID: ${ownerId}`);
        console.log(`[PostCard Debug] isOwner: ${isOwner}`);
    }, [user?.user?._id, post.createdBy, isOwner]);

    const handleLongPress = useCallback(() => {
        // alert("long press")
        console.log('[PostCard Debug] handleLongPress called');
        if (isOwner) {
            console.log('[PostCard Debug] isOwner is true, showing menu');
            if (Platform.OS === 'ios') {
                ActionSheetIOS.showActionSheetWithOptions(
                    {
                        options: ['Cancel', 'Edit Post', 'Delete Post'],
                        destructiveButtonIndex: 2,
                        cancelButtonIndex: 0,
                    },
                    (buttonIndex) => {
                        if (buttonIndex === 1) onEdit?.(post);
                        else if (buttonIndex === 2) onDelete?.(post._id);
                    }
                );
            } else {
                setMenuVisible(true);
            }
        }
    }, [isOwner, onEdit, onDelete, post]);

    const displayContent = useMemo(() => {
        if (post.type === 'DEATH') {
            const prefix = "إِنَّا لِلّهِ وَإِنَّـا إِلَيْهِ رَاجِعونَ\n\n";
            if (!post.content.startsWith("إِنَّا لِلّهِ وَإِنَّـا إِلَيْهِ رَاجِعونَ")) {
                return prefix + post.content;
            }
        }
        return post.content;
    }, [post.content, post.type]);

    const getTypeIcon = () => {
        switch (post.type) {
            case 'DEATH': return 'megaphone';
            case 'ACCIDENT': return 'warning';
            default: return 'bookmark';
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
        <>
            <CompactLayout
                post={post}
                getTypeIcon={getTypeIcon}
                getTypeColor={getTypeColor}
                onPress={() => onPress?.(post._id)}
                onLongPress={handleLongPress}
                colors={colors}
            />
            <PostActionMenu
                visible={menuVisible}
                onClose={() => setMenuVisible(false)}
                onEdit={() => onEdit?.(post)}
                onDelete={() => onDelete?.(post._id)}
                colors={colors}
            />
        </>
    );
});

const styles = StyleSheet.create({
    container: {
        marginBottom: 12,
        borderRadius: 18,
        padding: 12,
        backgroundColor: '#fff',
        shadowColor: '#1e293b',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 10,
        elevation: 6,
        // Remove marginHorizontal here, handled by parent padding
    },
    compactContainer: {
        flexDirection: 'row',
        marginBottom: 8,
        borderRadius: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        overflow: 'hidden', // Ensure image/content doesn't bleed out of rounded card
    },
    compactImage: {
        width: 110,
        height: 110,
        // Flush with left of card: match card radius on left only
        borderTopLeftRadius: 14,
        borderBottomLeftRadius: 14,
        borderTopRightRadius: 0,
        borderBottomRightRadius: 0,
    },
    placeholderImage: {
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    compactContent: {
        flex: 1,
        padding: 12, // Content column padding
        justifyContent: 'space-between',
    },
    compactHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 2, // Reduced from 4
    },
    compactHeadline: {
        fontSize: 14,
        fontWeight: '400', // Changed from 600
        lineHeight: 18, // Reduced from 20
        color: '#1e293b',
    },
    compactFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
    },
    authorText: {
        fontSize: 11,
        color: '#64748b',
        opacity: 0.8,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        paddingTop: 8, // Reduced from 12
        paddingBottom: 4, // Reduced from 8
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconButton: {
        marginLeft: 12,
        padding: 4,
    },
    typeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 20,
        gap: 4,
    },
    typeText: {
        fontSize: 8,
        fontWeight: '400', // Changed from 700
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    timeText: {
        fontSize: 12,
        opacity: 0.5,
        fontWeight: '500',
    },
    contentContainer: {
        paddingHorizontal: 14,
        paddingBottom: 8, // Reduced from 10
    },
    headline: {
        fontSize: 15,
        lineHeight: 22,
        fontWeight: '400', // Changed from 600
    },
    readMore: {
        fontSize: 14,
        fontWeight: '700',
    },
    imageContainer: {
        width: '100%',
        aspectRatio: 16 / 9,
        backgroundColor: '#f8f8f8',
        marginVertical: 4,
    },
    imageWrapper: {
        width: width - 32,
        height: '100%',
    },
    mainImage: {
        width: '100%',
        height: '100%',
    },
    imageBadge: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
    },
    imageBadgeText: {
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
    menuOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuContent: {
        width: width * 0.7,
        borderRadius: 20,
        padding: 16,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 8,
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

