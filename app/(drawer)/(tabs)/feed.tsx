import { PostData } from '@/apis/posts';
import { FeedEmptyState } from '@/components/feed/feedEmptyState';
import { FeedFooter } from '@/components/feed/feedFooter';
import { FeedHeader } from '@/components/feed/feedHeader';
import { PostCard } from '@/components/feed/postCard';
import { PostModal } from '@/components/feed/PostModal';
import { PostDetail } from '@/components/feed/PostDetail';
import { useDeletePost } from '@/hooks/usePosts';
import { ImageViewerModal } from '@/components/common/ImageViewerModal';
import { ThemedText } from '@/components/themedText';
import { ThemedView } from '@/components/themedView';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useFeed } from '@/hooks/useFeed';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Stack, useNavigation } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Dimensions, FlatList, Modal, Platform, RefreshControl, ScrollView, StatusBar, StyleSheet, TouchableOpacity, View, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ErrorBoundary } from '@/components/common/errorBoundary';


const { width } = Dimensions.get('window');

export default function FeedScreen() {
    console.log('FeedScreen: rendering...');
    const { theme } = useTheme();
    const { user } = useAuth();
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const colors = Colors[theme];

    const [viewerVisible, setViewerVisible] = useState(false);
    const [viewerImages, setViewerImages] = useState<string[]>([]);
    const [viewerInitialIndex, setViewerInitialIndex] = useState(0);

    const [postModalVisible, setPostModalVisible] = useState(false);
    const [editingPost, setEditingPost] = useState<PostData | null>(null);

    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const [detailPost, setDetailPost] = useState<PostData | null>(null);

    const deletePostMutation = useDeletePost();

    const {
        posts,
        isLoading,
        isRefetching,
        hasNextPage,
        isFetchingNextPage,
        isError,
        error,
        filters: { searchQuery, setSearchQuery, selectedType, setSelectedType },
        handlers: { handleRefresh, handleEndReached, subscribeToPosts, unsubscribeFromPosts }
    } = useFeed();

    const handleViewImage = useCallback((images: string[], index: number) => {
        setViewerImages(images);
        setViewerInitialIndex(index);
        setViewerVisible(true);
    }, []);

    const handleCreatePost = useCallback(() => {
        setEditingPost(null);
        setPostModalVisible(true);
    }, []);

    const handleEditPost = useCallback((post: PostData) => {
        setEditingPost(post);
        setPostModalVisible(true);
    }, []);

    const handleDeletePost = useCallback((postId: string) => {
        Alert.alert(
            'Delete Post',
            'Are you sure you want to delete this post?',
            [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: 'Delete', 
                    style: 'destructive',
                    onPress: () => deletePostMutation.mutate(postId)
                }
            ]
        );
    }, [deletePostMutation]);

    // Optimization: Viewability-aware socket subscriptions
    const onViewableItemsChanged = useCallback(({ viewableItems, changed }: any) => {
        const joinIds = changed
            .filter((item: any) => item.isViewable)
            .map((item: any) => item.item._id);
        const leaveIds = changed
            .filter((item: any) => !item.isViewable)
            .map((item: any) => item.item._id);

        if (joinIds.length > 0) subscribeToPosts(joinIds);
        if (leaveIds.length > 0) unsubscribeFromPosts(leaveIds);
    }, [subscribeToPosts, unsubscribeFromPosts]);

    const viewabilityConfig = useRef({
        itemVisiblePercentThreshold: 50,
        minimumViewTime: 300,
    }).current;

    const renderItem = useCallback(({ item }: { item: PostData }) => (
        <PostCard
            post={item}
            variant="compact"
            onViewImage={handleViewImage}
            onEdit={handleEditPost}
            onDelete={handleDeletePost}
            onPress={() => {
                setDetailPost(item);
                setDetailModalVisible(true);
            }}
        />
    ), [handleViewImage, handleEditPost, handleDeletePost, user?.user?._id]);

    const keyExtractor = useCallback((item: PostData) => item._id, []);

    // Optimization: Approximate height for smoother scrolling
    const getItemLayout = useCallback((data: any, index: number) => {
        const item = data[index];
        // Base height (header + footer + content padding) ~ 150
        // Image height ~ width * 0.6
        const hasImages = item?.images && item.images.length > 0;
        const height = 150 + (hasImages ? width * 0.6 : 0);
        return {
            length: height,
            offset: height * index,
            index,
        };
    }, []);


    const listEmpty = useCallback(() => (
        <FeedEmptyState
            colors={colors}
            isLoading={isLoading}
            isRefetching={isRefetching}
            isError={isError}
            error={error}
            refetch={handleRefresh}
            postsCount={posts.length}
        />
    ), [colors, isLoading, isError, error, handleRefresh, posts.length]);

    const listFooter = useCallback(() => (
        <FeedFooter
            colors={colors}
            isFetchingNextPage={isFetchingNextPage}
            hasNextPage={hasNextPage}
            postsCount={posts.length}
        />
    ), [colors, isFetchingNextPage, hasNextPage, posts.length]);

    return (
        <ErrorBoundary>
            <ThemedView style={styles.container}>
                <Stack.Screen options={{ headerShown: false }} />

                {/* Fixed Header — does NOT scroll */}
                <FeedHeader
                    colors={colors}
                    insets={insets}
                    navigation={navigation}
                    user={user}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    selectedType={selectedType}
                    setSelectedType={setSelectedType}
                    onCreatePost={handleCreatePost}
                    containerStyle={{ marginBottom: 16 }}
                />

                {/* Scrolling list only */}
                <FlatList
                    data={posts}
                    renderItem={renderItem}
                    keyExtractor={keyExtractor}
                    getItemLayout={getItemLayout}
                    ListEmptyComponent={listEmpty}
                    ListFooterComponent={listFooter}
                    contentContainerStyle={styles.listContent}
                    onEndReached={handleEndReached}
                    onEndReachedThreshold={0.5}
                    onViewableItemsChanged={onViewableItemsChanged}
                    viewabilityConfig={viewabilityConfig}
                    initialNumToRender={6}
                    maxToRenderPerBatch={10}
                    windowSize={5}
                    removeClippedSubviews={Platform.OS === 'android'}
                    updateCellsBatchingPeriod={50}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefetching}
                            onRefresh={handleRefresh}
                            tintColor={colors.primary}
                        />
                    }
                />
                <ImageViewerModal
                    visible={viewerVisible}
                    onClose={() => setViewerVisible(false)}
                    images={viewerImages}
                    initialIndex={viewerInitialIndex}
                />

                <PostModal 
                    visible={postModalVisible} 
                    onClose={() => setPostModalVisible(false)} 
                    editingPost={editingPost}
                />

                {/* News Detail Modal */}
                <Modal
                    visible={detailModalVisible}
                    animationType="slide"
                    transparent={false}
                    onRequestClose={() => setDetailModalVisible(false)}
                >
                    <ThemedView style={{ flex: 1, paddingTop: insets.top }}>
                        <View style={detailsStyles.modalHeader}>
                            <TouchableOpacity 
                                onPress={() => setDetailModalVisible(false)}
                                style={detailsStyles.backButton}
                            >
                                <Ionicons name="arrow-back" size={24} color={colors.text} />
                            </TouchableOpacity>
                            <ThemedText style={detailsStyles.headerTitle}>Full Story</ThemedText>
                        </View>
                        
                        <ScrollView 
                            contentContainerStyle={detailsStyles.scrollContent}
                            showsVerticalScrollIndicator={false}
                        >
                            {detailPost && (
                                <PostDetail 
                                    post={detailPost}
                                    onViewImage={handleViewImage}
                                    onEdit={(post) => {
                                        setDetailModalVisible(false);
                                        handleEditPost(post);
                                    }}
                                    onDelete={(id) => {
                                        setDetailModalVisible(false);
                                        handleDeletePost(id);
                                    }}
                                    isOwner={user?.user?._id === detailPost.createdBy?._id}
                                />
                            )}
                        </ScrollView>
                    </ThemedView>
                </Modal>
            </ThemedView>
        </ErrorBoundary>
    );
}

const detailsStyles = StyleSheet.create({
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#ccc',
        backgroundColor: '#FFFFFF',
    },
    backButton: {
        padding: 4,
        marginRight: 12,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    scrollContent: {
        paddingBottom: 40,
    },
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    keyboardView: {
        flex: 1,
    },
    listContent: {
        paddingHorizontal: Platform.OS === 'android' ? 18 : 20,
        paddingTop: 0,
        paddingBottom: 40,
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
