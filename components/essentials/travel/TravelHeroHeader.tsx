import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import Svg, { Circle, Path } from 'react-native-svg';
import Animated, {
    Easing,
    FadeInDown,
    FadeInUp,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { capitalizeString } from '@/utils/string';
import { FlowingLine } from './FlowingLine';
import { Layout } from '@/constants/layout';

interface TravelHeroHeaderProps {
    place: any;
    placeName: string;
    isOwner: boolean;
    onBack: () => void;
    onReport: () => void;
    onEdit: () => void;
    primaryColor?: string;
}

/**
 * Compact travel-specific hero. Route-themed decor and motion are pure
 * transform/opacity (plus one dash-offset), presentation only.
 */
export const TravelHeroHeader = React.memo(function TravelHeroHeader({
    place,
    placeName,
    isOwner,
    onBack,
    onReport,
    onEdit,
    primaryColor }: TravelHeroHeaderProps) {
    const { theme } = useTheme();
    const colors = Colors[theme];
    const insets = useSafeAreaInsets();

    const route: any[] = Array.isArray(place?.route) ? place.route : [];
    const origin = route.length > 0 ? capitalizeString(route[0]?.city) : '';
    const destination = route.length > 1 ? capitalizeString(route[route.length - 1]?.city) : '';
    const typeLabel = place?.type ? capitalizeString(place.type) : 'Travel';
    const placeImage = place?.images?.length > 0 ? place.images[0] : null;

    // The vehicle tile gently floats: a soft vertical bob.
    const bob = useSharedValue(0);
    useEffect(() => {
        bob.value = withRepeat(
            withTiming(1, { duration: 1900, easing: Easing.inOut(Easing.sin) }),
            -1,
            true
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const bobStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: -3 + bob.value * 6 }] }));

    const BG = primaryColor || '#0f172a';

    return (
        <Animated.View
            entering={FadeInUp.duration(450)}
            style={[styles.container, { backgroundColor: BG }]}
        >
            {/* Route-inspired background decor */}
            <TravelBackgroundDecor limeColor={colors.lime} secondaryColor={colors.secondary} />

            {/* Nav row */}
            <View
                style={[
                    styles.navRow,
                    { paddingTop: insets.top + (Platform.OS === 'android' ? 16 : 8) },
                ]}
            >
                <TouchableOpacity onPress={onBack} style={styles.navButton} activeOpacity={0.8}>
                    <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
                </TouchableOpacity>
                <View style={styles.navActions}>
                    <TouchableOpacity
                        style={[styles.navButton, { backgroundColor: '#FFFFFF' }]}
                        onPress={onReport}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="flag" size={18} color="#EF4444" />
                    </TouchableOpacity>
                    {isOwner && (
                        <TouchableOpacity
                            style={[styles.navButton, { backgroundColor: '#FFFFFF' }]}
                            onPress={onEdit}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="pencil" size={18} color={colors.primary} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Identity row */}
            <Animated.View
                entering={FadeInDown.delay(100).duration(450)}
                style={styles.identityRow}
            >
                <View style={styles.identityText}>
                    <View style={styles.chipRow}>
                        <View style={[styles.typeChip, { backgroundColor: colors.lime }]}>
                            <Ionicons name="bus" size={11} color="#1E293B" />
                            <ThemedText style={styles.typeChipText}>{typeLabel}</ThemedText>
                        </View>
                    </View>
                    <ThemedText style={styles.title} numberOfLines={2}>
                        {placeName}
                    </ThemedText>
                    {(origin || place?.village) && (
                        <View style={styles.subtitleRow}>
                            <Ionicons name="navigate" size={12} color={colors.secondary} />
                            <ThemedText style={styles.subtitle} numberOfLines={1}>
                                {destination ? `${origin}  ${Array.isArray(place?.returnRoute) && place.returnRoute.length > 0 ? '↔' : '→'}  ${destination}` : origin || capitalizeString(place?.village)}
                            </ThemedText>
                        </View>
                    )}
                </View>

                <Animated.View style={[styles.vehicleTile, bobStyle]}>
                    {placeImage ? (
                        <Image source={{ uri: placeImage }} style={styles.vehicleImage} contentFit="cover" />
                    ) : (
                        <MaterialCommunityIcons name="bus-side" size={34} color="#FFFFFF" />
                    )}
                </Animated.View>
            </Animated.View>

            {/* Origin → destination ribbon */}
            {destination ? (
                <Animated.View
                    entering={FadeInDown.delay(220).duration(450)}
                    style={styles.ribbon}
                >
                    <View style={[styles.ribbonDot, { backgroundColor: colors.lime }]} />
                    <FlowingLine color="rgba(255,255,255,0.45)" style={styles.ribbonLine} />
                    <View style={styles.ribbonBus}>
                        <Ionicons name="bus" size={13} color="#FFFFFF" />
                    </View>
                    <FlowingLine color="rgba(255,255,255,0.45)" style={styles.ribbonLine} />
                    <Ionicons name="location" size={14} color={colors.secondary} />
                </Animated.View>
            ) : null}
        </Animated.View>
    );
});

