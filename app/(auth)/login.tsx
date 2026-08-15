import { ThemedText } from '@/components/ThemedText';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { Layout } from '../../constants/layout';
import { useTheme } from '../../context/ThemeContext';
import { LoginForm } from '@/components/auth/LoginForm';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Modal, TouchableOpacity } from 'react-native';


const LoginScreen = React.memo(function LoginScreen() {
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
            style={[styles.container, { backgroundColor: colors.background }]}
        >
            {/* Header / Top Section */}
            <View style={{ backgroundColor: colors.background, zIndex: 1 }}>
                <View style={[styles.headerSection, { paddingTop: insets.top, backgroundColor: colors.primary, zIndex: 1 }]}>
                    <View style={styles.headerContent}>
                        <Image
                            source={require('../../public/white_logo.svg')}
                            style={{ width: 200, height: 50, marginBottom: 12 }}
                            contentFit="contain"
                        />
                        <ThemedText style={styles.headerTitle}>Sign in to your Account</ThemedText>
                        <ThemedText style={styles.headerSubtitle}>Welcome back! Please enter your details</ThemedText>
                    </View>
                </View>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                style={{ flex: 1, backgroundColor: colors.background }}
                contentContainerStyle={{ flexGrow: 1, backgroundColor: colors.background }}
                bounces={false}
                keyboardShouldPersistTaps="handled"
            >
                <LoginForm />
            </ScrollView>

            {/* Session Expired Modal */}
            <Modal
                visible={showExpiredModal}
                transparent
                animationType="fade"
                statusBarTranslucent
            >
                <View style={[styles.modalOverlay, { backgroundColor: colors.backdrop }]}>
                    <View style={[styles.modalContent, { backgroundColor: colors.modalBackground }]}>
                        <View style={[styles.modalIconBox, { backgroundColor: `${colors.primary}18` }]}>
                            <Ionicons name="time-outline" size={40} color={colors.primary} />
                        </View>

                        <ThemedText style={[styles.modalTitle, { color: colors.text }]}>Session Expired</ThemedText>
                        <ThemedText style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                            Your session has timed out or was ended. Please sign in again to continue.
                        </ThemedText>

                        <TouchableOpacity
                            style={[styles.modalButton, { backgroundColor: colors.primary }]}
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
        flex: 1 },
    headerSection: {
        paddingBottom: 34,
        borderBottomLeftRadius: Layout.headerBorderRadius,
        borderBottomRightRadius: Layout.headerBorderRadius,
        overflow: 'hidden' },
    headerContent: {
        paddingHorizontal: 18,
        paddingTop: 34 },
    headerTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#FFFFFF',
        lineHeight: 40,
        marginBottom: 4 },
    headerSubtitle: {
        fontSize: 12.5,
        color: 'rgba(255, 255, 255, 0.9)',
        lineHeight: 22 },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20 },
    modalContent: {
        width: '100%',
        borderRadius: Layout.borderRadius,
        padding: 20,
        alignItems: 'center' },
    modalIconBox: {
        width: 80,
        height: 80,
        borderRadius: Layout.borderRadius,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20 },
    modalTitle: {
        fontSize: 15.5,
        fontWeight: '700',
        marginBottom: 12,
        textAlign: 'center' },
    modalSubtitle: {
        fontSize: 12.5,
        lineHeight: 22,
        textAlign: 'center',
        marginBottom: 24 },
    modalButton: {
        width: '100%',
        height: 52,
        borderRadius: Layout.borderRadius,
        justifyContent: 'center',
        alignItems: 'center' },
    modalButtonText: {
        color: '#FFFFFF',
        fontSize: 13.5,
        fontWeight: '700' } });

export default LoginScreen;
