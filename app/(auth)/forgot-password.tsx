import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { REQUEST_PASSWORD_RESET } from '@/apis/forgot-password';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';

export default function ForgotPasswordScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { theme, isDark } = useTheme();
    const colors = Colors[theme];

    const [emailOrPhone, setEmailOrPhone] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!emailOrPhone.trim()) {
            Toast.show({
                type: 'error',
                text1: 'Required',
                text2: 'Please enter your email or phone number'
            });
            return;
        }

        setLoading(true);

        try {
            const response = await REQUEST_PASSWORD_RESET(emailOrPhone.trim());

            Toast.show({
                type: 'success',
                text1: 'Success',
                text2: response.message || 'Reset code sent successfully'
            });

            // Navigate to reset password screen with email/phone
            router.push({
                pathname: '/(auth)/reset-password',
                params: { emailOrPhone: emailOrPhone.trim() }
            } as any);

        } catch (error: any) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error.message || 'Failed to send reset code'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.container, { backgroundColor: colors.background }]}
        >
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ flexGrow: 1, backgroundColor: colors.background }}
                bounces={false}
            >
                {/* Header / Top Section */}
                <View style={[styles.headerSection, { paddingTop: insets.top, backgroundColor: '#004030' }]}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <View style={styles.headerContent}>
                        <ThemedText style={styles.headerTitle}>Forgot{"\n"}Password?</ThemedText>
                        <ThemedText style={styles.headerSubtitle}>
                            Enter your email or phone number to receive a reset code
                        </ThemedText>
                    </View>
                </View>

                {/* Form Card */}
                <View style={styles.formContainer}>
                    <View style={[styles.formCard, { backgroundColor: colors.card }]}>
                        {/* Email/Phone Input */}
                        <View style={styles.inputField}>
                            <ThemedText style={[styles.label, isDark && { color: '#E2E8F0' }]}>EMAIL OR PHONE <ThemedText style={styles.required}>*</ThemedText></ThemedText>
                            <View style={[styles.inputBox, {
                                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F8FAFC',
                                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0'
                            }]}>
                                <Ionicons name="mail-outline" size={20} color={isDark ? 'rgba(255, 255, 255, 0.5)' : '#64748B'} style={{ marginRight: 12 }} />
                                <TextInput
                                    placeholder="Enter your email or phone"
                                    placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.4)' : '#94A3B8'}
                                    value={emailOrPhone}
                                    onChangeText={setEmailOrPhone}
                                    style={[styles.input, { color: colors.text }]}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    editable={!loading}
                                />
                            </View>
                        </View>

                        {/* Submit Button */}
                        <TouchableOpacity
                            style={[styles.submitButton, { backgroundColor: '#004030' }]}
                            onPress={handleSubmit}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <ThemedText style={styles.submitButtonText}>Send Reset Code</ThemedText>
                            )}
                        </TouchableOpacity>

                        {/* Footer */}
                        <View style={styles.footer}>
                            <ThemedText style={[styles.footerText, { color: isDark ? 'rgba(255, 255, 255, 0.6)' : '#64748B' }]}>
                                Remember your password?{' '}
                            </ThemedText>
                            <TouchableOpacity onPress={() => router.back()}>
                                <ThemedText style={[styles.footerLink, { color: isDark ? '#FFFFFF' : '#004030' }]}>Log In</ThemedText>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerSection: {
        paddingBottom: 40,
        borderBottomLeftRadius: 36,
        borderBottomRightRadius: 36,
        overflow: 'hidden',
    },
    backButton: {
        marginLeft: 22,
        marginTop: 18,
        marginBottom: 8, // Added padding bottom as requested
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerContent: {
        paddingHorizontal: 22,
        paddingBottom: 18,
        // Removed paddingTop: 40 as button now pushes content
    },
    headerTitle: {
        fontSize: 28, // Reduced from 32
        fontWeight: '800',
        color: '#FFFFFF',
        lineHeight: 40,
        marginBottom: 6,
    },
    headerSubtitle: {
        fontSize: 15,
        color: 'rgba(255, 255, 255, 0.9)',
        lineHeight: 22,
    },
    formContainer: {
        flex: 1,
        paddingHorizontal: 18,
        paddingTop: 30,
        paddingBottom: 38,
    },
    formCard: {
        borderRadius: 24,
        padding: 22,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    inputField: {
        marginBottom: 22,
    },
    label: {
        fontSize: 11,
        fontWeight: '700',
        color: '#475569',
        letterSpacing: 0.5,
        marginBottom: 6,
        marginLeft: 0,
    },
    required: {
        color: '#EF4444',
    },
    inputBox: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 52,
        borderRadius: 14,
        paddingHorizontal: 12,
        borderWidth: 1,
    },
    input: {
        flex: 1,
        fontSize: 14,
        fontWeight: '500',
    },
    submitButton: {
        height: 52,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 18,
        overflow: 'hidden',
        shadowColor: '#004030',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    submitButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 6,
    },
    footerText: {
        fontSize: 14,
        fontWeight: '500',
    },
    footerLink: {
        fontSize: 14,
        fontWeight: '700',
    },
});
