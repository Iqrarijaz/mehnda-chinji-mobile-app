import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity, View, Platform } from 'react-native';
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
    type?: 'danger' | 'info' | 'warning' | 'success';
    isLoading?: boolean;
}

export const ConfirmationModal: React.FC<GlassConfirmationModalProps> = React.memo(({
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

    const getIconColor = () => {
        switch (type) {
            case 'danger':
                return { bg: `${colors.danger}15`, color: colors.danger, btnBg: colors.danger, icon: 'trash-outline' as const };
            case 'warning':
                return { bg: `${colors.warning}15`, color: colors.warning, btnBg: colors.warning, icon: 'warning-outline' as const };
            case 'success':
                return { bg: `${colors.success}15`, color: colors.success, btnBg: colors.success, icon: 'checkmark-circle-outline' as const };
            case 'info':
            default:
                return { bg: `${colors.primary}15`, color: colors.primary, btnBg: colors.primary, icon: 'information-circle-outline' as const };
        }
    };

    const typeConfig = getIconColor();

    return (
        <PremiumModal visible={visible} onClose={onClose} type="centered" sheetStyle={{ backgroundColor: 'transparent', paddingHorizontal: 0, paddingBottom: 0, paddingTop: 0 }}>
            <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                {/* Header with Icon */}
                <View style={styles.header}>
                    <View style={styles.iconWrapper}>
                        <Ionicons
                            name={typeConfig.icon}
                            size={32}
                            color={typeConfig.color}
                        />
                    </View>
                    <ThemedText style={[styles.title, { color: colors.text }]}>{title}</ThemedText>
                </View>

                {/* Message */}
                <ThemedText style={[styles.message, { color: colors.textSecondary }]}>{message}</ThemedText>

                {/* Footer Actions */}
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[styles.button, styles.cancelBtn, { backgroundColor: colors.inputBackground }]}
                        onPress={onClose}
                        disabled={isLoading}
                        activeOpacity={0.7}
                    >
                        <ThemedText style={[styles.cancelText, { color: colors.text }]}>{cancelText}</ThemedText>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.button, styles.confirmBtnWrapper, { backgroundColor: typeConfig.btnBg }]}
                        onPress={onConfirm}
                        disabled={isLoading}
                        activeOpacity={0.8}
                    >
                        <ThemedText style={styles.confirmBtnText}>{confirmText}</ThemedText>
                    </TouchableOpacity>
                </View>
            </View>
        </PremiumModal>
    );
});

ConfirmationModal.displayName = 'ConfirmationModal';

const styles = StyleSheet.create({
    modalContent: {
        width: '100%',
        maxWidth: 320,
        alignSelf: 'center',
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
        paddingHorizontal: 4,
        fontWeight: '500',
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        width: '100%',
    },
    button: {
        flex: 1,
        height: Platform.OS === 'android' ? 46 : 50,
        borderRadius: Layout.borderRadius,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelBtn: {},
    cancelText: {
        fontSize: 13,
        fontWeight: '700',
    },
    confirmBtnWrapper: {},
    confirmBtnText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#FFFFFF',
    },
});
