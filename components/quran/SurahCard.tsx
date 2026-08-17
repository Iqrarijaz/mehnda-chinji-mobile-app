import type { SurahListItem } from '@/apis/quran';
import { ThemedText } from '@/components/ThemedText';
import { PressableScale } from '@/components/essentials/shared/PressableScale';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Layout } from '@/constants/layout';

interface SurahCardProps {
    item: SurahListItem;
    index: number;
    isFav: boolean;
    isDownloaded: boolean;
    isDownloading: boolean;
    downloadProgress: number; // 0..1
    /** True when this surah is the one currently playing in the mini player. */
    isActivePlaying: boolean;
    onPress: () => void;
    onFavToggle: () => void;
    onPlay: () => void;
    onDownload: () => void;
}

const capitalize = (str: string) =>
    str ? str.charAt(0).toUpperCase() + str.slice(1) : str;

export const SurahCard = memo(({
    item,
    index,
    isFav,
    isDownloaded,
    isDownloading,
    downloadProgress,
    isActivePlaying,
    onPress,
    onFavToggle,
    onPlay,
    onDownload }: SurahCardProps) => {
    const { theme } = useTheme();
    const colors = Colors[theme];

    return (
        <View>
            <PressableScale
                intensity={0.02}
                onPress={onPress}
                style={[styles.card, { backgroundColor: colors.cardBg }]}
            >
                {/* Top row: number, names, arabic */}
                <View style={styles.topRow}>
                    <View style={[styles.numberTile, { backgroundColor: `${colors.secondary}1A` }]}>
                        <ThemedText style={[styles.numberText, { color: colors.secondary }]}>
                            {item.number}
                        </ThemedText>
                    </View>

                    <View style={styles.info}>
                        <ThemedText style={[styles.englishName, { color: colors.text }]} numberOfLines={1}>
                            {item.englishName}
                        </ThemedText>
                        <View style={styles.metaRow}>
                            <ThemedText style={[styles.metaText, { color: colors.textSecondary }]} numberOfLines={1}>
                                {capitalize(item.revelationType)}
                            </ThemedText>
                            <View style={[styles.dot, { backgroundColor: colors.textSecondary }]} />
                            <ThemedText style={[styles.metaText, { color: colors.textSecondary }]}>
                                {item.numberOfAyahs} verses
                            </ThemedText>
                        </View>
                    </View>

                    <ThemedText style={[styles.arabicName, { color: colors.primary }]} numberOfLines={1}>
                        {item.name}
                    </ThemedText>
                </View>

                {/* Action row: Play, Download, Favourite */}
                <View style={styles.actionRow}>
                    <TouchableOpacity
                        onPress={onPlay}
                        activeOpacity={0.85}
                        style={[styles.playBtn, { backgroundColor: colors.primary }]}
                        hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                    >
                        <Ionicons name={isActivePlaying ? 'pause' : 'play'} size={13} color="#FFFFFF" />
                        <ThemedText style={styles.playBtnText}>{isActivePlaying ? 'Pause' : 'Play'}</ThemedText>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={isDownloaded || isDownloading ? undefined : onDownload}
                        disabled={isDownloaded || isDownloading}
                        activeOpacity={0.85}
                        style={[
                            styles.downloadBtn,
                            {
                                backgroundColor: isDownloaded ? `${colors.lime}1E` : `${colors.primary}0D` },
                        ]}
                        hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                    >
                        {isDownloading ? (
                            <>
                                <ActivityIndicator size="small" color={colors.primary} />
                                <ThemedText style={[styles.downloadText, { color: colors.primary }]}>
                                    {Math.round(downloadProgress * 100)}%
                                </ThemedText>
                            </>
                        ) : isDownloaded ? (
                            <>
                                <Ionicons name="checkmark-circle" size={14} color={colors.lime} />
                                <ThemedText style={[styles.downloadText, { color: colors.primary }]}>
                                    Saved
                                </ThemedText>
                            </>
                        ) : (
                            <>
                                <Ionicons name="download-outline" size={14} color={colors.primary} />
                                <ThemedText style={[styles.downloadText, { color: colors.primary }]}>
                                    Download
                                </ThemedText>
                            </>
                        )}
                    </TouchableOpacity>

                    <View style={{ flex: 1 }} />

                    <TouchableOpacity
                        onPress={onFavToggle}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        style={styles.favButton}
                    >
                        <Ionicons
                            name={isFav ? 'heart' : 'heart-outline'}
                            size={20}
                            color={isFav ? '#EF4444' : colors.textSecondary}
                        />
                    </TouchableOpacity>
                </View>
            </PressableScale>
        </View>
    );
});

SurahCard.displayName = 'SurahCard';

const styles = StyleSheet.create({
    card: {
        borderRadius: Layout.borderRadius,
        padding: 11,
        marginBottom: 12,
        gap: 12 },
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12 },
    numberTile: {
        width: 40,
        height: 40,
        borderRadius: Layout.borderRadius,
        justifyContent: 'center',
        alignItems: 'center' },
    numberText: { fontSize: 11.5, fontWeight: '800' },
    info: { flex: 1 },
    englishName: {
        fontSize: 12.5,
        fontWeight: '800',
        letterSpacing: 0.1 },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 3 },
    metaText: { fontSize: 10, fontWeight: '500' },
    dot: {
        width: 3,
        height: 3,
        borderRadius: Layout.borderRadius,
        marginHorizontal: 6,
        opacity: 0.5 },
    arabicName: {
        fontSize: 15.5,
        fontFamily: 'NotoNastaliqUrdu-Regular',
        fontWeight: 'bold',
        textAlign: 'right',
        maxWidth: 120 },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8 },
    playBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 11,
        height: 32,
        borderRadius: Layout.borderRadius },
    playBtnText: {
        color: '#FFFFFF',
        fontSize: 10.5,
        fontWeight: '800',
        letterSpacing: 0.2 },
    downloadBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 10,
        height: 32,
        borderRadius: Layout.borderRadius },
    downloadText: {
        fontSize: 10.5,
        fontWeight: '700' },
    favButton: {
        padding: 4 } });
