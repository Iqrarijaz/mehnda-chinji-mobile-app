import { Ionicons } from '@expo/vector-icons';
import Animated, {
    FadeIn,
    SlideInLeft,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Platform,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Toast from 'react-native-toast-message';

import { PremiumModal } from '../common/PremiumModal';
import { changePassword } from '@/apis/profile';
import { ThemedText } from '@/components/themedText';
import { useAuth } from '@/context/AuthContext';

const PRIMARY = '#006666';

// ── Password strength ─────────────────────────────────────────────────────────
function getStrength(pw: string): { level: number; label: string; color: string } {
    if (!pw) return { level: 0, label: '', color: '#E2E8F0' };
    let score = 0;
    if (pw.length >= 6) score++;
    if (pw.length >= 10) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    if (score <= 1) return { level: 0.25, label: 'Weak', color: '#EF4444' };
    if (score <= 2) return { level: 0.5, label: 'Fair', color: '#F59E0B' };
    if (score <= 3) return { level: 0.75, label: 'Good', color: '#3B82F6' };
    return { level: 1, label: 'Strong', color: PRIMARY };
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
    const [focused, setFocused] = useState(false);
    const [secure, setSecure] = useState(true);
    const borderColor = useSharedValue(0);

    const wrapStyle = useAnimatedStyle(() => ({
        borderColor: withTiming(
            borderColor.value === 1 ? PRIMARY : '#E2E8F0',
            { duration: 200 }
        ),
        shadowOpacity: withTiming(borderColor.value === 1 ? 0.08 : 0.03, { duration: 200 }),
    }));

    const onFocus = useCallback(() => { setFocused(true); borderColor.value = 1; }, []);
    const onBlur = useCallback(() => { setFocused(false); borderColor.value = 0; }, []);

    return (
        <Animated.View entering={SlideInLeft.delay(delay).duration(350)} style={styles.fieldWrap}>
            <ThemedText style={styles.label}>{label}</ThemedText>
            <Animated.View style={[styles.inputRow, wrapStyle]}>
                <Ionicons
                    name="lock-closed-outline"
                    size={18}
                    color={focused ? PRIMARY : '#94A3B8'}
                    style={styles.inputIcon}
                />
                <TextInput
                    ref={inputRef}
                    style={styles.input}
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    placeholderTextColor="#CBD5E1"
                    secureTextEntry={secure}
                    returnKeyType={returnKeyType}
                    onSubmitEditing={onSubmit}
                    onFocus={onFocus}
                    onBlur={onBlur}
                    blurOnSubmit={returnKeyType === 'done'}
                    autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setSecure(s => !s)} style={styles.eyeBtn} activeOpacity={0.7}>
                    <Ionicons name={secure ? 'eye-off-outline' : 'eye-outline'} size={18} color="#94A3B8" />
                </TouchableOpacity>
            </Animated.View>
        </Animated.View>
    );
});

// ── Strength Bar ──────────────────────────────────────────────────────────────
const StrengthBar = React.memo(({ password }: { password: string }) => {
    const { level, label, color } = getStrength(password);
    const barWidth = useSharedValue(0);
    barWidth.value = withTiming(level, { duration: 400 });
    const barStyle = useAnimatedStyle(() => ({
        width: `${barWidth.value * 100}%`,
        backgroundColor: color,
    }));

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
    const { updateUser } = useAuth();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const newRef = useRef<TextInput>(null);
    const confirmRef = useRef<TextInput>(null);

    const btnScale = useSharedValue(1);
    const btnStyle = useAnimatedStyle(() => ({ transform: [{ scale: btnScale.value }] }));
    const onPressIn = useCallback(() => { btnScale.value = withSpring(0.97, { damping: 15 }); }, []);
    const onPressOut = useCallback(() => { btnScale.value = withSpring(1, { damping: 12 }); }, []);

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
        <PremiumModal visible={visible} onClose={resetAndClose}>
            <View style={styles.handle} />

            <Animated.View entering={SlideInLeft.delay(60).duration(350)} style={styles.header}>
                <View>
                    <ThemedText style={styles.title}>Change Password</ThemedText>
                    <ThemedText style={styles.subtitle}>Update your account security</ThemedText>
                </View>
                <TouchableOpacity style={styles.closeBtn} onPress={resetAndClose} activeOpacity={0.7}>
                    <Ionicons name="close" size={18} color="#64748B" />
                </TouchableOpacity>
            </Animated.View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: 20 }}
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
                <Animated.View
                    entering={SlideInLeft.delay(280).duration(350)}
                    style={styles.actions}
                >
                    <Animated.View style={btnStyle}>
                        <TouchableOpacity
                            onPress={handleSubmit}
                            onPressIn={onPressIn}
                            onPressOut={onPressOut}
                            disabled={isLoading || !canSubmit}
                            activeOpacity={1}
                            style={[styles.primaryBtn, (!canSubmit || isLoading) && styles.primaryBtnDisabled]}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <ThemedText style={styles.primaryBtnText}>Update Password</ThemedText>
                            )}
                        </TouchableOpacity>
                    </Animated.View>

                    <TouchableOpacity onPress={resetAndClose} style={styles.cancelBtn} activeOpacity={0.7}>
                        <ThemedText style={styles.cancelText}>Cancel</ThemedText>
                    </TouchableOpacity>
                </Animated.View>
            </ScrollView>
        </PremiumModal>
    );
});

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'transparent',
        justifyContent: 'flex-end',
    },
    sheet: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingTop: 12,
        paddingHorizontal: 20,
        paddingBottom: Platform.OS === 'ios' ? 36 : 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -6 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
    },
    handle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#E2E8F0',
        alignSelf: 'center',
        marginBottom: 20,
    },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    title: {
        fontSize: Platform.OS === 'android' ? 18 : 20,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 3,
    },
    subtitle: {
        fontSize: 13,
        color: '#94A3B8',
        fontWeight: '500',
    },
    closeBtn: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Input
    fieldWrap: { marginBottom: 14 },
    label: {
        fontSize: 10,
        fontWeight: '700',
        color: '#94A3B8',
        letterSpacing: 0.8,
        marginBottom: 7,
        marginLeft: 2,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        paddingHorizontal: 14,
        height: 52,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 6,
    },
    inputIcon: { marginRight: 10 },
    input: {
        flex: 1,
        fontSize: Platform.OS === 'android' ? 14 : 15,
        fontWeight: '500',
        color: '#0F172A',
    },
    eyeBtn: { padding: 4 },

    // Strength bar
    strengthWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginTop: -6,
        marginBottom: 14,
        marginHorizontal: 2,
    },
    strengthTrack: {
        flex: 1,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#E2E8F0',
        overflow: 'hidden',
    },
    strengthFill: {
        height: '100%',
        borderRadius: 2,
    },
    strengthLabel: {
        fontSize: 11,
        fontWeight: '700',
        width: 44,
    },

    // Mismatch
    mismatch: {
        fontSize: 12,
        color: '#EF4444',
        fontWeight: '600',
        marginTop: -8,
        marginBottom: 10,
        marginLeft: 4,
    },

    // Buttons
    actions: { marginTop: 8, gap: 10 },
    primaryBtn: {
        backgroundColor: PRIMARY,
        height: 52,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: PRIMARY,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    primaryBtnDisabled: { opacity: 0.45 },
    primaryBtnText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
    cancelBtn: {
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelText: {
        fontSize: 14,
        color: '#94A3B8',
        fontWeight: '600',
    },
});
