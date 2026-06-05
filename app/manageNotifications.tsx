import React, { useEffect } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/context/ThemeContext';
import { useNotificationStore, NotificationPreferences } from '@/store/notificationStore';
import NotificationSectionCard from '@/components/notification/NotificationSectionCard';
import NotificationToggleRow from '@/components/notification/NotificationToggleRow';
import { ThemedText } from '@/components/themedText';

export default function ManageNotificationsScreen() {
    const { theme } = useTheme();
    const colors = Colors[theme];
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const {
        preferences,
        isLoading,
        loadPreferences,
        setPreference
    } = useNotificationStore();

    useEffect(() => {
        loadPreferences();
    }, []);

    const handleBack = () => {
        router.canGoBack() ? router.back() : router.replace('/settings');
    };

    const togglePreference = (key: keyof NotificationPreferences) => {
        setPreference(key, !preferences[key]);
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* ── Header ──────────────────────────────────────────── */}
            <Animated.View
                entering={FadeInUp.duration(600)}
                style={[styles.headerWrap, { backgroundColor: colors.primary }]}
            >
                <View style={[styles.headerTopRow, { paddingTop: insets.top + 8 }]}>
                    <TouchableOpacity
                        onPress={handleBack}
                        style={styles.backBtn}
                    >
                        <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
                    </TouchableOpacity>
                    <View style={styles.headerTitleWrap}>
                        <ThemedText style={styles.headerTitle}>Manage Notifications</ThemedText>
                    </View>
                    <View style={{ width: 42 }} />
                </View>
                <Animated.View entering={FadeIn.delay(400).duration(500)} style={styles.headerSubtitleWrap}>
                    <ThemedText style={styles.headerSubtitle}>Control which notifications you receive</ThemedText>
                </Animated.View>
            </Animated.View>

            {/* ── Content ─────────────────────────────────────────── */}
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={[
                    styles.scrollContent,
                    { paddingBottom: insets.bottom + 40 }
                ]}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={isLoading}
                        onRefresh={loadPreferences}
                        tintColor={colors.primary}
                    />
                }
            >
                <NotificationSectionCard title="General Updates">
                    {/* <NotificationToggleRow
                        index={0}
                        icon="newspaper-outline"
                        color="#6366F1" // Indigo
                        label="Community Feed"
                        description="Stay updated with posts from your community"
                        value={preferences.feed}
                        onValueChange={() => togglePreference('feed')}
                    /> */}
                    <NotificationToggleRow
                        index={1}
                        icon="business-outline"
                        color="#0D9488" // Teal
                        label="Business Updates"
                        description="New services and business registrations near you"
                        value={preferences.business}
                        onValueChange={() => togglePreference('business')}
                        isLast
                    />
                </NotificationSectionCard>

                <NotificationSectionCard title="Prayer & Weather">
                    <NotificationToggleRow
                        index={2}
                        icon="moon-outline"
                        color="#047857" // Green (Islamic)
                        label="Prayer Notifications"
                        description="Receive adhan alerts for your daily prayer times"
                        value={preferences.prayer}
                        onValueChange={() => togglePreference('prayer')}
                    />
                    <NotificationToggleRow
                        index={3}
                        icon="partly-sunny-outline"
                        color="#3B82F6" // Blue
                        label="Weather Alerts"
                        description="Get daily weather updates and storm alerts"
                        value={preferences.weather}
                        onValueChange={() => togglePreference('weather')}
                        isLast
                    />
                </NotificationSectionCard>

                <NotificationSectionCard title="Emergency & Health">
                    <NotificationToggleRow
                        index={2}
                        icon="water-outline"
                        color="#EF4444" // Red (Blood)
                        label="Blood Donations"
                        description="Urgent blood donation requests in your area"
                        value={preferences.blood}
                        onValueChange={() => togglePreference('blood')}
                    />
                    <NotificationToggleRow
                        index={3}
                        icon="alert-circle-outline"
                        color="#F59E0B" // Amber/Orange
                        label="Emergencies"
                        description="Critical alerts and emergency announcements"
                        value={preferences.emergency}
                        onValueChange={() => togglePreference('emergency')}
                    />
                    <NotificationToggleRow
                        index={4}
                        icon="heart-outline"
                        color="#EC4899" // Pink/Rose
                        label="Health Services"
                        description="Medical camps and health-related updates"
                        value={preferences.health}
                        onValueChange={() => togglePreference('health')}
                        isLast
                    />
                </NotificationSectionCard>

                <NotificationSectionCard title="Other Notifications">
                    <NotificationToggleRow
                        index={5}
                        icon="school-outline"
                        color="#10B981" // Green (Education)
                        label="Education"
                        description="School announcements and educational resources"
                        value={preferences.education}
                        onValueChange={() => togglePreference('education')}
                    />
                    <NotificationToggleRow
                        index={6}
                        icon="library-outline"
                        color="#64748B" // Slate (Govt)
                        label="Government"
                        description="Information on government schemes and news"
                        value={preferences.govt}
                        onValueChange={() => togglePreference('govt')}
                    />
                    <NotificationToggleRow
                        index={7}
                        icon="moon-outline"
                        color="#8B5CF6" // Purple (Religious)
                        label="Religious"
                        description="Local religious events and prayer timings"
                        value={preferences.religious}
                        onValueChange={() => togglePreference('religious')}
                        isLast
                    />
                </NotificationSectionCard>

                <ThemedText style={[styles.footerNote, { color: colors.textSecondary }]}>
                    You can change these settings at any time. Changes are synced with your account across all devices.
                </ThemedText>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerWrap: {
        paddingBottom: 24,
        borderBottomLeftRadius: Layout.headerBorderRadius,
        borderBottomRightRadius: Layout.headerBorderRadius,
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
    headerSubtitleWrap: {
        alignItems: 'center',
        marginTop: 8,
    },
    headerSubtitle: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.75)',
        fontWeight: '500',
    },
    scrollView: {
        flex: 1,
        marginTop: -30,
        zIndex: 0,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 46,
    },
    footerNote: {
        fontSize: 11,
        textAlign: 'center',
        marginTop: 8,
        lineHeight: 18,
        paddingHorizontal: 20,
    },
});
