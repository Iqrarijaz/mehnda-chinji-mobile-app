import React, { memo } from 'react';
import { View, Modal, TouchableOpacity, StyleSheet, Image } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useAuth } from '@/context/AuthContext';

interface EmptyFeedBackModalProps {
    visible: boolean;
    onClose: () => void;
}

const EmptyFeedBackModalComponent = ({ visible, onClose }: EmptyFeedBackModalProps) => {
    const { theme } = useTheme();
    const colors = Colors[theme];
    const { user } = useAuth();

    const userName = user?.user?.name
        ? user.user.name.split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
        : 'User';

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                    <View style={styles.imageContainer}>
                        <Image
                            source={require('@/assets/icons/empty_input.webp')}
                            style={styles.image}
                            resizeMode="contain"
                        />
                    </View>
                    <ThemedText style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                        Dear <ThemedText style={{ fontWeight: 'bold', color: colors.text }}>{userName}</ThemedText>, please enter some feedback before submitting.
                    </ThemedText>

                    <TouchableOpacity
                        style={[styles.modalButton, { backgroundColor: colors.primary }]}
                        onPress={onClose}
                    >
                        <ThemedText style={styles.modalButtonText}>Got it</ThemedText>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

export const EmptyFeedBackModal = memo(EmptyFeedBackModalComponent);

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
    imageContainer: {
        width: 220,
        height: 180,
        marginBottom: 16,
        justifyContent: 'center',
        alignItems: 'center' },
    image: {
        width: '100%',
        height: '100%' },
    modalSubtitle: {
        fontSize: 11.5,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20 },
    modalButton: {
        width: 120,
        height: 40,
        borderRadius: Layout.borderRadius,
        justifyContent: 'center',
        alignItems: 'center' },
    modalButtonText: {
        color: '#FFFFFF',
        fontSize: 12.5,
        fontWeight: '600' }
});
