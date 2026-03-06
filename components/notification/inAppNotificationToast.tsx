import { InAppNotification } from '@/hooks/useSocketNotifications';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef } from 'react';
import {
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/* -------------------------------------------------------
 * Icon helpers
 * ----------------------------------------------------- */

type NotifType = 'SYSTEM' | 'BLOOD_DONATION' | 'BUSINESS' | 'POST' | 'SUPPORT' | string;

const TYPE_CONFIG: Record<
    NotifType,
    { icon: keyof typeof Ionicons.glyphMap; gradient: [string, string] }
> = {
    BLOOD_DONATION: {
        icon: 'water',
        gradient: ['rgba(239, 68, 68, 0.95)', 'rgba(185, 28, 28, 0.98)'],
    },
    BUSINESS: {
        icon: 'briefcase',
        gradient: ['rgba(234, 179, 8, 0.95)', 'rgba(161, 98, 7, 0.98)'],
    },
    POST: {
        icon: 'document-text',
        gradient: ['rgba(99, 102, 241, 0.95)', 'rgba(67, 56, 202, 0.98)'],
    },
    SUPPORT: {
        icon: 'help-circle',
        gradient: ['rgba(14, 165, 233, 0.95)', 'rgba(2, 132, 199, 0.98)'],
    },
    SYSTEM: {
        icon: 'notifications',
        gradient: ['rgba(30, 41, 59, 0.97)', 'rgba(15, 23, 42, 0.99)'],
    },
};

const AUTO_DISMISS_MS = 4500;

/* -------------------------------------------------------
 * Single Toast Item
 * ----------------------------------------------------- */

interface ToastItemProps {
    notification: InAppNotification;
    onDismiss: (id: string) => void;
    index: number;
}

function ToastItem({ notification, onDismiss, index }: ToastItemProps) {
    const translateY = useSharedValue(-100);
    const opacity = useSharedValue(0);
    const scale = useSharedValue(0.92);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const config = TYPE_CONFIG[notification.type] ?? TYPE_CONFIG.SYSTEM;

    const dismiss = () => onDismiss(notification.id);

    useEffect(() => {
        // Slide in
        translateY.value = withSpring(0, { damping: 18, stiffness: 180 });
        opacity.value = withTiming(1, { duration: 280 });
        scale.value = withSpring(1, { damping: 15, stiffness: 200 });

        // Auto-dismiss
        timerRef.current = setTimeout(() => {
            translateY.value = withTiming(-120, { duration: 300 });
            opacity.value = withTiming(0, { duration: 300 }, (finished) => {
                if (finished) runOnJS(dismiss)();
            });
        }, AUTO_DISMISS_MS);

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateY: translateY.value },
            { scale: scale.value },
        ],
        opacity: opacity.value,
    }));

    const handleClose = () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        translateY.value = withTiming(-120, { duration: 250 });
        opacity.value = withTiming(0, { duration: 250 }, (finished) => {
            if (finished) runOnJS(dismiss)();
        });
    };

    return (
        <Animated.View
            style={[styles.toastWrapper, { marginTop: index * 6 }, animatedStyle]}
            accessibilityRole="alert"
            accessibilityLabel={`${notification.title}: ${notification.body}`}
        >
            <LinearGradient
                colors={config.gradient as [string, string]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.toastGradient}
            >
                {/* Specular highlight */}
                <View style={styles.specular} />

                {/* Left icon badge */}
                <View style={styles.iconBadge}>
                    <Ionicons name={config.icon} size={20} color="#fff" />
                </View>

                {/* Text content */}
                <View style={styles.textContainer}>
                    <Text style={styles.title} numberOfLines={1}>
                        {notification.title}
                    </Text>
                    <Text style={styles.body} numberOfLines={2}>
                        {notification.body}
                    </Text>
                </View>

                {/* Close button */}
                <TouchableOpacity
                    onPress={handleClose}
                    style={styles.closeBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityLabel="Dismiss notification"
                >
                    <Ionicons name="close" size={16} color="rgba(255,255,255,0.8)" />
                </TouchableOpacity>

                {/* Progress bar */}
                <ProgressBar durationMs={AUTO_DISMISS_MS} />
            </LinearGradient>
        </Animated.View>
    );
}

