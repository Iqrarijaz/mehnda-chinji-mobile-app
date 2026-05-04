import { POST_QUERY_KEYS, PostData, getPostsList, toggleLikePost } from '@/apis/posts';
import { useSocket } from '@/context/SocketContext';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFeedSocket } from './useFeedSocket';

export const useFeed = () => {
    const queryClient = useQueryClient();
    const { socket } = useSocket();

    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [selectedType, setSelectedType] = useState<string | null>(null);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const queryKey = useMemo(() =>
        POST_QUERY_KEYS.list({ type: selectedType || undefined, search: debouncedSearch || undefined }),
        [selectedType, debouncedSearch]);

    const {
        data: posts = [], // Flattened posts derived via query select
        isLoading,
        isRefetching,
        hasNextPage,
        fetchNextPage,
        isFetchingNextPage,
        refetch,
        isError,
        error
    } = useInfiniteQuery({
        queryKey,
        queryFn: ({ pageParam = 1 }) => getPostsList({
            type: selectedType || undefined,
            search: debouncedSearch || undefined,
            page: pageParam
        }),
        getNextPageParam: (lastPage: any) => {
            const pagination = lastPage?.pagination;
            if (pagination && pagination.currentPage < pagination.totalPages) {
                return pagination.currentPage + 1;
            }
            return undefined;
        },
        initialPageParam: 1,
        staleTime: 60 * 1000, // 1 minute
        gcTime: 10 * 60 * 1000, // 10 minutes
        // Optimization: derive posts once and memoize at the source
        select: (data) => data.pages.flatMap((page: any) => page.data || []),
    });

    const likeMutation = useMutation({
        mutationFn: toggleLikePost,
        onMutate: async (postId) => {
            await queryClient.cancelQueries({ queryKey: POST_QUERY_KEYS.all });
            const previousPosts = queryClient.getQueryData(POST_QUERY_KEYS.all);

            queryClient.setQueriesData({ queryKey: POST_QUERY_KEYS.all }, (old: any) => {
                if (!old) return old;
                return {
                    ...old,
                    pages: old.pages.map((page: any) => {
                        const postIndex = (page.data || []).findIndex((p: PostData) => p._id === postId);
                        if (postIndex === -1) return page;

                        const newData = [...page.data];
                        const post = newData[postIndex];
                        newData[postIndex] = {
                            ...post,
                            isLiked: !post.isLiked,
                            likesCount: post.isLiked ? (post.likesCount || 1) - 1 : (post.likesCount || 0) + 1
                        };
                        return { ...page, data: newData };
                    })
                };
            });
            return { previousPosts };
        },
        onError: (_err, _postId, context: any) => {
            queryClient.setQueriesData({ queryKey: POST_QUERY_KEYS.all }, context.previousPosts);
        },
    });

    const handleLike = useCallback((postId: string) => {
        likeMutation.mutate(postId);
    }, [likeMutation]);

    const { subscribeToPosts, unsubscribeFromPosts } = useFeedSocket();

    return {
        posts,
        isLoading,
        isRefetching,
        hasNextPage,
        isFetchingNextPage,
        isError,
        error,
        filters: {
            searchQuery,
            setSearchQuery,
            selectedType,
            setSelectedType
        },
        handlers: {
            handleLike,
            handleRefresh: refetch,
            handleEndReached: () => {
                if (hasNextPage && !isFetchingNextPage) {
                    fetchNextPage();
                }
            },
            subscribeToPosts,
            unsubscribeFromPosts
        }
    };
};
