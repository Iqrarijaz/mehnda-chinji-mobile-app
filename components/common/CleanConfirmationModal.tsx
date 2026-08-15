import { Ionicons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { ActivityIndicator, Modal, StyleSheet, View } from 'react-native';
import Animated, {
    FadeIn,
    useAnimatedStyle,
    useSharedValue,
    withTiming } from 'react-native-reanimated';
import { ThemedText } from '../ThemedText';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/colors';
import { PressableScale } from '@/components/essentials/shared/PressableScale';

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
            <Animated.View
                entering={FadeIn.duration(200)}
                style={styles.modalOverlay}
            >
                <Animated.View
                    style={[
                        styles.modalContent,
                        { backgroundColor: colors.card },
                    ]}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={[styles.iconWrapper, { backgroundColor: typeStyles.iconBg }]}>
                            <Ionicons name={typeStyles.iconName} size={28} color={typeStyles.iconColor} />
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
                        <PressableScale
                            onPress={onClose}
                            disabled={isLoading}
                            style={[
                                styles.button,
                                styles.cancelBtn,
                                { backgroundColor: colors.inputBackground, borderColor: colors.border }
                            ]}
                        >
                            <ThemedText style={[styles.cancelBtnText, { color: colors.text }]}>
                                {cancelText}
                            </ThemedText>
                        </PressableScale>

                        <PressableScale
                            onPress={onConfirm}
                            disabled={isLoading}
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
                        </PressableScale>
                    </View>
                </Animated.View>
            </Animated.View>
        </Modal>
    );
});

const styles = StyleSheet.create({
    flexOne: {
        flex: 1 },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24 },
    modalContent: {
        width: '100%',
        maxWidth: 320,
        borderRadius: 20,
        padding: 16,
        alignItems: 'center' },
    header: {
        alignItems: 'center',
        marginBottom: 8 },
    iconWrapper: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10 },
    title: {
        fontSize: 14,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 4 },
    message: {
        fontSize: 11,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 16,
        marginBottom: 16,
        fontWeight: '500' },
    footer: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 4,
        width: '100%' },
    cancelBtn: {
        width: '100%',
        height: 34,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 999,
        backgroundColor: '#F1F5F9' },
    cancelText: {
        fontSize: 11.5,
        fontWeight: '700',
        color: '#64748B' },
    confirmBtnWrapper: {
        width: '100%',
        height: 34,
        borderRadius: 999,
        justifyContent: 'center',
        alignItems: 'center' },
    confirmBtnText: {
        fontSize: 11.5,
        fontWeight: '700',
        color: '#FFFFFF' } });
