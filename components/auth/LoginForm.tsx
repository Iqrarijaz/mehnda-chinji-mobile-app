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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Device from 'expo-device';
import * as yup from 'yup';
import Toast from 'react-native-toast-message';

import { ThemedText } from '@/components/themedText';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { loginApi, googleLoginApi } from '@/apis/login';
import { analyticsService, AnalyticsEvents } from '@/analytics';
import { loginSchema } from '@/utils/validation';
import { clientStorage } from '@/utils/storage';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

// Removed global configuration

export function LoginForm() {
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
            <View style={[styles.formCard, { backgroundColor: colors.card }]}>
                {/* Email/Phone Input */}
                <View style={styles.inputField}>
                    <ThemedText style={[styles.label, isDark && { color: '#E2E8F0' }]}>EMAIL OR PHONE <ThemedText style={styles.required}>*</ThemedText></ThemedText>
                    <View style={[styles.inputBox, {
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F8FAFC',
                        borderColor: errors.email && touched.email ? '#EF4444' : (isDark ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0')
                    }]}>
                        <Ionicons name="person-outline" size={20} color={isDark ? 'rgba(255, 255, 255, 0.5)' : '#64748B'} style={{ marginRight: 12 }} />
                        <TextInput
                            placeholder="Enter your email or phone"
                            placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.4)' : '#94A3B8'}
                            value={formData.email}
                            onChangeText={(email) => {
                                setFormData(prev => ({ ...prev, email }));
                                if (errors.email) validateField('email', email);
                            }}
                            onBlur={() => handleBlur('email')}
                            style={[styles.input, { color: colors.text }]}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            editable={!formData.loading}
                        />
                        {touched.email && !errors.email && formData.email.length > 0 && (
                            <Ionicons name="checkmark-circle" size={18} color="#10B981" style={{ marginLeft: 8 }} />
                        )}
                    </View>
                    {touched.email && errors.email ? (
                        <ThemedText style={styles.errorText}>{errors.email}</ThemedText>
                    ) : null}
                </View>

                {/* Password */}
                <View style={styles.inputField}>
                    <ThemedText style={[styles.label, isDark && { color: '#E2E8F0' }]}>PASSWORD <ThemedText style={styles.required}>*</ThemedText></ThemedText>
                    <View style={[styles.inputBox, {
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F8FAFC',
                        borderColor: errors.password && touched.password ? '#EF4444' : (isDark ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0')
                    }]}>
                        <Ionicons name="lock-closed-outline" size={20} color={isDark ? 'rgba(255, 255, 255, 0.5)' : '#64748B'} style={{ marginRight: 12 }} />
                        <TextInput
                            placeholder="Enter your password"
                            placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.4)' : '#94A3B8'}
                            value={formData.password}
                            onChangeText={(password) => {
                                setFormData(prev => ({ ...prev, password }));
                                if (errors.password) validateField('password', password);
                            }}
                            onBlur={() => handleBlur('password')}
                            style={[styles.input, { color: colors.text }]}
                            secureTextEntry={!formData.showPassword}
                            editable={!formData.loading}
                        />
                        {touched.password && !errors.password && formData.password.length > 0 && (
                            <Ionicons name="checkmark-circle" size={18} color="#10B981" style={{ marginLeft: 8 }} />
                        )}
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
                            color={formData.rememberMe ? colors.primary : (isDark ? 'rgba(255, 255, 255, 0.5)' : '#64748B')}
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
                <TouchableOpacity
                    style={[styles.loginButton, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
                    onPress={handleLogin}
                    disabled={formData.loading}
                >
                    {formData.loading ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <ThemedText style={styles.loginButtonText}>Log In</ThemedText>
                    )}
                </TouchableOpacity>

                {/* Google Login Button */}
                <TouchableOpacity
                    style={[styles.loginButton, { backgroundColor: '#F5F5F5', shadowColor: 'rgba(0,0,0,0.1)' }]}
                    onPress={handleGoogleLogin}
                    disabled={formData.googleLoading}
                >
                    {formData.googleLoading ? (
                        <ActivityIndicator color="#000000" />
                    ) : (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Image source={require('../../assets/icons/google.png')} style={{ width: 20, height: 20, marginRight: 8 }} />
                            <ThemedText style={[styles.loginButtonText, { color: '#000000' }]}>Sign in with Google</ThemedText>
                        </View>
                    )}
                </TouchableOpacity>



                {/* Footer */}
                <View style={styles.footer}>
                    <ThemedText style={[styles.footerText, { color: isDark ? 'rgba(255, 255, 255, 0.6)' : '#64748B' }]}>
                        Don't have an account?{' '}
                    </ThemedText>
                    <TouchableOpacity onPress={() => router.push('/(auth)/register' as any)}>
                        <ThemedText style={[styles.footerLink, { color: isDark ? colors.text : colors.primary }]}>Sign Up</ThemedText>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    formContainer: {
        paddingHorizontal: 18,
        paddingTop: 30,
        paddingBottom: 40,
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
        borderRadius: Layout.borderRadius,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 18,
        overflow: 'hidden',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    loginButtonText: {
        color: '#FFFFFF',
        fontSize: 12,
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
        fontSize: 12,
        fontWeight: '500',
    },
    footerLink: {
        fontSize: 12,
        fontWeight: '700',
    },
});
