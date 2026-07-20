import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    TouchableOpacity,
    Modal,
    TextInput,
    FlatList,
    ActivityIndicator,
    StyleSheet,
    Platform,
    KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import MapLibreGL, { MapView, Camera, Logger } from '@maplibre/maplibre-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import {
    searchPlaces,
    reverseGeocode,
    getCurrentCoords,
    PlaceResult,
} from '@/utils/locationService';
import { SubmitButton } from './SubmitButton';
import { LocationLoadingModal } from './LocationLoadingModal';

// MapLibre is fully free and needs no API key/token; pass null to satisfy the
// Mapbox-compatible API surface.
MapLibreGL?.setAccessToken?.(null);

// MapLibre logs a benign per-tile "Request failed … Canceled" warning whenever
// the viewport changes before a tile finishes loading (normal while panning).
// Raise the log level so these don't spam the console.
Logger?.setLogLevel?.('error');

// Free OpenStreetMap raster tiles — no API key, no Google dependency.
const OSM_STYLE = {
    version: 8,
    sources: {
        osm: {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            maxzoom: 19,
            attribution: '© OpenStreetMap contributors',
        },
    },
    layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
};

// Stable stringified style — passing a fresh string each render makes MapView
// reload the style, which resets the camera and cancels tile requests.
const OSM_STYLE_JSON = JSON.stringify(OSM_STYLE);

export interface LocationValue {
    latitude: number;
    longitude: number;
    address?: string;
}

interface LocationPickerProps {
    label?: string;
    value: LocationValue | null;
    onChange: (value: LocationValue | null) => void;
    delay?: number;
    variant?: 'default' | 'icon' | 'button';
}

