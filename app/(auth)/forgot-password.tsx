import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { ThemedText } from '@/components/themedText';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useTheme } from '../../context/ThemeContext';
import { forgotPasswordSchema } from '@/utils/validation';
import * as yup from 'yup';
import { checkAccountDetails, sendOtp } from '@/apis/login/forgot-password';

import { analyticsService, AnalyticsEvents } from '@/analytics';

export default function ForgotPasswordScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { theme, isDark } = useTheme();
    const colors = Colors[theme];

    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1); // 1: Find Account, 2: Profile Preview
    const [userProfile, setUserProfile] = useState<any>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});

    const validateField = async (name: string, value: any) => {
        try {
            const fieldSchema = yup.reach(forgotPasswordSchema, name) as yup.AnySchema;
            await fieldSchema.validate(value);
            setErrors(prev => ({ ...prev, [name]: '' }));
        } catch (error: any) {
            setErrors(prev => ({ ...prev, [name]: error.message }));
        }
    };

    const handleBlur = (field: string) => {
        setTouched(prev => ({ ...prev, [field]: true }));
        validateField(field, email.trim());
    };

    const handleSubmit = async () => {
        setErrors({});
        setTouched({ email: true });
        try {
            await forgotPasswordSchema.validate({ email: email.trim() }, { abortEarly: false });
        } catch (error: any) {
            if (error.inner) {
                const newErrors: Record<string, string> = {};
                error.inner.forEach((err: any) => {
                    newErrors[err.path] = err.message;
                });
                setErrors(newErrors);
            }
            Toast.show({
                type: 'error',
                text1: 'Validation Error',
                text2: 'Please fix the errors in the form'
            });
            return;
        }

        setLoading(true);

        try {
            const response = await checkAccountDetails(email.trim());
            setUserProfile(response.data);
            setStep(2);
        } catch (error: any) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error.message || 'Account not found'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSendOtp = async () => {
        setLoading(true);
        try {
            await sendOtp(email.trim());
            Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'Verification code sent successfully'
            });

            analyticsService.trackEvent(AnalyticsEvents.FORGOT_PASSWORD_REQUEST, { email: email.trim() });


            // Navigate to verify otp screen with identifier
            router.push({
                pathname: '/(auth)/verify-otp',
                params: {
                    email: email.trim(),
                    name: userProfile?.name || '',
                    profileImage: userProfile?.profileImage || ''
                }
            } as any);

        } catch (error: any) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error.message || 'Failed to send verification code'
            });
        } finally {
            setLoading(false);
        }
    };

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
                            source={require('../../public/icon.svg')}
                            style={{ width: 48, height: 48, marginBottom: 16 }}
                            contentFit="contain"
                        />
                        <ThemedText style={styles.headerTitle}>Forgot Password?</ThemedText>
                        <ThemedText style={styles.headerSubtitle}>
                            {step === 1
                                ? "Enter your registered email to find your account"
                                : "Is this you? We'll send a code to your registered email"}
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
                        {step === 1 ? (
                            <>
                                {/* Email/Phone Input */}
                                 <View style={styles.inputField}>
                                    <ThemedText style={[styles.label, isDark && { color: '#E2E8F0' }]}>EMAIL ADDRESS <ThemedText style={styles.required}>*</ThemedText></ThemedText>
                                    <View style={[styles.inputBox, {
                                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F8FAFC',
                                        borderColor: errors.email && touched.email ? '#EF4444' : (isDark ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0')
                                    }]}>
                                        <Ionicons name="mail-outline" size={20} color={isDark ? 'rgba(255, 255, 255, 0.5)' : '#64748B'} style={{ marginRight: 12 }} />
                                        <TextInput
                                            placeholder="example@gmail.com"
                                            placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.4)' : '#94A3B8'}
                                            value={email}
                                            onChangeText={(text) => {
                                                setEmail(text);
                                                if (errors.email) validateField('email', text.trim());
                                            }}
                                            onBlur={() => handleBlur('email')}
                                            style={[styles.input, { color: colors.text }]}
                                            keyboardType="email-address"
                                            autoCapitalize="none"
                                            editable={!loading}
                                        />
                                        {touched.email && !errors.email && email.length > 0 && (
                                            <Ionicons name="checkmark-circle" size={18} color="#10B981" style={{ marginLeft: 8 }} />
                                        )}
                                    </View>
                                    {touched.email && errors.email ? (
                                        <ThemedText style={styles.errorText}>{errors.email}</ThemedText>
                                    ) : null}
                                </View>

                                {/* Find Account Button */}
                                <TouchableOpacity
                                    style={[styles.submitButton, { backgroundColor: '#006666' }]}
                                    onPress={handleSubmit}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="#FFFFFF" />
                                    ) : (
                                        <ThemedText style={styles.submitButtonText}>Find Account</ThemedText>
                                    )}
                                </TouchableOpacity>
                            </>
                        ) : (
                            <View style={styles.profileContainer}>
                                <View style={styles.profileInfo}>
                                    {userProfile?.profileImage ? (
                                        <Image
                                            source={{ uri: userProfile.profileImage }}
                                            style={styles.profileAvatar}
                                            contentFit="cover"
                                            transition={200}
                                        />
                                    ) : (
                                        <View style={[styles.profileAvatarPlaceholder, { backgroundColor: colors.primary + '20' }]}>
                                            <Ionicons name="person" size={40} color={colors.primary} />
                                        </View>
                                    )}
                                    <ThemedText style={[styles.profileName, { color: colors.text }]}>
                                        {userProfile?.name
                                            ? userProfile.name.split(' ').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')
                                            : ''}
                                    </ThemedText>
                                    <ThemedText style={[styles.profileEmail, { color: colors.icon }]}>
                                        {userProfile?.email}
                                    </ThemedText>
                                </View>

                                {/* Send OTP Button */}
                                <TouchableOpacity
                                    style={[styles.submitButton, styles.submitButtonHorizontal, { backgroundColor: '#006666', marginTop: 5 }]}
                                    onPress={handleSendOtp}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="#FFFFFF" />
                                    ) : (
                                        <ThemedText style={styles.submitButtonText}>Send OTP</ThemedText>
                                    )}
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.notMeButton}
                                    onPress={() => setStep(1)}
                                    disabled={loading}
                                >
                                    <ThemedText style={[styles.notMeText, { color: colors.primary }]}>
                                        Not me? Try again
                                    </ThemedText>
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* Footer */}
                        <View style={styles.footer}>
                            <ThemedText style={[styles.footerText, { color: isDark ? 'rgba(255, 255, 255, 0.6)' : '#64748B' }]}>
                                Remember your password?{' '}
                            </ThemedText>
                            <TouchableOpacity onPress={() => router.back()}>
                                <ThemedText style={[styles.footerLink, { color: isDark ? '#FFFFFF' : '#006666' }]}>Log In</ThemedText>
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
        borderBottomLeftRadius: Layout.headerBorderRadius,
        borderBottomRightRadius: Layout.headerBorderRadius,
        overflow: 'hidden',
    },
    headerContent: {
        paddingHorizontal: 22,
        paddingTop: 38,
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
        borderRadius: Layout.borderRadius,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
    },
    inputField: {
        marginBottom: 20,
    },
    errorText: {
        color: '#EF4444',
        fontSize: 12,
        marginTop: 6,
        marginLeft: 4,
        fontWeight: '500',
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
        borderRadius: Layout.borderRadius,
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
        borderRadius: Layout.borderRadius,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 18,
        overflow: 'hidden',
        shadowColor: '#006666',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
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
    // Stage 2 Profile Styles
    profileContainer: {
        alignItems: 'center',
        paddingVertical: 5,
    },
    profileInfo: {
        alignItems: 'center',
        marginBottom: 15,
    },
    profileAvatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        marginBottom: 10,
        borderWidth: 2,
        borderColor: '#00666620',
    },
    profileAvatarPlaceholder: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    profileName: {
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 2,
    },
    profileEmail: {
        fontSize: 14,
        fontWeight: '500',
    },
    notMeButton: {
        marginTop: 10,
        padding: 5,
    },
    notMeText: {
        fontSize: 14,
        fontWeight: '700',
    },
    submitButtonHorizontal: {
        paddingHorizontal: 30,
        alignSelf: 'center',
    },
});
