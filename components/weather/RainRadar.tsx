import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import MapLibreGL, { Camera, MapView, RasterLayer, RasterSource } from '@maplibre/maplibre-react-native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '../ThemedText';
import { getRadarFrames, RadarFrame } from '@/apis/weather';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';

// MapLibre is fully free and needs no API key/token; pass null to satisfy the
// Mapbox-compatible API surface. (Idempotent — LocationPicker also calls this;
// harmless if it runs more than once.)
MapLibreGL?.setAccessToken?.(null);

// Free OpenStreetMap raster tiles as the radar's base map — same source used
// by LocationPicker, kept as a stable stringified style so the map doesn't
// reload (and reset its camera) on every render.
const OSM_STYLE_JSON = JSON.stringify({
    version: 8,
    sources: {
        osm: {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            maxzoom: 19,
            attribution: '© OpenStreetMap contributors' } },
    layers: [{ id: 'osm', type: 'raster', source: 'osm' }] });

const FRAME_INTERVAL_MS = 700;
const MAP_HEIGHT = 220;

function formatFrameTime(unixSec: number): string {
    return new Date(unixSec * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

interface RainRadarProps {
    coords: { lat: number; lon: number } | null;
}

const RainRadar = React.memo(({ coords }: RainRadarProps) => {
    const { theme, isDark } = useTheme();
    const colors = Colors[theme];

    const [activeIndex, setActiveIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const { data, isLoading } = useQuery({
        queryKey: ['radarFrames'],
        queryFn: getRadarFrames,
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 15,
    });

    // Most recent ~1h of past frames + the short nowcast — a nowcast-heavy
    // list would run mostly-empty tiles at the edges of the loop.
    const frames: RadarFrame[] = useMemo(() => {
        if (!data) return [];
        const past = data.past.slice(-6);
        return [...past, ...data.nowcast];
    }, [data]);

    // Default the animation to the latest "now" frame (end of the past list)
    // once frames load, rather than starting mid-history.
    useEffect(() => {
        if (frames.length > 0) setActiveIndex(Math.max(0, (data?.past.slice(-6).length || 1) - 1));
    }, [data]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        if (!isPlaying || frames.length < 2) return;
        timerRef.current = setInterval(() => {
            setActiveIndex(prev => (prev + 1) % frames.length);
        }, FRAME_INTERVAL_MS);
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isPlaying, frames.length]);

    if (!coords) return null;

    const activeFrame = frames[activeIndex];
    const isForecastFrame = !!data && activeIndex >= data.past.slice(-6).length;
    const tileUrl = activeFrame?.tileUrlTemplate ?? null;

    return (
        <View style={[styles.wrapper, { backgroundColor: colors.cardBg }]}>
            <View style={styles.headerRow}>
                <View style={styles.headerLeft}>
                    <Ionicons name="rainy" size={14} color={colors.primary} />
                    <ThemedText style={[styles.title, { color: colors.text }]}>Rain Radar</ThemedText>
                </View>
                {activeFrame ? (
                    <View style={[
                        styles.frameBadge,
                        { backgroundColor: isForecastFrame ? `${colors.secondary}22` : `${colors.lime}22` },
                    ]}>
                        <ThemedText style={[styles.frameBadgeText, { color: isForecastFrame ? colors.secondary : colors.lime }]}>
                            {isForecastFrame ? 'Forecast' : 'Now'} · {formatFrameTime(activeFrame.time)}
                        </ThemedText>
                    </View>
                ) : null}
            </View>

            <View style={[styles.mapCard, { height: MAP_HEIGHT }]}>
                <MapView
                    style={StyleSheet.absoluteFill}
                    mapStyle={OSM_STYLE_JSON}
                    logoEnabled={false}
                    attributionEnabled={true}
                    compassEnabled={false}
                    zoomEnabled
                    scrollEnabled
                    pitchEnabled={false}
                    rotateEnabled={false}
                >
                    <Camera
                        defaultSettings={{
                            centerCoordinate: [coords.lon, coords.lat],
                            zoomLevel: 6 }}
                    />
                    {tileUrl ? (
                        <RasterSource id="radarSource" tileUrlTemplates={[tileUrl]} tileSize={256}>
                            <RasterLayer id="radarLayer" style={{ rasterOpacity: 0.65 }} />
                        </RasterSource>
                    ) : null}
                </MapView>

                {isLoading ? (
                    <View style={[StyleSheet.absoluteFill, styles.mapOverlayCenter]}>
                        <ThemedText style={[styles.loadingText, { color: colors.textSecondary }]}>Loading radar…</ThemedText>
                    </View>
                ) : null}
            </View>

            {frames.length > 1 ? (
                <View style={styles.controlsRow}>
                    <TouchableOpacity
                        onPress={() => setIsPlaying(p => !p)}
                        style={[styles.playBtn, { backgroundColor: colors.primary }]}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        <Ionicons name={isPlaying ? 'pause' : 'play'} size={14} color="#FFFFFF" />
                    </TouchableOpacity>

                    <View style={styles.dotsRow}>
                        {frames.map((_, i) => (
                            <TouchableOpacity
                                key={i}
                                onPress={() => { setIsPlaying(false); setActiveIndex(i); }}
                                hitSlop={{ top: 8, bottom: 6, left: 3, right: 3 }}
                            >
                                <View style={[
                                    styles.dot,
                                    {
                                        backgroundColor: i === activeIndex ? colors.primary : (isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)'),
                                        width: i === activeIndex ? 14 : 5 },
                                ]} />
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            ) : null}
        </View>
    );
});

RainRadar.displayName = 'RainRadar';

export default RainRadar;

const styles = StyleSheet.create({
    wrapper: {
        borderRadius: Layout.borderRadius, padding: 14, marginBottom: 14 },
    headerRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 10, flexWrap: 'wrap', gap: 6 },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    title: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },
    frameBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Layout.borderRadius },
    frameBadgeText: { fontSize: 9.5, fontWeight: '700' },
    mapCard: { borderRadius: Layout.borderRadius, overflow: 'hidden', position: 'relative' },
    mapOverlayCenter: { alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.15)' },
    loadingText: { fontSize: 11, fontWeight: '600', backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: Layout.borderRadius },
    controlsRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
    playBtn: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
    dotsRow: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1, flexWrap: 'wrap' },
    dot: { height: 5, borderRadius: 3 } });