export function LocationPicker({ label = 'LOCATION', value, onChange, delay = 0, variant = 'default' }: LocationPickerProps) {
    const { theme, isDark } = useTheme();
    const colors = Colors[theme];
    const insets = useSafeAreaInsets();

    const [modalVisible, setModalVisible] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<PlaceResult[]>([]);
    const [searching, setSearching] = useState(false);
    const [locating, setLocating] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const skipSearchRef = useRef(false);

    const cameraRef = useRef<Camera>(null);
    const [selectedCoord, setSelectedCoord] = useState<{ latitude: number; longitude: number } | null>(
        value ? { latitude: value.latitude, longitude: value.longitude } : null
    );

    useEffect(() => {
        if (value) {
            setSelectedCoord({ latitude: value.latitude, longitude: value.longitude });
        } else {
            setSelectedCoord(null);
        }
    }, [value]);

    const AnimatedView = delay > 0 ? Animated.View : View;
    const animatedProps = delay > 0 ? { entering: FadeInDown.delay(delay) } : {};

    const inputBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.035)';

    // Debounced Nominatim search.
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        // Skip the search that a programmatic setQuery (e.g. picking a result)
        // would otherwise trigger — it would re-open the dropdown over the map.
        if (skipSearchRef.current) {
            skipSearchRef.current = false;
            return;
        }
        if (query.trim().length < 3) {
            setResults([]);
            setSearching(false);
            return;
        }
        setSearching(true);
        debounceRef.current = setTimeout(async () => {
            const found = await searchPlaces(query);
            setResults(found);
            setSearching(false);
        }, 600);

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [query]);

    const moveCamera = (latitude: number, longitude: number, zoomLevel?: number) => {
        cameraRef.current?.setCamera({
            centerCoordinate: [longitude, latitude], // MapLibre uses [lng, lat]
            ...(zoomLevel != null ? { zoomLevel } : {}), // omit to preserve current zoom
            animationDuration: 600,
        });
    };

    // Tapping the map recenters the camera there; the fixed center pin (and
    // selectedCoord, via onRegionDidChange) then reflects that exact point.
    const handleMapPress = (feature: any) => {
        const coords = feature?.geometry?.coordinates;
        if (Array.isArray(coords) && coords.length === 2) {
            setResults([]);
            setSelectedCoord({ latitude: coords[1], longitude: coords[0] });
            moveCamera(coords[1], coords[0]);
        }
    };

    // Keep the selection locked to whatever is under the center pin as the map
    // moves (pan, fly-to, current location). Guarantees the marker is centered.
    const handleRegionChange = (feature: any) => {
        const coords = feature?.geometry?.coordinates;
        if (Array.isArray(coords) && coords.length === 2) {
            setSelectedCoord({ latitude: coords[1], longitude: coords[0] });
        }
    };

    const selectPlace = (place: PlaceResult) => {
        setSelectedCoord({ latitude: place.latitude, longitude: place.longitude });
        moveCamera(place.latitude, place.longitude, 14);
        setResults([]);
        skipSearchRef.current = true;
        setQuery(place.displayName);
    };

    const useCurrentLocation = async () => {
        setLocating(true);
        try {
            const coords = await getCurrentCoords({ requestPermission: true });
            if (!coords) return;

            setSelectedCoord({ latitude: coords.latitude, longitude: coords.longitude });
            moveCamera(coords.latitude, coords.longitude, 15);
            setResults([]);
        } finally {
            setLocating(false);
        }
    };

    const handleConfirm = async () => {
        if (!selectedCoord) {
            closeModal();
            return;
        }
        setLocating(true);
        const address = await reverseGeocode(selectedCoord.latitude, selectedCoord.longitude);
        onChange({
            latitude: selectedCoord.latitude,
            longitude: selectedCoord.longitude,
            address: address || 'Selected location',
        });
        setLocating(false);
        closeModal();
    };

    const clearLocation = () => {
        onChange(null);
        closeModal();
    };

    const closeModal = () => {
        setModalVisible(false);
        setQuery('');
        setResults([]);
        setSearching(false);
    };

    const displayLabel = value?.address
        ? value.address
        : value
            ? `${value.latitude.toFixed(5)}, ${value.longitude.toFixed(5)}`
            : '';

    return (
        <AnimatedView {...animatedProps} style={variant === 'default' ? styles.field : undefined}>
            {variant === 'default' ? (
                <>
                    <View style={styles.labelRow}>
                        <ThemedText style={[styles.label, { color: colors.text }]}>
                            {label} <ThemedText style={{ color: colors.icon, fontWeight: '400' }}>(Optional)</ThemedText>
                        </ThemedText>
                        {value ? (
                            <TouchableOpacity onPress={() => onChange(null)} hitSlop={8}>
                                <ThemedText style={{ color: '#EF4444', fontSize: 12, fontWeight: '700' }}>Remove</ThemedText>
                            </TouchableOpacity>
                        ) : null}
                    </View>

                    <TouchableOpacity
                        style={[styles.trigger, { backgroundColor: inputBg, minHeight: 80, paddingVertical: 12, alignItems: 'flex-start' }]}
                        onPress={() => setModalVisible(true)}
                        activeOpacity={0.7}
                    >
                        <Ionicons
                            name={value ? 'location' : 'location-outline'}
                            size={18}
                            color={value ? colors.primary : colors.icon}
                            style={{ marginRight: 10, marginTop: 2 }}
                        />
                        <ThemedText
                            style={[styles.triggerText, { color: value ? colors.text : colors.icon, marginTop: 1 }]}
                        >
                            {value ? displayLabel : 'Search or use current location'}
                        </ThemedText>
                        <Ionicons name="chevron-forward" size={16} color={colors.icon} style={{ marginTop: 2 }} />
                    </TouchableOpacity>
                </>
            ) : variant === 'button' ? (
                <TouchableOpacity
                    onPress={() => setModalVisible(true)}
                    style={{ backgroundColor: colors.lime, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, flexDirection: 'row', alignItems: 'center' }}
                >
                    <Ionicons name="location" size={12} color="#FFF" style={{ marginRight: 4 }} />
                    <ThemedText style={{ color: '#FFF', fontSize: 10, fontWeight: '600' }}>{label === 'LOCATION' ? 'Current Location' : label}</ThemedText>
                </TouchableOpacity>
            ) : (
                <TouchableOpacity onPress={() => setModalVisible(true)} hitSlop={8}>
                    <Ionicons name="location" size={20} color={colors.lime} />
                </TouchableOpacity>
            )}

            <Modal visible={modalVisible} animationType="slide" transparent={true} onRequestClose={closeModal}>
                <View style={[styles.modalOverlayFS, { backgroundColor: colors.background }]}>
                    {/* Header */}
                    <View style={[styles.modalHeaderFS, { backgroundColor: 'transparent', paddingTop: Math.max(insets.top, 20) }]}>
                        <TouchableOpacity onPress={closeModal} hitSlop={8} style={{ padding: 8, backgroundColor: '#FFF', borderRadius: 24, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 4 }}>
                            <Ionicons name="arrow-back" size={24} color="#000" />
                        </TouchableOpacity>
                        <SubmitButton
                            title="Done"
                            onPress={handleConfirm}
                            disabled={!selectedCoord}
                            isLoading={locating}
                            style={{ height: 36, minWidth: 80, paddingHorizontal: 16 }}
                        />
                    </View>

                    <View style={{ flex: 1, position: 'relative' }}>
                        <MapView
                            style={{ flex: 1 }}
                            mapStyle={OSM_STYLE_JSON}
                            logoEnabled={false}
                            attributionEnabled={true}
                            onPress={handleMapPress}
                            onRegionDidChange={handleRegionChange}
                        >
                            <Camera
                                ref={cameraRef}
                                defaultSettings={{
                                    centerCoordinate: value
                                        ? [value.longitude, value.latitude]
                                        : [69.3451, 30.3753], // Pakistan
                                    zoomLevel: value ? 13 : 4,
                                }}
                            />
                        </MapView>

                        {/* Fixed center pin — the selection is always whatever the
                            map is centered on, so the marker is guaranteed centered. */}
                        <View pointerEvents="none" style={styles.centerPinWrap}>
                            <Ionicons
                                name="location"
                                size={44}
                                color={colors.primary}
                                style={{ transform: [{ translateY: -22 }] }}
                            />
                        </View>

                        {/* Floating Search overlay */}
                        <View style={[styles.floatingSearchContainer, { top: Math.max(insets.top, 20) + 60 }]}>
                            <View style={[styles.searchBoxFS, { backgroundColor: colors.background, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 4 }]}>
                                <Ionicons name="search" size={18} color={colors.icon} style={{ marginRight: 8 }} />
                                <TextInput
                                    style={[styles.searchInput, { color: colors.text }]}
                                    placeholder="Search an address or place"
                                    placeholderTextColor={colors.icon}
                                    value={query}
                                    onChangeText={setQuery}
                                    returnKeyType="search"
                                />
                                {searching ? <ActivityIndicator size="small" color={colors.primary} /> : null}
                            </View>

                            {results.length > 0 && (
                                <FlatList
                                    data={results}
                                    keyExtractor={(item, index) => `${item.latitude}-${item.longitude}-${index}`}
                                    keyboardShouldPersistTaps="handled"
                                    style={[styles.resultsListFS, { backgroundColor: colors.background, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 4 }]}
                                    renderItem={({ item }) => (
                                        <TouchableOpacity
                                            style={[styles.resultRow, { borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}
                                            onPress={() => selectPlace(item)}
                                            activeOpacity={0.7}
                                        >
                                            <Ionicons name="location-outline" size={18} color={colors.icon} style={{ marginRight: 10, marginTop: 2 }} />
                                            <ThemedText style={[styles.resultText, { color: colors.text }]} numberOfLines={2}>
                                                {item.displayName}
                                            </ThemedText>
                                        </TouchableOpacity>
                                    )}
                                />
                            )}
                        </View>

                        {/* Floating Current Location Button */}
                        <TouchableOpacity
                            style={[styles.floatingCurrentLocBtn, { bottom: Math.max(insets.bottom, 20) + 10 }]}
                            onPress={useCurrentLocation}
                            activeOpacity={0.8}
                        >
                            <View style={{ backgroundColor: colors.lime, padding: 12, borderRadius: 30, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 5, elevation: 5 }}>
                                <Ionicons name="navigate" size={24} color="#FFF" />
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Premium location-fetch loading modal (presents over the map) */}
            <LocationLoadingModal visible={locating} />
        </AnimatedView>
    );
}

