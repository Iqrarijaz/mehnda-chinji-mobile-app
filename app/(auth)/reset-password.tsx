import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, memo } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { ThemedText } from '@/components/ThemedText';
import { BackButton } from '@/components/common/BackButton';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/context/ThemeContext';
import { resetPasswordSchema } from '@/utils/validation';
import { resetPassword } from '@/apis/login/forgot-password';
import { analyticsService, AnalyticsEvents } from '@/analytics';
import { LoaderOverlay } from '@/components/common/LoaderOverlay';
import { FormInput } from '@/components/common/FormInput';
import { SubmitButton } from '@/components/common/SubmitButton';

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
                <View style={[styles.headerSection, { paddingTop: insets.top, backgroundColor: colors.primary, zIndex: 1 }]}>
                    <BackButton backgroundColor="rgba(255,255,255,0.18)" color="#FFFFFF" size={22} />
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
                            <FormInput
                                label="NEW PASSWORD"
                                icon="lock-closed-outline"
                                placeholder="Enter new password"
                                value={formData.newPassword}
                                onChangeText={(newPassword) => setFormData(prev => ({ ...prev, newPassword }))}
                                secureTextEntry={!formData.showPassword}
                                editable={!formData.loading}
                                inputBoxStyle={{
                                    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0',
                                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F8FAFC'
                                }}
                                rightAccessory={
                                    <TouchableOpacity
                                        onPress={() => setFormData(prev => ({ ...prev, showPassword: !prev.showPassword }))}
                                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                    >
                                        <Ionicons
                                            name={formData.showPassword ? 'eye-outline' : 'eye-off-outline'}
                                            size={20}
                                            color={isDark ? 'rgba(255, 255, 255, 0.5)' : '#64748B'}
                                        />
                                    </TouchableOpacity>
                                }
                            />
                        </View>

                        {/* Confirm Password Input */}
                        <View style={styles.inputField}>
                            <FormInput
                                label="CONFIRM PASSWORD"
                                icon="lock-closed-outline"
                                placeholder="Confirm new password"
                                value={formData.confirmPassword}
                                onChangeText={(confirmPassword) => setFormData(prev => ({ ...prev, confirmPassword }))}
                                secureTextEntry={!formData.showPassword}
                                editable={!formData.loading}
                                inputBoxStyle={{
                                    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0',
                                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F8FAFC'
                                }}
                            />
                        </View>

                        {/* Submit Button */}
                        <SubmitButton
                            title="Set New Password"
                            onPress={handleSubmit}
                            isLoading={formData.loading}
                            style={{ width: '100%', marginTop: 6 }}
                        />
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
        flex: 1 },
    headerSection: {
        paddingBottom: 34,
        borderBottomLeftRadius: Layout.headerBorderRadius,
        borderBottomRightRadius: Layout.headerBorderRadius,
        overflow: 'hidden' },
    backButton: {
        position: 'absolute',
        top: 50,
        left: 20,
        zIndex: 10,
        width: 40,
        height: 40,
        borderRadius: Layout.borderRadius,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center' },
    headerContent: {
        paddingHorizontal: 18,
        paddingTop: 34 },
    headerTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#FFFFFF',
        lineHeight: 40,
        marginBottom: 6 },
    headerSubtitle: {
        fontSize: 12.5,
        color: 'rgba(255, 255, 255, 0.9)',
        lineHeight: 22 },
    formContainer: {
        flex: 1,
        paddingHorizontal: 15,
        paddingTop: 26,
        paddingBottom: 34 },
    formCard: {
        borderRadius: Layout.borderRadius,
        padding: 13 },
    inputField: {
        marginBottom: 18 },
    label: {
        fontSize: 10,
        fontWeight: '700',
        color: '#475569',
        letterSpacing: 0.5,
        marginBottom: 6,
        marginLeft: 0 },
    inputBox: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 52,
        borderRadius: Layout.borderRadius,
        paddingHorizontal: 10 },
    input: {
        flex: 1,
        fontSize: 10.5,
        fontWeight: '500' },
    submitButton: {
        height: 52,
        borderRadius: Layout.borderRadius,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 6,
        marginBottom: 18,
        overflow: 'hidden' },
    submitButtonText: {
        color: '#FFFFFF',
        fontSize: 10.5,
        fontWeight: '700',
        letterSpacing: 0.5 },
    strengthContainer: {
        marginTop: 8,
        paddingHorizontal: 2 },
    strengthBarContainer: {
        flexDirection: 'row',
        height: 4,
        gap: 4,
        marginBottom: 4 },
    strengthBar: {
        flex: 1,
        height: '100%',
        borderRadius: Layout.borderRadius,
        backgroundColor: '#E2E8F0' },
    strengthText: {
        fontSize: 10,
        fontWeight: '600',
        textAlign: 'right' },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 6 },
    footerText: {
        fontSize: 10.5,
        fontWeight: '500' },
    footerLink: {
        fontSize: 10.5,
        fontWeight: '700' } });
