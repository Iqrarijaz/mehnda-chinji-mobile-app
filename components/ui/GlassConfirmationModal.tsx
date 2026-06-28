import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '../ThemedText';
import { PremiumModal } from '../common/PremiumModal';
import { Layout } from '@/constants/layout';

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

export const GlassConfirmationModal: React.FC<GlassConfirmationModalProps> = ({
    visible,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    type = 'info'
}) => {
    return (
        <PremiumModal visible={visible} onClose={onClose} type="centered" sheetStyle={{ backgroundColor: 'transparent', paddingHorizontal: 0, paddingBottom: 0, paddingTop: 0 }}>
            <View style={styles.modalContent}>
                <LinearGradient
                    colors={['rgba(255, 255, 255, 0.98)', 'rgba(241, 245, 249, 0.99)']}
                    style={StyleSheet.absoluteFill}
                />

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
                    >
                        <ThemedText style={styles.cancelText}>{cancelText}</ThemedText>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.confirmBtnWrapper}
                        onPress={onConfirm}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={type === 'danger' ? ['#ef4444', '#b91c1c'] : ['#3b82f6', '#1d4ed8']}
                            style={styles.confirmBtn}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <ThemedText style={styles.confirmBtnText}>{confirmText}</ThemedText>
                        </LinearGradient>
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
        width: '100%',
        borderRadius: Layout.borderRadius,
        padding: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.08)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
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
        marginBottom: 12,
    },
    title: {
        fontSize: 20,
        fontWeight: '800',
        color: '#0f172a',
        textAlign: 'center',
    },
    message: {
        fontSize: 15,
        color: '#475569',
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
        borderRadius: Layout.borderRadius,
        backgroundColor: 'rgba(0, 0, 0, 0.03)',
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.08)',
    },
    cancelText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#64748b',
    },
    confirmBtnWrapper: {
        flex: 1.5,
        height: 48,
        borderRadius: Layout.borderRadius,
        overflow: 'hidden',
    },
    confirmBtn: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    confirmBtnText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#FFFFFF',
    },
});
