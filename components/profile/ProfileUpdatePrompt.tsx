import React from 'react';
import {
    StyleSheet,
    View,
    TouchableOpacity,
    Platform,
} from 'react-native';
import LottieView from 'lottie-react-native';
import { PremiumModal } from '../common/PremiumModal';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/context/ThemeContext';

interface ProfileUpdatePromptProps {
    visible: boolean;
    onClose: () => void;
    onUpdate: () => void;
}

export const ProfileUpdatePrompt = React.memo(({
    visible,
    onClose,
    onUpdate,
}: ProfileUpdatePromptProps) => {

    const { theme } = useTheme();
    const colors = Colors[theme];
    const isDark = theme === 'dark';

    if (!visible) return null;

    return (
        <PremiumModal
            visible={visible}
            onClose={onClose}
            closable={false}
        >
            <View style={styles.modalContent}>

                <View style={styles.lottieContainer}>
                    <LottieView
                        source={require('@/public/json/edit_profile.json')}
                        autoPlay
                        loop
                        style={styles.lottie}
                    />
                </View>

                <ThemedText style={[styles.description, { color: isDark ? '#8FA79E' : '#6B7B73', textAlign: 'center' }]}>
                    Please set your phone number, city, and village in your profile for a better experience.
                </ThemedText>

                <View style={styles.footer}>
                    <View style={[styles.actions, { justifyContent: 'center' }]}>
                        <TouchableOpacity
                            style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
                            onPress={onUpdate}
                            activeOpacity={0.8}
                        >
                            <ThemedText style={styles.primaryBtnText}>Update Profile</ThemedText>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </PremiumModal>
    );
});


const styles = StyleSheet.create({
    modalContent: {
        width: '100%',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    titleSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    closeButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconBox: {
        width: 38,
        height: 38,
        borderRadius: Layout.borderRadius,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: -0.4,
    },
    description: {
        fontSize: 13.5,
        lineHeight: 19,
        marginBottom: 10,
        paddingLeft: 2,
    },
    footer: {
        marginTop: 14,
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    primaryBtn: {
        width: 150,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    primaryBtnText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '600',
    },
    cancelBtn: {
        flex: 1,
        height: Platform.OS === 'android' ? 48 : 52,
        justifyContent: 'center',
        alignItems: 'center',
        borderColor: '#ECECEC',
        borderRadius: Layout.borderRadius,
    },
    cancelText: {
        fontSize: 14,
        fontWeight: '600',
    },
    lottieContainer: {
        width: 150,
        height: 120,
        marginBottom: 12,
        alignSelf: 'center',
        justifyContent: 'center',
        alignItems: 'center',
    },
    lottie: {
        width: '100%',
        height: '100%',
    },
});

