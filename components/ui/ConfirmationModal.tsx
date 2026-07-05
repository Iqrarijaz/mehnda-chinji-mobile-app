import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '../ThemedText';
import { PremiumModal } from '../common/PremiumModal';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/colors';

interface GlassConfirmationModalProps {
    visible: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'info';
}

export const ConfirmationModal: React.FC<GlassConfirmationModalProps> = ({
    visible,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    type = 'info'
}) => {
    const { theme } = useTheme();
    const colors = Colors[theme];

    return (
        <PremiumModal visible={visible} onClose={onClose} type="centered" sheetStyle={{ backgroundColor: 'transparent', paddingHorizontal: 0, paddingBottom: 0, paddingTop: 0 }}>
            <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                {/* Header with Icon */}
                <View style={styles.header}>
                    <View style={[
                        styles.iconWrapper,
                        { backgroundColor: type === 'danger' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)' }
                    ]}>
                        <Ionicons
                            name={type === 'danger' ? "alert-circle" : "information-circle"}
                            size={32}
                            color={type === 'danger' ? "#ef4444" : "#3b82f6"}
                        />
                    </View>
                    <ThemedText style={[styles.title, { color: colors.text }]}>{title}</ThemedText>
                </View>

                {/* Message */}
                <ThemedText style={[styles.message, { color: colors.textSecondary }]}>{message}</ThemedText>

                {/* Footer Actions */}
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={styles.cancelBtn}
                        onPress={onClose}
                        activeOpacity={0.7}
                    >
                        <ThemedText style={[styles.cancelText, { color: colors.textSecondary }]}>{cancelText}</ThemedText>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.confirmBtnWrapper, { backgroundColor: type === 'danger' ? '#ef4444' : colors.primary }]}
                        onPress={onConfirm}
                        activeOpacity={0.8}
                    >
                        <ThemedText style={styles.confirmBtnText}>{confirmText}</ThemedText>
                    </TouchableOpacity>
                </View>
            </View>
        </PremiumModal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        width: '85%',
        maxWidth: 320,
        alignSelf: 'center',
        borderRadius: Layout.borderRadius,
        padding: 20,
        overflow: 'hidden',
        borderColor: 'rgba(0, 0, 0, 0.08)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
    },
    header: {
        alignItems: 'center',
        marginBottom: 12,
    },
    iconWrapper: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    title: {
        fontSize: 18,
        fontWeight: '800',
        textAlign: 'center',
    },
    message: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 20,
        paddingHorizontal: 10,
    },
    footer: {
        flexDirection: 'row',
        gap: 12,
        justifyContent: 'center',
    },
    cancelBtn: {
        width: 120,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(128, 128, 128, 0.1)',
    },
    cancelText: {
        fontSize: 14,
        fontWeight: '600',
    },
    confirmBtnWrapper: {
        width: 120,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    confirmBtnText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});
