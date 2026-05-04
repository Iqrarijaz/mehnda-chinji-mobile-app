import React, { useEffect } from 'react';
import {
    Modal,
    StyleSheet,
    View,
    TouchableOpacity,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PremiumModal } from '../common/PremiumModal';
import { ThemedText } from '@/components/themedText';
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
                <View style={styles.header}>
                    <View style={styles.titleSection}>
                        <View style={[styles.iconBox, { backgroundColor: colors.primary + '15' }]}>
                            <Ionicons name="person-circle-sharp" size={20} color={colors.primary} />
                        </View>
                        <ThemedText style={[styles.title, { color: colors.text }]}>Update Profile</ThemedText>
                    </View>
                </View>

                <ThemedText style={[styles.description, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                    Please set your phone number, city, and village in your profile for a better experience.
                </ThemedText>

                <View style={styles.footer}>
                    <View style={styles.actions}>
                        <TouchableOpacity
                            style={[styles.primaryBtn, { flex: 1, marginTop: 0, backgroundColor: colors.primary }]}
                            onPress={onUpdate}
                            activeOpacity={0.8}
                        >
                            <ThemedText style={styles.primaryBtnText}>Update Profile</ThemedText>
                            <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
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
        height: Platform.OS === 'android' ? 48 : 52,
        paddingHorizontal: 16,
        borderRadius: Layout.borderRadius,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        gap: 8,
    },
    primaryBtnText: {
        color: '#FFF',
        fontSize: 15,
        fontWeight: 'bold',
    },
    cancelBtn: {
        flex: 1,
        height: Platform.OS === 'android' ? 48 : 52,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: Layout.borderRadius,
    },
    cancelText: {
        fontSize: 14,
        fontWeight: '600',
    },
});

