import { CHANGE_PASSWORD, DELETE_ACCOUNT, GET_ACTIVE_SESSIONS, MANAGE_NOTIFICATIONS, REVOKE_SESSION } from '@/apis/profile';
import { CleanConfirmationModal } from '@/components/common/CleanConfirmationModal';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { DrawerActions } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Image,
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';


export default function SettingsScreen() {
    const { theme, themePreference, setThemePreference, isDark } = useTheme();
    const { user, updateUser, logout } = useAuth();
    const navigation = useNavigation();
    const colors = Colors[theme];

    const getProfileSource = () => {
        if (user?.user?.profileImage) {
            return { uri: user.user.profileImage };
        }
        const gender = user?.user?.gender?.toUpperCase();
        if (gender === 'FEMALE') {
            return require('../assets/icons/user-female.png');
        }
        return require('../assets/icons/user-male.png');
    };

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
    const [bloodAlerts, setBloodAlerts] = useState(user?.user?.notifications?.bloodRequest ?? true);
    const [businessUpdates, setBusinessUpdates] = useState(user?.user?.notifications?.business ?? true);
    const [notificationModalVisible, setNotificationModalVisible] = useState(false);
    const [pendingNotification, setPendingNotification] = useState<{ type: 'bloodRequest' | 'business', value: boolean } | null>(null);
    const [isUpdatingNotification, setIsUpdatingNotification] = useState(false);

    // Privacy States
    const [showPhone, setShowPhone] = useState(true);
    const [canContact, setCanContact] = useState(true);

    // Active Sessions State
    const [isSessionsModalVisible, setIsSessionsModalVisible] = useState(false);
    const queryClient = useQueryClient();

    const { data: sessionsData, isLoading: isLoadingSessions } = useQuery({
        queryKey: ['activeSessions'],
        queryFn: async () => {
            const response = await GET_ACTIVE_SESSIONS();
            if (response.success) return response.data;
            throw new Error(response.message || 'Failed to load sessions');
        },
        enabled: isSessionsModalVisible,
    });

    const sessions = sessionsData ?? [];

    const revokeSessionMutation = useMutation({
        mutationFn: async (sessionId: string) => {
            const response = await REVOKE_SESSION({ sessionId });
            if (!response.success) throw new Error(response.message || 'Failed to revoke session');
            return response;
        },
        onSuccess: () => {
            Toast.show({ type: 'success', text1: 'Session Revoked', text2: 'Device logged out successfully' });
            queryClient.invalidateQueries({ queryKey: ['activeSessions'] });
        },
        onError: (error: any) => {
            Toast.show({ type: 'error', text1: 'Error', text2: error.message || 'Failed to revoke session' });
        },
    });

    React.useEffect(() => {
        if (user?.user?.notifications) {
            setBloodAlerts(user.user.notifications.bloodRequest ?? true);
            setBusinessUpdates(user.user.notifications.business ?? true);
        }
    }, [user]);


    const handleRevokeSession = (sessionId: string) => {
        revokeSessionMutation.mutate(sessionId);
    };

    const getPlatformIcon = (platform: string) => {
        const p = platform?.toLowerCase();
        if (p?.includes('ios') || p?.includes('iphone') || p?.includes('ipad')) return 'logo-apple';
        if (p?.includes('android')) return 'logo-android';
        if (p?.includes('web') || p?.includes('windows') || p?.includes('mac')) return 'globe-outline';
        return 'phone-portrait-outline';
    };

    const confirmNotificationChange = (type: 'bloodRequest' | 'business', value: boolean) => {
        setPendingNotification({ type, value });
        setNotificationModalVisible(true);
    };

    const handleUpdateNotification = async () => {

        if (!pendingNotification) return;

        setIsUpdatingNotification(true);
        try {
            const response = await MANAGE_NOTIFICATIONS({
                [pendingNotification.type]: pendingNotification.value
            });

            if (response.success) {
                if (response.user) {
                    await updateUser(response.user);
                }
                Toast.show({ type: 'success', text1: 'Success', text2: 'Notification settings updated' });
                setNotificationModalVisible(false);
            } else {
                Toast.show({ type: 'error', text1: 'Error', text2: response.message });
                // Revert state if needed, but useEffect handles sync with user object
            }
        } catch (error: any) {
            Toast.show({ type: 'error', text1: 'Error', text2: error.message || 'Failed to update settings' });
        } finally {
            setIsUpdatingNotification(false);
            setPendingNotification(null);
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
            <View style={[styles.headerIconBox, { backgroundColor: '#004030' + '15' }]}>
                <Ionicons name={icon} size={18} color="#004030" />
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
                trackColor={{ false: '#94a3b8', true: '#004030' }}
                thumbColor="#FFFFFF"
            />
        </View>
    );

    const lastUpdated = user?.user?.lastPasswordChangeAt;


    const newPasswordRef = React.useRef<TextInput>(null);
    const confirmPasswordRef = React.useRef<TextInput>(null);
    const insets = useSafeAreaInsets();

    return (
        <ThemedView style={styles.container}>
            {/* Header Section with Dark Green Background */}
            {/* Header Section with Dark Green Background */}
            <View style={[styles.headerSection, { paddingTop: insets.top + 20, backgroundColor: '#004030' }]}>
                {/* Top Row: Menu & Profile */}
                <View style={styles.topNavRow}>
                    <TouchableOpacity
                        onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
                        style={[styles.iconButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
                    >
                        <Ionicons name="grid-outline" size={20} color="#FFFFFF" />
                    </TouchableOpacity>

                    <ThemedText style={styles.headerTitle}>Settings</ThemedText>

                    <TouchableOpacity
                        onPress={() => navigation.navigate('profile' as never)}
                        style={styles.profileButton}
                    >
                        <Image
                            source={getProfileSource()}
                            style={styles.profileImage}
                        />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                bounces={false}
            >

                {/* Appearance Section - TEMPORARILY DISABLED FOR V1 */}
                {/* 
                {renderHeader('Appearance', 'color-palette-outline')}
                <View style={[styles.glassCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(15, 23, 42, 0.03)' }]}>
                    <View style={styles.appearanceRow}>
                        {(['light', 'dark', 'system'] as const).map((pref) => (
                            <TouchableOpacity
                                key={pref}
                                style={[
                                    styles.appearanceOption,
                                    themePreference === pref && [styles.activeOption, { borderColor: '#004030' }]
                                ]}
                                onPress={() => setThemePreference(pref)}
                            >
                                <Ionicons
                                    name={pref === 'light' ? 'sunny' : pref === 'dark' ? 'moon' : 'settings-outline'}
                                    size={20}
                                    color={themePreference === pref ? '#004030' : colors.text}
                                />
                                <ThemedText style={[
                                    styles.optionText,
                                    themePreference === pref && { color: '#004030', fontWeight: '700' }
                                ]}>
                                    {pref.charAt(0).toUpperCase() + pref.slice(1)}
                                </ThemedText>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View> 
                */}

                {/* Notifications Section */}
                {renderHeader('Notifications', 'notifications-outline')}
                <View style={[styles.glassCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(15, 23, 42, 0.03)' }]}>
                    {renderSettingRow('Blood alerts', bloodAlerts, (val) => confirmNotificationChange('bloodRequest', val))}
                    {renderSettingRow('Business updates', businessUpdates, (val) => confirmNotificationChange('business', val), true)}
                </View>

                {/* Privacy Section */}
                {renderHeader('Privacy', 'lock-closed-outline')}
                <View style={[styles.glassCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(15, 23, 42, 0.03)' }]}>

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
                                sessions.map((session: any, index: number) => (
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
                                                disabled={revokeSessionMutation.isPending}
                                                style={styles.revokeButton}
                                            >
                                                {revokeSessionMutation.isPending && revokeSessionMutation.variables === session._id ? (
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


            <CleanConfirmationModal
                visible={notificationModalVisible}
                onClose={() => setNotificationModalVisible(false)}
                onConfirm={handleUpdateNotification}
                title="Update Settings?"
                message={`Are you sure you want to ${pendingNotification?.value ? 'enable' : 'disable'} notifications for ${pendingNotification?.type === 'bloodRequest' ? 'Blood Alerts' : 'Business Updates'}?`}
                confirmText={isUpdatingNotification ? "Updating..." : "Confirm"}
                cancelText="Cancel"
                type="info"
                isLoading={isUpdatingNotification}
            />
        </ThemedView>
    );
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerSection: {
        paddingBottom: 32,
        borderBottomLeftRadius: 36,
        borderBottomRightRadius: 36,
    },
    headerContent: {
        paddingHorizontal: 24,
    },
    topNavRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 10,
    },
    iconButton: {
        width: 38,
        height: 38,
        borderRadius: 11,
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileButton: {
        width: 38,
        height: 38,
        borderRadius: 19,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.5)',
        padding: 1.5,
    },
    profileImage: {
        width: '100%',
        height: '100%',
        borderRadius: 17,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: -0.5,
    },
    headerSubtitle: {
        fontSize: 15,
        color: 'rgba(255, 255, 255, 0.8)',
        fontWeight: '500',
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
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        overflow: 'hidden',
    },
    appearanceRow: {
        flexDirection: 'row',
        padding: 4,
        gap: 4,
    },
    appearanceOption: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 4, // Reduced from 12
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
        paddingVertical: 10, // Reduced from 14
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12, // Reduced from 16
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
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: '#475569',
        letterSpacing: 0.5,
        marginBottom: 8,
        marginLeft: 2,
    },
    input: {
        height: 52,
        borderWidth: 1.5,
        borderRadius: 14,
        paddingHorizontal: 18,
        fontSize: 15,
        fontWeight: '500',
        backgroundColor: 'transparent',
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
