import { Ionicons } from '@expo/vector-icons';
import Animated, {
    Easing,
    FadeIn,
    SlideInLeft,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming } from 'react-native-reanimated';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Platform,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View } from 'react-native';
import Toast from 'react-native-toast-message';

import { PremiumModal } from '../common/PremiumModal';
import { FormInput } from '@/components/common/FormInput';
import { SubmitButton } from '@/components/common/SubmitButton';
import { changePassword } from '@/apis/profile';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Layout } from '@/constants/layout';

// PRIMARY will be used from colors.primary inside components

// ── Password strength ─────────────────────────────────────────────────────────
function getStrength(pw: string): { level: number; label: string; color: string } {
    if (!pw) return { level: 0, label: '', color: '#E2E8F0' };
    if (pw.length < 6) return { level: 0.25, label: 'Weak', color: '#EF4444' };
    if (pw.length < 8) return { level: 0.5, label: 'Fair', color: '#F59E0B' };
    if (pw.length < 10) return { level: 0.75, label: 'Good', color: '#3B82F6' };
    return { level: 1, label: 'Strong', color: '#006666' };
}

// ── Animated Input ────────────────────────────────────────────────────────────
interface InputFieldProps {
    label: string;
    value: string;
    onChangeText: (t: string) => void;
    placeholder: string;
    inputRef?: React.RefObject<TextInput | null>;
    onSubmit?: () => void;
    returnKeyType?: 'next' | 'done';
    delay?: number;
}

const InputField = React.memo(({
    label, value, onChangeText, placeholder, inputRef, onSubmit, returnKeyType = 'next', delay = 0
}: InputFieldProps) => {
    const [secure, setSecure] = useState(true);

    return (
        <FormInput
            label={label}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            secureTextEntry={secure}
            icon="lock-closed-outline"
            ref={inputRef}
            returnKeyType={returnKeyType}
            onSubmitEditing={onSubmit}
            blurOnSubmit={returnKeyType === 'done'}
            autoCapitalize="none"
            delay={delay}
            containerStyle={{ marginBottom: 16 }}
            rightAccessory={
                <TouchableOpacity onPress={() => setSecure(s => !s)} activeOpacity={0.7} style={{ padding: 4 }}>
                    <Ionicons name={secure ? 'eye-off-outline' : 'eye-outline'} size={18} color="#94A3B8" />
                </TouchableOpacity>
            }
        />
    );
});

// ── Strength Bar ──────────────────────────────────────────────────────────────
const StrengthBar = React.memo(({ password }: { password: string }) => {
    const { level, label, color } = getStrength(password);
    const barWidth = useSharedValue(0);
    barWidth.value = withTiming(level, { duration: 400 });
    const barStyle = useAnimatedStyle(() => ({
        width: `${barWidth.value * 100}%`,
        backgroundColor: color }));

    if (!password) return null;
    return (
        <Animated.View entering={FadeIn.duration(300)} style={styles.strengthWrap}>
            <View style={styles.strengthTrack}>
                <Animated.View style={[styles.strengthFill, barStyle]} />
            </View>
            <ThemedText style={[styles.strengthLabel, { color }]}>{label}</ThemedText>
        </Animated.View>
    );
});

// ── Modal ─────────────────────────────────────────────────────────────────────
interface PasswordModalProps {
    visible: boolean;
    onClose: () => void;
}

