import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { useSavedCities } from '@/hooks/useSavedCities';
import { searchPlaces, PlaceResult } from '@/utils/locationService';

const MAX_CITIES = 10;

// Compact "City, Region" from a verbose Nominatim display name.
const shortName = (displayName: string): string => {
    const parts = displayName.split(',').map((s) => s.trim());
    return parts.length > 1 ? `${parts[0]}, ${parts[parts.length - 1]}` : parts[0];
};

export default function ManageCitiesScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { theme, isDark } = useTheme();
    const colors = Colors[theme];

    const { cities, isSaving, addCity, removeCity, reorderCity, setDefaultCity } = useSavedCities();

    const [query, setQuery] = useState('');
    const [results, setResults] = useState<PlaceResult[]>([]);
    const [searching, setSearching] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const atLimit = cities.length >= MAX_CITIES;

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

    const onAdd = useCallback((place: PlaceResult) => {
        addCity({ name: shortName(place.displayName), latitude: place.latitude, longitude: place.longitude });
        setQuery('');
        setResults([]);
    }, [addCity]);

    const inputBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Gradient header */}
            <LinearGradient
                colors={[colors.primary, colors.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.header, { paddingTop: insets.top + 14 }]}
            >
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn} hitSlop={8}>
                        <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
                    </TouchableOpacity>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                        <ThemedText style={styles.title}>Saved Cities</ThemedText>
                        <ThemedText style={styles.subtitle}>{cities.length}/{MAX_CITIES} · tap the star to set default</ThemedText>
                    </View>
                    {isSaving ? <ActivityIndicator size="small" color="#FFFFFF" /> : null}
                </View>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                {/* Search / add */}
                {atLimit ? (
                    <View style={[styles.limitNote, { backgroundColor: inputBg }]}>
                        <Ionicons name="information-circle-outline" size={16} color={colors.icon} />
                        <ThemedText style={[styles.limitText, { color: colors.textSecondary }]}>
                            You've reached the {MAX_CITIES}-city limit. Remove one to add more.
                        </ThemedText>
                    </View>
                ) : (
                    <>
                        <View style={[styles.searchBox, { backgroundColor: inputBg }]}>
                            <Ionicons name="search" size={18} color={colors.icon} style={{ marginRight: 8 }} />
                            <TextInput
                                style={[styles.searchInput, { color: colors.text }]}
                                placeholder="Search a city to add"
                                placeholderTextColor={colors.icon}
                                value={query}
                                onChangeText={setQuery}
                                returnKeyType="search"
                            />
                            {searching ? <ActivityIndicator size="small" color={colors.primary} /> : null}
                        </View>

                        {results.map((r, i) => (
                            <TouchableOpacity
                                key={`${r.latitude}-${r.longitude}-${i}`}
                                style={[styles.resultRow, { borderBottomColor: colors.border }]}
                                onPress={() => onAdd(r)}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="add-circle" size={20} color={colors.lime} style={{ marginRight: 10 }} />
                                <ThemedText style={[styles.resultText, { color: colors.text }]} numberOfLines={2}>
                                    {r.displayName}
                                </ThemedText>
                            </TouchableOpacity>
                        ))}
                    </>
                )}

                {/* Saved cities list */}
                <ThemedText style={[styles.sectionLabel, { color: colors.textSecondary }]}>YOUR CITIES</ThemedText>

                {cities.length === 0 ? (
                    <View style={styles.empty}>
                        <Ionicons name="location-outline" size={44} color={colors.icon} />
                        <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>
                            No saved cities yet. Search above to add one.
                        </ThemedText>
                    </View>
                ) : (
                    cities.map((c, i) => (
                        <Animated.View
                            key={`${c.latitude}-${c.longitude}`}
                            entering={FadeInDown.delay(i * 40)}
                            style={[styles.cityRow, { backgroundColor: colors.card, borderColor: colors.border }]}
                        >
                            <TouchableOpacity onPress={() => setDefaultCity(i)} hitSlop={8} style={{ marginRight: 10 }}>
                                <Ionicons
                                    name={c.isDefault ? 'star' : 'star-outline'}
                                    size={20}
                                    color={c.isDefault ? colors.secondary : colors.icon}
                                />
                            </TouchableOpacity>

                            <View style={{ flex: 1 }}>
                                <ThemedText style={[styles.cityName, { color: colors.text }]} numberOfLines={1}>{c.name}</ThemedText>
                                {c.isDefault ? (
                                    <ThemedText style={[styles.defaultTag, { color: colors.secondary }]}>Default</ThemedText>
                                ) : null}
                            </View>

                            {/* Reorder */}
                            <TouchableOpacity onPress={() => reorderCity(i, i - 1)} disabled={i === 0} hitSlop={6} style={styles.reorderBtn}>
                                <Ionicons name="chevron-up" size={18} color={i === 0 ? colors.border : colors.icon} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => reorderCity(i, i + 1)} disabled={i === cities.length - 1} hitSlop={6} style={styles.reorderBtn}>
                                <Ionicons name="chevron-down" size={18} color={i === cities.length - 1 ? colors.border : colors.icon} />
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => removeCity(i)} hitSlop={6} style={styles.reorderBtn}>
                                <Ionicons name="trash-outline" size={18} color="#EF4444" />
                            </TouchableOpacity>
                        </Animated.View>
                    ))
                )}

                <View style={{ height: 32 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        paddingHorizontal: 16,
        paddingBottom: 18,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    headerRow: { flexDirection: 'row', alignItems: 'center' },
    iconBtn: {
        width: 38, height: 38, borderRadius: 19,
        backgroundColor: 'rgba(255,255,255,0.18)',
        justifyContent: 'center', alignItems: 'center',
    },
    title: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
    subtitle: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.85)', marginTop: 2 },
    body: { paddingHorizontal: 16, paddingTop: 16 },
    searchBox: {
        flexDirection: 'row', alignItems: 'center',
        borderRadius: 14, paddingHorizontal: 14, height: 50,
    },
    searchInput: { flex: 1, fontSize: 14 },
    resultRow: {
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth,
    },
    resultText: { flex: 1, fontSize: 13, lineHeight: 18 },
    limitNote: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        borderRadius: 12, padding: 12,
    },
    limitText: { flex: 1, fontSize: 12, lineHeight: 17 },
    sectionLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 0.6, marginTop: 22, marginBottom: 10 },
    cityRow: {
        flexDirection: 'row', alignItems: 'center',
        borderRadius: 14, borderWidth: StyleSheet.hairlineWidth,
        paddingVertical: 12, paddingHorizontal: 14, marginBottom: 10,
    },
    cityName: { fontSize: 15, fontWeight: '700' },
    defaultTag: { fontSize: 11, fontWeight: '700', marginTop: 1 },
    reorderBtn: {
        width: 30, height: 30, alignItems: 'center', justifyContent: 'center',
    },
    empty: { alignItems: 'center', paddingVertical: 30, gap: 10 },
    emptyText: { fontSize: 13, textAlign: 'center', paddingHorizontal: 30, lineHeight: 20 },
});
