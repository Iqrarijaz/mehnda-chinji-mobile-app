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
            style={[styles.container, { backgroundColor: colors.background }]}
        >
            {/* Header / Top Section */}
            <View style={{ backgroundColor: colors.background, zIndex: 1 }}>
                <View style={[styles.headerSection, { paddingTop: insets.top, backgroundColor: '#006666', zIndex: 1 }]}>
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
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                        <View style={styles.modalIconBox}>
                            <Ionicons name="time-outline" size={40} color="#006666" />
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
        flex: 1 },
    headerSection: {
        paddingBottom: 38,
        borderBottomLeftRadius: Layout.headerBorderRadius,
        borderBottomRightRadius: Layout.headerBorderRadius,
        overflow: 'hidden' },
    headerContent: {
        paddingHorizontal: 22,
        paddingTop: 38 },
    headerTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#FFFFFF',
        lineHeight: 40,
        marginBottom: 4 },
    headerSubtitle: {
        fontSize: 15,
        color: 'rgba(255, 255, 255, 0.9)',
        lineHeight: 22 },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24 },
    modalContent: {
        width: '100%',
        borderRadius: Layout.borderRadius,
        padding: 24,
        alignItems: 'center' },
    modalIconBox: {
        width: 80,
        height: 80,
        borderRadius: Layout.borderRadius,
        backgroundColor: 'rgba(0, 102, 102, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20 },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 12,
        textAlign: 'center' },
    modalSubtitle: {
        fontSize: 15,
        color: '#64748B',
        lineHeight: 22,
        textAlign: 'center',
        marginBottom: 24 },
    modalButton: {
        backgroundColor: '#006666',
        width: '100%',
        height: 52,
        borderRadius: Layout.borderRadius,
        justifyContent: 'center',
        alignItems: 'center' },
    modalButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700' } });
