import React from 'react';
import { View, Modal, StyleSheet, ActivityIndicator } from 'react-native';
import LottieView from 'lottie-react-native';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/colors';

interface LoaderOverlayProps {
    visible: boolean;
    text?: string;
}

export const LoaderOverlay: React.FC<LoaderOverlayProps> = ({ visible, text }) => {
    const { theme } = useTheme();
    const colors = Colors[theme];

    if (!visible) return null;

    return (
        <Modal
            transparent
            animationType="fade"
            visible={visible}
            onRequestClose={() => {}}
        >
            <View style={styles.overlay}>
                <LottieView
                    source={require('@/public/json/loading.json')}
                    autoPlay
                    loop
                    style={styles.lottie}
                    colorFilters={[
                        {
                            keypath: '**',
                            color: colors.primary }
                    ]}
                />
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999 },
    lottie: {
        width: 150,
        height: 150 }
});