const styles = StyleSheet.create({
    field: { gap: 6 },
    labelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingRight: 4,
    },
    label: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.5,
        marginLeft: 2,
    },
    trigger: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        paddingHorizontal: 14,
    },
    triggerText: {
        flex: 1,
        fontSize: 14,
        fontWeight: '500',
        marginRight: 8,
    },
    modalOverlayFS: {
        flex: 1,
        width: '100%',
        height: '100%',
        borderRadius: 24,
        overflow: 'hidden',
        padding: 0,
    },
    modalHeaderFS: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'ios' ? 16 : 16,
        paddingBottom: 12,
        zIndex: 30,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    floatingSearchContainer: {
        position: 'absolute',
        top: 70,
        left: 16,
        right: 16,
        zIndex: 20,
    },
    searchBoxFS: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        paddingHorizontal: 14,
        height: 50,
    },
    searchInput: { flex: 1, fontSize: 14 },
    resultsListFS: {
        marginTop: 8,
        borderRadius: 12,
        maxHeight: 250,
        paddingHorizontal: 14,
    },
    resultRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    resultText: { flex: 1, fontSize: 13, lineHeight: 18 },
    floatingCurrentLocBtn: {
        position: 'absolute',
        bottom: 30,
        right: 20,
        zIndex: 10,
    },
    centerPinWrap: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 5,
    },
});
