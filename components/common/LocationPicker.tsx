import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
    View,
    TouchableOpacity,
    Modal,
    TextInput,
    FlatList,
    ActivityIndicator,
    StyleSheet,
    Platform,
    KeyboardAvoidingView } from 'react-native';
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
    PlaceResult } from '@/utils/locationService';
import { SubmitButton } from './SubmitButton';
import { LocationLoadingModal } from './LocationLoadingModal';
import { BackButton } from './BackButton';
import { Layout } from '@/constants/layout';

// MapLibre is fully free and needs no API key/token; pass null to satisfy the
// Mapbox-compatible API surface.
MapLibreGL?.setAccessToken?.(null);

// Raise the log level so these don't spam the console.
Logger?.setLogLevel?.('error');

// Free OpenStreetMap raster tiles
const OSM_STYLE = {
    version: 8,
    sources: {
        osm: {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            maxzoom: 19,
            attribution: '© OpenStreetMap contributors' } },
    layers: [{ id: 'osm', type: 'raster', source: 'osm' }] };

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

export const LocationPicker = React.memo(function LocationPicker({ label = 'LOCATION', value, onChange, delay = 0, variant = 'default' }: LocationPickerProps) {
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

    const cameraRef = useRef<React.ElementRef<typeof Camera>>(null);
    const [selectedCoord, setSelectedCoord] = useState<{ latitude: number; longitude: number } | null>(
        value ? { latitude: value.latitude, longitude: value.longitude } : null
    );

    const initialCameraConfig = useMemo(() => ({
        centerCoordinate: value
            ? [value.longitude, value.latitude]
            : [69.3451, 30.3753], // Pakistan
        zoomLevel: value ? 13 : 4 
    }), []);
    
    const [selectedAddress, setSelectedAddress] = useState<string | null>(value?.address ?? null);
    const [resolvingAddress, setResolvingAddress] = useState(false);
    const geoDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const geoSeqRef = useRef(0);

    useEffect(() => {
        if (value) {
            setSelectedCoord({ latitude: value.latitude, longitude: value.longitude });
            setSelectedAddress(value.address ?? null);
        } else {
            setSelectedCoord(null);
            setSelectedAddress(null);
        }
    }, [value]);

    const AnimatedView = delay > 0 ? Animated.View : View;
    const animatedProps = delay > 0 ? { entering: FadeInDown.delay(delay) } : {};

    const inputBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.035)';

    // Debounced Nominatim search.
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
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
            centerCoordinate: [longitude, latitude],
            ...(zoomLevel != null ? { zoomLevel } : {}),
            animationDuration: 600 });
    };

    const handleMapPress = (feature: any) => {
        const coords = feature?.geometry?.coordinates;
        if (Array.isArray(coords) && coords.length === 2) {
            setResults([]);
            setSelectedCoord({ latitude: coords[1], longitude: coords[0] });
            moveCamera(coords[1], coords[0]);
        }
    };

    const resolveCenterAddress = (latitude: number, longitude: number) => {
      if (geoDebounceRef.current) clearTimeout(geoDebounceRef.current);
      setResolvingAddress(true);
      const seq = ++geoSeqRef.current;
      geoDebounceRef.current = setTimeout(async () => {
        const address = await reverseGeocode(latitude, longitude);
        if (seq !== geoSeqRef.current) return;
        setSelectedAddress(address);
        setResolvingAddress(false);
      }, 500);
    };

    const handleRegionChange = (feature: any) => {
        const coords = feature?.geometry?.coordinates;
        if (Array.isArray(coords) && coords.length === 2) {
            setSelectedCoord({ latitude: coords[1], longitude: coords[0] });
            resolveCenterAddress(coords[1], coords[0]);
        }
    };

    const selectPlace = (place: PlaceResult) => {
        setSelectedCoord({ latitude: place.latitude, longitude: place.longitude });
        setSelectedAddress(place.displayName);
        onChange({
            latitude: place.latitude,
            longitude: place.longitude,
            address: place.displayName,
        });
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

            const address = await reverseGeocode(coords.latitude, coords.longitude);
            const resolvedAddress = address || 'Current Location';
            setSelectedAddress(resolvedAddress);
            onChange({
                latitude: coords.latitude,
                longitude: coords.longitude,
                address: resolvedAddress,
            });
        } finally {
            setLocating(false);
        }
    };

    const handleConfirmMarkerLocation = async () => {
      setLocating(true);
      try {
        if (!selectedCoord) return;
        const address = await reverseGeocode(selectedCoord.latitude, selectedCoord.longitude);
        const resolvedAddress = address || selectedAddress || 'Selected store location';
        setSelectedAddress(resolvedAddress);
        onChange({
          latitude: selectedCoord.latitude,
          longitude: selectedCoord.longitude,
          address: resolvedAddress,
        });
      } catch (err) {
        console.warn('Location resolution error:', err);
      } finally {
        setLocating(false);
      }
    };

    const handleConfirm = async () => {
        if (!selectedCoord) {
            closeModal();
            return;
        }
        let address = selectedAddress;
        if (!address) {
          setLocating(true);
          address = await reverseGeocode(selectedCoord.latitude, selectedCoord.longitude);
          setLocating(false);
        }
        onChange({
            latitude: selectedCoord.latitude,
            longitude: selectedCoord.longitude,
            address: address || 'Selected location' });
        closeModal();
    };

    const clearLocation = () => {
        onChange(null);
        closeModal();
    };

    const closeModal = () => {
        if (geoDebounceRef.current) clearTimeout(geoDebounceRef.current);
        setResolvingAddress(false);
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
        <Animated.View {...animatedProps} style={variant === 'default' ? styles.field : undefined}>
            {variant === 'default' ? (
                <>
                    <View style={styles.labelRow}>
                        <ThemedText style={[styles.label, { color: colors.text }]}>
                            {label} <ThemedText style={{ color: colors.icon, fontWeight: '400' }}>(Optional)</ThemedText>
                        </ThemedText>
                        {value ? (
                            <TouchableOpacity onPress={() => onChange(null)} hitSlop={8}>
                                <ThemedText style={{ color: '#EF4444', fontSize: 10.5, fontWeight: '700' }}>Remove</ThemedText>
                            </TouchableOpacity>
                        ) : null}
                    </View>

                    <TouchableOpacity
                        style={[styles.trigger, { backgroundColor: inputBg, minHeight: 80, paddingVertical: 10, alignItems: 'flex-start' }]}
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
                    style={{ backgroundColor: colors.lime, paddingHorizontal: 8, paddingVertical: 4, borderRadius: Layout.borderRadius, flexDirection: 'row', alignItems: 'center' }}
                >
                    <Ionicons name="location" size={12} color="#FFF" style={{ marginRight: 4 }} />
                    <ThemedText style={{ color: '#FFF', fontSize: 9, fontWeight: '600' }}>{label === 'LOCATION' ? 'Current Location' : label}</ThemedText>
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
                        <BackButton onPress={closeModal} backgroundColor={isDark ? 'rgba(255,255,255,0.1)' : '#FFF'} />
                        <SubmitButton
                            title="Done"
                            onPress={handleConfirm}
                            disabled={!selectedCoord}
                            isLoading={locating}
                            style={{ height: 36, minWidth: 80, paddingHorizontal: 13 }}
                        />
                    </View>

                    <View style={{ flex: 1, position: 'relative' }}>
                        <MapView
                            style={{ flex: 1 }}
                            mapStyle={OSM_STYLE_JSON}
                            logoEnabled={false}
                            attributionEnabled={true}
                            compassEnabled={true}
                            compassViewPosition={3} // 3 = bottom-right
                            compassViewMargins={{ x: 24, y: Math.max(insets.bottom, 20) + 140 }}
                            onPress={handleMapPress}
                            onRegionDidChange={handleRegionChange}
                        >
                            <Camera
                                ref={cameraRef}
                                defaultSettings={initialCameraConfig}
                            />
                        </MapView>

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
                            <View style={[styles.searchBoxFS, { backgroundColor: colors.background }]}>
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
                                    style={[styles.resultsListFS, { backgroundColor: colors.background }]}
                                    initialNumToRender={5}
                                    maxToRenderPerBatch={5}
                                    windowSize={3}
                                    removeClippedSubviews={Platform.OS === 'android'}
                                    renderItem={({ item }) => (
                                        <TouchableOpacity
                                            style={[styles.resultRow, { borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', borderBottomWidth: 0 }]}
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
                        
                        {/* Sticky Tick Confirmation Button directly above current location button */}
                        <TouchableOpacity
                            style={[styles.floatingTickBtn, { bottom: Math.max(insets.bottom, 20) + 250 }]}
                            onPress={handleConfirmMarkerLocation}
                            activeOpacity={0.8}
                            disabled={locating || resolvingAddress}>
                            <View style={[styles.floatingIconBadge, { backgroundColor: colors.lime }]}>
                                <Ionicons name="checkmark-sharp" size={26} color={colors.background} />
                            </View>
                        </TouchableOpacity>

                        {/* Sticky Current Location Button */}
                        <TouchableOpacity
                            style={[styles.floatingCurrentLocBtn, { bottom: Math.max(insets.bottom, 20) + 185 }]}
                            onPress={useCurrentLocation}
                            activeOpacity={0.8}
                        >
                            <View style={[styles.floatingIconBadge, { backgroundColor: colors.lime }]}>
                                <Ionicons name="navigate" size={24} color={colors.background} />
                            </View>
                        </TouchableOpacity>
                        
                        {/* Selected location confirmation card */}
                        <View style={[styles.selectedCard, { backgroundColor: colors.background, paddingBottom: Math.max(insets.bottom, 20) }]}>
                            <ThemedText style={styles.selectedHint}>
                                Move the map so the pin sits exactly on your location — this helps others find you.
                            </ThemedText>
                            <View style={styles.selectedRow}>
                                <Ionicons name="location" size={28} color={colors.primary} style={{ marginHorizontal: 4 }} />
                                <View style={{ flex: 1 }}>
                                    <ThemedText style={styles.selectedTitle}>Selected location</ThemedText>
                                    <ThemedText style={[styles.selectedAddress, { color: colors.text }]} numberOfLines={2}>
                                        {selectedAddress || 'Move the map to place the pin...'}
                                    </ThemedText>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Premium location-fetch loading modal */}
            <LocationLoadingModal visible={locating} />
        </Animated.View>
    );
}, (prevProps, nextProps) => {
    return (
        prevProps.value?.latitude === nextProps.value?.latitude &&
        prevProps.value?.longitude === nextProps.value?.longitude &&
        prevProps.value?.address === nextProps.value?.address &&
        prevProps.delay === nextProps.delay &&
        prevProps.variant === nextProps.variant &&
        prevProps.label === nextProps.label
    );
});

const styles = StyleSheet.create({
    field: { gap: 6 },
    labelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingRight: 4 },
    label: {
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.5,
        marginLeft: 2 },
    trigger: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: Layout.borderRadius,
        paddingHorizontal: 11 },
    triggerText: {
        flex: 1,
        fontSize: 12.5,
        fontWeight: '500',
        marginRight: 8 },
    modalOverlayFS: {
        flex: 1,
        width: '100%',
        height: '100%',
        borderRadius: Layout.borderRadius,
        overflow: 'hidden',
        padding: 0 },
    modalHeaderFS: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 13,
        paddingTop: Platform.OS === 'ios' ? 16 : 16,
        paddingBottom: 10,
        zIndex: 30,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0 },
    modalTitle: {
        fontSize: 15.5,
        fontWeight: '600' },
    floatingSearchContainer: {
        position: 'absolute',
        top: 70,
        left: 16,
        right: 16,
        zIndex: 20 },
    searchBoxFS: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: Layout.borderRadius,
        paddingHorizontal: 11,
        height: 50 },
    searchInput: { flex: 1, fontSize: 12.5 },
    resultsListFS: {
        marginTop: 8,
        borderRadius: Layout.borderRadius,
        maxHeight: 250,
        paddingHorizontal: 11 },
    resultRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: 10 },
    resultText: { flex: 1, fontSize: 11.5, lineHeight: 18 },
    floatingTickBtn: {
        position: 'absolute',
        right: 20,
        zIndex: 12,
    },
    floatingCurrentLocBtn: {
        position: 'absolute',
        right: 20,
        zIndex: 10,
    },
    floatingIconBadge: {
        padding: 12,
        borderRadius: 100,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    centerPinWrap: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 5 },
    selectedCard: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 15,
        borderTopLeftRadius: Layout.borderRadius * 2,
        borderTopRightRadius: Layout.borderRadius * 2,
        paddingHorizontal: 16,
        paddingTop: 12,
        gap: 8,
    },
    selectedHint: {
        fontSize: 12.5,
        fontWeight: '600',
        lineHeight: 18,
    },
    selectedRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    selectedTitle: {
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.4,
    },
    selectedAddress: {
        fontSize: 15,
        fontWeight: '800',
        marginTop: 2,
        lineHeight: 20,
    },
});
