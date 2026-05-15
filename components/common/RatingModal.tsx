import React from 'react';
import {
    View,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Dimensions,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '../themedText';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { ReviewService } from '@/utils/review';

const { width } = Dimensions.get('window');

interface RatingModalProps {
    visible: boolean;
    onClose: () => void;
}

export const RatingModal: React.FC<RatingModalProps> = ({ visible, onClose }) => {
    const { theme } = useTheme();
    const colors = Colors[theme];

    const handleRateNow = () => {
        ReviewService.markRated();
        ReviewService.openStore();
        onClose();
    };

    const handleDismiss = () => {
        ReviewService.markPromptShown();
        onClose();
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={[styles.container, { backgroundColor: colors.background }]}>
                    <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
                        <Ionicons name="star" size={40} color={colors.primary} />
                    </View>

                    <ThemedText style={styles.title}>Enjoying Rehbar?</ThemedText>
                    <ThemedText style={styles.description}>
                        If you like using Rehbar, could you take a moment to rate us? It helps us reach more people in our community!
                    </ThemedText>

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={[styles.button, styles.rateButton, { backgroundColor: colors.primary }]}
                            onPress={handleRateNow}
                        >
                            <ThemedText style={styles.rateButtonText}>Rate Now</ThemedText>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.button, styles.laterButton]}
                            onPress={handleDismiss}
                        >
                            <ThemedText style={[styles.laterButtonText, { color: colors.textSecondary }]}>
                                Maybe Later
                            </ThemedText>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity 
                        style={styles.closeIcon} 
                        onPress={handleDismiss}
                    >
                        <Ionicons name="close" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    container: {
        width: Math.min(width - 48, 340),
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        position: 'relative',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
            },
            android: {
                elevation: 8,
            },
        }),
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 22,
        fontWeight: '900',
        marginBottom: 12,
        textAlign: 'center',
    },
    description: {
        fontSize: 15,
        lineHeight: 22,
        textAlign: 'center',
        marginBottom: 24,
        opacity: 0.7,
    },
    buttonContainer: {
        width: '100%',
        gap: 12,
    },
    button: {
        height: 52,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },
    rateButton: {
        // color from props
    },
    rateButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    laterButton: {
        // transparent
    },
    laterButtonText: {
        fontSize: 15,
        fontWeight: '600',
    },
    closeIcon: {
        position: 'absolute',
        top: 16,
        right: 16,
        padding: 4,
    },
});
