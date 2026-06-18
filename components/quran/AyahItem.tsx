import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themedText';

interface AyahItemProps {
    index: number;
    arabicText: string;
    englishText: string;
    showTranslation: boolean;
    isPlaying: boolean;
    isBuffering: boolean;
    primaryColor: string;
    textSecondaryColor: string;
    borderColor: string;
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
    borderColor,
    cardColor,
}: AyahItemProps) => (
    <View style={[
        styles.rowContainer, 
        { 
            borderBottomColor: borderColor,
        }
    ]}>
        {/* Controls Column (Badge Only) */}
        <View style={styles.leftControls}>
            <View style={[
                styles.badge, 
                { 
                    backgroundColor: isPlaying ? primaryColor : (primaryColor + '12'),
                }
            ]}>
                <ThemedText style={[
                    styles.badgeText, 
                    { color: isPlaying ? '#FFFFFF' : primaryColor }
                ]}>
                    {index + 1}
                </ThemedText>
            </View>
        </View>

        {/* Text Content Column */}
        <View style={styles.textContent}>
            <ThemedText style={[
                styles.arabicText, 
                { color: isPlaying ? primaryColor : undefined }
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
));

AyahItem.displayName = 'AyahItem';

const styles = StyleSheet.create({
    rowContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    leftControls: {
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        width: 32,
    },
    badge: {
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    badgeText: { 
        fontSize: 9, 
        fontWeight: 'bold' 
    },
    textContent: {
        flex: 1,
        justifyContent: 'center',
    },
    arabicText: {
        fontSize: 22,
        lineHeight: 38,
        paddingVertical: 4,
        textAlign: 'right',
        writingDirection: 'rtl',
        fontWeight: '400',
        width: '100%',
    },
    translationText: {
        fontSize: 12,
        lineHeight: 18,
        textAlign: 'left',
        marginTop: 6,
        width: '100%',
    },
});
