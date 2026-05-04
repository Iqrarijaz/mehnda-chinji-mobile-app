import apiClient from '../client';
import { ConversationSource } from '../../types/chat';

export const createOrGetConversation = async (receiverId: string, source: ConversationSource | null = ConversationSource.NONE) => {
    return apiClient.post('/api/user/chat/conversation', { receiverId, source });
};

export const getConversationsLines = async () => {
    return apiClient.get('/api/user/chat/conversations');
};

export const sendMessage = async (conversationId: string, text: string, type: 'text' | 'image' | 'file' = 'text') => {
    return apiClient.post(`/api/user/chat/message/${conversationId}`, { text, type });
};

export const getMessages = async (conversationId: string, page = 1) => {
    return apiClient.get(`/api/user/chat/messages/${conversationId}?page=${page}`);
};

export const markMessagesSeen = async (conversationId: string) => {
    try {
        await apiClient.put(`/api/user/chat/seen/${conversationId}`, {});
        return true;
    } catch (error) {
        // console.error("Mark Messages Seen Error", error);
        // Don't throw, just log, as this is a background action
        return false;
    }
};

export const getConversationDetails = async (conversationId: string) => {
    return apiClient.get(`/api/user/chat/details/${conversationId}`);
};

export const blockConversation = async (conversationId: string) => {
    return apiClient.put(`/api/user/chat/block/${conversationId}`, {});
};

export const unblockConversation = async (conversationId: string) => {
    return apiClient.put(`/api/user/chat/unblock/${conversationId}`, {});
};
