import React, { useState, useCallback, useRef, memo, forwardRef, useImperativeHandle } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';

interface ChatInputProps {
    onSend: (text: string) => void;
    onTyping?: () => void;
}

export interface ChatInputRef {
    setText: (text: string) => void;
}

const ChatInputComponent = forwardRef<ChatInputRef, ChatInputProps>(({ onSend, onTyping }, ref) => {
    const [text, setText] = useState('');

    useImperativeHandle(ref, () => ({
        setText
    }));

    const { theme } = useTheme();
    const colors = Colors[theme];
    
    // Debounce typing emits so we don't flood the server/sockets
    const lastTyped = useRef(0);

    const handleChange = useCallback((val: string) => {
        setText(val);
        
        // Debounce typing event (emit max once every 2 seconds)
        const now = Date.now();
        if (now - lastTyped.current > 2000) {
            if (onTyping) onTyping();
            lastTyped.current = now;
        }
    }, [onTyping]);

    const handleSendPress = useCallback(() => {
        const trimmed = text.trim();
        if (!trimmed) return;
        
        onSend(trimmed);
        setText('');
    }, [text, onSend]);

    return (
        <View style={[styles.container, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
            <View style={[styles.inputWrapper, { backgroundColor: colors.background }]}>
                <TextInput
                    style={[styles.input, { color: colors.text }]}
                    value={text}
                    onChangeText={handleChange}
                    placeholder="Type a message..."
                    placeholderTextColor={colors.icon}
                    multiline
                    maxLength={1000}
                />
                <TouchableOpacity
                    style={[
                        styles.sendButton,
                        { backgroundColor: colors.primary, opacity: !text.trim() ? 0.6 : 1 }
                    ]}
                    onPress={handleSendPress}
                    disabled={!text.trim()}
                    activeOpacity={0.8}
                >
                    <Ionicons name="send" size={18} color="#FFFFFF" style={{ marginLeft: 2 }} />
                </TouchableOpacity>
            </View>
        </View>
    );
});

export const ChatInput = memo(ChatInputComponent);

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderTopWidth: StyleSheet.hairlineWidth,
        // UI inspiration from ThankYou modal / premium UI
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 5,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        borderRadius: 24, // Pill shaped inspired by ThankYouModal button
        paddingHorizontal: 6,
        paddingVertical: 6,
    },
    input: {
        flex: 1,
        minHeight: 40,
        maxHeight: 120,
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'ios' ? 10 : 8,
        paddingBottom: Platform.OS === 'ios' ? 10 : 8,
        fontSize: 15,
        lineHeight: 20,
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
        marginBottom: 0, // align to bottom of multiline
    },
});
