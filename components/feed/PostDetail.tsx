import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { formatRelativeTime } from '@/utils/dateUtils';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useMemo, useState } from 'react';
import { Dimensions, FlatList, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '../themedText';
import { ThemedView } from '../themedView';
import { PostData } from './postCard';

const { width } = Dimensions.get('window');

interface PostDetailProps {
    post: PostData;
    onViewImage?: (images: string[], index: number) => void;
    onEdit?: (post: PostData) => void;
    onDelete?: (postId: string) => void;
    isOwner?: boolean;
}

export const PostDetail: React.FC<PostDetailProps> = ({ 
    post, 
    onViewImage, 
    onEdit, 
    onDelete,
    isOwner 
}) => {
    const { theme } = useTheme();
    const colors = Colors[theme];
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

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

    const onViewableItemsChanged = React.useRef(({ viewableItems }: any) => {
        if (viewableItems.length > 0) {
            setCurrentImageIndex(viewableItems[0].index || 0);
        }
    }).current;

    const viewabilityConfig = React.useRef({
        itemVisiblePercentThreshold: 50
    }).current;

    return (
        <ScrollView 
            style={[styles.container, { backgroundColor: colors.background }]}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
        >
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <View style={[styles.typeBadge, { backgroundColor: `${getTypeColor()}12` }]}>
                        <Ionicons name={getTypeIcon() as any} size={14} color={getTypeColor()} />
                        <ThemedText style={[styles.typeText, { color: getTypeColor() }]}>
                            {post.type}
                        </ThemedText>
                    </View>
                    <ThemedText style={styles.timeText}>
                        {formatRelativeTime(post.createdAt)}
                    </ThemedText>
                </View>
            </View>

            <View style={styles.body}>
                <ThemedText style={styles.contentBody}>{displayContent}</ThemedText>
            </View>

            {post.images && post.images.length > 0 && (
                <View style={styles.mediaContainer}>
                    <FlatList
                        data={post.images}
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        onViewableItemsChanged={onViewableItemsChanged}
                        viewabilityConfig={viewabilityConfig}
                        keyExtractor={(_, index) => `detail-img-${index}`}
                        renderItem={({ item, index }) => (
                            <TouchableOpacity
                                activeOpacity={0.9}
                                onPress={() => onViewImage?.(post.images, index)}
                                style={styles.imageWrapper}
                            >
                                <Image
                                    source={{ uri: item }}
                                    style={styles.image}
                                    contentFit="contain"
                                    transition={200}
                                />
                            </TouchableOpacity>
                        )}
                    />
                    {post.images.length > 1 && (
                        <View style={styles.imageBadge}>
                            <ThemedText style={styles.imageBadgeText}>
                                {currentImageIndex + 1} / {post.images.length}
                            </ThemedText>
                        </View>
                    )}
                </View>
            )}

            <View style={styles.footer}>
                <View style={styles.authorSection}>
                    <Image 
                        source={{ uri: post.createdBy?.profileImage }} 
                        style={styles.avatar}
                    />
                    <View>
                        <ThemedText style={styles.authorName}>{post.createdBy?.name}</ThemedText>
                        <ThemedText style={styles.authorRole}>Contributor</ThemedText>
                    </View>
                </View>

                {isOwner && (
                    <View style={styles.actionRow}>
                        <TouchableOpacity 
                            style={[styles.actionButton, { backgroundColor: colors.primary + '15' }]}
                            onPress={() => onEdit?.(post)}
                        >
                            <Ionicons name="create-outline" size={20} color={colors.primary} />
                            <ThemedText style={[styles.actionButtonText, { color: colors.primary }]}>Edit</ThemedText>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.actionButton, { backgroundColor: '#FF3B3015' }]}
                            onPress={() => onDelete?.(post._id)}
                        >
                            <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                            <ThemedText style={[styles.actionButtonText, { color: '#FF3B30' }]}>Delete</ThemedText>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    typeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        gap: 6,
    },
    typeText: {
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    timeText: {
        fontSize: 13,
        opacity: 0.6,
        fontWeight: '500',
    },
    body: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    contentBody: {
        fontSize: 17,
        lineHeight: 26,
        fontWeight: '400',
    },
    mediaContainer: {
        width: '100%',
        aspectRatio: 1, // Square for details
        backgroundColor: '#f8f8f8',
        marginVertical: 10,
    },
    imageWrapper: {
        width: width,
        height: '100%',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    imageBadge: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    imageBadgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
    },
    footer: {
        padding: 20,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: '#eee',
        marginTop: 10,
    },
    authorSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 20,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#f1f5f9',
    },
    authorName: {
        fontSize: 16,
        fontWeight: '600',
    },
    authorRole: {
        fontSize: 12,
        opacity: 0.5,
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
        paddingVertical: 12,
        borderRadius: 12,
        gap: 8,
    },
    actionButtonText: {
        fontSize: 14,
        fontWeight: '700',
    },
});
