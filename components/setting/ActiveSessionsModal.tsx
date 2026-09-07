import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React from 'react';
import {
    ActivityIndicator,
    Platform,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View } from 'react-native';
import Toast from 'react-native-toast-message';

import { getActiveSessions, revokeSession } from '@/apis/profile';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { Layout } from '@/constants/layout';
import { PremiumModal } from '../common/PremiumModal';

// const PRIMARY is now accessed via colors.primary inside components

// ── Platform icon helper ──────────────────────────────────────────────────────
function getPlatformIcon(platform: string): string {
    const p = platform?.toLowerCase() || '';
    if (p.includes('ios') || p.includes('iphone') || p.includes('ipad')) return 'logo-apple';
    if (p.includes('android')) return 'logo-android';
    if (p.includes('web') || p.includes('windows') || p.includes('mac')) return 'globe-outline';
    return 'phone-portrait-outline';
}

function formatLastActive(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Active now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ── Session Card ──────────────────────────────────────────────────────────────
interface SessionCardProps {
    session: any;
    delay: number;
    onRevoke: (id: string) => void;
    isRevoking: boolean;
    colors: any;
}

const SessionCard = React.memo(({ session, delay, onRevoke, isRevoking, colors }: SessionCardProps) => {
    return (
        <View style={[styles.card, { backgroundColor: colors.background }, session.isCurrent && styles.cardCurrent]}>
            {/* Left icon */}
            <View style={[styles.iconCircle, session.isCurrent && styles.iconCircleCurrent]}>
                <Ionicons
                    name={getPlatformIcon(session.platform) as any}
                    size={22}
                    color={session.isCurrent ? colors.primary : colors.textSecondary}
                />
            </View>

            {/* Info */}
            <View style={styles.info}>
                <View style={styles.nameRow}>
                    <ThemedText style={styles.deviceName} numberOfLines={1}>
                        {session.deviceName || 'Unknown Device'}
                    </ThemedText>
                    {session.isCurrent && (
                        <View style={styles.badge}>
                            <ThemedText style={styles.badgeText}>Current</ThemedText>
                        </View>
                    )}
                </View>
                <ThemedText style={styles.meta}>
                    {session.platform && `${session.platform}  ·  `}{formatLastActive(session.lastActiveAt)}
                </ThemedText>
            </View>

            {/* Revoke */}
            {!session.isCurrent && (
                <TouchableOpacity
                    onPress={() => onRevoke(session._id)}
                    disabled={isRevoking}
                    activeOpacity={0.7}
                    style={styles.revokeBtn}
                >
                    {isRevoking ? (
                        <ActivityIndicator size="small" color="#EF4444" />
                    ) : (
                        <Ionicons name="log-out-outline" size={18} color="#EF4444" />
                    )}
                </TouchableOpacity>
            )}
        </View>
    );
});

// ── Skeleton ──────────────────────────────────────────────────────────────────
const SkeletonCard = React.memo(({ delay }: { delay: number }) => {
    const { theme } = useTheme();
    const colors = Colors[theme];
    const isDark = theme === 'dark';
    const skeletonBg = isDark ? 'rgba(255,255,255,0.05)' : '#E2E8F0';
    const subBg = isDark ? 'rgba(255,255,255,0.03)' : '#F1F5F9';

    return (
        <View style={[styles.card, { backgroundColor: colors.background, opacity: 0.5 }]}>
            <View style={[styles.iconCircle, { backgroundColor: skeletonBg }]} />
            <View style={styles.info}>
                <View style={{ width: '60%', height: 13, borderRadius: Layout.borderRadius, backgroundColor: skeletonBg, marginBottom: 8 }} />
                <View style={{ width: '40%', height: 11, borderRadius: Layout.borderRadius, backgroundColor: subBg }} />
            </View>
        </View>
    );
});

// ── Modal ─────────────────────────────────────────────────────────────────────
interface ActiveSessionsModalProps {
    visible: boolean;
    onClose: () => void;
}

export const ActiveSessionsModal: React.FC<ActiveSessionsModalProps> = React.memo(({ visible, onClose }) => {
    const { theme } = useTheme();
    const colors = Colors[theme];
    const queryClient = useQueryClient();

    const { data: sessionsData, isLoading } = useQuery({
        queryKey: ['activeSessions'],
        queryFn: async () => {
            const response = await getActiveSessions() as any;
            if (response.success) return response.data;
            throw new Error(response.message || 'Failed to load sessions');
        },
        enabled: visible });

    const sessions: any[] = sessionsData ?? [];

    const revokeSessionMutation = useMutation({
        mutationFn: async (sessionId: string) => {
            const response = await revokeSession({ sessionId }) as any;
            if (!response.success) throw new Error(response.message || 'Failed to revoke session');
            return response;
        },
        onSuccess: () => {
            Toast.show({ type: 'success', text1: 'Session Logged Out', text2: 'Device removed successfully' });
            queryClient.invalidateQueries({ queryKey: ['activeSessions'] });
        },
        onError: (error: any) => {
            Toast.show({ type: 'error', text1: 'Error', text2: error.message || 'Failed to revoke session' });
        } });

    return (
        <PremiumModal
            visible={visible}
            onClose={onClose}
            type="centered"
            sheetStyle={{ width: '90%', maxWidth: 400, borderRadius: Layout.borderRadius, padding: 18 }}
        >
            <View style={styles.header}>
                <ThemedText style={[styles.title, { color: colors.text }]}>Active Sessions</ThemedText>
                <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>Manage devices currently logged in</ThemedText>
            </View>

            <ScrollView
                style={styles.list}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
            >
                {isLoading ? (
                    <>
                        <SkeletonCard delay={0} />
                        <SkeletonCard delay={80} />
                        <SkeletonCard delay={160} />
                    </>
                ) : sessions.length === 0 ? (
                    <View style={styles.empty}>
                        <Ionicons name="phone-portrait-outline" size={40} color="#CBD5E1" />
                        <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>No active sessions found</ThemedText>
                    </View>
                ) : (
                    sessions.map((session, i) => (
                        <SessionCard
                            key={session._id}
                            session={session}
                            colors={colors}
                            delay={i * 60}
                            onRevoke={(id) => revokeSessionMutation.mutate(id)}
                            isRevoking={
                                revokeSessionMutation.isPending &&
                                revokeSessionMutation.variables === session._id
                            }
                        />
                    ))
                )}
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.modalButton, { backgroundColor: colors.primary }]}
                    onPress={onClose}
                    activeOpacity={0.8}
                >
                    <ThemedText style={styles.modalButtonText}>Done</ThemedText>
                </TouchableOpacity>
            </View>
        </PremiumModal>
    );
});

