import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/context/ThemeContext';
import type { ContinueListening } from '@/utils/quranPrefs';

function formatTimestamp(ms: number): string {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

interface ContinueListeningCardProps {
    data: ContinueListening;
    onPress: () => void;
    onDismiss: () => void;
}

/**
 * "Resume Surah X from mm:ss" card pinned above the Surah list — reads the
 * last playback checkpoint written by useSurahPlayer / the reader screen's
 * own player (see utils/quranPrefs.ts's setContinueListening).
 */
export const ContinueListeningCard = React.memo(function ContinueListeningCard({
    data,
    onPress,
    onDismiss,
}: ContinueListeningCardProps) {
    const { theme } = useTheme();
    const colors = Colors[theme];

    return (
        <Animated.View entering={FadeInDown.duration(350)}>
            <TouchableOpacity
                onPress={onPress}
                activeOpacity={0.85}
                style={[styles.card, { backgroundColor: colors.primary }]}
            >
                <View style={styles.iconCircle}>
                    <Ionicons name="book" size={18} color="#FFFFFF" />
                </View>

                <View style={styles.textWrap}>
                    <ThemedText style={styles.label}>CONTINUE LISTENING</ThemedText>
                    <ThemedText style={styles.title} numberOfLines={1}>
                        {`Resume ${data.englishName} from ${formatTimestamp(data.positionMillis)}`}
                    </ThemedText>
                </View>

                <Ionicons name="play-circle" size={30} color="#FFFFFF" />

                <TouchableOpacity onPress={onDismiss} hitSlop={10} style={styles.dismissBtn}>
                    <Ionicons name="close" size={14} color="rgba(255,255,255,0.75)" />
                </TouchableOpacity>
            </TouchableOpacity>
        </Animated.View>
    );
});

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: Layout.cardBorderRadius,
        paddingVertical: 11,
        paddingHorizontal: 12,
        marginBottom: 12,
        gap: 10,
    },
    iconCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    textWrap: { flex: 1 },
    label: {
        fontSize: 9.5,
        fontWeight: '800',
        letterSpacing: 0.6,
        color: 'rgba(255,255,255,0.8)',
    },
    title: {
        fontSize: 13,
        fontWeight: '700',
        color: '#FFFFFF',
        marginTop: 2,
    },
    dismissBtn: {
        marginLeft: 2,
        padding: 2,
    },
});
