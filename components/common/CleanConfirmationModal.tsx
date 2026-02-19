import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '../themed-text';

interface CleanConfirmationModalProps {
    visible: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'info';
    isLoading?: boolean;
}

export const CleanConfirmationModal: React.FC<CleanConfirmationModalProps> = ({
    visible,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    type = 'info',
    isLoading = false
}) => {
    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <Pressable style={styles.overlay} onPress={onClose}>
                <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>

                    {/* Header with Icon */}
                    <View style={styles.header}>
                        <View style={[
                            styles.iconWrapper,
                            { backgroundColor: type === 'danger' ? '#FEE2E2' : 'rgba(0, 64, 48, 0.08)' }
                        ]}>
                            <Ionicons
                                name={type === 'danger' ? "alert-circle" : "notifications"}
                                size={32}
                                color={type === 'danger' ? "#EF4444" : "#004030"}
                            />
                        </View>
                        <ThemedText style={styles.title}>{title}</ThemedText>
                    </View>

                    {/* Message */}
                    <ThemedText style={styles.message}>{message}</ThemedText>

                    {/* Footer Actions */}
                    <View style={styles.footer}>
                        <TouchableOpacity
                            style={styles.cancelBtn}
                            onPress={onClose}
                            activeOpacity={0.7}
                            disabled={isLoading}
                        >
                            <ThemedText style={styles.cancelText}>{cancelText}</ThemedText>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.confirmBtnWrapper, { backgroundColor: type === 'danger' ? '#EF4444' : '#004030' }]}
                            onPress={onConfirm}
                            activeOpacity={0.8}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <ThemedText style={styles.confirmBtnText}>{confirmText}</ThemedText>
                            )}
                        </TouchableOpacity>
                    </View>
                </Pressable>
            </Pressable>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        width: '90%',
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 10,
    },
    header: {
        alignItems: 'center',
        marginBottom: 16,
    },
    iconWrapper: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: '800',
        color: '#1E293B',
        textAlign: 'center',
        letterSpacing: -0.5,
    },
    message: {
        fontSize: 15,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 28,
        paddingHorizontal: 10,
    },
    footer: {
        flexDirection: 'row',
        gap: 12,
    },
    cancelBtn: {
        flex: 1,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 14,
        backgroundColor: '#F1F5F9',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    cancelText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#64748B',
    },
    confirmBtnWrapper: {
        flex: 1,
        height: 48,
        borderRadius: 14,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
    },
    confirmBtnText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#FFFFFF',
    },
});
