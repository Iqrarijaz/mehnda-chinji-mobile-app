import React, { useEffect } from 'react';
import {
    Modal,
    StyleSheet,
    View,
    TouchableOpacity,
    TouchableWithoutFeedback,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
    FadeIn,
    FadeOut,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
    Easing,
} from 'react-native-reanimated';
import { PremiumModal } from '../common/PremiumModal';
import { ThemedText } from '@/components/themedText';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/context/ThemeContext';

interface LocationPromptModalProps {
    visible: boolean;
    onClose: () => void;
    onUpdate: () => void;
}

export const LocationPromptModal = React.memo(({
    visible,
    onClose,
    onUpdate,
}: LocationPromptModalProps) => {

    const { theme } = useTheme();
    const colors = Colors[theme];
    const isDark = theme === 'dark';

    if (!visible) return null;

    if (!visible) return null;

    return (
        <PremiumModal
            visible={visible}
            onClose={onClose}
        >
            <View style={styles.modalContent}>
                    <View style={styles.header}>
                        <View style={styles.titleSection}>
                            <View style={[styles.iconBox, { backgroundColor: colors.primary + '15' }]}>
                                <Ionicons name="location-sharp" size={20} color={colors.primary} />
                            </View>
                            <ThemedText style={[styles.title, { color: colors.text }]}>Update Location</ThemedText>
                        </View>
                        <TouchableOpacity onPress={onClose} style={[styles.closeButton, { backgroundColor: isDark ? '#2D3748' : '#F1F5F9' }]}>
                            <Ionicons name="close" size={18} color={isDark ? '#CBD5E1' : '#64748B'} />
                        </TouchableOpacity>
                    </View>

                <ThemedText style={[styles.description, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                    Set your city and village in profile for Azaan and weather updates.
                </ThemedText>

                <View style={styles.footer}>
                    <View style={styles.actions}>
                        <TouchableOpacity
                            style={[styles.primaryBtn, { flex: 1, marginTop: 0, backgroundColor: colors.primary }]}
                            onPress={onUpdate} // Changed to onUpdate as setCityModalVisible is not defined
                            activeOpacity={0.8}
                        >
                            <ThemedText style={styles.primaryBtnText}>Select City</ThemedText>
                            <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
                        </TouchableOpacity>

                        <TouchableOpacity onPress={onClose} style={styles.cancelBtn} activeOpacity={0.7}>
                            <ThemedText style={[styles.cancelText, { color: isDark ? '#94A3B8' : '#64748B' }]}>Cancel</ThemedText>
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
        borderRadius: 13,
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
        borderColor: '#E2E8F0',
        borderRadius: Layout.borderRadius,
    },
    cancelText: {
        fontSize: 14,
        fontWeight: '600',
    },
});

