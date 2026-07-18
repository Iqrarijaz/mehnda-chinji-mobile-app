import { Ionicons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import Animated, {
    Easing,
    FadeInDown,
    FadeInUp,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';

interface BusinessRegistrationHeroHeaderProps {
    isEditing: boolean;
    onBack: () => void;
}

function BusinessRegistrationHeroHeaderComponent({
    isEditing,
    onBack,
}: BusinessRegistrationHeroHeaderProps) {
    const { theme } = useTheme();
    const colors = Colors[theme];
    const insets = useSafeAreaInsets();

    const pulse = useSharedValue(0);

    useEffect(() => {
        pulse.value = withRepeat(
            withTiming(1, { duration: 2500, easing: Easing.inOut(Easing.sin) }),
            -1,
            true
        );
    }, []);

    const haloStyle = useAnimatedStyle(() => ({
        opacity: 0.15 + pulse.value * 0.12,
        transform: [{ scale: 1.05 + pulse.value * 0.08 }],
    }));

    const iconStyle = useAnimatedStyle(() => ({
        transform: [{ scale: 1 + pulse.value * 0.03 }],
    }));

    return (
        <Animated.View
            entering={FadeInUp.duration(500)}
            style={[styles.container, { backgroundColor: colors.primary }]}
        >
            {/* Storefront / Business Growth SVG Decor */}
            <Svg
                style={StyleSheet.absoluteFill}
                viewBox="0 0 375 160"
                preserveAspectRatio="xMinYMin slice"
            >
                {/* Large circular background decor */}
                <Circle cx={360} cy={10} r={80} fill="rgba(255,255,255,0.04)" />
                <Circle cx={360} cy={10} r={55} fill="rgba(255,255,255,0.03)" />
                <Circle cx={20} cy={140} r={60} fill="rgba(255,255,255,0.03)" />

                {/* Growth trend line (right side) */}
                <Path
                    d="M260 115 Q290 80 320 90 T380 50"
                    stroke="rgba(255,255,255,0.08)"
                    strokeWidth={2}
                    fill="none"
                />
                <Path
                    d="M260 115 Q290 80 320 90 T380 50 L380 160 L260 160 Z"
                    fill="rgba(255,255,255,0.02)"
                />

                {/* Building / Shop awning contour (left side) */}
                <Path
                    d="M20 70 L80 70 L75 85 L65 85 L60 70 L50 70 L45 85 L35 85 L30 70 L20 70 Z"
                    fill="rgba(255,255,255,0.06)"
                />
                <Rect x={28} y={85} width={44} height={30} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={1.5} />
                <Rect x={42} y={100} width={16} height={15} fill="rgba(255,255,255,0.06)" />

                {/* Accent dots / stars */}
                <Circle cx={170} cy={35} r={3} fill={colors.lime} opacity={0.5} />
                <Circle cx={280} cy={45} r={2.5} fill="rgba(255,255,255,0.2)" />
                <Circle cx={120} cy={110} r={2} fill="rgba(255,255,255,0.15)" />
            </Svg>

            {/* Nav row */}
            <View
                style={[
                    styles.navRow,
                    { paddingTop: insets.top + 4, position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
                ]}
            >
                <TouchableOpacity onPress={onBack} style={styles.navButton} activeOpacity={0.8}>
                    <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
                </TouchableOpacity>
            </View>

            {/* Hero content */}
            <Animated.View
                entering={FadeInDown.delay(150).duration(500)}
                style={[styles.heroContent, { paddingTop: insets.top + 4 }]}
            >
                <View style={styles.iconWrap}>
                    <Animated.View style={[styles.halo, haloStyle]} />
                    <Animated.View style={[styles.iconTile, iconStyle]}>
                        <Ionicons name="storefront" size={20} color={colors.primary} />
                    </Animated.View>
                </View>
                <ThemedText style={styles.heroTitle}>
                    {isEditing ? 'Update Your Listing' : 'Grow Your Business'}
                </ThemedText>
                <ThemedText style={styles.heroSubtitle}>
                    Fill in the details below to list your business in the community directory
                </ThemedText>
            </Animated.View>

            {/* Wave accent line at bottom */}
            <Animated.View entering={FadeInDown.delay(200).duration(450)} style={styles.accentLine}>
                <Svg width="100%" height={12} viewBox="0 0 375 12" preserveAspectRatio="none">
                    <Path
                        d="M0 6 Q94 0 187 6 Q281 12 375 6"
                        stroke="rgba(255,255,255,0.12)"
                        strokeWidth={1.5}
                        fill="none"
                    />
                </Svg>
            </Animated.View>
        </Animated.View>
    );
}

export const BusinessRegistrationHeroHeader = React.memo(BusinessRegistrationHeroHeaderComponent);
BusinessRegistrationHeroHeader.displayName = 'BusinessRegistrationHeroHeader';

const styles = StyleSheet.create({
    container: {
        width: '100%',
        paddingBottom: 12,
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
        overflow: 'hidden',
    },
    navRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 4,
    },
    navButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    heroContent: {
        alignItems: 'center',
        paddingHorizontal: 24,
        marginTop: 2,
    },
    iconWrap: {
        width: 52,
        height: 52,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    halo: {
        position: 'absolute',
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: 'rgba(255, 255, 255, 0.4)',
    },
    iconTile: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 4,
    },
    heroTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#FFFFFF',
        textAlign: 'center',
        letterSpacing: 0.2,
    },
    heroSubtitle: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.8)',
        textAlign: 'center',
        marginTop: 6,
        lineHeight: 18,
    },
    accentLine: {
        width: '100%',
        height: 12,
        marginTop: 4,
    },
});
