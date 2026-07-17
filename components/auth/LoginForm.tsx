import React, { useState, useEffect } from 'react';
import {
    View,
    TouchableOpacity,
    StyleSheet,
    Platform,
    Image
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Device from 'expo-device';
import * as yup from 'yup';
import Toast from 'react-native-toast-message';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { loginApi, googleLoginApi } from '@/apis/login';
import { analyticsService, AnalyticsEvents } from '@/analytics';
import { loginSchema } from '@/utils/validation';
import { clientStorage } from '@/utils/storage';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { LoaderOverlay } from '@/components/common/LoaderOverlay';
import { FormInput } from '@/components/common/FormInput';
import { PressableScale } from '@/components/ui/PressableScale';
import Animated, { FadeInDown } from 'react-native-reanimated';

// Removed global configuration

export const LoginForm = React.memo(function LoginForm() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { login } = useAuth();
    const { theme } = useTheme();

    const isDark = theme === 'dark';
    const colors = Colors[theme];

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        rememberMe: true,
        showPassword: false,
        loading: false,
        googleLoading: false,
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});

    useEffect(() => {
        if (params.email && params.password) {
            setFormData(prev => ({
                ...prev,
                email: String(params.email),
                password: String(params.password)
            }));
        } else {
            loadSavedCredentials();
        }
    }, []);

    const loadSavedCredentials = async () => {
        try {
            const savedEmail = await clientStorage.getItem('remember_email');
            const savedPassword = await clientStorage.getItem('remember_password');
            if (savedEmail) {
                setFormData(prev => ({
                    ...prev,
                    email: savedEmail,
                    password: savedPassword || '',
                    rememberMe: true
                }));
            }
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Storage Error',
                text2: 'Failed to load saved credentials',
            });
        }
    };

    const validateField = async (name: string, value: any) => {
        try {
            const fieldSchema = yup.reach(loginSchema, name) as yup.AnySchema;
            await fieldSchema.validate(value);
            setErrors(prev => ({ ...prev, [name]: '' }));
        } catch (error: any) {
            setErrors(prev => ({ ...prev, [name]: error.message }));
        }
    };

    const handleBlur = (field: string) => {
        setTouched(prev => ({ ...prev, [field]: true }));
        validateField(field, (formData as any)[field]);
    };

    const handleLogin = async () => {
        setErrors({});
        setTouched({ email: true, password: true });
        try {
            await loginSchema.validate({
                email: formData.email,
                password: formData.password,
            }, { abortEarly: false });
            performLogin(formData.email, formData.password);
        } catch (error: any) {
            if (error.inner && error.inner.length > 0) {
                const newErrors: Record<string, string> = {};
                error.inner.forEach((err: any) => {
                    if (err.path && !newErrors[err.path]) {
                        newErrors[err.path] = err.message;
                    }
                });
                setErrors(newErrors);
            } else {
                setErrors(prev => ({ ...prev, [error.path || 'form']: error.message }));
            }
        }
    };

    const performLogin = async (email: string, password: string) => {
        setFormData(prev => ({ ...prev, loading: true }));

        try {
            const deviceName = Device.modelName || `Unknown ${Platform.OS} Device`;
            const platform = Platform.OS;

            const response = await loginApi({
                email,
                password,
                deviceName,
                platform,
                latitude: 0,
                longitude: 0,
            });

            // Save or clear credentials for Remember Me
            if (formData.rememberMe) {
                await clientStorage.setItem('remember_email', email);
                await clientStorage.setItem('remember_password', password);
            } else {
                await clientStorage.removeItem('remember_email');
                await clientStorage.removeItem('remember_password');
            }

            await login(response);
            analyticsService.trackEvent(AnalyticsEvents.LOGIN, { method: 'email' });
            Toast.show({
                type: 'success',
                text1: 'Welcome Back!',
                text2: 'Logged in successfully',
            });
        } catch (error: any) {
            const message =
                error?.response?.data?.message ||
                error?.message ||
                'Something went wrong';
            Toast.show({
                type: 'error',
                text1: 'Login Failed',
                text2: message,
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
            analyticsService.trackEvent(AnalyticsEvents.LOGIN, { method: 'google' });
            Toast.show({
                type: 'success',
                text1: 'Welcome!',
                text2: 'Logged in with Google',
            });
        } catch (error: any) {
            const message =
                error?.response?.data?.message ||
                error?.message ||
                'Google Login failed';
            Toast.show({
                type: 'error',
                text1: 'Login Failed',
                text2: message,
            });
        } finally {
            setFormData(prev => ({ ...prev, googleLoading: false }));
        }
    };



    return (
        <View style={styles.formContainer}>
            <Animated.View
                entering={FadeInDown.delay(80).duration(300)}
                style={styles.formCard}
            >
                {/* Email/Phone Input */}
                <View style={styles.inputField}>
                    <FormInput
                        label="EMAIL"
                        required
                        icon="person-outline"
                        placeholder="Enter your email"
                        value={formData.email}
                        onChangeText={(email) => {
                            setFormData(prev => ({ ...prev, email }));
                            if (errors.email) validateField('email', email);
                        }}
                        onBlur={() => handleBlur('email')}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        editable={!formData.loading}
                        rightAccessory={
                            touched.email && !errors.email && formData.email.length > 0 ? (
                                <Ionicons name="checkmark-circle" size={18} color="#7BC043" style={{ marginLeft: 8 }} />
                            ) : undefined
                        }
                    />
                    {touched.email && errors.email ? (
                        <ThemedText style={styles.errorText}>{errors.email}</ThemedText>
                    ) : null}
                </View>

                {/* Password */}
                <View style={styles.inputField}>
                    <FormInput
                        label="PASSWORD"
                        required
                        icon="lock-closed-outline"
                        placeholder="Enter your password"
                        value={formData.password}
                        onChangeText={(password) => {
                            setFormData(prev => ({ ...prev, password }));
                            if (errors.password) validateField('password', password);
                        }}
                        onBlur={() => handleBlur('password')}
                        secureTextEntry={!formData.showPassword}
                        editable={!formData.loading}
                        rightAccessory={
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                {touched.password && !errors.password && formData.password.length > 0 && (
                                    <Ionicons name="checkmark-circle" size={18} color="#7BC043" style={{ marginRight: 8 }} />
                                )}
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
                    {touched.password && errors.password ? (
                        <ThemedText style={styles.errorText}>{errors.password}</ThemedText>
                    ) : null}
                </View>

                {/* Remember & Forgot */}
                <View style={styles.optionsRow}>
                    <TouchableOpacity
                        style={styles.rememberMe}
                        onPress={() => setFormData(prev => ({ ...prev, rememberMe: !prev.rememberMe }))}
                    >
                        <Ionicons
                            name={formData.rememberMe ? 'checkbox' : 'square-outline'}
                            size={20}
                            color={formData.rememberMe ? colors.primary : (isDark ? 'rgba(255, 255, 255, 0.5)' : '#6B7B73')}
                        />
                        <ThemedText style={[styles.optionText, { color: colors.text }]}>Remember me</ThemedText>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password' as any)}>
                        <ThemedText style={[styles.forgotText, { color: isDark ? colors.text : colors.primary }]}>
                            Forgot Password?
                        </ThemedText>
                    </TouchableOpacity>
                </View>

                {/* Login Button */}
                <PressableScale
                    style={[styles.loginButton, { backgroundColor: colors.primary }]}
                    onPress={handleLogin}
                    disabled={formData.loading}
                >
                    <ThemedText style={styles.loginButtonText}>Log In</ThemedText>
                </PressableScale>

                {/* Google Login Button */}
                <PressableScale
                    style={[styles.loginButton, { backgroundColor: colors.field }]}
                    onPress={handleGoogleLogin}
                    disabled={formData.googleLoading}
                >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Image source={require('../../assets/icons/google.webp')} style={{ width: 20, height: 20, marginRight: 8 }} />
                        <ThemedText style={[styles.loginButtonText, { color: colors.text }]}>Sign in with Google</ThemedText>
                    </View>
                </PressableScale>



                {/* Footer */}
                <View style={styles.footer}>
                    <ThemedText style={[styles.footerText, { color: isDark ? 'rgba(255, 255, 255, 0.6)' : '#6B7B73' }]}>
                        Don&apos;t have an account?{' '}
                    </ThemedText>
                    <TouchableOpacity onPress={() => router.push('/(auth)/register' as any)}>
                        <ThemedText style={[styles.footerLink, { color: isDark ? colors.text : colors.primary }]}>Sign Up</ThemedText>
                    </TouchableOpacity>
                </View>
            </Animated.View>
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
    label: {
        fontSize: 11,
        fontWeight: '700',
        color: '#4F5F57',
        letterSpacing: 0.5,
        marginBottom: 6,
        marginLeft: 0,
    },
    required: {
        color: '#FF5A5F',
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
    optionsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 22,
    },
    rememberMe: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    optionText: {
        fontSize: 12,
        fontWeight: '500',
    },
    forgotText: {
        fontSize: 12,
        fontWeight: '600',
    },
    loginButton: {
        height: 52,
        borderRadius: 999,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 14,
        overflow: 'hidden',
    },
    loginButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700',
        letterSpacing: 0.3,
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
