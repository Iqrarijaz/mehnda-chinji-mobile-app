import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { sendOtp, verifyOtp } from '@/apis/login/forgot-password';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
import { LoaderOverlay } from '@/components/common/LoaderOverlay';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/context/ThemeContext';
import { analyticsService, AnalyticsEvents } from '@/analytics';
import { SubmitButton } from '@/components/common/SubmitButton';

export default function VerifyOtpScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const insets = useSafeAreaInsets();
    const { theme, isDark } = useTheme();
    const colors = Colors[theme];

    const email = params.email as string || '';
    const name = params.name as string || '';
    const profileImage = params.profileImage as string || '';

    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [timer, setTimer] = useState(120);
    const inputRefs = useRef<Array<TextInput | null>>([]);

    useEffect(() => {
        let interval: any;
        if (timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [timer]);

    const handleOtpChange = (value: string, index: number) => {
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto focus next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyPress = (e: any, index: number) => {
        if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleVerify = async () => {
        const otpString = otp.join('');
        if (otpString.length < 6) {
            Toast.show({
                type: 'error',
                text1: 'Required',
                text2: 'Please enter the 6-digit code'
            });
            return;
        }

        setLoading(true);
        try {
            await verifyOtp(email, otpString);
            Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'OTP verified successfully'
            });

            analyticsService.trackEvent(AnalyticsEvents.FORGOT_PASSWORD_VERIFIED, { email });


            router.push({
                pathname: '/(auth)/reset-password',
                params: { email, resetToken: otpString }
            } as any);

        } catch (error: any) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error.message || 'Invalid or expired OTP'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (timer > 0) return;

        setLoading(true);
        try {
            await sendOtp(email);
            setTimer(120);
            Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'New verification code sent'
            });
        } catch (error: any) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error.message || 'Failed to resend code'
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
            {/* Header */}
            <View style={{ backgroundColor: colors.background, zIndex: 1 }}>
                <View style={[styles.headerSection, { paddingTop: insets.top, backgroundColor: '#006666', zIndex: 1 }]}>
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
                        <ThemedText style={styles.headerTitle}>Verify Email</ThemedText>
                        <ThemedText style={styles.headerSubtitle}>
                            Please enter the 6-digit verification code
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
                {/* OTP Section */}
                <View style={styles.formContainer}>
                    <View style={[styles.formCard, { backgroundColor: colors.card }]}>

                        {/* Profile Preview */}
                        <View style={styles.profilePreview}>
                            {profileImage ? (
                                <Image
                                    source={{ uri: profileImage }}
                                    style={styles.profileAvatar}
                                    contentFit="cover"
                                    transition={200}
                                />
                            ) : (
                                <View style={[styles.profileAvatar, { backgroundColor: colors.primary + '20', justifyContent: 'center', alignItems: 'center' }]}>
                                    <Ionicons name="person" size={30} color={colors.primary} />
                                </View>
                            )}
                            <View style={styles.profileDetails}>
                                <ThemedText style={styles.profileName}>
                                    {name ? name.split(' ').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ') : ''}
                                </ThemedText>
                                <ThemedText style={styles.profileEmail}>{email}</ThemedText>
                            </View>
                        </View>

                        <ThemedText style={[styles.instructionText, { color: colors.text }]}>
                            A verification code has been sent to your email. Please check your inbox and enter the code below to continue.
                        </ThemedText>

                        <View style={styles.otpContainer}>
                            {otp.map((digit, index) => (
                                <TextInput
                                    key={index}
                                    allowFontScaling={false}
                                    ref={(ref) => { inputRefs.current[index] = ref; }}
                                    style={[
                                        styles.otpInput,
                                        {
                                            color: colors.text,
                                            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F1F5F9' }
                                    ]}
                                    value={digit}
                                    onChangeText={(value) => handleOtpChange(value, index)}
                                    onKeyPress={(e) => handleKeyPress(e, index)}
                                    keyboardType="number-pad"
                                    maxLength={1}
                                    editable={!loading}
                                />
                            ))}
                        </View>

                        <SubmitButton
                            title="Verify OTP"
                            onPress={handleVerify}
                            isLoading={loading}
                            style={{ width: '100%' }}
                        />

                        <View style={styles.footer}>
                            <ThemedText style={[styles.footerText, { color: isDark ? 'rgba(255, 255, 255, 0.6)' : '#64748B' }]}>
                                {timer > 0 ? `Resend code in ${timer}s` : "Didn't receive the code? "}
                            </ThemedText>
                            {timer === 0 && (
                                <TouchableOpacity onPress={handleResend}>
                                    <ThemedText style={[styles.footerLink, { color: colors.primary }]}>Resend</ThemedText>
                                </TouchableOpacity>
                            )}
                        </View>

                        <View style={[styles.footer, { marginTop: 15 }]}>
                            <ThemedText style={[styles.footerText, { color: isDark ? 'rgba(255, 255, 255, 0.6)' : '#64748B' }]}>
                                Back to{' '}
                            </ThemedText>
                            <TouchableOpacity onPress={() => router.replace('/(auth)/login' as any)}>
                                <ThemedText style={[styles.footerLink, { color: colors.primary }]}>Login</ThemedText>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </ScrollView>
            <LoaderOverlay visible={loading} text="Please wait..." />
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1 },
    headerSection: {
        paddingBottom: 8,
        borderBottomLeftRadius: Layout.headerBorderRadius,
        borderBottomRightRadius: Layout.headerBorderRadius },
    backButton: {
        marginLeft: 22,
        marginTop: 18,
        marginBottom: 8,
        width: 40,
        height: 40,
        borderRadius: Layout.borderRadius,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center' },
    headerContent: {
        paddingHorizontal: 18,
        paddingBottom: 15 },
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
        paddingTop: 26 },
    formCard: {
        borderRadius: Layout.borderRadius,
        padding: 13 },
    otpContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 10,
        marginBottom: 30 },
    otpInput: {
        width: 40,
        height: 40,
        borderRadius: Layout.borderRadius,
        textAlign: 'center',
        fontSize: 20.5,
        fontWeight: '800',
        padding: 4 },
    profilePreview: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        padding: 10,
        borderRadius: Layout.borderRadius,
        backgroundColor: 'rgba(0, 64, 48, 0.05)' },
    profileAvatar: {
        width: 50,
        height: 50,
        borderRadius: Layout.borderRadius,
        marginRight: 15 },
    profileDetails: {
        flex: 1 },
    profileName: {
        fontSize: 12.5,
        fontWeight: '800',
        color: '#006666',
        marginBottom: 2 },
    profileEmail: {
        fontSize: 10,
        opacity: 0.6 },
    instructionText: {
        fontSize: 10.5,
        lineHeight: 18,
        textAlign: 'center',
        marginBottom: 25,
        paddingHorizontal: 8,
        opacity: 0.8 },
    submitButton: {
        height: 52,
        borderRadius: Layout.borderRadius,
        justifyContent: 'center',
        alignItems: 'center' },
    submitButtonText: {
        color: '#FFFFFF',
        fontSize: 10.5,
        fontWeight: '700',
        letterSpacing: 0.5 },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 25 },
    footerText: {
        fontSize: 10.5,
        fontWeight: '500' },
    footerLink: {
        fontSize: 10.5,
        fontWeight: '700' } });
