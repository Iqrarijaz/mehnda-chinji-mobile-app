import axios from 'axios';
import { baseUrl } from '../../configs';
import { ConversationSource } from '../../types/chat';
import { GET_AUTH_HEADER } from '../../utils/token';

export const CREATE_OR_GET_CONVERSATION = async (receiverId: string, source: ConversationSource | null = ConversationSource.NONE) => {
    try {
        const headers = await GET_AUTH_HEADER();
        console.log("API REQUEST LOGS", { receiverId, source });
        const response = await axios.post(`${baseUrl}/api/user/chat/conversation`, { receiverId, source }, { headers });
        console.log("API RESPONSE LOGS", response.data);
        return response.data;
    } catch (error) {
        console.error("Create Conversation Error", error);
        throw error;
    }
};

export const GET_CONVERSATIONS_LINES = async () => {
    try {
        const headers = await GET_AUTH_HEADER();
        console.log("API REQUEST LOGS", "GET_CONVERSATIONS_LINES");
        const response = await axios.get(`${baseUrl}/api/user/chat/conversations`, { headers });
        console.log("API RESPONSE LOGS", response.data);
        return response.data;
    } catch (error) {
        console.error("Get Conversations Error", error);
        throw error;
    }
};

export const SEND_MESSAGE = async (conversationId: string, text: string, type: 'text' | 'image' | 'file' = 'text') => {
    try {
        const headers = await GET_AUTH_HEADER();
        console.log("API REQUEST LOGS", { conversationId, text, type });
        const response = await axios.post(`${baseUrl}/api/user/chat/message/${conversationId}`, { text, type }, { headers });
        console.log("API RESPONSE LOGS", response.data);
        return response.data;
    } catch (error) {
        console.error("Send Message Error", error);
        throw error;
    }
};

export const GET_MESSAGES = async (conversationId: string, page = 1) => {
    try {
        const headers = await GET_AUTH_HEADER();
        console.log("API REQUEST LOGS", { conversationId, page });
        const response = await axios.get(`${baseUrl}/api/user/chat/messages/${conversationId}?page=${page}`, { headers });
        console.log("API RESPONSE LOGS", response.data);
        return response.data;
    } catch (error) {
        console.error("Get Messages Error", error);
        throw error;
    }
};

export const MARK_MESSAGES_SEEN = async (conversationId: string) => {
    try {
        const headers = await GET_AUTH_HEADER();
        // console.log("API REQUEST LOGS", { conversationId });
        await axios.put(`${baseUrl}/api/user/chat/seen/${conversationId}`, {}, { headers });
        return true;
    } catch (error) {
        console.error("Mark Messages Seen Error", error);
        // Don't throw, just log, as this is a background action
        return false;
    }
};

export const GET_CONVERSATION_DETAILS = async (conversationId: string) => {
    try {
        const headers = await GET_AUTH_HEADER();
        console.log("API REQUEST LOGS", { conversationId });
        const response = await axios.get(`${baseUrl}/api/user/chat/details/${conversationId}`, { headers });
        console.log("API RESPONSE LOGS", response.data);
        return response.data;
    } catch (error) {
        console.error("Get Conversation Details Error", error);
        throw error;
    }
};

export const BLOCK_CONVERSATION = async (conversationId: string) => {
    try {
        const headers = await GET_AUTH_HEADER();
        console.log("API REQUEST LOGS", { conversationId });
        const response = await axios.put(`${baseUrl}/api/user/chat/block/${conversationId}`, {}, { headers });
        console.log("API RESPONSE LOGS", response.data);
        return response.data;
    } catch (error) {
        console.error("Block Conversation Error", error);
        throw error;
    }
};

export const UNBLOCK_CONVERSATION = async (conversationId: string) => {
    try {
        const headers = await GET_AUTH_HEADER();
        console.log("API REQUEST LOGS", { conversationId });
        const response = await axios.put(`${baseUrl}/api/user/chat/unblock/${conversationId}`, {}, { headers });
        console.log("API RESPONSE LOGS", response.data);
        return response.data;
    } catch (error) {
        console.error("Unblock Conversation Error", error);
        throw error;
    }
};
