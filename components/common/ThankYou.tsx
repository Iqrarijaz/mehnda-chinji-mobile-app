import React, { memo } from 'react';
import { View, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';

import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';

interface ThankYouModalProps {
    visible: boolean;
    onClose: () => void;
    animationSource?: any;
    children?: React.ReactNode;
    buttonText?: string;
    loop?: boolean;
    animationWidth?: number | string;
    animationHeight?: number | string;
}

const ThankYouModalComponent: React.FC<ThankYouModalProps> = ({
    visible,
    onClose,
    animationSource,
    children,
    buttonText = "Done",
    loop = true,
    animationWidth = 220,
    animationHeight = 180
}) => {
    const { theme } = useTheme();
    const colors = Colors[theme];

    // Default animation if none is provided
    const source = animationSource || require('@/public/json/thank_you.json');

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                    <View style={[styles.lottieContainer, { width: animationWidth as any, height: animationHeight as any }]}>
                        <LottieView
                            source={source}
                            autoPlay
                            loop={loop}
                            style={styles.lottie}
                        />
                    </View>

                    <View style={styles.textContainer}>
                        {children}
                    </View>

                    <TouchableOpacity
                        style={[styles.modalButton, { backgroundColor: colors.primary }]}
                        onPress={onClose}
                    >
                        <ThemedText style={styles.modalButtonText}>{buttonText}</ThemedText>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

export const ThankYouModal = memo(ThankYouModalComponent);

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
        alignItems: 'center',
        // 
        // 
        // 
        // 
    },
    lottieContainer: {
        marginBottom: 16,
        justifyContent: 'center',
        alignItems: 'center' },
    lottie: {
        width: '100%',
        height: '100%' },
    textContainer: {
        marginBottom: 24,
        alignItems: 'center' },
    modalButton: {
        width: 120,
        height: 40,
        borderRadius: Layout.borderRadius,
        justifyContent: 'center',
        alignItems: 'center' },
    modalButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600' }
});