export const PasswordModal: React.FC<PasswordModalProps> = React.memo(({ visible, onClose }) => {
    const { theme } = useTheme();
    const { updateUser } = useAuth();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const newRef = useRef<TextInput>(null);
    const confirmRef = useRef<TextInput>(null);
    const resetAndClose = useCallback(() => {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        onClose();
    }, [onClose]);

    const handleSubmit = useCallback(async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            Toast.show({ type: 'error', text1: 'Required', text2: 'All fields are required' });
            return;
        }
        if (newPassword !== confirmPassword) {
            Toast.show({ type: 'error', text1: 'Mismatch', text2: 'New passwords do not match' });
            return;
        }
        if (newPassword.length < 6) {
            Toast.show({ type: 'error', text1: 'Too Short', text2: 'Password must be at least 6 characters' });
            return;
        }

        setIsLoading(true);
        try {
            const response = await changePassword({ currentPassword, newPassword }) as any;
            if (response.success) {
                Toast.show({ type: 'success', text1: 'Password Updated', text2: 'Your password has been changed' });
                if (response.data?.lastPasswordChangeAt) {
                    updateUser({ lastPasswordChangeAt: response.data.lastPasswordChangeAt });
                }
                resetAndClose();
            } else {
                Toast.show({ type: 'error', text1: 'Error', text2: response.message });
            }
        } catch (err: any) {
            Toast.show({ type: 'error', text1: 'Error', text2: err.response?.data?.message || 'Failed to update password' });
        } finally {
            setIsLoading(false);
        }
    }, [currentPassword, newPassword, confirmPassword, updateUser, resetAndClose]);

    const canSubmit = currentPassword.length > 0 && newPassword.length >= 6 && confirmPassword.length > 0;

    return (
        <PremiumModal visible={visible} onClose={resetAndClose} type="centered">

            <Animated.View entering={SlideInLeft.delay(60).duration(350)} style={styles.header}>
                <ThemedText style={styles.title}>Change Password</ThemedText>
            </Animated.View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: 12 }}
            >
                {/* Inputs */}
                <InputField
                    label="CURRENT PASSWORD"
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    placeholder="Enter current password"
                    onSubmit={() => newRef.current?.focus()}
                    delay={100}
                />

                <InputField
                    label="NEW PASSWORD"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="Min. 6 characters"
                    inputRef={newRef}
                    onSubmit={() => confirmRef.current?.focus()}
                    delay={160}
                />

                <StrengthBar password={newPassword} />

                <InputField
                    label="CONFIRM NEW PASSWORD"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Repeat new password"
                    inputRef={confirmRef}
                    onSubmit={handleSubmit}
                    returnKeyType="done"
                    delay={220}
                />

                {/* Confirm mismatch hint */}
                {confirmPassword.length > 0 && confirmPassword !== newPassword && (
                    <Animated.View entering={FadeIn.duration(250)}>
                        <ThemedText style={styles.mismatch}>Passwords don't match</ThemedText>
                    </Animated.View>
                )}

                {/* Buttons */}
                <View style={styles.actions}>
                    <View style={{ flex: 1 }}>
                        <SubmitButton
                            title="Update"
                            onPress={handleSubmit}
                            disabled={!canSubmit}
                            isLoading={isLoading}
                        />
                    </View>

                    <TouchableOpacity onPress={resetAndClose} style={styles.cancelBtn} activeOpacity={0.7}>
                        <ThemedText style={styles.cancelText}>Cancel</ThemedText>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </PremiumModal>
    );
});

const styles = StyleSheet.create({


    // Header
    header: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16 },
    title: {
        fontSize: 14,
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: 3 },
    subtitle: {
        fontSize: 11,
        fontWeight: '500' },
    closeBtn: {
        width: 30,
        height: 30,
        borderRadius: Layout.borderRadius,
        justifyContent: 'center',
        alignItems: 'center' },

    // Input
    fieldWrap: { marginBottom: 10 },
    label: {
        fontSize: 11,
        fontWeight: '700',
        color: '#94A3B8',
        letterSpacing: 0.8,
        marginBottom: 4,
        marginLeft: 2 },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: Layout.borderRadius, // Overridden in wrapStyle
        paddingHorizontal: 14,
        height: Platform.OS === 'android' ? 42 : 48 },
    inputIcon: { marginRight: 10 },
    input: {
        flex: 1,
        fontSize: 11,
        fontWeight: '500' },
    eyeBtn: { padding: 4 },

    // Strength bar
    strengthWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginTop: -6,
        marginBottom: 14,
        marginHorizontal: 2 },
    strengthTrack: {
        flex: 1,
        height: 4,
        borderRadius: Layout.borderRadius,
        backgroundColor: '#E2E8F0',
        overflow: 'hidden' },
    strengthFill: {
        height: '100%',
        borderRadius: Layout.borderRadius },
    strengthLabel: {
        fontSize: 11,
        fontWeight: '700',
        width: 42 },

    // Mismatch
    mismatch: {
        fontSize: 11,
        color: '#EF4444',
        fontWeight: '600',
        marginTop: -8,
        marginBottom: 10,
        marginLeft: 4 },

    // Buttons
    actions: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 12 },
    primaryBtn: {
        backgroundColor: '#006666',
        height: 40,
        borderRadius: Layout.borderRadius,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20 },
    primaryBtnDisabled: { opacity: 0.45 },
    primaryBtnText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600' },
    cancelBtn: {
        flex: 1,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: Layout.borderRadius,
        backgroundColor: 'transparent' },
    cancelText: {
        fontSize: 14,
        color: '#94A3B8',
        fontWeight: '600' } });
