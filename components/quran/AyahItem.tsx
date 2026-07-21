import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { memo, useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Layout } from '@/constants/layout';

interface AyahItemProps {
    index: number;
    arabicText: string;
    englishText: string;
    showTranslation: boolean;
    isPlaying: boolean;
    isBuffering: boolean;
    primaryColor: string;
    textSecondaryColor: string;
    borderColor?: string;
    cardColor: string;
    fontSize: number;
    isBookmarked: boolean;
    onLongPress: (index: number) => void;
}

export const AyahItem = memo(({
    index,
    arabicText,
    englishText,
    showTranslation,
    isPlaying,
    isBuffering,
    primaryColor,
    textSecondaryColor,
    fontSize,
    isBookmarked,
    onLongPress }: AyahItemProps) => {
    const { theme } = useTheme();
    const colors = Colors[theme];

    const spacedText = useMemo(() => arabicText.replace(/\s+/g, '   '), [arabicText]);
    const baseColor = isPlaying ? primaryColor : colors.text;

    const arabicStyle = [
        styles.arabicText,
        { fontSize, lineHeight: fontSize * 1.9, color: baseColor },
    ];

    return (
        <Pressable
            onLongPress={() => onLongPress(index)}
            delayLongPress={280}
            style={({ pressed }) => [
                styles.rowContainer,
                isPlaying && { backgroundColor: `${primaryColor}0D` },
                pressed && { backgroundColor: `${primaryColor}12` },
            ]}
        >
            {/* Lime accent bar while playing */}
            {isPlaying && <View style={[styles.playingAccent, { backgroundColor: colors.lime }]} />}

            {/* Verse number badge + bookmark indicator */}
            <View style={styles.leftControls}>
                <View style={[
                    styles.badge,
                    { backgroundColor: isPlaying ? primaryColor : `${primaryColor}12` },
                ]}>
                    {isBuffering ? (
                        <ActivityIndicator size="small" color={isPlaying ? '#FFFFFF' : colors.secondary} />
                    ) : (
                        <ThemedText style={[
                            styles.badgeText,
                            { color: isPlaying ? '#FFFFFF' : primaryColor },
                        ]}>
                            {index + 1}
                        </ThemedText>
                    )}
                </View>
                {isBookmarked && (
                    <Ionicons name="bookmark" size={13} color={colors.secondary} style={{ marginTop: 6 }} />
                )}
            </View>

            {/* Text content */}
            <View style={styles.textContent}>
                <ThemedText style={arabicStyle}>{spacedText}</ThemedText>

                {showTranslation && englishText ? (
                    <ThemedText style={[styles.translationText, { color: textSecondaryColor }]}>
                        {englishText}
                    </ThemedText>
                ) : null}
            </View>
        </Pressable>
    );
});

AyahItem.displayName = 'AyahItem';

const styles = StyleSheet.create({
    rowContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: 14,
        paddingHorizontal: 12,
        borderRadius: Layout.borderRadius,
        marginBottom: 6 },
    playingAccent: {
        position: 'absolute',
        left: 0,
        top: 16,
        bottom: 16,
        width: 3,
        borderRadius: Layout.borderRadius },
    leftControls: {
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        width: 30,
        paddingTop: 6 },
    badge: {
        width: 28,
        height: 28,
        borderRadius: Layout.borderRadius,
        justifyContent: 'center',
        alignItems: 'center' },
    badgeText: {
        fontSize: 11,
        fontWeight: '800' },
    textContent: {
        flex: 1,
        justifyContent: 'center' },
    arabicText: {
        paddingVertical: 4,
        textAlign: 'right',
        writingDirection: 'rtl',
        fontWeight: '400',
        width: '100%' },
    translationText: {
        fontSize: 13,
        lineHeight: 20,
        textAlign: 'left',
        marginTop: 8,
        width: '100%' } });
