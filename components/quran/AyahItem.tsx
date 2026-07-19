import React from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';

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
}

export const AyahItem = React.memo(({
    index,
    arabicText,
    englishText,
    showTranslation,
    isPlaying,
    isBuffering,
    primaryColor,
    textSecondaryColor,
}: AyahItemProps) => {
    const { theme } = useTheme();
    const colors = Colors[theme];

    return (
    <View style={[
        styles.rowContainer,
        isPlaying && { backgroundColor: `${primaryColor}0D` },
    ]}>
        {/* Lime accent bar while playing */}
        {isPlaying && <View style={[styles.playingAccent, { backgroundColor: colors.lime }]} />}

        {/* Verse number badge */}
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
        </View>

        {/* Text content */}
        <View style={styles.textContent}>
            <ThemedText style={[
                styles.arabicText,
                { color: isPlaying ? primaryColor : undefined },
            ]}>
                {arabicText.replace(/\s+/g, '   ')}
            </ThemedText>

            {showTranslation && englishText ? (
                <ThemedText style={[styles.translationText, { color: textSecondaryColor }]}>
                    {englishText}
                </ThemedText>
            ) : null}
        </View>
    </View>
    );
});

AyahItem.displayName = 'AyahItem';

const styles = StyleSheet.create({
    rowContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: 14,
        paddingHorizontal: 12,
        borderRadius: 16,
        marginBottom: 6,
    },
    playingAccent: {
        position: 'absolute',
        left: 0,
        top: 16,
        bottom: 16,
        width: 3,
        borderRadius: 2,
    },
    leftControls: {
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        width: 30,
        paddingTop: 6,
    },
    badge: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '800',
    },
    textContent: {
        flex: 1,
        justifyContent: 'center',
    },
    arabicText: {
        fontSize: 24,
        lineHeight: 46,
        paddingVertical: 4,
        textAlign: 'right',
        writingDirection: 'rtl',
        fontWeight: '400',
        width: '100%',
    },
    translationText: {
        fontSize: 13,
        lineHeight: 20,
        textAlign: 'left',
        marginTop: 8,
        width: '100%',
    },
});