ActiveSessionsModal.displayName = 'ActiveSessionsModal';

const styles = StyleSheet.create({
    header: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 14,
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 2,
    },
    subtitle: {
        fontSize: 12,
        fontWeight: '500',
        textAlign: 'center',
    },

    // Session card
    list: {
        maxHeight: 320,
        flexGrow: 0,
    },
    listContent: {
        paddingBottom: 2,
        flexGrow: 0,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: Layout.borderRadius,
        padding: 10,
        marginBottom: 8,
    },
    cardCurrent: {
        backgroundColor: 'rgba(0,102,102,0.08)',
    },
    iconCircle: {
        width: 38,
        height: 38,
        borderRadius: Layout.borderRadius,
        backgroundColor: 'rgba(0,102,102,0.08)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    iconCircleCurrent: {
        backgroundColor: 'rgba(0,102,102,0.14)',
    },
    info: { flex: 1 },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 2,
        flexWrap: 'wrap',
    },
    deviceName: {
        fontSize: 13,
        fontWeight: '700',
        flexShrink: 1,
    },
    badge: {
        backgroundColor: 'rgba(0,102,102,0.14)',
        paddingHorizontal: 7,
        paddingVertical: 2,
        borderRadius: Layout.borderRadius,
    },
    badgeText: {
        fontSize: 9,
        fontWeight: '700',
        color: '#006666',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    meta: {
        fontSize: 11,
        color: '#94A3B8',
        fontWeight: '500',
    },
    revokeBtn: {
        width: 32,
        height: 32,
        borderRadius: Layout.borderRadius,
        backgroundColor: '#FEF2F2',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 10,
    },

    // Empty
    empty: {
        alignItems: 'center',
        paddingVertical: 24,
        gap: 8,
    },
    emptyText: {
        fontSize: 12,
        fontWeight: '500',
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 14,
        width: '100%',
    },
    modalButton: {
        width: '100%',
        height: Platform.OS === 'android' ? 46 : 50,
        borderRadius: Layout.borderRadius,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalButtonText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '700',
    },
});
