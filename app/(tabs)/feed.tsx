import { PostData } from '@/apis/posts';
import { FeedEmptyState } from '@/components/feed/feedEmptyState';
import { FeedFooter } from '@/components/feed/feedFooter';
import { FeedHeader } from '@/components/feed/feedHeader';
import { PostCard } from '@/components/feed/postCard';
import { ThemedView } from '@/components/themedView';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useFeed } from '@/hooks/useFeed';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Stack, useNavigation } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Dimensions, FlatList, Modal, Platform, RefreshControl, StatusBar, StyleSheet, TouchableOpacity, View } from 'react-native';
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

    const {
        posts,
        isLoading,
        isRefetching,
        hasNextPage,
        isFetchingNextPage,
        isError,
        error,
        filters: { searchQuery, setSearchQuery, selectedType, setSelectedType },
        handlers: { handleLike, handleRefresh, handleEndReached, subscribeToPosts, unsubscribeFromPosts }
    } = useFeed();

    const handleViewImage = useCallback((images: string[], index: number) => {
        setViewerImages(images);
        setViewerInitialIndex(index);
        setViewerVisible(true);
    }, []);

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
            onLike={handleLike}
            onViewImage={handleViewImage}
            onPress={(_id) => {
                // Detail navigation
            }}
        />
    ), [handleLike, handleViewImage]);

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

                {/* Global Image Viewer Modal */}
                <Modal
                    visible={viewerVisible}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setViewerVisible(false)}
                >
                    <ThemedView style={styles.viewerContainer}>
                        <StatusBar hidden={viewerVisible} />
                        <View style={styles.viewerHeader}>
                            <TouchableOpacity
                                style={styles.closeButton}
                                onPress={() => setViewerVisible(false)}
                            >
                                <Ionicons name="close" size={28} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        <FlatList
                            data={viewerImages}
                            horizontal
                            pagingEnabled
                            initialScrollIndex={viewerInitialIndex}
                            getItemLayout={(_, index) => ({
                                length: width,
                                offset: width * index,
                                index,
                            })}
                            showsHorizontalScrollIndicator={false}
                            keyExtractor={(img, index) => `viewer-${index}`}
                            renderItem={({ item }) => (
                                <View style={styles.viewerImageWrapper}>
                                    <Image
                                        source={{ uri: item }}
                                        style={styles.fullImage}
                                        contentFit="contain"
                                    />
                                </View>
                            )}
                        />
                    </ThemedView>
                </Modal>
            </ThemedView>
        </ErrorBoundary>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    keyboardView: {
        flex: 1,
    },
    listContent: {
        paddingTop: 4,
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
