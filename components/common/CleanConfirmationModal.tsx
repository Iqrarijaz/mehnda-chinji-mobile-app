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

    // Slight scale-up to accompany the sheet's fade-in, driven the same way
    // PremiumModal drives its blur intensity, so it re-triggers on every open.
    const sheetScale = useSharedValue(0.94);
    useEffect(() => {
        sheetScale.value = visible
            ? withTiming(1, { duration: 240 })
            : 0.94;
    }, [visible]);
    const sheetAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: sheetScale.value }]
    }));

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            onRequestClose={onClose}
        >
            <Animated.View entering={FadeIn.duration(200)} style={styles.modalOverlay}>
                <Animated.View style={[styles.modalContent, { backgroundColor: colors.card }, sheetAnimatedStyle]}>
                    {/* Header with Icon */}
                    <View style={styles.header}>
                        <View style={[
                            styles.iconWrapper,
                            { backgroundColor: config.bg }
                        ]}>
                            <Ionicons name={config.icon} size={20} color={config.color} />
                        </View>
                        <ThemedText style={[styles.title, { color: config.color }]}>{title}</ThemedText>
                    </View>

                    {/* Message */}
                    <ThemedText style={styles.message}>{message}</ThemedText>

                    {/* Footer Actions */}
                    <View style={styles.footer}>
                        <PressableScale
                            containerStyle={styles.flexOne}
                            style={styles.cancelBtn}
                            onPress={onClose}
                            disabled={isLoading}
                        >
                            <ThemedText style={styles.cancelText}>{cancelText}</ThemedText>
                        </PressableScale>

                        <PressableScale
                            containerStyle={styles.flexOne}
                            style={[styles.confirmBtnWrapper, { backgroundColor: config.btnBg }]}
                            onPress={onConfirm}
                            disabled={isLoading}
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
};

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
