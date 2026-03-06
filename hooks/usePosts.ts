import {
    addPostComment,
    deletePostComment,
    getPostComments,
    getPostsList,
    POST_QUERY_KEYS,
    PostData,
    toggleLikePost,
    updatePostComment
} from '@/apis/posts';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export const usePosts = (filters: { type?: string | null; searchQuery?: string } = {}) => {
    return useInfiniteQuery({
        queryKey: POST_QUERY_KEYS.list({ type: filters.type, search: filters.searchQuery }),
        queryFn: ({ pageParam = 1 }) => getPostsList({
            type: filters.type,
            search: filters.searchQuery,
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
        staleTime: 60 * 1000,
        gcTime: 10 * 60 * 1000,
    });
};

export const useLikePost = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: toggleLikePost,
        onMutate: async (postId) => {
            // Cancel any outgoing refetches
            await queryClient.cancelQueries({ queryKey: POST_QUERY_KEYS.all });

            // Snapshot the previous value
            const previousPosts = queryClient.getQueryData(POST_QUERY_KEYS.all);

            // Optimistically update
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
        onError: (err, postId, context: any) => {
            queryClient.setQueriesData({ queryKey: POST_QUERY_KEYS.all }, context.previousPosts);
        },
    });
};

export const usePostComments = (postId: string, parentCommentId: string | null = null, enabled: boolean = true) => {
    return useInfiniteQuery({
        queryKey: POST_QUERY_KEYS.comments(postId, parentCommentId),
        queryFn: ({ pageParam = 1 }) => getPostComments(postId, pageParam, 20, parentCommentId),
        getNextPageParam: (lastPage: any) => {
            const pagination = lastPage?.pagination;
            if (pagination && pagination.currentPage < pagination.totalPages) {
                return pagination.currentPage + 1;
            }
            return undefined;
        },
        initialPageParam: 1,
        enabled: enabled && !!postId,
        staleTime: 60 * 1000,
        gcTime: 10 * 60 * 1000,
    });
};

export const useAddComment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ postId, text, parentCommentId }: { postId: string; text: string; parentCommentId?: string | null }) =>
            addPostComment(postId, text, parentCommentId),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: POST_QUERY_KEYS.comments(variables.postId, null) });
        },
    });
};

export const useDeleteComment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deletePostComment,
        onSuccess: (response: any, commentId) => {
            if (response?.data?.postId) {
                queryClient.invalidateQueries({ queryKey: POST_QUERY_KEYS.comments(response.data.postId, null) });
            }
        },
    });
};

export const useUpdateComment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ commentId, text }: { commentId: string; text: string }) =>
            updatePostComment(commentId, text),
        onSuccess: (response: any) => {
            const postId = response?.data?.postId;
            if (postId) {
                queryClient.invalidateQueries({ queryKey: POST_QUERY_KEYS.comments(postId, null) });
            }
        },
    });
};
