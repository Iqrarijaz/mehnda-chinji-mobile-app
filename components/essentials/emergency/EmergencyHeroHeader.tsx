import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import Svg, { Circle, Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { capitalizeString } from '@/utils/string';
import { Layout } from '@/constants/layout';

// Two heartbeats across the ribbon; ~470 units of stroke including zigzags.
const ECG_PATH =
    'M0 20 H84 L96 20 L104 4 L114 34 L122 20 H196 L208 20 L216 8 L226 32 L234 20 H340';
const ECG_SWEEP = 560;

interface EmergencyHeroHeaderProps {
    place: any;
    placeName: string;
    isOwner: boolean;
    onBack: () => void;
    onReport: () => void;
    onEdit: () => void;
    primaryColor?: string;
}

/**
 * Compact emergency hero: calm brand palette, heartbeat sweep, and a softly
 * pulsing service tile. Presentation only — nav actions passed straight through.
 */
export const EmergencyHeroHeader = React.memo(function EmergencyHeroHeader({
    place,
    placeName,
    isOwner,
    onBack,
    onReport,
    onEdit,
    primaryColor }: EmergencyHeroHeaderProps) {
    const { theme } = useTheme();
    const colors = Colors[theme];
    const insets = useSafeAreaInsets();

    const typeLabel = place?.type ? capitalizeString(place.type) : 'Emergency';
    const timing = typeof place?.timing === 'string' ? place.timing.trim() : '';
    const area = [place?.village, place?.city].filter(Boolean).map(capitalizeString).join(', ');
    const placeImage = place?.images?.length > 0 ? place.images[0] : null;

    const BG = primaryColor || '#b91c1c';

    return (
        <View style={[styles.container, { backgroundColor: BG }]}>
            {/* Emergency-themed decor: faint shield, cross, and circles */}
            <EmergencyBackgroundDecor limeColor={colors.lime} secondaryColor={colors.secondary} />

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
            <View style={styles.identityRow}>
                <View style={styles.identityText}>
                    <View style={styles.chipRow}>
                        <View style={[styles.typeChip, { backgroundColor: colors.lime }]}>
                            <Ionicons name="medkit" size={11} color="#1E293B" />
                            <ThemedText style={styles.typeChipText}>{typeLabel}</ThemedText>
                        </View>
                        {timing ? (
                            <View style={styles.availabilityChip}>
                                <View style={[styles.availabilityDot, { backgroundColor: colors.lime }]} />
                                <ThemedText style={styles.availabilityText} numberOfLines={1}>
                                    {timing}
                                </ThemedText>
                            </View>
                        ) : null}
                    </View>
                    <ThemedText style={styles.title} numberOfLines={2}>
                        {placeName}
                    </ThemedText>
                    <View style={styles.subtitleRow}>
                        <Ionicons name="shield-checkmark" size={12} color={colors.secondary} />
                        <ThemedText style={styles.subtitle} numberOfLines={1}>
                            {area ? `Serving ${area}` : 'Ready to respond when it matters'}
                        </ThemedText>
                    </View>
                </View>

                <View style={styles.tileWrap}>
                    <View style={[styles.pulseRing, styles.pulseRingSlow]} />
                    <View style={styles.pulseRing} />
                    <View style={styles.serviceTile}>
                        {placeImage ? (
                            <Image source={{ uri: placeImage }} style={styles.serviceImage} contentFit="cover" />
                        ) : (
                            <Ionicons name="medkit" size={28} color="#FFFFFF" />
                        )}
                    </View>
                </View>
            </View>

            {/* Heartbeat ribbon */}
            <View style={styles.ecgWrap}>
                <Svg width="100%" height={40} viewBox="0 0 340 40" preserveAspectRatio="none">
                    <Path
                        d={ECG_PATH}
                        stroke="rgba(255,255,255,0.22)"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                    />
                    <Path
                        d={ECG_PATH}
                        stroke={colors.lime}
                        strokeWidth={2.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                        strokeDasharray={`70 ${ECG_SWEEP - 70}`}
                    />
                </Svg>
            </View>
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        width: '100%',
        paddingBottom: 8,
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
        overflow: 'hidden' },
    navRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 13,
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
        paddingHorizontal: 16,
        marginTop: 8,
        gap: 14 },
    identityText: {
        flex: 1 },
    chipRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8 },
    typeChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: Layout.borderRadius },
    typeChipText: {
        fontSize: 9,
        fontWeight: '800',
        color: '#1E293B',
        textTransform: 'uppercase',
        letterSpacing: 0.6 },
    availabilityChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 7,
        paddingVertical: 4,
        borderRadius: Layout.borderRadius,
        backgroundColor: 'rgba(255,255,255,0.16)',
        flexShrink: 1 },
    availabilityDot: {
        width: 6,
        height: 6,
        borderRadius: Layout.borderRadius },
    availabilityText: {
        fontSize: 9,
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: 0.4,
        textTransform: 'uppercase',
        flexShrink: 1 },
    title: {
        fontSize: 17.5,
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
        fontSize: 11,
        color: 'rgba(255,255,255,0.85)',
        fontWeight: '600',
        flexShrink: 1 },
    tileWrap: {
        width: 58,
        height: 58,
        justifyContent: 'center',
        alignItems: 'center' },
    pulseRing: {
        position: 'absolute',
        width: 58,
        height: 58,
        borderRadius: Layout.borderRadius,
        backgroundColor: 'rgba(255,255,255,0.35)' },
    serviceTile: {
        width: 58,
        height: 58,
        borderRadius: Layout.borderRadius,
        backgroundColor: 'rgba(255,255,255,0.16)',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden' },
    serviceImage: {
        width: '100%',
        height: '100%' },
    ecgWrap: {
        marginTop: 10,
        paddingHorizontal: 16 } });

const EmergencyBackgroundDecor = React.memo(({ limeColor, secondaryColor }: { limeColor: string; secondaryColor: string }) => (
    <Svg
        style={StyleSheet.absoluteFill}
        viewBox="0 0 375 190"
        preserveAspectRatio="xMinYMin slice"
    >
        <Circle cx={350} cy={0} r={95} fill="rgba(255,255,255,0.06)" />
        <Circle cx={5} cy={190} r={70} fill="rgba(255,255,255,0.05)" />
        <Path
            d="M300 118 l26 -10 l26 10 v20 c0 16 -12 28 -26 34 c-14 -6 -26 -18 -26 -34 z"
            stroke="rgba(255,255,255,0.10)"
            strokeWidth={2}
            fill="none"
        />
        <Path
            d="M52 84 h8 v-8 h8 v8 h8 v8 h-8 v8 h-8 v-8 h-8 z"
            fill="rgba(255,255,255,0.10)"
        />
        <Circle cx={120} cy={52} r={3.5} fill={limeColor} opacity={0.55} />
        <Circle cx={268} cy={70} r={3.5} fill={secondaryColor} opacity={0.6} />
    </Svg>
));
