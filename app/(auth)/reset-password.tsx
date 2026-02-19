import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
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

import { RESET_PASSWORD } from '@/apis/forgot-password';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';

export default function ResetPasswordScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const insets = useSafeAreaInsets();
    const { theme, isDark } = useTheme();
    const colors = Colors[theme];

    const emailOrPhone = params.emailOrPhone as string || '';

    const [formData, setFormData] = useState({
        resetToken: '',
        newPassword: '',
        confirmPassword: '',
        showPassword: false,
        loading: false
    });

    const handleSubmit = async () => {
        if (!formData.resetToken.trim()) {
            Toast.show({
                type: 'error',
                text1: 'Required',
                text2: 'Please enter the reset code'
            });
            return;
        }

        if (!formData.newPassword.trim()) {
            Toast.show({
                type: 'error',
                text1: 'Required',
                text2: 'Please enter a new password'
            });
            return;
        }

        if (formData.newPassword.length < 6) {
            Toast.show({
                type: 'error',
                text1: 'Invalid Password',
                text2: 'Password must be at least 6 characters long'
            });
            return;
        }

        if (formData.newPassword !== formData.confirmPassword) {
            Toast.show({
                type: 'error',
                text1: 'Password Mismatch',
                text2: 'Passwords do not match'
            });
            return;
        }

        setFormData(prev => ({ ...prev, loading: true }));

        try {
            const response = await RESET_PASSWORD(
                emailOrPhone,
                formData.resetToken.trim(),
                formData.newPassword
            );

            Toast.show({
                type: 'success',
                text1: 'Success',
                text2: response.message || 'Password reset successfully'
            });

            // Navigate back to login
            setTimeout(() => {
                router.replace('/(auth)/login' as any);
            }, 1500);

        } catch (error: any) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error.message || 'Failed to reset password'
            });
            setFormData(prev => ({ ...prev, loading: false }));
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
                        <ThemedText style={styles.headerTitle}>Reset{"\n"}Password</ThemedText>
                        <ThemedText style={styles.headerSubtitle}>
                            Enter the code sent to {emailOrPhone}
                        </ThemedText>
                    </View>
                </View>

                {/* Form Card */}
                <View style={styles.formContainer}>
                    <View style={[styles.formCard, { backgroundColor: colors.card }]}>
                        {/* Reset Code Input */}
                        <View style={styles.inputField}>
                            <ThemedText style={[styles.label, isDark && { color: '#E2E8F0' }]}>RESET CODE</ThemedText>
                            <View style={[styles.inputBox, {
                                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F8FAFC',
                                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0'
                            }]}>
                                <Ionicons name="key-outline" size={20} color={isDark ? 'rgba(255, 255, 255, 0.5)' : '#64748B'} style={{ marginRight: 12 }} />
                                <TextInput
                                    placeholder="Enter 6-digit code"
                                    placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.4)' : '#94A3B8'}
                                    value={formData.resetToken}
                                    onChangeText={(resetToken) => setFormData(prev => ({ ...prev, resetToken }))}
                                    style={[styles.input, { color: colors.text }]}
                                    keyboardType="number-pad"
                                    maxLength={6}
                                    editable={!formData.loading}
                                />
                            </View>
                        </View>

                        {/* New Password Input */}
                        <View style={styles.inputField}>
                            <ThemedText style={[styles.label, isDark && { color: '#E2E8F0' }]}>NEW PASSWORD</ThemedText>
                            <View style={[styles.inputBox, {
                                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F8FAFC',
                                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0'
                            }]}>
                                <Ionicons name="lock-closed-outline" size={20} color={isDark ? 'rgba(255, 255, 255, 0.5)' : '#64748B'} style={{ marginRight: 12 }} />
                                <TextInput
                                    placeholder="Enter new password"
                                    placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.4)' : '#94A3B8'}
                                    value={formData.newPassword}
                                    onChangeText={(newPassword) => setFormData(prev => ({ ...prev, newPassword }))}
                                    style={[styles.input, { color: colors.text }]}
                                    secureTextEntry={!formData.showPassword}
                                    editable={!formData.loading}
                                />
                                <TouchableOpacity
                                    onPress={() => setFormData(prev => ({ ...prev, showPassword: !prev.showPassword }))}
                                >
                                    <Ionicons
                                        name={formData.showPassword ? 'eye-outline' : 'eye-off-outline'}
                                        size={20}
                                        color={isDark ? 'rgba(255, 255, 255, 0.5)' : '#64748B'}
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Confirm Password Input */}
                        <View style={styles.inputField}>
                            <ThemedText style={[styles.label, isDark && { color: '#E2E8F0' }]}>CONFIRM PASSWORD</ThemedText>
                            <View style={[styles.inputBox, {
                                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F8FAFC',
                                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0'
                            }]}>
                                <Ionicons name="lock-closed-outline" size={20} color={isDark ? 'rgba(255, 255, 255, 0.5)' : '#64748B'} style={{ marginRight: 12 }} />
                                <TextInput
                                    placeholder="Confirm new password"
                                    placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.4)' : '#94A3B8'}
                                    value={formData.confirmPassword}
                                    onChangeText={(confirmPassword) => setFormData(prev => ({ ...prev, confirmPassword }))}
                                    style={[styles.input, { color: colors.text }]}
                                    secureTextEntry={!formData.showPassword}
                                    editable={!formData.loading}
                                />
                            </View>
                        </View>

                        {/* Submit Button */}
                        <TouchableOpacity
                            style={[styles.submitButton, { backgroundColor: '#004030' }]}
                            onPress={handleSubmit}
                            disabled={formData.loading}
                        >
                            {formData.loading ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <ThemedText style={styles.submitButtonText}>Reset Password</ThemedText>
                            )}
                        </TouchableOpacity>

                        {/* Footer */}
                        <View style={styles.footer}>
                            <ThemedText style={[styles.footerText, { color: isDark ? 'rgba(255, 255, 255, 0.6)' : '#64748B' }]}>
                                Didn't receive code?{' '}
                            </ThemedText>
                            <TouchableOpacity onPress={() => router.back()}>
                                <ThemedText style={[styles.footerLink, { color: isDark ? '#FFFFFF' : '#047857' }]}>Resend</ThemedText>
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
        paddingBottom: 38,
        borderBottomLeftRadius: 36,
        borderBottomRightRadius: 36,
        overflow: 'hidden',
    },
    backButton: {
        position: 'absolute',
        top: 50,
        left: 20,
        zIndex: 10,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerContent: {
        paddingHorizontal: 22,
        paddingTop: 38,
    },
    headerTitle: {
        fontSize: 32,
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
        marginBottom: 18,
    },
    label: {
        fontSize: 11,
        fontWeight: '700',
        color: '#475569',
        letterSpacing: 0.5,
        marginBottom: 6,
        marginLeft: 0,
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
        marginTop: 6,
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
