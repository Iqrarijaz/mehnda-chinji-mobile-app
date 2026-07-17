import React, { useState, useEffect } from 'react';
import {
    View,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    StyleSheet,
    Platform,
    Image
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Device from 'expo-device';
import Toast from 'react-native-toast-message';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { signup, checkAccountExistsApi, googleLoginApi } from '@/apis/login';
import { registerSchema, getPasswordStrength } from '@/utils/validation';
import { analyticsService, AnalyticsEvents } from '@/analytics';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { LoaderOverlay } from '@/components/common/LoaderOverlay';
import { FormInput } from '@/components/common/FormInput';
import { PressableScale } from '@/components/ui/PressableScale';

export const RegisterForm = React.memo(function RegisterForm() {
    const router = useRouter();
    const { login } = useAuth();
    const { theme } = useTheme();

    const isDark = theme === 'dark';
    const colors = Colors[theme];

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        showPassword: false,
        showConfirmPassword: false,
        loading: false,
        ageVerified: false,
        termsAccepted: false,
        guidelinesAccepted: false,
        googleLoading: false,
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [checkingAccount, setCheckingAccount] = useState<Record<string, boolean>>({});

    const validateField = async (name: string, value: any, currentData = formData) => {
        try {
            const dataToValidate = { ...currentData, [name]: value };
            await registerSchema.validateAt(name, dataToValidate);
            setErrors(prev => ({ ...prev, [name]: '' }));
            return true;
        } catch (error: any) {
            setErrors(prev => ({ ...prev, [name]: error.message }));
            return false;
        }
    };

    const handleAccountCheck = async (name: 'email' | 'phone', value: string) => {
        if (!value) return;

        setCheckingAccount(prev => ({ ...prev, [name]: true }));
        try {
            const response = await checkAccountExistsApi({ [name]: value });
            if (response.data?.exists) {
                setErrors(prev => ({ ...prev, [name]: response.data.message || `${name} already exists` }));
            }
        } catch (error: any) {
            console.error(`Error checking ${name} existence:`, error);
        } finally {
            setCheckingAccount(prev => ({ ...prev, [name]: false }));
        }
    };

    const handleBlur = async (field: string) => {
        setTouched(prev => ({ ...prev, [field]: true }));
        const isValid = await validateField(field, (formData as any)[field]);

        if (isValid && (field === 'email' || field === 'phone')) {
            handleAccountCheck(field as 'email' | 'phone', (formData as any)[field]);
        }
    };

    const handleRegister = async () => {
        setErrors({});
        setTouched({
            fullName: true,
            email: true,
            phone: true,
            password: true,
            confirmPassword: true,
            ageVerified: true,
            termsAccepted: true,
            guidelinesAccepted: true
        });

        try {
            await registerSchema.validate(formData, { abortEarly: false });
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
                text2: 'Please fix the errors in the form',
            });
            return;
        }

        const { fullName, email, phone, password, confirmPassword } = formData;

        setFormData(prev => ({ ...prev, loading: true }));

        try {
            await signup({
                name: fullName,
                email,
                phone,
                password,
                confirm: confirmPassword,
                location: {
                    type: "Point",
                    coordinates: [0, 0]
                },
                ageVerified: true,
                termsAccepted: true,
                privacyAccepted: true,
                guidelinesAccepted: true
            });
            Toast.show({
                type: 'success',
                text1: 'Success!',
                text2: 'Account created successfully',
            });

            analyticsService.trackEvent(AnalyticsEvents.SIGN_UP, { method: 'email' });

            router.replace({ pathname: '/login', params: { email: email.trim(), password } } as any);
        } catch (error: any) {
            Toast.show({
                type: 'error',
                text1: 'Registration Failed',
                text2: error?.response?.data?.message || error?.message || 'Something went wrong',
            });
        } finally {
            setFormData(prev => ({ ...prev, loading: false }));
        }
    };

    const handleGoogleLogin = async () => {
        setFormData(prev => ({ ...prev, googleLoading: true }));
        try {
            GoogleSignin.configure({
                webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '672311293362-dfgu9rtfc0ucfb1j3nmnu4snv2ss4b8r.apps.googleusercontent.com',
            });
            await GoogleSignin.hasPlayServices();
            const userInfo = await GoogleSignin.signIn();

            // In v16+, idToken is inside data.idToken, but can also be at root in older types.
            const idToken = userInfo?.data?.idToken || (userInfo as any)?.idToken;

            if (!idToken) throw new Error('Could not receive ID token from Google');

            const deviceName = Device.modelName || `Unknown ${Platform.OS} Device`;
            const platform = Platform.OS;

            const response = await googleLoginApi({
                idToken,
                deviceName,
                platform,
            });

            await login(response);
            analyticsService.trackEvent(AnalyticsEvents.SIGN_UP, { method: 'google' });
            Toast.show({
                type: 'success',
                text1: 'Welcome!',
                text2: 'Registered with Google',
            });
        } catch (error: any) {
            const message =
                error?.response?.data?.message ||
                error?.message ||
                'Google Login failed';
            Toast.show({
                type: 'error',
                text1: 'Registration Failed',
                text2: message,
            });
        } finally {
            setFormData(prev => ({ ...prev, googleLoading: false }));
        }
    };


    const isFormValid = () => {
        return registerSchema.isValidSync(formData);
    };

    const renderValidationIcon = (field: string) => {
        if (touched[field] && !errors[field] && (formData as any)[field]?.length > 0) {
            return <Ionicons name="checkmark-circle" size={18} color="#7BC043" style={{ marginLeft: 8 }} />;
        }
        return null;
    };

    const strength = getPasswordStrength(formData.password);
    const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
    const strengthColors = ['', '#FF5A5F', '#F0803C', '#7BC043', '#4B8B27'];

    return (
        <View style={styles.formContainer}>
            <View style={styles.formCard}>
                {/* Full Name */}
                <View style={styles.inputField}>
                    <FormInput
                        label="FULL NAME"
                        required
                        icon="person-outline"
                        placeholder="Enter your full name"
                        value={formData.fullName}
                        onChangeText={(fullName: string) => {
                            setFormData(prev => ({ ...prev, fullName }));
                            if (errors.fullName) validateField('fullName', fullName);
                        }}
                        onBlur={() => handleBlur('fullName')}
                        rightAccessory={renderValidationIcon('fullName')}
                    />
                    {touched.fullName && errors.fullName ? <ThemedText style={styles.errorText}>{errors.fullName}</ThemedText> : null}
                </View>

                {/* Email */}
                <View style={styles.inputField}>
                    <FormInput
                        label="EMAIL"
                        required
                        icon="mail-outline"
                        placeholder="Enter your email"
                        value={formData.email}
                        onChangeText={(email: string) => {
                            setFormData(prev => ({ ...prev, email }));
                            if (errors.email) validateField('email', email);
                        }}
                        onBlur={() => handleBlur('email')}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        rightAccessory={
                            checkingAccount.email ? (
                                <ActivityIndicator size="small" color="#003D36" style={{ marginLeft: 8 }} />
                            ) : renderValidationIcon('email')
                        }
                    />
                    {touched.email && errors.email ? <ThemedText style={styles.errorText}>{errors.email}</ThemedText> : null}
                </View>

                {/* Phone */}
                <View style={styles.inputField}>
                    <FormInput
                        label="PHONE"
                        required
                        icon="call-outline"
                        placeholder="03XXXXXXXXX"
                        value={formData.phone}
                        onChangeText={(phone: string) => {
                            const clean = phone.replace(/[^0-9]/g, '');
                            setFormData(prev => ({ ...prev, phone: clean }));
                            if (errors.phone) validateField('phone', clean);
                        }}
                        onBlur={() => handleBlur('phone')}
                        keyboardType="phone-pad"
                        maxLength={11}
                        rightAccessory={
                            checkingAccount.phone ? (
                                <ActivityIndicator size="small" color="#003D36" style={{ marginLeft: 8 }} />
                            ) : renderValidationIcon('phone')
                        }
                    />
                    {touched.phone && errors.phone ? <ThemedText style={styles.errorText}>{errors.phone}</ThemedText> : null}
                </View>

                {/* Password */}
                <View style={styles.inputField}>
                    <FormInput
                        label="PASSWORD"
                        required
                        icon="lock-closed-outline"
                        placeholder="Enter your password"
                        value={formData.password}
                        onChangeText={(password: string) => {
                            setFormData(prev => ({ ...prev, password }));
                            const newData = { ...formData, password };
                            if (errors.password) validateField('password', password, newData);
                            if (touched.confirmPassword || errors.confirmPassword) {
                                validateField('confirmPassword', formData.confirmPassword, newData);
                            }
                        }}
                        onBlur={() => handleBlur('password')}
                        secureTextEntry={!formData.showPassword}
                        rightAccessory={
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                {renderValidationIcon('password')}
                                <TouchableOpacity
                                    onPress={() => setFormData(prev => ({ ...prev, showPassword: !prev.showPassword }))}
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                >
                                    <Ionicons
                                        name={formData.showPassword ? 'eye-outline' : 'eye-off-outline'}
                                        size={20}
                                        color={isDark ? 'rgba(255, 255, 255, 0.5)' : '#6B7B73'}
                                    />
                                </TouchableOpacity>
                            </View>
                        }
                    />

                    {touched.password && errors.password ? <ThemedText style={styles.errorText}>{errors.password}</ThemedText> : null}
                </View>

                {/* Confirm Password */}
                <View style={styles.inputField}>
                    <FormInput
                        label="CONFIRM PASSWORD"
                        required
                        icon="lock-closed-outline"
                        placeholder="Confirm your password"
                        value={formData.confirmPassword}
                        onChangeText={(confirmPassword: string) => {
                            setFormData(prev => ({ ...prev, confirmPassword }));
                            if (errors.confirmPassword) validateField('confirmPassword', confirmPassword, { ...formData, confirmPassword });
                        }}
                        onBlur={() => handleBlur('confirmPassword')}
                        secureTextEntry={!formData.showConfirmPassword}
                        rightAccessory={
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                {renderValidationIcon('confirmPassword')}
                                <TouchableOpacity
                                    onPress={() => setFormData(prev => ({ ...prev, showConfirmPassword: !prev.showConfirmPassword }))}
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                >
                                    <Ionicons
                                        name={formData.showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                                        size={20}
                                        color={isDark ? 'rgba(255, 255, 255, 0.5)' : '#6B7B73'}
                                    />
                                </TouchableOpacity>
                            </View>
                        }
                    />
                    {touched.confirmPassword && errors.confirmPassword ? <ThemedText style={styles.errorText}>{errors.confirmPassword}</ThemedText> : null}
                </View>

                {/* Age Verification Checkbox */}
                <View style={styles.checkboxContainer}>
                    <TouchableOpacity
                        onPress={() => {
                            setFormData(prev => ({ ...prev, ageVerified: !prev.ageVerified }));
                            if (errors.ageVerified) setErrors(prev => ({ ...prev, ageVerified: '' }));
                        }}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.checkbox, formData.ageVerified && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
                            {formData.ageVerified && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
                        </View>
                    </TouchableOpacity>
                    <ThemedText style={[styles.checkboxText, { color: isDark ? 'rgba(255, 255, 255, 0.7)' : '#6B7B73' }]}>
                        I confirm that I am at least 13 years old. <ThemedText style={styles.required}>*</ThemedText>
                    </ThemedText>
                </View>
                {errors.ageVerified && <ThemedText style={[styles.errorText, { marginTop: -12, marginBottom: 16 }]}>{errors.ageVerified}</ThemedText>}

                {/* Terms & Privacy Checkbox */}
                <View style={styles.checkboxContainer}>
                    <TouchableOpacity
                        onPress={() => {
                            setFormData(prev => ({ ...prev, termsAccepted: !prev.termsAccepted }));
                            if (errors.termsAccepted) setErrors(prev => ({ ...prev, termsAccepted: '' }));
                        }}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.checkbox, formData.termsAccepted && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
                            {formData.termsAccepted && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
                        </View>
                    </TouchableOpacity>
                    <View style={{ flex: 1 }}>
                        <ThemedText style={[styles.checkboxText, { color: isDark ? 'rgba(255, 255, 255, 0.7)' : '#6B7B73' }]}>
                            I agree to the {' '}
                            <ThemedText
                                style={{ color: colors.primary, fontWeight: '700', fontSize: 13, textDecorationLine: 'underline' }}
                                onPress={() => {
                                    router.push('/terms' as any);
                                }}
                            >Terms & Conditions</ThemedText>
                            {' '} and {' '}
                            <ThemedText
                                style={{ color: colors.primary, fontWeight: '700', fontSize: 13, textDecorationLine: 'underline' }}
                                onPress={() => {
                                    router.push('/privacy' as any);
                                }}
                            >Privacy Policy</ThemedText>
                            <ThemedText style={styles.required}> *</ThemedText>
                        </ThemedText>
                    </View>
                </View>

                {errors.termsAccepted && <ThemedText style={[styles.errorText, { marginTop: -12, marginBottom: 16 }]}>{errors.termsAccepted}</ThemedText>}

                {/* Community Guidelines Checkbox */}
                <View style={styles.checkboxContainer}>
                    <TouchableOpacity
                        onPress={() => {
                            setFormData(prev => ({ ...prev, guidelinesAccepted: !prev.guidelinesAccepted }));
                            if (errors.guidelinesAccepted) setErrors(prev => ({ ...prev, guidelinesAccepted: '' }));
                        }}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.checkbox, formData.guidelinesAccepted && { backgroundColor: '#003D36', borderColor: '#003D36' }]}>
                            {formData.guidelinesAccepted && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
                        </View>
                    </TouchableOpacity>
                    <View style={{ flex: 1 }}>
                        <ThemedText style={[styles.checkboxText, { color: isDark ? 'rgba(255, 255, 255, 0.7)' : '#6B7B73' }]}>
                            I agree to follow the {' '}
                            <ThemedText
                                style={{ color: '#003D36', fontWeight: '700', fontSize: 13, textDecorationLine: 'underline' }}
                                onPress={() => {
                                    router.push('/communityGuidelines' as any);
                                }}
                            >Community Guidelines</ThemedText>
                            <ThemedText style={styles.required}> *</ThemedText>
                        </ThemedText>
                    </View>
                </View>

                {errors.guidelinesAccepted && <ThemedText style={[styles.errorText, { marginTop: -12, marginBottom: 16 }]}>{errors.guidelinesAccepted}</ThemedText>}

                {/* Register Button */}
                <PressableScale
                    style={[
                        styles.registerButton,
                        { backgroundColor: isFormValid() ? '#003D36' : '#8FA79E' }
                    ]}
                    onPress={handleRegister}
                    disabled={formData.loading || !isFormValid()}
                >
                    {formData.loading ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <ThemedText style={styles.registerButtonText}>Sign Up</ThemedText>
                    )}
                </PressableScale>

                {/* Google Login Button */}
                <PressableScale
                    style={[
                        styles.registerButton,
                        { backgroundColor: colors.field, marginTop: 8, marginBottom: 8 }
                    ]}
                    onPress={handleGoogleLogin}
                    disabled={formData.googleLoading}
                >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Image source={require('../../assets/icons/google.webp')} style={{ width: 20, height: 20, marginRight: 8 }} />
                        <ThemedText style={[styles.registerButtonText, { color: colors.text }]}>Sign up with Google</ThemedText>
                    </View>
                </PressableScale>


                {/* Footer */}
                <View style={styles.footer}>
                    <ThemedText style={[styles.footerText, { color: isDark ? 'rgba(255, 255, 255, 0.6)' : '#6B7B73' }]}>
                        Already have an account?{' '}
                    </ThemedText>
                    <TouchableOpacity onPress={() => router.push('/login' as any)}>
                        <ThemedText style={[styles.footerLink, { color: isDark ? '#FFFFFF' : '#003D36', fontWeight: 'bold' }]}>Log In</ThemedText>
                    </TouchableOpacity>
                </View>
            </View>
            <LoaderOverlay visible={formData.loading || formData.googleLoading} />
        </View>
    );
});

