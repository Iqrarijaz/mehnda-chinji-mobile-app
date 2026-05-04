import { POST_QUERY_KEYS, PostData } from '@/apis/posts';
import { useSocket } from '@/context/SocketContext';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

/**
 * useFeedSocket
 * Manages global socket listeners for the feed with optimizations:
 * 1. Throttling: Prevents UI jank during high-frequency updates (e.g., rapid likes).
 * 2. Deduplication: Ensures listeners are attached correctly for the feed context.
 * 3. Surgical Updates: Updates the React Query cache only where needed.
 */
export const useFeedSocket = () => {
    const queryClient = useQueryClient();
    const { socket } = useSocket();

    // Ref to store pending updates for throttling
    const pendingUpdates = useRef<Map<string, { likesCount?: number; commentsCount?: number }>>(new Map());
    const throttleTimer = useRef<NodeJS.Timeout | null>(null);

    const applyThrottledUpdates = () => {
        if (pendingUpdates.current.size === 0) return;

        const updates = new Map(pendingUpdates.current);
        pendingUpdates.current.clear();

        queryClient.setQueriesData({ queryKey: POST_QUERY_KEYS.all }, (old: any) => {
            if (!old) return old;

            let cacheChanged = false;
            const newPages = old.pages.map((page: any) => {
                let pageChanged = false;
                const newData = (page.data || []).map((post: PostData) => {
                    const update = updates.get(post._id);
                    if (update) {
                        pageChanged = true;
                        cacheChanged = true;
                        return {
                            ...post,
                            likesCount: update.likesCount !== undefined ? update.likesCount : post.likesCount,
                            commentsCount: update.commentsCount !== undefined ? update.commentsCount : post.commentsCount,
                        };
                    }
                    return post;
                });

                return pageChanged ? { ...page, data: newData } : page;
            });

            return cacheChanged ? { ...old, pages: newPages } : old;
        });

        throttleTimer.current = null;
    };

    useEffect(() => {
        if (!socket) return;

        const handlePostUpdated = (data: { postId: string, likesCount?: number, commentsCount?: number }) => {
            // Add to pending updates
            const current = pendingUpdates.current.get(data.postId) || {};
            pendingUpdates.current.set(data.postId, {
                ...current,
                ...data
            });

            // Trigger throttled update (100ms window)
            if (!throttleTimer.current) {
                throttleTimer.current = setTimeout(applyThrottledUpdates, 100) as any;
            }
        };

        const handleNewComment = (data: { postId: string, comment: any }) => {
            // New comments are usually lower frequency than likes, but we still update surgically
            queryClient.setQueriesData({ queryKey: POST_QUERY_KEYS.comments(data.postId, null) }, (old: any) => {
                if (!old) return old;
                return {
                    ...old,
                    pages: old.pages.map((page: any, index: number) => {
                        if (index === 0) {
                            return {
                                ...page,
                                data: [data.comment, ...(page.data || [])]
                            };
                        }
                        return page;
                    })
                };
            });

            // Increment comment count in post list (throttled)
            handlePostUpdated({ postId: data.postId });
        };

        const handleCommentDeleted = (data: { postId: string, commentId: string }) => {
            queryClient.setQueriesData({ queryKey: POST_QUERY_KEYS.comments(data.postId, null) }, (old: any) => {
                if (!old) return old;
                return {
                    ...old,
                    pages: old.pages.map((page: any) => {
                        const hasComment = (page.data || []).some((c: any) => c._id === data.commentId);
                        if (!hasComment) return page;
                        return {
                            ...page,
                            data: page.data.filter((c: any) => c._id !== data.commentId)
                        };
                    })
                };
            });
            handlePostUpdated({ postId: data.postId });
        };

        const handleCommentUpdated = (data: { postId: string, comment: any }) => {
            queryClient.setQueriesData({ queryKey: POST_QUERY_KEYS.comments(data.postId, null) }, (old: any) => {
                if (!old) return old;
                return {
                    ...old,
                    pages: old.pages.map((page: any) => {
                        const index = (page.data || []).findIndex((c: any) => c._id === data.comment._id);
                        if (index === -1) return page;
                        const newData = [...page.data];
                        newData[index] = data.comment;
                        return { ...page, data: newData };
                    })
                };
            });
        };

        socket.on('post_updated', handlePostUpdated);
        socket.on('new_comment', handleNewComment);
        socket.on('comment_deleted', handleCommentDeleted);
        socket.on('comment_updated', handleCommentUpdated);

        return () => {
            socket.off('post_updated', handlePostUpdated);
            socket.off('new_comment', handleNewComment);
            socket.off('comment_deleted', handleCommentDeleted);
            socket.off('comment_updated', handleCommentUpdated);
            if (throttleTimer.current) clearTimeout(throttleTimer.current);
        };
    }, [socket, queryClient]);

    // Viewability management for rooms
    const subscribeToPosts = (postIds: string[]) => {
        if (!socket || postIds.length === 0) return;
        socket.emit('subscribe_posts', postIds);
    };

    const unsubscribeFromPosts = (postIds: string[]) => {
        if (!socket || postIds.length === 0) return;
        socket.emit('unsubscribe_posts', postIds);
    };

    return { subscribeToPosts, unsubscribeFromPosts };
};
