import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
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
    });

    useEffect(() => {
        loadSavedEmail();
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

        setFormData(prev => ({ ...prev, loading: true }));

        try {
            const response = await LOGIN_API({
                email: formData.email,
                password: formData.password,
            });

            // Save or clear email for Remember Me
            if (formData.rememberMe) {
                await AsyncStorage.setItem('remember_email', formData.email);
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
            style={styles.container}
        >
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ flexGrow: 1 }}
                bounces={false}
            >
                {/* Header / Top Section */}
                <View style={[styles.headerSection, { paddingTop: insets.top }]}>
                    <LinearGradient
                        colors={['#1e293b', '#0F172A']}
                        style={StyleSheet.absoluteFill}
                    />
                    {/* Specular Edge Highlight */}
                    <LinearGradient
                        colors={['rgba(255, 255, 255, 0.2)', 'transparent']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                        style={styles.glassEdge}
                    />
                    <View style={styles.headerContent}>
                        <ThemedText style={styles.headerTitle}>Sign in to your{"\n"}Account</ThemedText>
                    </View>
                </View>

                {/* Bottom Section / Card Container */}
                <View style={styles.bottomSection}>
                    <View style={styles.card}>
                        {/* Card Specular Highlight */}
                        <LinearGradient
                            colors={['rgba(255, 255, 255, 0.15)', 'transparent']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 0, y: 1 }}
                            style={styles.cardGlassEdge}
                        />

                        {/* Google Login */}
                        <TouchableOpacity
                            style={styles.googleButton}
                            onPress={() => Alert.alert('Google Login', 'Implementation coming soon!')}
                        >
                            <Image
                                source={require('../../assets/icons/google.png')}
                                style={styles.googleIcon}
                            />
                            <ThemedText style={styles.googleButtonText}>
                                Continue with Google
                            </ThemedText>
                        </TouchableOpacity>

                        {/* Divider */}
                        <View style={styles.dividerContainer}>
                            <View style={styles.divider} />
                            <ThemedText style={styles.dividerText}>or</ThemedText>
                            <View style={styles.divider} />
                        </View>

                        {/* Form Fields */}
                        <View style={styles.formSection}>
                            <View style={[styles.inputGroup, { borderBottomColor: 'rgba(255, 255, 255, 0.1)' }]}>
                                <Ionicons name="mail-outline" size={20} color="rgba(255, 255, 255, 0.5)" style={{ marginRight: 12 }} />
                                <TextInput
                                    placeholder="Email"
                                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                                    value={formData.email}
                                    onChangeText={(email: string) => setFormData(prev => ({ ...prev, email }))}
                                    style={styles.input}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Ionicons name="lock-closed-outline" size={20} color="rgba(255, 255, 255, 0.5)" style={{ marginRight: 12 }} />
                                <TextInput
                                    placeholder="Password"
                                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                                    value={formData.password}
                                    onChangeText={(password: string) => setFormData(prev => ({ ...prev, password }))}
                                    style={styles.input}
                                    secureTextEntry={!formData.showPassword}
                                />
                                <TouchableOpacity
                                    onPress={() => setFormData(prev => ({ ...prev, showPassword: !prev.showPassword }))}
                                >
                                    <Ionicons
                                        name={formData.showPassword ? 'eye-outline' : 'eye-off-outline'}
                                        size={20}
                                        color="rgba(255, 255, 255, 0.5)"
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Rememeber & Forgot */}
                        <View style={styles.optionsRow}>
                            <TouchableOpacity
                                style={styles.rememberMe}
                                onPress={() => setFormData(prev => ({ ...prev, rememberMe: !prev.rememberMe }))}
                            >
                                <Ionicons
                                    name={formData.rememberMe ? 'checkbox' : 'square-outline'}
                                    size={18}
                                    color={formData.rememberMe ? '#FF9B51' : 'rgba(255, 255, 255, 0.5)'}
                                />
                                <ThemedText style={styles.optionText}>Remember me</ThemedText>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => Alert.alert('Forgot Password', 'Contact support for now.')}>
                                <ThemedText style={[styles.optionText, { color: '#FF9B51', fontWeight: '600' }]}>
                                    Forgot Password ?
                                </ThemedText>
                            </TouchableOpacity>
                        </View>

                        {/* Login Button */}
                        <TouchableOpacity
                            style={styles.loginButton}
                            onPress={handleLogin}
                            disabled={formData.loading}
                        >
                            <LinearGradient
                                colors={['#FF9B51', '#FF8E3D']}
                                style={StyleSheet.absoluteFill}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 0, y: 1 }}
                            />
                            {formData.loading ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <ThemedText style={styles.loginButtonText}>Log In</ThemedText>
                            )}
                        </TouchableOpacity>

                        {/* Footer */}
                        <View style={styles.footer}>
                            <ThemedText style={styles.footerText}>Don't have an account? </ThemedText>
                            <TouchableOpacity onPress={() => router.push('/(auth)/register' as any)}>
                                <ThemedText style={styles.footerLink}>Sign Up</ThemedText>
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
        backgroundColor: '#0F172A',
    },
    glassEdge: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 2,
        zIndex: 10,
    },
    headerSection: {
        height: '35%',
        minHeight: 280,
        width: '100%',
    },
    headerContent: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 30,
        zIndex: 1,
    },
    headerTitle: {
        fontSize: 36,
        fontWeight: '800',
        color: '#FFFFFF',
        lineHeight: 44,
        marginBottom: 12,
    },
    headerSubtitle: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.6)',
        lineHeight: 22,
    },
    bottomSection: {
        flex: 1,
        width: '100%',
        alignItems: 'center',
        backgroundColor: '#0F172A',
    },
    card: {
        width: '90%',
        maxWidth: 420,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 28,
        padding: 24,
        marginTop: -60, // Overlap effect
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        overflow: 'hidden',
    },
    cardGlassEdge: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 1.5,
    },
    googleButton: {
        flexDirection: 'row',
        height: 56,
        borderRadius: 28,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.15)',
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    googleIcon: {
        width: 24,
        height: 24,
    },
    googleButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 24,
    },
    divider: {
        flex: 1,
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    dividerText: {
        marginHorizontal: 16,
        color: 'rgba(255, 255, 255, 0.4)',
        fontSize: 14,
        fontWeight: '500',
    },
    formSection: {
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        overflow: 'hidden',
        marginBottom: 20,
    },
    inputGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 58,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: '#FFFFFF',
    },
    optionsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    rememberMe: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    optionText: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.5)',
    },
    loginButton: {
        height: 56,
        borderRadius: 18,
        backgroundColor: '#FF9B51',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        overflow: 'hidden',
        shadowColor: '#FF9B51',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    loginButtonText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '800',
        zIndex: 1,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 4,
    },
    footerText: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.5)',
    },
    footerLink: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FF9B51',
    },
});
