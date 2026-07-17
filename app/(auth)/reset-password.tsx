import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, memo } from 'react';
import {
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

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/context/ThemeContext';
import { resetPasswordSchema } from '@/utils/validation';
import { resetPassword } from '@/apis/login/forgot-password';
import { analyticsService, AnalyticsEvents } from '@/analytics';
import { LoaderOverlay } from '@/components/common/LoaderOverlay';

const ResetPasswordScreen = memo(function ResetPasswordScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const insets = useSafeAreaInsets();
    const { theme, isDark } = useTheme();
    const colors = Colors[theme];
    const [formData, setFormData] = useState({
        resetToken: params.resetToken as string || '',
        newPassword: '',
        confirmPassword: '',
        showPassword: false,
        loading: false
    });


    const email = params.email as string || '';

    const handleSubmit = async () => {
        try {
            await resetPasswordSchema.validate({
                password: formData.newPassword,
                confirmPassword: formData.confirmPassword
            });

            if (!formData.resetToken) {
                throw new Error('Invalid reset session. Please try again.');
            }
        } catch (error: any) {
            Toast.show({
                type: 'error',
                text1: 'Validation Error',
                text2: error.message
            });
            return;
        }

        setFormData(prev => ({ ...prev, loading: true }));

        try {
            const response = await resetPassword(
                email,
                formData.resetToken.trim(),
                formData.newPassword
            );

            Toast.show({
                type: 'success',
                text1: 'Success',
                text2: response?.data?.message || 'Password reset successfully'
            });

            analyticsService.trackEvent(AnalyticsEvents.RESET_PASSWORD_SUCCESS, { email });


            // Navigate back to login with auto-fill params
            setTimeout(() => {
                router.replace({
                    pathname: '/(auth)/login',
                    params: { email: email.trim(), password: formData.newPassword }
                } as any);
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
            behavior="padding"
            style={[styles.container, { backgroundColor: colors.background }]}
        >
            {/* Header / Top Section */}
            <View style={{ backgroundColor: colors.background, zIndex: 1 }}>
                <View style={[styles.headerSection, { paddingTop: insets.top, backgroundColor: '#003D36', zIndex: 1 }]}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <View style={styles.headerContent}>
                        <Image
                            source={require('../../public/white_logo.svg')}
                            style={{ width: 200, height: 50, marginBottom: 12 }}
                            contentFit="contain"
                        />
                        <ThemedText style={styles.headerTitle}>Set New Password</ThemedText>
                        <ThemedText style={styles.headerSubtitle}>
                            Create a new password for your account
                        </ThemedText>
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
                {/* Form Card */}
                <View style={styles.formContainer}>
                    <View style={[styles.formCard, { backgroundColor: colors.card }]}>

                        {/* New Password Input */}
                        <View style={styles.inputField}>
                            <ThemedText style={[styles.label, isDark && { color: '#ECECEC' }]}>NEW PASSWORD</ThemedText>
                            <View style={[styles.inputBox, {
                                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F8FAFC',
                                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#ECECEC'
                            }]}>
                                <Ionicons name="lock-closed-outline" size={20} color={isDark ? 'rgba(255, 255, 255, 0.5)' : '#6B7B73'} style={{ marginRight: 12 }} />
                                <TextInput
                                    placeholder="Enter new password"
                                    placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.4)' : '#8FA79E'}
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
                                        color={isDark ? 'rgba(255, 255, 255, 0.5)' : '#6B7B73'}
                                    />
                                </TouchableOpacity>
                            </View>


                        </View>

                        {/* Confirm Password Input */}
                        <View style={styles.inputField}>
                            <ThemedText style={[styles.label, isDark && { color: '#ECECEC' }]}>CONFIRM PASSWORD</ThemedText>
                            <View style={[styles.inputBox, {
                                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F8FAFC',
                                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#ECECEC'
                            }]}>
                                <Ionicons name="lock-closed-outline" size={20} color={isDark ? 'rgba(255, 255, 255, 0.5)' : '#6B7B73'} style={{ marginRight: 12 }} />
                                <TextInput
                                    placeholder="Confirm new password"
                                    placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.4)' : '#8FA79E'}
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
                            style={[styles.submitButton, { backgroundColor: '#003D36' }]}
                            onPress={handleSubmit}
                            disabled={formData.loading}
                        >
                            <ThemedText style={styles.submitButtonText}>Set New Password</ThemedText>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
            <LoaderOverlay visible={formData.loading} />
        </KeyboardAvoidingView>
    );
});

export default ResetPasswordScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerSection: {
        paddingBottom: 38,
        borderBottomLeftRadius: Layout.headerBorderRadius,
        borderBottomRightRadius: Layout.headerBorderRadius,
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
        borderRadius: Layout.borderRadius,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0,
        shadowRadius: 8,
    },
    inputField: {
        marginBottom: 18,
    },
    label: {
        fontSize: 11,
        fontWeight: '700',
        color: '#4F5F57',
        letterSpacing: 0.5,
        marginBottom: 6,
        marginLeft: 0,
    },
    inputBox: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 52,
        borderRadius: Layout.borderRadius,
        paddingHorizontal: 12,
    },
    input: {
        flex: 1,
        fontSize: 12,
        fontWeight: '500',
    },
    submitButton: {
        height: 52,
        borderRadius: Layout.borderRadius,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 6,
        marginBottom: 18,
        overflow: 'hidden',
        shadowColor: '#003D36',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0,
        shadowRadius: 8,
    },
    submitButtonText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    strengthContainer: {
        marginTop: 8,
        paddingHorizontal: 2,
    },
    strengthBarContainer: {
        flexDirection: 'row',
        height: 4,
        gap: 4,
        marginBottom: 4,
    },
    strengthBar: {
        flex: 1,
        height: '100%',
        borderRadius: 2,
        backgroundColor: '#ECECEC',
    },
    strengthText: {
        fontSize: 11,
        fontWeight: '600',
        textAlign: 'right',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 6,
    },
    footerText: {
        fontSize: 12,
        fontWeight: '500',
    },
    footerLink: {
        fontSize: 12,
        fontWeight: '700',
    },
});
