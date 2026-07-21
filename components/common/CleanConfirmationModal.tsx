import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Modal, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '../ThemedText';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/colors';

interface CleanConfirmationModalProps {
    visible: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'info' | 'success' | 'warning';
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
    const { theme } = useTheme();
    const colors = Colors[theme];

    // Determine colors and icons based on type
    const getStyles = () => {
        switch (type) {
            case 'danger':
                return {
                    bg: '#FEF2F2',
                    icon: 'alert-circle' as const,
                    color: '#EF4444',
                    btnBg: '#EF4444'
                };
            case 'success':
                return {
                    bg: '#F0FDF4',
                    icon: 'checkmark-circle' as const,
                    color: '#22C55E',
                    btnBg: '#22C55E'
                };
            case 'warning':
                return {
                    bg: '#FFFBEB',
                    icon: 'warning' as const,
                    color: '#F59E0B',
                    btnBg: '#F59E0B'
                };
            case 'info':
            default:
                return {
                    bg: '#F8FAFC',
                    icon: 'information-circle' as const,
                    color: '#000000',
                    btnBg: '#000000'
                };
        }
    };

    const config = getStyles();

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                    {/* Header with Icon */}
                    <View style={styles.header}>
                        <View style={[
                            styles.iconWrapper,
                            { backgroundColor: config.bg }
                        ]}>
                            <Ionicons name={config.icon} size={22} color={config.color} />
                        </View>
                        <ThemedText style={[styles.title, { color: config.color }]}>{title}</ThemedText>
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
                            style={[styles.confirmBtnWrapper, { backgroundColor: config.btnBg }]}
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
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24 },
    modalContent: {
        width: '100%',
        borderRadius: Layout.borderRadius,
        padding: 24,
        alignItems: 'center' },
    header: {
        alignItems: 'center',
        marginBottom: 16 },
    iconWrapper: {
        width: 72,
        height: 72,
        borderRadius: Layout.borderRadius,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20 },
    title: {
        fontSize: 18,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 8 },
    message: {
        fontSize: 13,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 24,
        fontWeight: '500' },
    footer: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8 },
    cancelBtn: {
        flex: 1,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: Layout.borderRadius,
        backgroundColor: '#F8FAFC' },
    cancelText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748B' },
    confirmBtnWrapper: {
        flex: 1,
        height: 40,
        borderRadius: Layout.borderRadius,
        justifyContent: 'center',
        alignItems: 'center' },
    confirmBtnText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF' } });
