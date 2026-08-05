import type { SurahListItem } from '@/apis/quran';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { memo, useRef } from 'react';
import { ActivityIndicator, GestureResponderEvent, LayoutChangeEvent, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Layout } from '@/constants/layout';

interface MiniAudioPlayerProps {
    surah: SurahListItem;
    isPlaying: boolean;
    isLoading: boolean;
    ayahIndex: number;
    total: number;
    position: number;
    duration: number;
    onToggle: () => void;
    onNext: () => void;
    onPrev: () => void;
    onSeek: (ratio: number) => void;
    onClose: () => void;
    bottomInset: number;
}

/**
 * Bottom media-player bar for inline Surah audio: play/pause, verse
 * navigation, a seekable progress line, and close. Lives above the tab bar.
 */
export const MiniAudioPlayer = memo(({
    surah,
    isPlaying,
    isLoading,
    ayahIndex,
    total,
    position,
    duration,
    onToggle,
    onNext,
    onPrev,
    onSeek,
    onClose,
    bottomInset }: MiniAudioPlayerProps) => {
    const { theme } = useTheme();
    const colors = Colors[theme];
    const trackWidth = useRef(0);

    const ratio = duration > 0 ? Math.min(1, position / duration) : 0;

    const onTrackLayout = (e: LayoutChangeEvent) => {
        trackWidth.current = e.nativeEvent.layout.width;
    };

    const onTrackPress = (e: GestureResponderEvent) => {
        if (trackWidth.current > 0) {
            onSeek(e.nativeEvent.locationX / trackWidth.current);
        }
    };

    return (
        <Animated.View
            entering={FadeInUp.duration(300)}
            style={[styles.container, { backgroundColor: colors.primary, paddingBottom: bottomInset + 8 }]}
        >
            <View style={styles.row}>
                {/* Play / Pause */}
                <TouchableOpacity
                    onPress={onToggle}
                    activeOpacity={0.85}
                    style={[styles.playBtn, { backgroundColor: '#FFFFFF' }]}
                >
                    {isLoading ? (
                        <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                        <Ionicons name={isPlaying ? 'pause' : 'play'} size={18} color={colors.primary} />
                    )}
                </TouchableOpacity>

                {/* Title + verse counter */}
                <View style={styles.info}>
                    <ThemedText style={styles.title} numberOfLines={1}>
                        {surah.englishName}
                    </ThemedText>
                    <ThemedText style={[styles.counter, { color: colors.lime }]} numberOfLines={1}>
                        Verse {ayahIndex + 1}{total ? ` / ${total}` : ''}
                    </ThemedText>
                </View>

                {/* Prev / Next */}
                <TouchableOpacity onPress={onPrev} style={styles.stepBtn} hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}>
                    <Ionicons name="play-skip-back" size={16} color="rgba(255,255,255,0.9)" />
                </TouchableOpacity>
                <TouchableOpacity onPress={onNext} style={styles.stepBtn} hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}>
                    <Ionicons name="play-skip-forward" size={16} color="rgba(255,255,255,0.9)" />
                </TouchableOpacity>

                {/* Close */}
                <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="close" size={18} color="rgba(255,255,255,0.85)" />
                </TouchableOpacity>
            </View>

            {/* Seekable progress line */}
            <TouchableOpacity activeOpacity={1} onPress={onTrackPress} onLayout={onTrackLayout} style={styles.track}>
                <View style={styles.trackBg} />
                <View style={[styles.trackFill, { width: `${ratio * 100}%`, backgroundColor: colors.lime }]} />
                <View style={[styles.thumb, { left: `${ratio * 100}%`, backgroundColor: colors.lime }]} />
            </TouchableOpacity>
        </Animated.View>
    );
});

MiniAudioPlayer.displayName = 'MiniAudioPlayer';

const styles = StyleSheet.create({
    container: {
        paddingTop: 8,
        paddingHorizontal: 11,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28 },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10 },
    playBtn: {
        width: 40,
        height: 40,
        borderRadius: Layout.borderRadius,
        justifyContent: 'center',
        alignItems: 'center' },
    info: {
        flex: 1 },
    title: {
        fontSize: 12.5,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 0.2 },
    counter: {
        fontSize: 10,
        fontWeight: '700',
        marginTop: 1 },
    stepBtn: {
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center' },
    closeBtn: {
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center' },
    track: {
        height: 20,
        justifyContent: 'center',
        marginTop: 6 },
    trackBg: {
        height: 4,
        borderRadius: Layout.borderRadius,
        backgroundColor: 'rgba(255,255,255,0.22)' },
    trackFill: {
        position: 'absolute',
        left: 0,
        height: 4,
        borderRadius: Layout.borderRadius },
    thumb: {
        position: 'absolute',
        width: 12,
        height: 12,
        borderRadius: Layout.borderRadius,
        marginLeft: -6 } });