const styles = StyleSheet.create({
    container: {
        width: '100%',
        paddingBottom: 20,
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
        overflow: 'hidden' },
    navRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 4 },
    navActions: {
        flexDirection: 'row',
        gap: 8 },
    navButton: {
        width: 36,
        height: 36,
        borderRadius: Layout.borderRadius,
        backgroundColor: 'rgba(0,0,0,0.2)',
        justifyContent: 'center',
        alignItems: 'center' },
    identityRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginTop: 8,
        gap: 14 },
    identityText: {
        flex: 1 },
    chipRow: {
        flexDirection: 'row',
        marginBottom: 8 },
    typeChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: Layout.borderRadius },
    typeChipText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#1E293B',
        textTransform: 'uppercase',
        letterSpacing: 0.6 },
    title: {
        fontSize: 21,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 0.2,
        lineHeight: 26 },
    subtitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        marginTop: 5 },
    subtitle: {
        fontSize: 12.5,
        color: 'rgba(255,255,255,0.85)',
        fontWeight: '600',
        flexShrink: 1 },
    vehicleTile: {
        width: 58,
        height: 58,
        borderRadius: Layout.borderRadius,
        backgroundColor: 'rgba(255,255,255,0.16)',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden' },
    vehicleImage: {
        width: '100%',
        height: '100%' },
    ribbon: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        marginTop: 16,
        gap: 8 },
    ribbonDot: {
        width: 8,
        height: 8,
        borderRadius: Layout.borderRadius },
    ribbonLine: {
        flex: 1 },
    ribbonBus: {
        width: 26,
        height: 26,
        borderRadius: Layout.borderRadius,
        backgroundColor: 'rgba(255,255,255,0.18)',
        justifyContent: 'center',
        alignItems: 'center' } });

const TravelBackgroundDecor = React.memo(({ limeColor, secondaryColor }: { limeColor: string; secondaryColor: string }) => (
    <Svg
        style={StyleSheet.absoluteFill}
        viewBox="0 0 375 190"
        preserveAspectRatio="xMinYMin slice"
    >
        <Circle cx={345} cy={5} r={95} fill="rgba(255,255,255,0.06)" />
        <Circle cx={10} cy={185} r={70} fill="rgba(255,255,255,0.05)" />
        <Path
            d="M -20 140 C 70 60, 190 170, 400 55"
            stroke="rgba(255,255,255,0.12)"
            strokeWidth={2}
            strokeDasharray="5 9"
            strokeLinecap="round"
            fill="none"
        />
        <Circle cx={96} cy={97} r={3.5} fill={limeColor} opacity={0.6} />
        <Circle cx={252} cy={118} r={3.5} fill={secondaryColor} opacity={0.65} />
    </Svg>
));
