export interface User {
    _id: string;
    name: string;
    profileImage?: string;
    email?: string;
}

export enum ConversationSource {
    BUSINESS = 'BUSINESS',
    DONOR = 'DONOR',
    MULTIPLE = 'MULTIPLE',
    MARKETPLACE = 'MARKETPLACE',
    NONE = 'NONE',
}

export interface Conversation {
    _id: string;
    participants: User[];
    lastMessage: string;
    lastMessageAt: string;
    lastMessageBy: string;
    unreadCount: Record<string, number>;
    source?: ConversationSource | null;
    blockedBy?: string[];
    createdAt: string;
    updatedAt: string;
}

export interface Message {
    _id: string;
    conversationId: string;
    sender: User | string;
    text: string;
    seenBy: string[];
    status: 'sent' | 'delivered' | 'read';
    type: 'text' | 'image' | 'file';
    createdAt: string;
    updatedAt: string;
}
