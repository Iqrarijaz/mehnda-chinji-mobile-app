import { ThemedText } from '@/components/ThemedText';
import { Image } from 'expo-image';
import {
    KeyboardAvoidingView,
    ScrollView,
    StyleSheet,
    View
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { useTheme } from '../../context/ThemeContext';
import { LoginForm } from '@/components/auth/LoginForm';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Modal, TouchableOpacity } from 'react-native';

export default function LoginScreen() {
    const insets = useSafeAreaInsets();
    const { theme } = useTheme();
    const colors = Colors[theme];
    const { expired } = useLocalSearchParams<{ expired?: string }>();
    const [showExpiredModal, setShowExpiredModal] = useState(false);

    useEffect(() => {
        if (expired === 'true') {
            setShowExpiredModal(true);
        }
    }, [expired]);

    return (
        <KeyboardAvoidingView
            behavior="padding"
            style={styles.container}
        >
            <ScrollView
                showsVerticalScrollIndicator={false}
                style={styles.flex}
                contentContainerStyle={styles.scroll}
                bounces={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* ── Forest hero with brand lockup ─────────────────────── */}
                <View style={[styles.hero, { paddingTop: insets.top + 32 }]}>
                    <Image
                        source={require('../../public/white_logo.png')}
                        style={styles.brandLogo}
                        contentFit="contain"
                    />
                </View>

                {/* ── Rounded content sheet ─────────────────────────────── */}
                <Animated.View
                    entering={FadeInDown.duration(450)}
                    style={[styles.sheet, { backgroundColor: colors.background, paddingBottom: insets.bottom + 32 }]}
                >
                    <ThemedText style={[styles.heading, { color: colors.text }]}>Welcome back</ThemedText>
                    <ThemedText style={[styles.subheading, { color: colors.textSecondary }]}>
                        Sign in to your account to continue
                    </ThemedText>

                    <LoginForm />
                </Animated.View>
            </ScrollView>

            {/* Session Expired Modal */}
            <Modal
                visible={showExpiredModal}
                transparent
                animationType="fade"
                statusBarTranslucent
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                        <View style={styles.modalIconBox}>
                            <Ionicons name="time-outline" size={40} color="#003D36" />
                        </View>

                        <ThemedText style={styles.modalTitle}>Session Expired</ThemedText>
                        <ThemedText style={styles.modalSubtitle}>
                            Your session has timed out or was ended. Please sign in again to continue.
                        </ThemedText>

                        <TouchableOpacity
                            style={styles.modalButton}
                            onPress={() => setShowExpiredModal(false)}
                        >
                            <ThemedText style={styles.modalButtonText}>Got it</ThemedText>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#003D36',
    },
    flex: {
        flex: 1,
    },
    scroll: {
        flexGrow: 1,
    },
    hero: {
        alignItems: 'center',
        paddingBottom: 36,
        paddingHorizontal: 24,
    },
    brandLogo: {
        width: 210,
        height: 52,
    },
    sheet: {
        flexGrow: 1,
        borderTopLeftRadius: 36,
        borderTopRightRadius: 36,
        paddingHorizontal: 22,
        paddingTop: 30,
    },
    heading: {
        fontSize: 26,
        fontWeight: '900',
        letterSpacing: -0.4,
    },
    subheading: {
        fontSize: 14.5,
        marginTop: 4,
        marginBottom: 8,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,20,15,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalContent: {
        width: '100%',
        borderRadius: 28,
        padding: 24,
        alignItems: 'center',
    },
    modalIconBox: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(0, 61, 54, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0C2B26',
        marginBottom: 12,
        textAlign: 'center',
    },
    modalSubtitle: {
        fontSize: 15,
        color: '#6B7B73',
        lineHeight: 22,
        textAlign: 'center',
        marginBottom: 24,
    },
    modalButton: {
        backgroundColor: '#003D36',
        width: '100%',
        height: 52,
        borderRadius: 999,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
});
