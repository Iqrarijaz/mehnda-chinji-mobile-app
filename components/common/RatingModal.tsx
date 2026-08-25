import React, { memo } from 'react';
import {
    View,
    StyleSheet,
    Modal,
    TouchableOpacity } from 'react-native';
import LottieView from 'lottie-react-native';
import { ThemedText } from '../ThemedText';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { ReviewService } from '@/utils/review';
import { Layout } from '@/constants/layout';

interface RatingModalProps {
    visible: boolean;
    onClose: () => void;
}

const RatingModalComponent: React.FC<RatingModalProps> = ({ visible, onClose }) => {
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
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                    <View style={styles.lottieContainer}>
                        <LottieView
                            source={require('@/public/json/rating.json')}
                            autoPlay
                            loop={false}
                            renderMode="HARDWARE"
                            style={styles.lottie}
                        />
                    </View>

                    <View style={styles.textContainer}>
                        <ThemedText style={styles.title}>Enjoying Rehbar?</ThemedText>
                        <ThemedText style={styles.description}>
                            If you love Rehbar, please take a moment to rate us!
                        </ThemedText>
                    </View>

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={styles.laterButton}
                            onPress={handleDismiss}
                        >
                            <ThemedText style={[styles.laterButtonText, { color: colors.textSecondary }]}>
                                Maybe Later
                            </ThemedText>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.modalButton, { backgroundColor: colors.primary }]}
                            onPress={handleRateNow}
                        >
                            <ThemedText style={styles.modalButtonText}>Rate Now</ThemedText>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

export const RatingModal = memo(RatingModalComponent);

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20 },
    modalContent: {
        width: '100%',
        borderRadius: Layout.borderRadius,
        padding: 20,
        alignItems: 'center' },
    lottieContainer: {
        width: 220,
        height: 180,
        marginBottom: 16,
        justifyContent: 'center',
        alignItems: 'center' },
    lottie: {
        width: '100%',
        height: '100%' },
    textContainer: {
        marginBottom: 24,
        alignItems: 'center' },
    title: {
        fontSize: 18.5,
        fontWeight: '900',
        marginBottom: 12,
        textAlign: 'center' },
    description: {
        fontSize: 12.5,
        lineHeight: 22,
        textAlign: 'center',
        opacity: 0.7 },
    buttonContainer: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 7,
        marginTop: 8 },
    modalButton: {
        width: 100,
        height: 36,
        borderRadius: Layout.borderRadius,
        justifyContent: 'center',
        alignItems: 'center' },
    modalButtonText: {
        color: '#FFFFFF',
        fontSize: 11.5,
        fontWeight: '600' },
    laterButton: {
        paddingVertical: 7,
        paddingHorizontal: 10,
        justifyContent: 'center',
        alignItems: 'center' },
    laterButtonText: {
        fontSize: 12.5,
        fontWeight: '600' } });
