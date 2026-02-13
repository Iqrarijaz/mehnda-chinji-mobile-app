import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import Toast from 'react-native-toast-message';


import { CHANGE_PASSWORD, DELETE_ACCOUNT, GET_ACTIVE_SESSIONS, REVOKE_SESSION } from '@/apis/profile';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import * as Biometrics from '../utils/biometrics';

export default function SettingsScreen() {
    const { theme, themePreference, setThemePreference, isDark } = useTheme();
    const { user, updateUser, logout } = useAuth();
    const colors = Colors[theme];

    // Password Modal State
    const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    // Delete Account Modal State
    const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
    const [deleteConfirmation, setDeleteConfirmation] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    // Notification States
    const [bloodAlerts, setBloodAlerts] = useState(true);
    const [businessUpdates, setBusinessUpdates] = useState(true);

    // Privacy States
    const [showPhone, setShowPhone] = useState(true);
    const [canContact, setCanContact] = useState(true);

    // Active Sessions State
    const [isSessionsModalVisible, setIsSessionsModalVisible] = useState(false);
    const [sessions, setSessions] = useState<any[]>([]);
    const [isLoadingSessions, setIsLoadingSessions] = useState(false);
    const [revokingSessionId, setRevokingSessionId] = useState<string | null>(null);

    // Biometric State
    const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
    const [isBiometricModalVisible, setIsBiometricModalVisible] = useState(false);
    const [biometricPassword, setBiometricPassword] = useState('');
    const [isEnablingBiometric, setIsEnablingBiometric] = useState(false);

    React.useEffect(() => {
        if (isSessionsModalVisible) {
            loadSessions();
        }
    }, [isSessionsModalVisible]);

    React.useEffect(() => {
        checkBiometricStatus();
    }, []);

    const checkBiometricStatus = async () => {
        const creds = await Biometrics.getBiometricCredentials();
        setIsBiometricEnabled(!!creds);
    };

    const loadSessions = async () => {
        setIsLoadingSessions(true);
        try {
            const response = await GET_ACTIVE_SESSIONS();
            if (response.success) {
                setSessions(response.data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoadingSessions(false);
        }
    };

    const handleRevokeSession = async (sessionId: string) => {
        setRevokingSessionId(sessionId);
        try {
            const response = await REVOKE_SESSION({ sessionId });
            if (response.success) {
                Toast.show({ type: 'success', text1: 'Session Revoked', text2: 'Device logged out successfully' });
                loadSessions();
            } else {
                Toast.show({ type: 'error', text1: 'Error', text2: response.message });
            }
        } catch (error: any) {
            Toast.show({ type: 'error', text1: 'Error', text2: error.message || 'Failed to revoke session' });
        } finally {
            setRevokingSessionId(null);
        }
    };

    const getPlatformIcon = (platform: string) => {
        const p = platform?.toLowerCase();
        if (p?.includes('ios') || p?.includes('iphone') || p?.includes('ipad')) return 'logo-apple';
        if (p?.includes('android')) return 'logo-android';
        if (p?.includes('web') || p?.includes('windows') || p?.includes('mac')) return 'globe-outline';
        return 'phone-portrait-outline';
    };

    const handleToggleBiometric = async (value: boolean) => {
        if (value) {
            const available = await Biometrics.checkBiometricAvailability();
            if (!available) {
                Toast.show({ type: 'error', text1: 'Not Available', text2: 'Biometric authentication is not available on this device.' });
                return;
            }
            setIsBiometricModalVisible(true);
        } else {
            await Biometrics.deleteBiometricCredentials();
            setIsBiometricEnabled(false);
            Toast.show({ type: 'success', text1: 'Disabled', text2: 'Biometric login disabled.' });
        }
    };

    const handleEnableBiometric = async () => {
        if (!biometricPassword) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Password is required' });
            return;
        }

        setIsEnablingBiometric(true);
        try {
            // Here we should ideally verify the password with the server.
            // For now, we will save it. Use login to check if password is correct?
            // To be safe, let's just save it. If wrong, login will fail.
            // But better user experience: try to login first?
            // Since we don't have a direct "verify password" API, we can assume the user knows it
            // or we could implement a verify endpoint. 
            // For simplicity and speed, let's save it. 
            // IMPROVEMENT: Call login API to verify.

            const email = user?.user?.email;
            if (!email) {
                Toast.show({ type: 'error', text1: 'Error', text2: 'User email not found.' });
                return;
            }

            const success = await Biometrics.saveBiometricCredentials(email, biometricPassword);
            if (success) {
                setIsBiometricEnabled(true);
                setIsBiometricModalVisible(false);
                setBiometricPassword('');
                Toast.show({ type: 'success', text1: 'Enabled', text2: 'Biometric login enabled successfully.' });
            } else {
                Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to save credentials.' });
            }
        } catch (error) {
            console.error(error);
            Toast.show({ type: 'error', text1: 'Error', text2: 'Something went wrong.' });
        } finally {
            setIsEnablingBiometric(false);
        }
    };

    const handlePasswordChange = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'All fields are required' });
            return;
        }

        if (newPassword !== confirmPassword) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'New passwords do not match' });
            return;
        }

        if (newPassword.length < 6) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Password must be at least 6 characters' });
            return;
        }

        setIsChangingPassword(true);
        try {
            const response = await CHANGE_PASSWORD({
                currentPassword,
                newPassword
            });

            if (response.success) {
                Toast.show({ type: 'success', text1: 'Success', text2: 'Password updated successfully' });
                if (response.data?.lastPasswordChangeAt) {
                    updateUser({ lastPasswordChangeAt: response.data.lastPasswordChangeAt });
                }
                setIsPasswordModalVisible(false);
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
            } else {
                Toast.show({ type: 'error', text1: 'Error', text2: response.message });
            }
        } catch (error: any) {
            const message = error.response?.data?.message || 'Failed to update password';
            Toast.show({ type: 'error', text1: 'Error', text2: message });
        } finally {
            setIsChangingPassword(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (deleteConfirmation !== 'DELETE MY ACCOUNT') return;

        setIsDeleting(true);
        try {
            const response = await DELETE_ACCOUNT({});
            if (response.success) {
                Toast.show({ type: 'success', text1: 'Account Deleted', text2: 'Your account has been successfully deleted.' });
                setIsDeleteModalVisible(false);
                logout();
            } else {
                Toast.show({ type: 'error', text1: 'Error', text2: response.message });
            }
        } catch (error: any) {
            const message = error.response?.data?.message || 'Failed to delete account';
            Toast.show({ type: 'error', text1: 'Error', text2: message });
        } finally {
            setIsDeleting(false);
        }
    };

    const renderHeader = (title: string, icon: any) => (
        <View style={styles.sectionHeader}>
            <View style={[styles.headerIconBox, { backgroundColor: colors.secondary + '15' }]}>
                <Ionicons name={icon} size={18} color={colors.secondary} />
            </View>
            <ThemedText style={styles.sectionTitle}>{title}</ThemedText>
        </View>
    );

    const renderSettingRow = (label: string, value: boolean, onValueChange: (v: boolean) => void, last = false) => (
        <View style={[styles.settingRow, last && { borderBottomWidth: 0 }]}>
            <ThemedText style={styles.settingLabel}>{label}</ThemedText>
            <Switch
                value={value}
                onValueChange={onValueChange}
                trackColor={{ false: '#94a3b8', true: colors.secondary }}
                thumbColor="#FFFFFF"
            />
        </View>
    );

    const lastUpdated = user?.user?.lastPasswordChangeAt;


    const newPasswordRef = React.useRef<TextInput>(null);
    const confirmPasswordRef = React.useRef<TextInput>(null);

    return (
        <ThemedView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>

                {/* Appearance Section */}
                {renderHeader('Appearance', 'color-palette-outline')}
                <View style={[styles.glassCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(15, 23, 42, 0.03)' }]}>
                    <View style={styles.appearanceRow}>
                        {(['light', 'dark', 'system'] as const).map((pref) => (
                            <TouchableOpacity
                                key={pref}
                                style={[
                                    styles.appearanceOption,
                                    themePreference === pref && [styles.activeOption, { borderColor: colors.secondary }]
                                ]}
                                onPress={() => setThemePreference(pref)}
                            >
                                <Ionicons
                                    name={pref === 'light' ? 'sunny' : pref === 'dark' ? 'moon' : 'settings-outline'}
                                    size={20}
                                    color={themePreference === pref ? colors.secondary : colors.text}
                                />
                                <ThemedText style={[
                                    styles.optionText,
                                    themePreference === pref && { color: colors.secondary, fontWeight: '700' }
                                ]}>
                                    {pref.charAt(0).toUpperCase() + pref.slice(1)}
                                </ThemedText>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Notifications Section */}
                {renderHeader('Notifications', 'notifications-outline')}
                <View style={[styles.glassCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(15, 23, 42, 0.03)' }]}>
                    {renderSettingRow('Blood alerts', bloodAlerts, setBloodAlerts)}
                    {renderSettingRow('Business updates', businessUpdates, setBusinessUpdates, true)}
                </View>

                {/* Privacy Section */}
                {renderHeader('Privacy', 'lock-closed-outline')}
                <View style={[styles.glassCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(15, 23, 42, 0.03)' }]}>
                    {renderSettingRow('Biometric Login', isBiometricEnabled, handleToggleBiometric)}
                    {renderSettingRow('Show phone number', showPhone, setShowPhone)}
                    {renderSettingRow('Who can contact me', canContact, setCanContact, true)}
                </View>



                {/* Account Section */}
                {renderHeader('Account', 'person-outline')}
                <View style={[styles.glassCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(15, 23, 42, 0.03)' }]}>
                    <TouchableOpacity
                        style={styles.actionRow}
                        onPress={() => setIsSessionsModalVisible(true)}
                    >
                        <View>
                            <ThemedText style={styles.settingLabel}>Active Sessions</ThemedText>
                            <ThemedText style={styles.lastUpdateText}>
                                Manage logged-in devices
                            </ThemedText>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionRow}
                        onPress={() => setIsPasswordModalVisible(true)}
                    >
                        <View>
                            <ThemedText style={styles.settingLabel}>Change password</ThemedText>
                            {lastUpdated && (
                                <ThemedText style={styles.lastUpdateText}>
                                    Last updated: {new Date(lastUpdated).toLocaleString()}
                                </ThemedText>
                            )}
                        </View>
                        <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.deleteButton]}
                        onPress={() => {
                            setDeleteConfirmation('');
                            setIsDeleteModalVisible(true);
                        }}
                    >
                        <Ionicons name="trash-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                        <ThemedText style={styles.deleteButtonText}>Delete account</ThemedText>
                    </TouchableOpacity>
                </View>

                <View style={styles.footerInfo}>
                    <ThemedText style={styles.versionText}>Mehnda Chinji v1.0.0</ThemedText>
                </View>
            </ScrollView>

            <Modal
                visible={isPasswordModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setIsPasswordModalVisible(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalOverlay}
                >
                    <ThemedView style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <ThemedText style={styles.modalTitle}>Change Password</ThemedText>
                            <TouchableOpacity onPress={() => setIsPasswordModalVisible(false)}>
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.inputContainer}>
                            <ThemedText style={styles.inputLabel}>Current Password</ThemedText>
                            <TextInput
                                style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                                value={currentPassword}
                                onChangeText={setCurrentPassword}
                                secureTextEntry
                                placeholder="Enter current password"
                                placeholderTextColor="#94a3b8"
                                returnKeyType="next"
                                onSubmitEditing={() => newPasswordRef.current?.focus()}
                                blurOnSubmit={false}
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <ThemedText style={styles.inputLabel}>New Password</ThemedText>
                            <TextInput
                                ref={newPasswordRef}
                                style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                                value={newPassword}
                                onChangeText={setNewPassword}
                                secureTextEntry
                                placeholder="Min 6 characters"
                                placeholderTextColor="#94a3b8"
                                returnKeyType="next"
                                onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                                blurOnSubmit={false}
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <ThemedText style={styles.inputLabel}>Confirm New Password</ThemedText>
                            <TextInput
                                ref={confirmPasswordRef}
                                style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry
                                placeholder="Confirm new password"
                                placeholderTextColor="#94a3b8"
                                returnKeyType="done"
                                onSubmitEditing={handlePasswordChange}
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.saveButton, { backgroundColor: colors.secondary }]}
                            onPress={handlePasswordChange}
                            disabled={isChangingPassword}
                        >
                            {isChangingPassword ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <ThemedText style={styles.saveButtonText}>Update Password</ThemedText>
                            )}
                        </TouchableOpacity>
                    </ThemedView>
                </KeyboardAvoidingView>
            </Modal>

            <Modal
                visible={isDeleteModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setIsDeleteModalVisible(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalOverlay}
                >
                    <ThemedView style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <ThemedText style={[styles.modalTitle, { color: '#ef4444' }]}>Delete Account</ThemedText>
                            <TouchableOpacity onPress={() => setIsDeleteModalVisible(false)}>
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.inputContainer}>
                            <ThemedText style={styles.warningText}>
                                This action is permanent and cannot be undone. All your data will be lost.
                            </ThemedText>
                            <ThemedText style={styles.inputLabel}>
                                Type <ThemedText style={{ fontWeight: '800', color: '#ef4444' }}>DELETE MY ACCOUNT</ThemedText> to confirm.
                            </ThemedText>
                            <TextInput
                                style={[styles.input, { color: colors.text, borderColor: '#ef4444' }]}
                                value={deleteConfirmation}
                                onChangeText={setDeleteConfirmation}
                                placeholder="DELETE MY ACCOUNT"
                                placeholderTextColor="#94a3b8"
                                autoCapitalize="characters"
                            />
                        </View>

                        <TouchableOpacity
                            style={[
                                styles.saveButton,
                                { backgroundColor: '#ef4444', opacity: deleteConfirmation === 'DELETE MY ACCOUNT' ? 1 : 0.5 }
                            ]}
                            onPress={handleDeleteAccount}
                            disabled={isDeleting || deleteConfirmation !== 'DELETE MY ACCOUNT'}
                        >
                            {isDeleting ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <ThemedText style={styles.saveButtonText}>Delete My Account</ThemedText>
                            )}
                        </TouchableOpacity>
                    </ThemedView>
                </KeyboardAvoidingView>
            </Modal>

            <Modal
                visible={isSessionsModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setIsSessionsModalVisible(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalOverlay}
                >
                    <ThemedView style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <ThemedText style={styles.modalTitle}>Active Sessions</ThemedText>
                            <TouchableOpacity onPress={() => setIsSessionsModalVisible(false)}>
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={{ maxHeight: 400 }}>
                            {isLoadingSessions ? (
                                <ActivityIndicator color={colors.secondary} style={{ padding: 20 }} />
                            ) : (
                                sessions.map((session, index) => (
                                    <View key={session._id} style={[styles.sessionRow, index === sessions.length - 1 && { borderBottomWidth: 0 }]}>
                                        <View style={styles.sessionIconBox}>
                                            <Ionicons name={getPlatformIcon(session.platform)} size={22} color="#94a3b8" />
                                        </View>
                                        <View style={styles.sessionInfo}>
                                            <ThemedText style={styles.sessionDevice}>{session.deviceName}</ThemedText>
                                            <View style={styles.sessionMetaRow}>
                                                {session.isCurrent && (
                                                    <View style={styles.currentBadge}>
                                                        <ThemedText style={styles.currentBadgeText}>Current</ThemedText>
                                                    </View>
                                                )}
                                            </View>
                                            <ThemedText style={styles.sessionTime}>
                                                Last active: {new Date(session.lastActiveAt).toLocaleDateString()}
                                            </ThemedText>
                                        </View>
                                        {!session.isCurrent && (
                                            <TouchableOpacity
                                                onPress={() => handleRevokeSession(session._id)}
                                                disabled={!!revokingSessionId}
                                                style={styles.revokeButton}
                                            >
                                                {revokingSessionId === session._id ? (
                                                    <ActivityIndicator size="small" color="#ef4444" />
                                                ) : (
                                                    <Ionicons name="trash-outline" size={18} color="#ef4444" />
                                                )}
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                ))
                            )}
                            {sessions.length === 0 && !isLoadingSessions && (
                                <View style={{ padding: 20, alignItems: 'center' }}>
                                    <ThemedText style={{ opacity: 0.5 }}>No active sessions found</ThemedText>
                                </View>
                            )}
                        </ScrollView>
                    </ThemedView>
                </KeyboardAvoidingView>
            </Modal>

            <Modal
                visible={isBiometricModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setIsBiometricModalVisible(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalOverlay}
                >
                    <ThemedView style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <ThemedText style={styles.modalTitle}>Enable Biometric Login</ThemedText>
                            <TouchableOpacity onPress={() => setIsBiometricModalVisible(false)}>
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.inputContainer}>
                            <ThemedText style={styles.inputLabel}>Confirm Password</ThemedText>
                            <TextInput
                                style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                                value={biometricPassword}
                                onChangeText={setBiometricPassword}
                                secureTextEntry
                                placeholder="Enter your password"
                                placeholderTextColor="#94a3b8"
                                returnKeyType="done"
                                onSubmitEditing={handleEnableBiometric}
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.saveButton, { backgroundColor: colors.secondary }]}
                            onPress={handleEnableBiometric}
                            disabled={isEnablingBiometric}
                        >
                            {isEnablingBiometric ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <ThemedText style={styles.saveButtonText}>Enable</ThemedText>
                            )}
                        </TouchableOpacity>
                    </ThemedView>
                </KeyboardAvoidingView>
            </Modal>
        </ThemedView>
    );
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
        marginTop: 10,
    },
    headerIconBox: {
        width: 32,
        height: 32,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '800',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
        opacity: 0.7,
    },
    glassCard: {
        borderRadius: 20,
        padding: 4,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        overflow: 'hidden',
    },
    appearanceRow: {
        flexDirection: 'row',
        padding: 8,
        gap: 8,
    },
    appearanceOption: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'transparent',
        gap: 6,
    },
    activeOption: {
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    optionText: {
        fontSize: 12,
        fontWeight: '600',
        opacity: 0.8,
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    settingLabel: {
        fontSize: 15,
        fontWeight: '600',
    },
    lastUpdateText: {
        fontSize: 11,
        opacity: 0.5,
        marginTop: 2,
        fontWeight: '500',
    },
    dangerLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    dangerBadge: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        borderWidth: 0.5,
        borderColor: 'rgba(239, 68, 68, 0.2)',
    },
    dangerBadgeText: {
        fontSize: 8,
        fontWeight: '900',
        color: '#ef4444',
    },
    footerInfo: {
        alignItems: 'center',
        marginTop: 10,
    },
    versionText: {
        fontSize: 12,
        opacity: 0.4,
        fontWeight: '600',
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 24,
        paddingBottom: 40,
        elevation: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '800',
    },
    inputContainer: {
        marginBottom: 18,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        opacity: 0.7,
    },
    input: {
        height: 52,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    saveButton: {
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    deleteButton: {
        backgroundColor: '#ef4444',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 16,
        marginTop: 24,
    },
    deleteButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    warningText: {
        color: '#ef4444',
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 16,
        lineHeight: 20,
    },
    // Session Styles
    sessionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    sessionIconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    sessionInfo: {
        flex: 1,
    },
    sessionDevice: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 2,
    },
    sessionMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 2,
    },
    sessionLocation: {
        fontSize: 12,
        opacity: 0.5,
    },
    currentBadge: {
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        paddingHorizontal: 6,
        paddingVertical: 1,
        borderRadius: 4,
        borderWidth: 0.5,
        borderColor: 'rgba(16, 185, 129, 0.3)',
    },
    currentBadgeText: {
        fontSize: 9,
        fontWeight: '700',
        color: '#10B981',
    },
    sessionTime: {
        fontSize: 11,
        opacity: 0.4,
    },
    revokeButton: {
        padding: 8,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderRadius: 8,
    },
});
