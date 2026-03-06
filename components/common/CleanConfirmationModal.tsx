import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '../themedText';
import { TintedCard } from '../ui/tintedCard';
import { PremiumModal } from './PremiumModal';

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
        <PremiumModal visible={visible} onClose={onClose} type="centered">
            <TintedCard
                tintColor={config.color}
                bgColor="#FFFFFF"
                style={styles.modalWrapper}
            >
                <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
                    {/* Header with Icon */}
                    <View style={styles.header}>
                        <View style={[
                            styles.iconWrapper,
                            { backgroundColor: config.bg, borderColor: config.color + '10', borderWidth: 1 }
                        ]}>
                            <Ionicons
                                name={config.icon}
                                size={36}
                                color={config.color}
                            />
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
                </Pressable>
            </TintedCard>
        </PremiumModal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalWrapper: {
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.1,
        shadowRadius: 24,
    },
    modalContent: {
        width: '100%',
        paddingHorizontal: 24,
        paddingBottom: 24,
        paddingTop: 32,
    },
    header: {
        alignItems: 'center',
        marginBottom: 16,
    },
    iconWrapper: {
        width: 72,
        height: 72,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 22,
        fontWeight: '900',
        textAlign: 'center',
        letterSpacing: -0.5,
    },
    message: {
        fontSize: 16,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 32,
        fontWeight: '500',
        paddingHorizontal: 4,
    },
    footer: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    cancelBtn: {
        flex: 1,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
        backgroundColor: '#F8FAFC',
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
    },
    cancelText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#64748B',
    },
    confirmBtnWrapper: {
        flex: 1,
        height: 50,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
    },
    confirmBtnText: {
        fontSize: 15,
        fontWeight: '800',
        color: '#FFFFFF',
    },
});