/* -------------------------------------------------------
 * Auto-dismiss progress bar
 * ----------------------------------------------------- */

function ProgressBar({ durationMs }: { durationMs: number }) {
    const width = useSharedValue(100);

    useEffect(() => {
        width.value = withTiming(0, { duration: durationMs });
    }, []);

    const animStyle = useAnimatedStyle(() => ({
        width: `${width.value}%`,
    }));

    return (
        <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressBar, animStyle]} />
        </View>
    );
}

/* -------------------------------------------------------
 * Main exported component
 * ----------------------------------------------------- */

interface InAppNotificationToastProps {
    notifications: InAppNotification[];
    onDismiss: (id: string) => void;
}

/**
 * InAppNotificationToast
 *
 * Drop this once in your root layout. Pass `notifications` from
 * `useSocketNotifications()` and the `dismiss` callback.
 *
 * Example:
 * ```tsx
 * const { notifications, dismiss } = useSocketNotifications();
 * <InAppNotificationToast notifications={notifications} onDismiss={dismiss} />
 * ```
 */
export function InAppNotificationToast({
    notifications,
    onDismiss,
}: InAppNotificationToastProps) {
    const insets = useSafeAreaInsets();

    if (notifications.length === 0) return null;

    return (
        <View
            style={[styles.container, { top: insets.top + (Platform.OS === 'android' ? 8 : 4) }]}
            pointerEvents="box-none"
        >
            {notifications.map((n, i) => (
                <ToastItem
                    key={n.id}
                    notification={n}
                    onDismiss={onDismiss}
                    index={i}
                />
            ))}
        </View>
    );
}

/* -------------------------------------------------------
 * Styles
 * ----------------------------------------------------- */

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        left: 12,
        right: 12,
        zIndex: 9999,
        shadowRadius: 10,
    gap: 8,
    },
toastWrapper: {
    borderRadius: 18,
        overflow: 'hidden',
            shadowColor: '#000',
                shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
        shadowRadius: 16,
        shadowRadius: 10,
        borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.12)',
    },
toastGradient: {
    flexDirection: 'row',
        alignItems: 'center',
            paddingHorizontal: 14,
                paddingVertical: 12,
                    paddingBottom: 18, // extra space for progress bar
                        borderRadius: 18,
                            overflow: 'hidden',
                                position: 'relative',
    },
specular: {
    position: 'absolute',
        top: 0,
            left: '15%',
                right: '15%',
                    height: 1,
                        backgroundColor: 'rgba(255,255,255,0.18)',
    },
iconBadge: {
    width: 36,
        height: 36,
            borderRadius: 10,
                backgroundColor: 'rgba(255,255,255,0.12)',
                    justifyContent: 'center',
                        alignItems: 'center',
                            marginRight: 12,
                                flexShrink: 0,
    },
textContainer: {
    flex: 1,
        marginRight: 8,
    },
title: {
    fontSize: 14,
        fontWeight: '700',
            color: '#FFFFFF',
                letterSpacing: 0.1,
                    marginBottom: 2,
    },
body: {
    fontSize: 12,
        color: 'rgba(255,255,255,0.75)',
            lineHeight: 17,
    },
closeBtn: {
    width: 24,
        height: 24,
            borderRadius: 12,
                backgroundColor: 'rgba(255,255,255,0.08)',
                    justifyContent: 'center',
                        alignItems: 'center',
                            flexShrink: 0,
    },
progressTrack: {
    position: 'absolute',
        bottom: 0,
            left: 0,
                right: 0,
                    height: 3,
                        backgroundColor: 'rgba(255,255,255,0.12)',
    },
progressBar: {
    height: 3,
        backgroundColor: 'rgba(255,255,255,0.5)',
            borderRadius: 2,
    },
});
