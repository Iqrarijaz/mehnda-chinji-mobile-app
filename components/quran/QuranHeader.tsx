import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { Layout } from '@/constants/layout';
import { BackButton } from '@/components/common/BackButton';

interface QuranHeaderProps {
    title: string;
    subtitle?: string;
    paddingTop: number;
    onBack: () => void;
    /** Optional controls rendered centered below the title (e.g. reader controls). */
    rightSlot?: React.ReactNode;
    /** Render the Arabic surah title in the Nastaliq font (reading screen). */
    arabicTitle?: boolean;
    // Kept for backward compatibility with existing call sites (unused here).
    borderColor?: string;
    cardColor?: string;
    textColor?: string;
    textSecondaryColor?: string;
}

/**
 * Premium Quran compact header on brand primary with faint crescent/star decor.
 * The title sits centered at the top with a custom back button on the left.
 */
export const QuranHeader = memo(({
    title,
    subtitle,
    paddingTop,
    onBack,
    rightSlot,
    arabicTitle }: QuranHeaderProps) => {
    const { theme } = useTheme();
    const colors = Colors[theme];

    return (
        <View
            style={[styles.container, { backgroundColor: colors.primary, paddingTop }]}
        >
            {/* Faint crescent + star decor */}
            <QuranBackgroundDecor lime={colors.lime} secondary={colors.secondary} />

            {/* Title row: back left, title centered */}
            <View style={styles.topRow}>
                <BackButton
                    onPress={onBack}
                    color="#FFFFFF"
                    backgroundColor="rgba(255,255,255,0.18)"
                    size={16}
                    style={styles.navButton}
                />

                <View style={styles.titleWrap}>
                    <ThemedText
                        style={[styles.title, arabicTitle && styles.titleArabic]}
                        numberOfLines={1}
                    >
                        {title}
                    </ThemedText>
                    {subtitle ? (
                        <ThemedText style={styles.subtitle} numberOfLines={1}>{subtitle}</ThemedText>
                    ) : null}
                </View>
            </View>

            {/* Optional controls, centered below the title */}
            {rightSlot ? (
                <View style={styles.controlsRow}>
                    {rightSlot}
                </View>
            ) : null}
        </View>
    );
});

QuranHeader.displayName = 'QuranHeader';

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 13,
        paddingBottom: 10,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        overflow: 'hidden' },
    topRow: {
        minHeight: 34,
        justifyContent: 'center',
        alignItems: 'center' },
    navButton: {
        position: 'absolute',
        left: 0,
        width: 32,
        height: 32,
        borderRadius: Layout.borderRadius },
    titleWrap: {
        alignItems: 'center',
        paddingHorizontal: 40 },
    title: {
        fontSize: 14.5,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 0.2,
        textAlign: 'center' },
    titleArabic: {
        fontFamily: 'NotoNastaliqUrdu-Regular',
        fontSize: 15.5 },
    subtitle: {
        fontSize: 9.5,
        color: 'rgba(255,255,255,0.8)',
        fontWeight: '500',
        marginTop: 2,
        textAlign: 'center' },
    controlsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        flexWrap: 'wrap',
        marginTop: 10 } });

const QuranBackgroundDecor = memo(({ lime, secondary }: { lime: string; secondary: string }) => (
    <Svg style={StyleSheet.absoluteFill} viewBox="0 0 375 130" preserveAspectRatio="xMinYMin slice">
        <Circle cx={352} cy={0} r={80} fill="rgba(255,255,255,0.05)" />
        <Circle cx={8} cy={130} r={55} fill="rgba(255,255,255,0.04)" />
        <Path
            d="M300 40 a18 18 0 1 0 13 31 a14 14 0 1 1 -13 -31 z"
            fill="rgba(255,255,255,0.07)"
        />
        <Path
            d="M58 44 l3 7 l7 3 l-7 3 l-3 7 l-3 -7 l-7 -3 l7 -3 z"
            fill="rgba(255,255,255,0.09)"
        />
        <Circle cx={120} cy={34} r={3} fill={lime} opacity={0.5} />
        <Circle cx={250} cy={96} r={2.5} fill={secondary} opacity={0.6} />
    </Svg>
));
