import React, { useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Path } from 'react-native-svg';
import Animated, {
    Easing,
    FadeInDown,
    FadeInUp,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from 'react-native-reanimated';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';

interface QuranHeaderProps {
    title: string;
    subtitle?: string;
    paddingTop: number;
    onBack: () => void;
    /** Optional slot rendered at the top-right of the header (e.g. reader controls). */
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
 * Premium Quran hero header on brand primary with faint crescent/book decor
 * and a gently floating icon tile — matching the app's other module heroes.
 */
export const QuranHeader = React.memo(({
    title,
    subtitle,
    paddingTop,
    onBack,
    rightSlot,
    arabicTitle,
}: QuranHeaderProps) => {
    const { theme } = useTheme();
    const colors = Colors[theme];

    const float = useSharedValue(0);
    useEffect(() => {
        float.value = withRepeat(
            withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.sin) }),
            -1,
            true
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const floatStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: -3 + float.value * 6 }],
    }));

    return (
        <Animated.View
            entering={FadeInUp.duration(450)}
            style={[styles.container, { backgroundColor: colors.primary, paddingTop }]}
        >
            {/* Faint crescent + geometric decor */}
            <Svg style={StyleSheet.absoluteFill} viewBox="0 0 375 150" preserveAspectRatio="xMinYMin slice">
                <Circle cx={352} cy={0} r={85} fill="rgba(255,255,255,0.05)" />
                <Circle cx={8} cy={150} r={60} fill="rgba(255,255,255,0.04)" />
                {/* crescent moon */}
                <Path
                    d="M300 44 a20 20 0 1 0 14 34 a16 16 0 1 1 -14 -34 z"
                    fill="rgba(255,255,255,0.08)"
                />
                {/* small 4-point star */}
                <Path
                    d="M334 40 l3 7 l7 3 l-7 3 l-3 7 l-3 -7 l-7 -3 l7 -3 z"
                    fill="rgba(255,255,255,0.10)"
                />
                <Circle cx={120} cy={38} r={3} fill={colors.lime} opacity={0.5} />
                <Circle cx={210} cy={118} r={2.5} fill={colors.secondary} opacity={0.55} />
            </Svg>

            {/* Nav row */}
            <View style={styles.navRow}>
                <TouchableOpacity onPress={onBack} style={styles.navButton} activeOpacity={0.8}>
                    <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
                </TouchableOpacity>
                {rightSlot ? <View style={styles.rightSlot}>{rightSlot}</View> : null}
            </View>

            {/* Identity row */}
            <Animated.View entering={FadeInDown.delay(100).duration(450)} style={styles.identityRow}>
                <Animated.View style={[styles.iconTile, floatStyle]}>
                    <Ionicons name="book" size={22} color="#FFFFFF" />
                </Animated.View>
                <View style={styles.identityText}>
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
            </Animated.View>
        </Animated.View>
    );
});

QuranHeader.displayName = 'QuranHeader';

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 20,
        paddingBottom: 18,
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
        overflow: 'hidden',
    },
    navRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: 38,
    },
    navButton: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: 'rgba(255,255,255,0.18)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    rightSlot: {
        flexShrink: 1,
        alignItems: 'flex-end',
    },
    identityRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginTop: 12,
    },
    iconTile: {
        width: 46,
        height: 46,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.16)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    identityText: {
        flex: 1,
    },
    title: {
        fontSize: 19,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 0.2,
    },
    titleArabic: {
        fontFamily: 'NotoNastaliqUrdu-Regular',
        fontSize: 20,
    },
    subtitle: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.8)',
        fontWeight: '500',
        marginTop: 3,
    },
});
