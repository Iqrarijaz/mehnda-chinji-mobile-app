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

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import {
    searchPlaces,
    reverseGeocode,
    getCurrentCoords,
    PlaceResult,
} from '@/utils/locationService';

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
}

/**
 * Reusable location picker shared across Business, Essential and Marketplace
 * create/edit forms. Lets the user search an address (OpenStreetMap / Nominatim),
 * pick a result, or capture their current GPS location. All coordinates are
 * optional — the field can be cleared at any time.
 */
export function LocationPicker({ label = 'LOCATION', value, onChange, delay = 0 }: LocationPickerProps) {
    const { theme, isDark } = useTheme();
    const colors = Colors[theme];

    const [modalVisible, setModalVisible] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<PlaceResult[]>([]);
    const [searching, setSearching] = useState(false);
    const [locating, setLocating] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const AnimatedView = delay > 0 ? Animated.View : View;
    const animatedProps = delay > 0 ? { entering: FadeInDown.delay(delay) } : {};

    const inputBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.035)';

    // Debounced Nominatim search.
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
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

    const selectPlace = (place: PlaceResult) => {
        onChange({
            latitude: place.latitude,
            longitude: place.longitude,
            address: place.displayName,
        });
        closeModal();
    };

    const useCurrentLocation = async () => {
        setLocating(true);
        try {
            const coords = await getCurrentCoords({ requestPermission: true });
            if (!coords) {
                setLocating(false);
                return;
            }
            const address = await reverseGeocode(coords.latitude, coords.longitude);
            onChange({
                latitude: coords.latitude,
                longitude: coords.longitude,
                address: address || 'Current location',
            });
            closeModal();
        } finally {
            setLocating(false);
        }
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
        <AnimatedView {...animatedProps} style={styles.field}>
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
                style={[styles.trigger, { backgroundColor: inputBg, height: Platform.OS === 'android' ? 48 : 52 }]}
                onPress={() => setModalVisible(true)}
                activeOpacity={0.7}
            >
                <Ionicons
                    name={value ? 'location' : 'location-outline'}
                    size={18}
                    color={value ? colors.primary : colors.icon}
                    style={{ marginRight: 10 }}
                />
                <ThemedText
                    style={[styles.triggerText, { color: value ? colors.text : colors.icon }]}
                    numberOfLines={1}
                >
                    {value ? displayLabel : 'Search or use current location'}
                </ThemedText>
                <Ionicons name="chevron-forward" size={16} color={colors.icon} />
            </TouchableOpacity>

            <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={closeModal}>
                <View style={styles.modalOverlay}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                        style={[styles.modalCard, { backgroundColor: colors.background }]}
                    >
                        <View style={styles.modalHeader}>
                            <ThemedText style={[styles.modalTitle, { color: colors.text }]}>Select Location</ThemedText>
                            <TouchableOpacity onPress={closeModal} hitSlop={8}>
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        <View style={[styles.searchBox, { backgroundColor: inputBg }]}>
                            <Ionicons name="search" size={18} color={colors.icon} style={{ marginRight: 8 }} />
                            <TextInput
                                style={[styles.searchInput, { color: colors.text }]}
                                placeholder="Search an address or place"
                                placeholderTextColor={colors.icon}
                                value={query}
                                onChangeText={setQuery}
                                autoFocus
                                returnKeyType="search"
                            />
                            {searching ? <ActivityIndicator size="small" color={colors.primary} /> : null}
                        </View>

                        <TouchableOpacity
                            style={[styles.currentLocationBtn, { borderColor: colors.primary }]}
                            onPress={useCurrentLocation}
                            disabled={locating}
                            activeOpacity={0.7}
                        >
                            {locating ? (
                                <ActivityIndicator size="small" color={colors.primary} />
                            ) : (
                                <Ionicons name="navigate" size={18} color={colors.primary} />
                            )}
                            <ThemedText style={[styles.currentLocationText, { color: colors.primary }]}>
                                {locating ? 'Getting your location…' : 'Use Current Location'}
                            </ThemedText>
                        </TouchableOpacity>

                        <FlatList
                            data={results}
                            keyExtractor={(item, index) => `${item.latitude}-${item.longitude}-${index}`}
                            keyboardShouldPersistTaps="handled"
                            style={styles.resultsList}
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
                            ListEmptyComponent={
                                query.trim().length >= 3 && !searching ? (
                                    <ThemedText style={[styles.emptyText, { color: colors.icon }]}>
                                        No places found. Try a different search.
                                    </ThemedText>
                                ) : null
                            }
                        />

                        {value ? (
                            <TouchableOpacity style={styles.clearBtn} onPress={clearLocation} activeOpacity={0.7}>
                                <Ionicons name="trash-outline" size={16} color="#EF4444" />
                                <ThemedText style={styles.clearText}>Remove saved location</ThemedText>
                            </TouchableOpacity>
                        ) : null}
                    </KeyboardAvoidingView>
                </View>
            </Modal>
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
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalCard: {
        maxHeight: '85%',
        minHeight: '55%',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 16,
        paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
    },
    modalTitle: { fontSize: 17, fontWeight: '700' },
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        paddingHorizontal: 14,
        height: 50,
        marginBottom: 12,
    },
    searchInput: { flex: 1, fontSize: 14 },
    currentLocationBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        borderWidth: 1.5,
        borderRadius: 12,
        paddingVertical: 12,
        marginBottom: 12,
    },
    currentLocationText: { fontSize: 14, fontWeight: '700' },
    resultsList: { flex: 1 },
    resultRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    resultText: { flex: 1, fontSize: 13, lineHeight: 18 },
    emptyText: { textAlign: 'center', marginTop: 24, fontSize: 13 },
    clearBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 12,
    },
    clearText: { color: '#EF4444', fontSize: 13, fontWeight: '600' },
});
