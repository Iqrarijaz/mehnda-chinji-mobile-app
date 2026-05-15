import apiClient from '../client';

export interface PostData {
    _id: string;
    content: string;
    images: string[];
    type: 'GENERAL' | 'DEATH' | 'ACCIDENT' | 'SPORTS' | 'SPONSORED';
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

export interface CommentData {
    _id: string;
    postId: string;
    userId: {
        _id: string;
        name: string;
        profileImage?: string;
    };
    text: string;
    parentCommentId: string | null;
    repliesCount: number;
    createdAt: string;
}

export const POST_QUERY_KEYS = {
    all: ['posts'] as const,
    list: (filters: any) => [...POST_QUERY_KEYS.all, 'infinite-list', filters] as const,
    detail: (postId: string) => [...POST_QUERY_KEYS.all, 'detail', postId] as const,
    comments: (postId: string, parentCommentId: string | null) => [...POST_QUERY_KEYS.all, 'comments', postId, parentCommentId] as const,
};

export const getPostsList = async (params: { page?: number; limit?: number; type?: string | null; search?: string } = {}) => {
    console.log('Fetching posts with params:', params);
    const response: any = await apiClient.get('/api/user/v1/posts/list', { params });
    console.log('Posts response received:', { success: response?.success, count: response?.data?.length });
    return response;
};

export const getPostDetail = async (postId: string) => {
    return apiClient.get('/api/user/v1/posts/detail', { params: { postId } });
};

export const toggleLikePost = async (postId: string) => {
    return apiClient.post('/api/user/v1/posts/like', { postId });
};

export const addPostComment = async (postId: string, text: string, parentCommentId?: string | null) => {
    return apiClient.post('/api/user/v1/posts/comment/add', { postId, text, parentCommentId });
};

export const getPostComments = async (postId: string, page: number = 1, limit: number = 20, parentCommentId?: string | null) => {
    const params = { postId, page, limit, parentCommentId };
    return apiClient.get('/api/user/v1/posts/comment/list', { params });
};

export const deletePostComment = async (commentId: string) => {
    return apiClient.post('/api/user/v1/posts/comment/delete', { commentId });
};

export const updatePostComment = async (commentId: string, text: string) => {
    return apiClient.post('/api/user/v1/posts/comment/update', { commentId, text });
};

// Post Management APIs
export const createPost = async (formData: FormData) => {
    return apiClient.post('/api/user/v1/posts/add', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
};

export const updatePost = async (postId: string, formData: FormData) => {
    // Ensure postId is included in the formData for the backend to identify the post
    if (!formData.has('postId')) {
        formData.append('postId', postId);
    }
    return apiClient.post(`/api/user/v1/posts/update`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
};

export const deletePost = async (postId: string) => {
    return apiClient.post('/api/user/v1/posts/delete', { postId });
};

export const deletePostImage = async (postId: string, imageUrl: string) => {
    return apiClient.post('/api/user/v1/posts/image/delete', { postId, imageUrl });
};