const styles = StyleSheet.create({
    formContainer: {
        paddingTop: 16,
        paddingBottom: 12,
    },
    formCard: {},
    inputField: {
        marginBottom: 20,
    },
    errorText: {
        color: '#FF5A5F',
        fontSize: 12,
        marginTop: 6,
        marginLeft: 4,
        fontWeight: '500',
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
    label: {
        fontSize: 11,
        fontWeight: '700',
        color: '#4F5F57',
        letterSpacing: 0.5,
        marginBottom: 8,
        marginLeft: 2,
    },
    required: {
        color: '#FF5A5F',
    },
    inputBox: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 52,
        borderRadius: Layout.borderRadius,
        paddingHorizontal: 14,
    },
    input: {
        flex: 1,
        fontSize: 12,
        fontWeight: '500',
    },
    registerButton: {
        height: 52,
        borderRadius: 999,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
        marginBottom: 20,
        overflow: 'hidden',
    },
    registerButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
    },
    footerText: {
        fontSize: 12,
        fontWeight: '500',
    },
    footerLink: {
        fontSize: 12,
        fontWeight: '700',
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        paddingHorizontal: 4,
    },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 6,
        borderColor: '#ECECEC',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    checkboxText: {
        fontSize: 12,
        flex: 1,
        lineHeight: 18,
    },
});
