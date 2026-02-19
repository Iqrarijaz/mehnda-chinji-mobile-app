import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
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

import { LOGIN_API } from '../../apis/login';
import { ThemedText } from '../../components/themed-text';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export default function LoginScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { login } = useAuth();
    const { theme } = useTheme();

    const isDark = theme === 'dark';
    const colors = Colors[theme];

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        rememberMe: false,
        showPassword: false,
        loading: false,
        googleLoading: false,
        latitude: 0,
        longitude: 0,
    });

    useEffect(() => {
        loadSavedEmail();
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
                let location = await Location.getCurrentPositionAsync({});
                setFormData(prev => ({
                    ...prev,
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude
                }));
            }
        })();
    }, []);

    const loadSavedEmail = async () => {
        try {
            const savedEmail = await AsyncStorage.getItem('remember_email');
            if (savedEmail) {
                setFormData(prev => ({ ...prev, email: savedEmail, rememberMe: true }));
            }
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Storage Error',
                text2: 'Failed to load saved credentials',
            });
        }
    };

    const handleLogin = async () => {
        if (!formData.email || !formData.password) {
            Toast.show({
                type: 'error',
                text1: 'Required Fields',
                text2: 'Please fill in all fields to continue',
            });
            return;
        }

        performLogin(formData.email, formData.password);
    };

    const performLogin = async (email: string, password: string) => {
        setFormData(prev => ({ ...prev, loading: true }));

        try {
            const deviceName = Device.modelName || `Unknown ${Platform.OS} Device`;
            const platform = Platform.OS;

            const response = await LOGIN_API({
                email,
                password,
                deviceName,
                platform,
                latitude: formData.latitude,
                longitude: formData.longitude,
            });

            // Save or clear email for Remember Me
            if (formData.rememberMe) {
                await AsyncStorage.setItem('remember_email', email);
            } else {
                await AsyncStorage.removeItem('remember_email');
            }

            await login(response);
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
                    <View style={styles.headerContent}>
                        <ThemedText style={styles.headerTitle}>Sign in to your{"\n"}Account</ThemedText>
                        <ThemedText style={styles.headerSubtitle}>Welcome back! Please enter your details</ThemedText>
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
                                <Ionicons name="person-outline" size={20} color={isDark ? 'rgba(255, 255, 255, 0.5)' : '#64748B'} style={{ marginRight: 12 }} />
                                <TextInput
                                    placeholder="Enter your email or phone"
                                    placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.4)' : '#94A3B8'}
                                    value={formData.email}
                                    onChangeText={(email: string) => setFormData(prev => ({ ...prev, email }))}
                                    style={[styles.input, { color: colors.text }]}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </View>
                        </View>

                        {/* Password Input */}
                        <View style={styles.inputField}>
                            <ThemedText style={[styles.label, isDark && { color: '#E2E8F0' }]}>PASSWORD <ThemedText style={styles.required}>*</ThemedText></ThemedText>
                            <View style={[styles.inputBox, {
                                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F8FAFC',
                                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0'
                            }]}>
                                <Ionicons name="lock-closed-outline" size={20} color={isDark ? 'rgba(255, 255, 255, 0.5)' : '#64748B'} style={{ marginRight: 12 }} />
                                <TextInput
                                    placeholder="Enter your password"
                                    placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.4)' : '#94A3B8'}
                                    value={formData.password}
                                    onChangeText={(password: string) => setFormData(prev => ({ ...prev, password }))}
                                    style={[styles.input, { color: colors.text }]}
                                    secureTextEntry={!formData.showPassword}
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

                        {/* Remember & Forgot */}
                        <View style={styles.optionsRow}>
                            <TouchableOpacity
                                style={styles.rememberMe}
                                onPress={() => setFormData(prev => ({ ...prev, rememberMe: !prev.rememberMe }))}
                            >
                                <Ionicons
                                    name={formData.rememberMe ? 'checkbox' : 'square-outline'}
                                    size={20}
                                    color={formData.rememberMe ? '#004030' : (isDark ? 'rgba(255, 255, 255, 0.5)' : '#64748B')}
                                />
                                <ThemedText style={[styles.optionText, { color: colors.text }]}>Remember me</ThemedText>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password' as any)}>
                                <ThemedText style={[styles.forgotText, { color: isDark ? '#FFFFFF' : '#004030' }]}>
                                    Forgot Password?
                                </ThemedText>
                            </TouchableOpacity>
                        </View>

                        {/* Login Button */}
                        <TouchableOpacity
                            style={[styles.loginButton, { backgroundColor: '#004030' }]}
                            onPress={handleLogin}
                            disabled={formData.loading}
                        >
                            {formData.loading ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <ThemedText style={styles.loginButtonText}>Log In</ThemedText>
                            )}
                        </TouchableOpacity>

                        {/* Footer */}
                        <View style={styles.footer}>
                            <ThemedText style={[styles.footerText, { color: isDark ? 'rgba(255, 255, 255, 0.6)' : '#64748B' }]}>
                                Don't have an account?{' '}
                            </ThemedText>
                            <TouchableOpacity onPress={() => router.push('/(auth)/register' as any)}>
                                <ThemedText style={[styles.footerLink, { color: isDark ? '#FFFFFF' : '#004030' }]}>Sign Up</ThemedText>
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
    headerContent: {
        paddingHorizontal: 22,
        paddingTop: 38,
    },
    headerTitle: {
        fontSize: 28, // Reduced from 32
        fontWeight: '800',
        color: '#FFFFFF',
        lineHeight: 40,
        marginBottom: 4,
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
        fontSize: 14,
        fontWeight: '500',
    },
    forgotText: {
        fontSize: 14,
        fontWeight: '600',
    },
    loginButton: {
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
    loginButtonText: {
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
