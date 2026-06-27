import { updateProfile } from '@/apis/profile';
import { DeleteAccountModal } from '@/components/setting/DeleteAccountModal';
import { PasswordModal } from '@/components/setting/PasswordModal';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ReviewService } from '@/utils/review';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { SettingRowItem } from '@/components/setting/SettingRow';
import { ActiveSessionsModal } from '@/components/setting/ActiveSessionsModal';
import { SectionCard } from '@/components/setting/SectionCard';

export default function SettingsScreen() {
    const { theme, toggleTheme, isDark } = useTheme();
    const { user, updateUser, logout } = useAuth();
    const router = useRouter();
    const colors = Colors[theme];
    const insets = useSafeAreaInsets();

    const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
    const [isEmailModalVisible, setIsEmailModalVisible] = useState(false);
    const [isSessionsModalVisible, setIsSessionsModalVisible] = useState(false);
    const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
    const [newEmail, setNewEmail] = useState(user?.user?.email || '');
    const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);

    const handleUpdateEmail = async () => {
        if (!newEmail || newEmail === user?.user?.email) {
            setIsEmailModalVisible(false);
            return;
        }
        setIsUpdatingEmail(true);
        try {
            const response = await updateProfile({ email: newEmail });
            if (response.data?.userData) {
                await updateUser(response.data.userData);
                Toast.show({ type: 'success', text1: 'Success', text2: 'Email updated successfully' });
                setIsEmailModalVisible(false);
            }
        } catch (error: any) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error.response?.data?.message || 'Failed to update email',
            });
        } finally {
            setIsUpdatingEmail(false);
        }
    };

    const [activeTab, setActiveTab] = useState<'account' | 'app' | 'legal'>('account');

    const handleLogout = useCallback(() => {
        logout();
    }, [logout]);

    const tabs = [
        { id: 'account', label: 'Account', icon: 'person' },
        { id: 'app', label: 'App', icon: 'settings' },
        { id: 'legal', label: 'Legal', icon: 'shield-checkmark' },
    ];

    const renderTabContent = () => {
        switch (activeTab) {
            case 'account':
                return (
                    <Animated.View key="account" entering={FadeIn.duration(400)}>
                        <SectionCard title="Account Details" delay={100}>
                            <SettingRowItem icon="person-outline" label="Edit Profile" subtitle="Update your personal info" onPress={() => router.push('/profile')} />
                            <SettingRowItem icon="lock-closed-outline" label="Change Password" subtitle="Keep your account secure" onPress={() => setIsPasswordModalVisible(true)} />
                            <SettingRowItem icon="phone-portrait-outline" label="Manage Devices" subtitle="View active sessions" onPress={() => setIsSessionsModalVisible(true)} isLast />
                        </SectionCard>

                        <SectionCard title="Session" delay={200}>
                            <SettingRowItem icon="log-out-outline" label="Logout" color="#EF4444" iconColor="#EF4444" iconBg="rgba(239, 68, 68, 0.08)" showChevron={false} onPress={handleLogout} isLast />
                        </SectionCard>

                        <SectionCard title="Danger Zone" delay={300}>
                            <SettingRowItem icon="trash-outline" label="Delete Account" subtitle="This action cannot be undone" color="#F87171" iconColor="#F87171" iconBg="rgba(248, 113, 113, 0.08)" showChevron={false} onPress={() => setIsDeleteModalVisible(true)} isLast />
                        </SectionCard>
                    </Animated.View>
                );
            case 'app':
                return (
                    <Animated.View key="app" entering={FadeIn.duration(400)}>
                        <SectionCard title="Preferences" delay={100}>
                            <SettingRowItem
                                icon="notifications-outline"
                                label="Push Notifications"
                                subtitle="Control which alerts you receive"
                                onPress={() => router.push('/manageNotifications')}
                            />
                            <SettingRowItem
                                icon="star-outline"
                                label="Rate App"
                                subtitle="Enjoying Rehbar? Let us know!"
                                onPress={() => ReviewService.openStore()}
                            />
                            {/* <SettingRowItem
                                icon="moon-outline"
                                label="Dark Mode"
                                subtitle={isDark ? 'Currently enabled' : 'Currently disabled'}
                                isToggle
                                toggleValue={isDark}
                                onToggleChange={() => toggleTheme()}
                                primaryColor={colors.primary}
                                isLast
                            /> */}
                        </SectionCard>

                        <SectionCard title="System" delay={200}>
                            <SettingRowItem icon="analytics-outline" label="Data Usage" subtitle="Manage your data preferences" onPress={() => router.push('/dataUsage')} isLast />
                        </SectionCard>
                    </Animated.View>
                );
            case 'legal':
                return (
                    <Animated.View key="legal" entering={FadeIn.duration(400)}>
                        <SectionCard title="My Activity" delay={100}>
                            <SettingRowItem icon="flag-outline" label="My Reports" subtitle="View and manage your submissions" onPress={() => router.push('/reports')} isLast />
                        </SectionCard>

                        <SectionCard title="Policies & Guidelines" delay={200}>
                            <SettingRowItem icon="shield-outline" label="Privacy Policy" onPress={() => router.push('/privacy')} />
                            <SettingRowItem icon="document-text-outline" label="Terms & Conditions" onPress={() => router.push('/terms')} />
                            <SettingRowItem icon="people-outline" label="Community Guidelines" onPress={() => router.push('/communityGuidelines')} isLast />
                        </SectionCard>
                    </Animated.View>
                );
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>

            {/* ── Header ──────────────────────────────────────────── */}
            <Animated.View entering={FadeInUp.duration(600)} style={[styles.headerWrap, { backgroundColor: colors.primary }]}>
                <View style={[styles.headerTopRow, { paddingTop: insets.top + 8 }]}>
                    <TouchableOpacity
                        onPress={() => router.replace('/(drawer)/(tabs)' as any)}
                        style={styles.backBtn}
                    >
                        <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Animated.View entering={FadeIn.delay(200).duration(500)} style={styles.headerTitleWrap}>
                        <ThemedText style={styles.headerTitle}>Settings</ThemedText>
                    </Animated.View>
                    <View style={{ width: 42 }} />
                </View>

                {/* ── Tabs ── */}
                <View style={styles.tabContainer}>
                    {tabs.map((tab) => (
                        <TouchableOpacity
                            key={tab.id}
                            style={[
                                styles.tabButton,
                                activeTab === tab.id && styles.activeTabButton
                            ]}
                            onPress={() => setActiveTab(tab.id as any)}
                        >
                            <Ionicons
                                name={tab.icon as any}
                                size={18}
                                color={activeTab === tab.id ? '#FFFFFF' : 'rgba(255,255,255,0.6)'}
                            />
                            <ThemedText
                                style={[
                                    styles.tabLabel,
                                    activeTab === tab.id && styles.activeTabLabel
                                ]}
                            >
                                {tab.label}
                            </ThemedText>
                        </TouchableOpacity>
                    ))}
                </View>
            </Animated.View>

            {/* ── Tab Content ────────────────────────────────────── */}
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
                showsVerticalScrollIndicator={false}
            >
                {renderTabContent()}

                {/* Version */}
                <Animated.View entering={FadeIn.delay(400).duration(400)} style={styles.versionWrap}>
                    <ThemedText style={styles.versionText}>Rehbar v{process.env.EXPO_PUBLIC_APP_VERSION ?? '1.2.0'}</ThemedText>
                </Animated.View>
            </ScrollView>

            {/* ── Modals ──────────────────────────────────────────── */}
            <PasswordModal visible={isPasswordModalVisible} onClose={() => setIsPasswordModalVisible(false)} />
            <ActiveSessionsModal visible={isSessionsModalVisible} onClose={() => setIsSessionsModalVisible(false)} />
            <DeleteAccountModal visible={isDeleteModalVisible} onClose={() => setIsDeleteModalVisible(false)} colors={colors} />

            <Modal visible={isEmailModalVisible} transparent animationType="slide" onRequestClose={() => setIsEmailModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={{ width: '100%' }}
                    >
                        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                            <ScrollView
                                keyboardShouldPersistTaps="handled"
                                showsVerticalScrollIndicator={false}
                                style={{ width: '100%' }}
                            >
                                <View style={{ alignItems: 'center' }}>
                                    <ThemedText style={styles.modalTitle}>Change Email Address</ThemedText>
                                    <View style={[styles.inputContainer, { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : '#F1F5F9' }]}>
                                        <Ionicons name="mail-outline" size={20} color={colors.textSecondary} style={{ marginRight: 10 }} />
                                        <TextInput
                                            style={[styles.input, { color: colors.text }]}
                                            value={newEmail}
                                            onChangeText={setNewEmail}
                                            placeholder="New Email Address"
                                            placeholderTextColor={theme === 'dark' ? 'rgba(255,255,255,0.3)' : '#94A3B8'}
                                            keyboardType="email-address"
                                            autoCapitalize="none"
                                        />
                                    </View>
                                    <View style={styles.modalButtons}>
                                        <TouchableOpacity style={[styles.modalButton, styles.cancelButton, { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : '#F1F5F9' }]} onPress={() => setIsEmailModalVisible(false)}>
                                            <ThemedText style={[styles.cancelButtonText, { color: colors.textSecondary }]}>Cancel</ThemedText>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={[styles.modalButton, { backgroundColor: colors.primary }]} onPress={handleUpdateEmail} disabled={isUpdatingEmail}>
                                            {isUpdatingEmail ? <ActivityIndicator color="#FFFFFF" size="small" /> : <ThemedText style={styles.confirmButtonText}>Update</ThemedText>}
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </ScrollView>
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },

    // Header
    headerWrap: {
        paddingBottom: 16,
        borderBottomLeftRadius: Layout.borderRadius,
        borderBottomRightRadius: Layout.borderRadius,
        overflow: 'hidden',
        zIndex: 2,
    },
    headerTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    backBtn: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: 'rgba(255,255,255,0.18)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitleWrap: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    tabContainer: {
        flexDirection: 'row',
        marginTop: 20,
        paddingHorizontal: 16,
        gap: 8,
    },
    tabButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: Layout.borderRadius,
        backgroundColor: 'rgba(255,255,255,0.1)',
        gap: 6,
    },
    activeTabButton: {
        backgroundColor: 'rgba(255,255,255,0.25)',
    },
    tabLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.6)',
    },
    activeTabLabel: {
        color: '#FFFFFF',
    },

    // Scroll
    scrollView: {
        flex: 1,
        marginTop: -10,
        zIndex: 0,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 30,
    },

    // Version
    versionWrap: { alignItems: 'center', paddingVertical: 20 },
    versionText: { fontSize: 12, color: '#B0B8C9', fontWeight: '500' },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: { width: '100%', borderRadius: Layout.borderRadius, padding: 24, alignItems: 'center' },
    modalTitle: { fontSize: 20, fontWeight: '700', marginBottom: 20 },
    inputContainer: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: Layout.borderRadius,
        paddingHorizontal: 15,
        marginBottom: 24,
    },
    input: { flex: 1, height: 50, fontSize: 15 },
    modalButtons: { flexDirection: 'row', width: '100%', gap: 12 },
    modalButton: { flex: 1, height: 50, borderRadius: Layout.borderRadius, justifyContent: 'center', alignItems: 'center' },
    cancelButton: {},
    cancelButtonText: { fontWeight: '600' },
    confirmButtonText: { color: '#FFFFFF', fontWeight: '700' },
});
