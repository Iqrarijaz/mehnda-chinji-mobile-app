import React from 'react';
import {
    StyleSheet,
    View,
    TouchableOpacity } from 'react-native';
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
    onUpdate }: ProfileUpdatePromptProps) => {

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
                        loop={false}
                        style={styles.lottie}
                    />
                </View>

                <ThemedText style={[styles.description, { color: isDark ? '#94A3B8' : '#64748B', textAlign: 'center' }]}>
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
        width: '100%' },
    description: {
        fontSize: 12,
        lineHeight: 19,
        marginBottom: 10,
        paddingLeft: 2 },
    footer: {
        marginTop: 14 },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12 },
    primaryBtn: {
        width: 150,
        height: 40,
        borderRadius: Layout.borderRadius,
        justifyContent: 'center',
        alignItems: 'center' },
    primaryBtnText: {
        color: '#FFF',
        fontSize: 12.5,
        fontWeight: '600' },
    lottieContainer: {
        width: 150,
        height: 120,
        marginBottom: 12,
        alignSelf: 'center',
        justifyContent: 'center',
        alignItems: 'center' },
    lottie: {
        width: '100%',
        height: '100%' } });

