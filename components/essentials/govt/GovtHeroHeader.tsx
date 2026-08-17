import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import Svg, { Circle, Path, Rect, Line } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { capitalizeString } from '@/utils/string';
import { Layout } from '@/constants/layout';

interface GovtHeroHeaderProps {
    place: any;
    placeName: string;
    isOwner: boolean;
    onBack: () => void;
    onReport: () => void;
    onEdit: () => void;
    primaryColor?: string;
}

/**
 * Authoritative govt-office hero header: deep slate-blue surface, faint
 * civic decor (pillars, shield, seal rings), a slow-pulse icon tile —
 * all presentation-only, actions pass through.
 */
export const GovtHeroHeader = React.memo(function GovtHeroHeader({
    place,
    placeName,
    isOwner,
    onBack,
    onReport,
    onEdit,
    primaryColor }: GovtHeroHeaderProps) {
    const { theme } = useTheme();
    const colors = Colors[theme];
    const insets = useSafeAreaInsets();

    const typeLabel = place?.type ? capitalizeString(place.type) : 'Govt Office';
    const timing = typeof place?.timing === 'string' ? place.timing.trim() : '';
    const area = [place?.village, place?.city].filter(Boolean).map(capitalizeString).join(', ');
    const placeImage = place?.images?.length > 0 ? place.images[0] : null;

    const BG = primaryColor || '#1e2e4a'; // slate-blue government feel

    return (
        <View style={[styles.container, { backgroundColor: BG }]}>
            {/* Civic / institutional decor */}
            <GovtBackgroundDecor limeColor={colors.lime} />

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
                            <Ionicons name="pencil" size={18} color={BG} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Identity row */}
            <View style={styles.identityRow}>
                <View style={styles.identityText}>
                    <View style={styles.chipRow}>
                        <View style={[styles.typeChip, { backgroundColor: colors.lime }]}>
                            <MaterialCommunityIcons name="office-building" size={11} color="#1E293B" />
                            <ThemedText style={styles.typeChipText}>{typeLabel}</ThemedText>
                        </View>
                        {timing ? (
                            <View style={styles.timingChip}>
                                <View style={[styles.timingDot, { backgroundColor: colors.lime }]} />
                                <ThemedText style={styles.timingText} numberOfLines={1}>
                                    {timing}
                                </ThemedText>
                            </View>
                        ) : null}
                    </View>

                    <ThemedText style={styles.title} numberOfLines={2}>
                        {placeName}
                    </ThemedText>

                    <View style={styles.subtitleRow}>
                        <MaterialCommunityIcons name="shield-check-outline" size={12} color="rgba(255,255,255,0.65)" />
                        <ThemedText style={styles.subtitle} numberOfLines={1}>
                            {area ? `Serving ${area}` : 'Government Public Services'}
                        </ThemedText>
                    </View>
                </View>

                <View style={styles.tileWrap}>
                    <View style={styles.halo} />
                    <View style={styles.serviceTile}>
                        {placeImage ? (
                            <Image source={{ uri: placeImage }} style={styles.serviceImage} contentFit="cover" />
                        ) : (
                            <MaterialCommunityIcons name="office-building" size={28} color="#FFFFFF" />
                        )}
                    </View>
                </View>
            </View>

            {/* Bottom accent line */}
            <View style={styles.accentLine}>
                <Svg width="100%" height={12} viewBox="0 0 375 12" preserveAspectRatio="none">
                    <Path
                        d="M0 6 Q94 0 187 6 Q281 12 375 6"
                        stroke="rgba(255,255,255,0.11)"
                        strokeWidth={1.5}
                        fill="none"
                    />
                </Svg>
            </View>
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        width: '100%',
        paddingBottom: 10,
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
        overflow: 'hidden' },
    navRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 13,
        paddingBottom: 4 },
    navActions: { flexDirection: 'row', gap: 8 },
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
        marginTop: 10,
        gap: 14 },
    identityText: { flex: 1 },
    chipRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
        flexWrap: 'wrap' },
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
    timingChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 7,
        paddingVertical: 4,
        borderRadius: Layout.borderRadius,
        backgroundColor: 'rgba(255,255,255,0.14)',
        flexShrink: 1 },
    timingDot: { width: 6, height: 6, borderRadius: Layout.borderRadius },
    timingText: {
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
        color: 'rgba(255,255,255,0.78)',
        fontWeight: '600',
        flexShrink: 1 },
    tileWrap: { width: 58, height: 58, justifyContent: 'center', alignItems: 'center' },
    halo: {
        position: 'absolute',
        width: 58,
        height: 58,
        borderRadius: Layout.borderRadius,
        backgroundColor: 'rgba(255,255,255,0.25)' },
    serviceTile: {
        width: 58,
        height: 58,
        borderRadius: Layout.borderRadius,
        backgroundColor: 'rgba(255,255,255,0.14)',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden' },
    serviceImage: { width: '100%', height: '100%' },
    accentLine: { marginTop: 12, paddingHorizontal: 16 } });

const GovtBackgroundDecor = React.memo(({ limeColor }: { limeColor: string }) => (
    <Svg
        style={StyleSheet.absoluteFill}
        viewBox="0 0 375 185"
        preserveAspectRatio="xMinYMin slice"
    >
        <Circle cx={360} cy={-5} r={95} fill="rgba(255,255,255,0.04)" />
        <Circle cx={360} cy={-5} r={65} fill="rgba(255,255,255,0.04)" />
        <Circle cx={360} cy={-5} r={38} fill="rgba(255,255,255,0.05)" />

        <Rect x={22} y={85} width={9} height={90} rx={3} fill="rgba(255,255,255,0.07)" />
        <Rect x={36} y={85} width={9} height={90} rx={3} fill="rgba(255,255,255,0.07)" />
        <Rect x={50} y={85} width={9} height={90} rx={3} fill="rgba(255,255,255,0.07)" />
        <Rect x={16} y={80} width={50} height={7} rx={2} fill="rgba(255,255,255,0.09)" />
        <Path d="M16 80 L41 55 L66 80 Z" fill="rgba(255,255,255,0.07)" />

        <Path
            d="M230 50 L258 50 L258 78 Q244 92 230 78 Z"
            stroke="rgba(255,255,255,0.09)"
            strokeWidth={1.5}
            fill="rgba(255,255,255,0.04)"
        />
        <Line x1={234} y1={64} x2={254} y2={64} stroke="rgba(255,255,255,0.09)" strokeWidth={1} />

        <Circle cx={160} cy={42} r={3} fill={limeColor} opacity={0.45} />
        <Circle cx={290} cy={130} r={2.5} fill="rgba(255,255,255,0.18)" />
        <Circle cx={195} cy={22} r={2} fill="rgba(255,255,255,0.12)" />
    </Svg>
));
