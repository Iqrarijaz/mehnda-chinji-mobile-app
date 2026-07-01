import React, { useState, useEffect, useRef, memo } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/ThemedText';
import Avatar from '@/components/ui/avatar';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { useSocket } from '@/context/SocketContext';

interface ChatHeaderProps {
    conversationId: string | string[] | undefined;
    name: string | string[] | undefined;
    profileImage: string | string[] | undefined;
    currentUserId: string | undefined;
    blockedByMe: boolean;
    onBack: () => void;
    onBlock: () => void;
}

const ChatHeaderComponent: React.FC<ChatHeaderProps> = ({
    conversationId,
    name,
    profileImage,
    currentUserId,
    blockedByMe,
    onBack,
    onBlock
}) => {
    const { theme, isDark } = useTheme();
    const { socket } = useSocket();
    const [isTyping, setIsTyping] = useState(false);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (!socket || !conversationId) return;

        const handleTypingStart = (data: any) => {
            if (data.conversationId === conversationId && data.userId !== currentUserId) {
                setIsTyping(true);
                if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000);
            }
        };

        const handleTypingEnd = (data: any) => {
            if (data.conversationId === conversationId && data.userId !== currentUserId) {
                setIsTyping(false);
                if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            }
        };

        socket.on('typing_start', handleTypingStart);
        socket.on('typing_end', handleTypingEnd);

        return () => {
            socket.off('typing_start', handleTypingStart);
            socket.off('typing_end', handleTypingEnd);
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        };
    }, [socket, conversationId, currentUserId]);

    return (
        <SafeAreaView style={{ backgroundColor: isDark ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)' }} edges={['top']}>
            <View style={[styles.header, { borderBottomColor: Colors[theme].border }]}>
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={Colors[theme].text} />
                </TouchableOpacity>

                <View style={styles.headerInfo}>
                    <Avatar
                        uri={profileImage as string}
                        name={name as string}
                        size={36}
                        style={styles.headerAvatar}
                    />
                    <View style={{ justifyContent: 'center', flex: 1 }}>
                        <ThemedText style={styles.headerName} numberOfLines={1}>
                            {String(name || 'Chat')}
                        </ThemedText>
                        {isTyping && (
                            <ThemedText style={{ fontSize: 12, color: Colors[theme].tint, marginTop: -2 }}>
                                Typing...
                            </ThemedText>
                        )}
                    </View>
                </View>

                <TouchableOpacity onPress={onBlock} style={styles.blockButton}>
                    <Ionicons
                        name={blockedByMe ? "ban" : "ban-outline"}
                        size={24}
                        color={blockedByMe ? "#ef4444" : Colors[theme].text}
                    />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

export const ChatHeader = memo(ChatHeaderComponent);

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    backButton: {
        padding: 4,
        marginRight: 8,
    },
    blockButton: {
        padding: 4,
        marginLeft: 8,
    },
    headerInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
    },
    headerAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        marginRight: 10,
        backgroundColor: '#cbd5e1',
    },
    headerName: {
        fontSize: 18,
        fontWeight: '600',
        textTransform: 'capitalize',
        flex: 1,
    },
});
