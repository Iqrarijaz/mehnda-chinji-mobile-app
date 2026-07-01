import React, { memo } from 'react';
import { View, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';

interface BlockConfirmationModalProps {
    visible: boolean;
    onClose: () => void;
    onConfirm: () => void;
    isBlockedByMe: boolean;
}

const BlockConfirmationModalComponent: React.FC<BlockConfirmationModalProps> = ({
    visible,
    onClose,
    onConfirm,
    isBlockedByMe,
}) => {
    const { theme, isDark } = useTheme();
    const colors = Colors[theme];

    const title = isBlockedByMe ? "Unblock User" : "Block User";
    const message = isBlockedByMe
        ? "Are you sure you want to unblock this user? They will be able to message you again."
        : "Are you sure you want to block this user? You won't be able to send or receive messages.";
    const confirmText = isBlockedByMe ? "Unblock" : "Block";
    const iconColor = isBlockedByMe ? "#3b82f6" : "#ef4444";
    const iconBgColor = isBlockedByMe ? "rgba(59, 130, 246, 0.1)" : "rgba(239, 68, 68, 0.1)";

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: colors.card }]}>

                    <View style={[styles.iconContainer, { backgroundColor: iconBgColor }]}>
                        <Ionicons
                            name={isBlockedByMe ? "lock-open-outline" : "ban-outline"}
                            size={42}
                            color={iconColor}
                        />
                    </View>

                    <View style={styles.textContainer}>
                        <ThemedText style={styles.title}>{title}</ThemedText>
                        <ThemedText style={[styles.message, { color: colors.textSecondary }]}>
                            {message}
                        </ThemedText>
                    </View>

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={[styles.cancelButton, { backgroundColor: isDark ? '#334155' : '#f1f5f9' }]}
                            onPress={onClose}
                        >
                            <ThemedText style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</ThemedText>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.confirmButton, { backgroundColor: iconColor }]}
                            onPress={onConfirm}
                        >
                            <ThemedText style={styles.confirmButtonText}>{confirmText}</ThemedText>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

export const BlockConfirmationModal = memo(BlockConfirmationModalComponent);

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalContent: {
        width: '100%',
        borderRadius: Layout.borderRadius,
        padding: 24,
        alignItems: 'center',
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    textContainer: {
        marginBottom: 28,
        alignItems: 'center',
        paddingHorizontal: 8,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
    },
    message: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 22,
    },
    buttonContainer: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-between',
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 15,
        fontWeight: '600',
    },
    confirmButton: {
        flex: 1,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    confirmButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '600',
    }
});
