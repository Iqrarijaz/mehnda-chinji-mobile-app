import { Ionicons } from '@expo/vector-icons';
import Animated, {
    Easing,
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
    const { theme } = useTheme();
    const colors = Colors[theme];
    const [focused, setFocused] = useState(false);
    const [secure, setSecure] = useState(true);
    const borderColor = useSharedValue(0);

    const wrapStyle = useAnimatedStyle(() => ({
        borderColor: withTiming(
            borderColor.value === 1 ? colors.primary : (theme === 'dark' ? 'rgba(255,255,255,0.1)' : '#E2E8F0'),
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
                    color={focused ? colors.primary : '#94A3B8'}
                    style={styles.inputIcon}
                />
                <TextInput
                    ref={inputRef}
                    style={[styles.input, { color: colors.text }]}
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    placeholderTextColor={theme === 'dark' ? 'rgba(255,255,255,0.3)' : '#CBD5E1'}
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
    const { theme } = useTheme();
    const colors = Colors[theme];
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
                    <Animated.View style={[btnStyle, { flex: 1 }]}>
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
                                <ThemedText style={styles.primaryBtnText}>Update</ThemedText>
                            )}
                        </TouchableOpacity>
                    </Animated.View>

                    <TouchableOpacity onPress={resetAndClose} style={[styles.cancelBtn, { borderColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : '#E2E8F0' }]} activeOpacity={0.7}>
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
        marginBottom: 16,
    },
    title: {
        fontSize: 14,
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: 3,
    },
    subtitle: {
        fontSize: 11,
        fontWeight: '500',
    },
    closeBtn: {
        width: 30,
        height: 30,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Input
    fieldWrap: { marginBottom: 10 },
    label: {
        fontSize: 11,
        fontWeight: '700',
        color: '#94A3B8',
        letterSpacing: 0.8,
        marginBottom: 4,
        marginLeft: 2,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: Layout.borderRadius,
        borderWidth: 1.5,
        borderColor: '#E2E8F0', // Overridden in wrapStyle
        paddingHorizontal: 14,
        height: Platform.OS === 'android' ? 44 : 48,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 6,
    },
    inputIcon: { marginRight: 10 },
    input: {
        flex: 1,
        fontSize: 11,
        fontWeight: '500',
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
        fontSize: 11,
        color: '#EF4444',
        fontWeight: '600',
        marginTop: -8,
        marginBottom: 10,
        marginLeft: 4,
    },

    // Buttons
    actions: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 12 },
    primaryBtn: {
        backgroundColor: '#006666', 
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    primaryBtnDisabled: { opacity: 0.45 },
    primaryBtnText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    cancelBtn: {
        flex: 1,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 20,
        backgroundColor: 'transparent',
    },
    cancelText: {
        fontSize: 14,
        color: '#94A3B8',
        fontWeight: '600',
    },
});
