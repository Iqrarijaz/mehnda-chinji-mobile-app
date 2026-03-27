import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Animated, {
    FadeIn,
    SlideInLeft,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import React, { useCallback, useEffect } from 'react';
import {
    ActivityIndicator,
    Platform,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import Toast from 'react-native-toast-message';

import { getActiveSessions, revokeSession } from '@/apis/profile';
import { ThemedText } from '@/components/themedText';
import { PremiumModal } from '../common/PremiumModal';

const PRIMARY = '#006666';

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
}

const SessionCard = React.memo(({ session, delay, onRevoke, isRevoking }: SessionCardProps) => {
    const scale = useSharedValue(1);
    const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

    const onPressIn = useCallback(() => { scale.value = withSpring(0.97, { damping: 15 }); }, []);
    const onPressOut = useCallback(() => { scale.value = withSpring(1, { damping: 12 }); }, []);

    return (
        <Animated.View entering={SlideInLeft.delay(delay).duration(400)} style={animStyle}>
            <View style={[styles.card, session.isCurrent && styles.cardCurrent]}>
                {/* Left icon */}
                <View style={[styles.iconCircle, session.isCurrent && styles.iconCircleCurrent]}>
                    <Ionicons
                        name={getPlatformIcon(session.platform) as any}
                        size={22}
                        color={session.isCurrent ? PRIMARY : '#94A3B8'}
                    />
                </View>

                {/* Info */}
                <View style={styles.info}>
                    <View style={styles.nameRow}>
                        <ThemedText style={styles.deviceName} numberOfLines={1}>
                            {session.deviceName || 'Unknown Device'}
                        </ThemedText>
                        {session.isCurrent && (
                            <Animated.View entering={FadeIn.delay(delay + 150).duration(300)} style={styles.badge}>
                                <ThemedText style={styles.badgeText}>Current</ThemedText>
                            </Animated.View>
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
                        onPressIn={onPressIn}
                        onPressOut={onPressOut}
                        disabled={isRevoking}
                        activeOpacity={0.8}
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
        </Animated.View>
    );
});

// ── Skeleton ──────────────────────────────────────────────────────────────────
const SkeletonCard = React.memo(({ delay }: { delay: number }) => {
    return (
        <Animated.View entering={SlideInLeft.delay(delay).duration(300)} style={[styles.card, { opacity: 0.5 }]}>
            <View style={[styles.iconCircle, { backgroundColor: '#E2E8F0' }]} />
            <View style={styles.info}>
                <View style={{ width: '60%', height: 13, borderRadius: 6, backgroundColor: '#E2E8F0', marginBottom: 8 }} />
                <View style={{ width: '40%', height: 11, borderRadius: 5, backgroundColor: '#F1F5F9' }} />
            </View>
        </Animated.View>
    );
});

// ── Modal ─────────────────────────────────────────────────────────────────────
interface ActiveSessionsModalProps {
    visible: boolean;
    onClose: () => void;
}

export const ActiveSessionsModal: React.FC<ActiveSessionsModalProps> = React.memo(({ visible, onClose }) => {
    const queryClient = useQueryClient();

    const { data: sessionsData, isLoading } = useQuery({
        queryKey: ['activeSessions'],
        queryFn: async () => {
            const response = await getActiveSessions() as any;
            if (response.success) return response.data;
            throw new Error(response.message || 'Failed to load sessions');
        },
        enabled: visible,
    });

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
        },
    });

    return (
        <PremiumModal visible={visible} onClose={onClose} type="centered">

            <View style={styles.header}>
                <View>
                    <ThemedText style={styles.title}>Active Sessions</ThemedText>
                    <ThemedText style={styles.subtitle}>Manage devices currently logged in</ThemedText>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
                    <Ionicons name="close" size={18} color="#64748B" />
                </TouchableOpacity>
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
                    <Animated.View entering={FadeIn.delay(200).duration(400)} style={styles.empty}>
                        <Ionicons name="phone-portrait-outline" size={40} color="#CBD5E1" />
                        <ThemedText style={styles.emptyText}>No active sessions found</ThemedText>
                    </Animated.View>
                ) : (
                    sessions.map((session, i) => (
                        <SessionCard
                            key={session._id}
                            session={session}
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
        </PremiumModal>
    );
});

const styles = StyleSheet.create({

    header: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: 20,
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

    // Session card
    list: { maxHeight: 420 },
    listContent: { paddingBottom: 8 },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
        padding: 14,
        marginBottom: 10,
    },
    cardCurrent: {
        backgroundColor: `${PRIMARY}08`,
    },
    iconCircle: {
        width: 46,
        height: 46,
        borderRadius: 14,
        backgroundColor: '#EEF2FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    iconCircleCurrent: {
        backgroundColor: `${PRIMARY}12`,
    },
    info: { flex: 1 },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
        flexWrap: 'wrap',
    },
    deviceName: {
        fontSize: 14,
        fontWeight: '700',
        color: '#0F172A',
        flexShrink: 1,
    },
    badge: {
        backgroundColor: `${PRIMARY}14`,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: PRIMARY,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    meta: {
        fontSize: 12,
        color: '#94A3B8',
        fontWeight: '500',
    },
    revokeBtn: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#FEF2F2',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 10,
    },

    // Empty
    empty: {
        alignItems: 'center',
        paddingVertical: 40,
        gap: 12,
    },
    emptyText: {
        fontSize: 14,
        color: '#94A3B8',
        fontWeight: '500',
    },
});
