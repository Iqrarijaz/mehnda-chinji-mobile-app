import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Modal, StyleSheet, TouchableOpacity, View, Platform } from 'react-native';
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

export const CleanConfirmationModal: React.FC<CleanConfirmationModalProps> = React.memo(({
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
                    iconBg: `${colors.danger}15`,
                    iconColor: colors.danger,
                    confirmBg: colors.danger,
                    iconName: 'trash-outline' as const,
                };
            case 'warning':
                return {
                    iconBg: `${colors.warning}15`,
                    iconColor: colors.warning,
                    confirmBg: colors.warning,
                    iconName: 'warning-outline' as const,
                };
            case 'success':
                return {
                    iconBg: `${colors.success}15`,
                    iconColor: colors.success,
                    confirmBg: colors.success,
                    iconName: 'checkmark-circle-outline' as const,
                };
            case 'info':
            default:
                return {
                    iconBg: `${colors.primary}15`,
                    iconColor: colors.primary,
                    confirmBg: colors.primary,
                    iconName: 'information-circle-outline' as const,
                };
        }
    };

    const typeStyles = getStyles();

    if (!visible) return null;

    return (
        <Modal
            transparent
            visible={visible}
            onRequestClose={onClose}
            animationType="fade"
            statusBarTranslucent
        >
            <View style={styles.modalOverlay}>
                <View
                    style={[
                        styles.modalContent,
                        { backgroundColor: colors.card },
                    ]}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.iconWrapper}>
                            <Ionicons name={typeStyles.iconName} size={32} color={typeStyles.iconColor} />
                        </View>
                    </View>

                    {/* Title & Message */}
                    <ThemedText style={[styles.title, { color: colors.text }]}>
                        {title}
                    </ThemedText>

                    <ThemedText style={[styles.message, { color: colors.textSecondary }]}>
                        {message}
                    </ThemedText>

                    {/* Action Buttons */}
                    <View style={styles.actionsContainer}>
                        <TouchableOpacity
                            onPress={onClose}
                            disabled={isLoading}
                            activeOpacity={0.7}
                            style={[
                                styles.button,
                                styles.cancelBtn,
                                { backgroundColor: colors.inputBackground }
                            ]}
                        >
                            <ThemedText style={[styles.cancelBtnText, { color: colors.text }]}>
                                {cancelText}
                            </ThemedText>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={onConfirm}
                            disabled={isLoading}
                            activeOpacity={0.8}
                            style={[
                                styles.button,
                                styles.confirmBtn,
                                { backgroundColor: typeStyles.confirmBg }
                            ]}
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
});

CleanConfirmationModal.displayName = 'CleanConfirmationModal';

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.55)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalContent: {
        width: '100%',
        maxWidth: 320,
        borderRadius: Layout.borderRadius,
        padding: 20,
        alignItems: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 8,
    },
    iconWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 6,
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 6,
    },
    message: {
        fontSize: 13,
        textAlign: 'center',
        lineHeight: 18,
        marginBottom: 20,
        fontWeight: '500',
        paddingHorizontal: 4,
    },
    actionsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        width: '100%',
    },
    button: {
        flex: 1,
        height: Platform.OS === 'android' ? 46 : 50,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: Layout.borderRadius,
    },
    cancelBtn: {},
    cancelBtnText: {
        fontSize: 13,
        fontWeight: '700',
    },
    confirmBtn: {},
    confirmBtnText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#FFFFFF',
    },
});
