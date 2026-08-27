import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { PressableScale } from '@/components/essentials/shared/PressableScale';
import { ThemedText } from '@/components/ThemedText';
import { ThemeColors } from '@/constants/colors';
import { Layout } from '@/constants/layout';

interface QiblaMessageStateProps {
    colors: ThemeColors;
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    message: string;
    /** Primary action. Omitted for states the user cannot act on. */
    actionLabel?: string;
    actionIcon?: keyof typeof Ionicons.glyphMap;
    onAction?: () => void;
    /** Shows a spinner in place of the action label while work is in flight. */
    busy?: boolean;
    /** Secondary line under the button, e.g. a fallback bearing. */
    footnote?: string;
    /** Tints the icon badge — danger for blocked, primary otherwise. */
    tone?: 'neutral' | 'warning';
}

/**
 * Shared layout for every non-compass state: loading, each way location can be
 * unavailable, and a device with no magnetometer.
 *
 * One component rather than four blocks inside the screen, because the states
 * differ only in wording and which action they offer. Keeping them uniform is
 * also what stops the "please allow location" case from looking like an error
 * when it is really just a question.
 */
function QiblaMessageStateComponent({
    colors, icon, title, message, actionLabel, actionIcon, onAction, busy, footnote, tone = 'neutral',
}: QiblaMessageStateProps) {
    const accent = tone === 'warning' ? colors.warning : colors.primary;

    // Foreground is chosen against the fill, not fixed to white. White on the
    // amber warning tone measures 2.15:1 in light and 1.67:1 in dark -- below
    // even the large-text floor -- where near-black on the same amber gives
    // 6.91:1 and 11.54:1. Teal keeps white, which it carries comfortably.
    const onAccent = tone === 'warning' ? '#1A1200' : '#FFFFFF';

    return (
        <View style={styles.wrap}>
            <View style={[styles.iconBadge, { backgroundColor: `${accent}1A` }]}>
                <Ionicons name={icon} size={34} color={accent} />
            </View>

            <ThemedText style={[styles.title, { color: colors.text }]}>{title}</ThemedText>
            <ThemedText style={[styles.message, { color: colors.textSecondary }]}>{message}</ThemedText>

            {actionLabel && onAction ? (
                <PressableScale
                    onPress={onAction}
                    disabled={busy}
                    containerStyle={styles.actionWrap}
                    style={[styles.action, { backgroundColor: accent, opacity: busy ? 0.7 : 1 }]}
                >
                    {busy ? (
                        <ActivityIndicator size="small" color={onAccent} />
                    ) : (
                        <>
                            {actionIcon ? <Ionicons name={actionIcon} size={17} color={onAccent} /> : null}
                            <ThemedText style={[styles.actionText, { color: onAccent }]}>{actionLabel}</ThemedText>
                        </>
                    )}
                </PressableScale>
            ) : null}

            {footnote ? (
                <ThemedText style={[styles.footnote, { color: colors.textSecondary }]}>{footnote}</ThemedText>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
    iconBadge: {
        width: 76, height: 76, borderRadius: 38,
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 20,
    },
    title: { fontSize: 18, fontWeight: '800', textAlign: 'center' },
    message: { fontSize: 13.5, textAlign: 'center', lineHeight: 21, marginTop: 8 },
    actionWrap: { width: '100%', maxWidth: 320, marginTop: 26 },
    action: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        height: Layout.buttonHeight,
        borderRadius: Layout.borderRadius,
        gap: 8,
    },
    actionText: { fontSize: 14.5, fontWeight: '800' },
    footnote: { fontSize: 12, textAlign: 'center', lineHeight: 18, marginTop: 16 },
});

export const QiblaMessageState = React.memo(QiblaMessageStateComponent);
QiblaMessageState.displayName = 'QiblaMessageState';
