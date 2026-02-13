import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import { Modal, Pressable, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming
} from 'react-native-reanimated';
import { ThemedText } from '../themed-text';

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
    const scale = useSharedValue(0.9);
    const opacity = useSharedValue(0);

    useEffect(() => {
        if (visible) {
            scale.value = withSpring(1, { damping: 15, stiffness: 100 });
            opacity.value = withTiming(1, { duration: 300 });
        } else {
            scale.value = withTiming(0.9, { duration: 200 });
            opacity.value = withTiming(0, { duration: 200 });
        }
    }, [visible]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: opacity.value,
    }));

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="none"
            onRequestClose={onClose}
        >
            <Pressable style={styles.overlay} onPress={onClose}>
                <Animated.View style={[styles.modalContent, animatedStyle]}>
                    <LinearGradient
                        colors={['rgba(30, 41, 59, 0.95)', 'rgba(15, 23, 42, 0.98)']}
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
                </Animated.View>
            </Pressable>
        </Modal>
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
        width: '90%',
        borderRadius: 28,
        padding: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.15)',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
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
        color: '#FFFFFF',
        textAlign: 'center',
    },
    message: {
        fontSize: 15,
        color: 'rgba(255, 255, 255, 0.7)',
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
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    cancelText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#94a3b8',
    },
    confirmBtnWrapper: {
        flex: 1.5,
        height: 48,
        borderRadius: 14,
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
