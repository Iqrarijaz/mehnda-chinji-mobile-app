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
import { Layout } from '@/constants/layout';

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

            {/* Header */}
            <View
                style={[styles.header, { paddingTop: insets.top + 14, backgroundColor: colors.primary }]}
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
            </View>

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
                                style={[styles.resultRow, { borderBottomWidth: 1, borderBottomColor: colors.border }]}
                            >
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
                            style={[styles.cityRow, { backgroundColor: colors.card }]}
                        >
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
        paddingHorizontal: 13,
        paddingBottom: 15,
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28 },
    headerRow: { flexDirection: 'row', alignItems: 'center' },
    iconBtn: {
        width: 38, height: 38, borderRadius: Layout.borderRadius,
        backgroundColor: 'rgba(255,255,255,0.18)',
        justifyContent: 'center', alignItems: 'center' },
    title: { fontSize: 15.5, fontWeight: '800', color: '#FFFFFF' },
    subtitle: { fontSize: 10.5, fontWeight: '600', color: 'rgba(255,255,255,0.85)', marginTop: 2 },
    body: { paddingHorizontal: 13, paddingTop: 13 },
    searchBox: {
        flexDirection: 'row', alignItems: 'center',
        borderRadius: Layout.borderRadius, paddingHorizontal: 11, height: 50 },
    searchInput: { flex: 1, fontSize: 12.5 },
    resultRow: {
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: 10 },
    resultText: { flex: 1, fontSize: 11.5, lineHeight: 18 },
    limitNote: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        borderRadius: Layout.borderRadius, padding: 10 },
    limitText: { flex: 1, fontSize: 10.5, lineHeight: 17 },
    sectionLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.6, marginTop: 22, marginBottom: 10 },
    cityRow: {
        flexDirection: 'row', alignItems: 'center',
        borderRadius: Layout.borderRadius,
        paddingVertical: 10, paddingHorizontal: 11, marginBottom: 10 },
    cityName: { fontSize: 12.5, fontWeight: '700' },
    defaultTag: { fontSize: 10, fontWeight: '700', marginTop: 1 },
    reorderBtn: {
        width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
    empty: { alignItems: 'center', paddingVertical: 26, gap: 10 },
    emptyText: { fontSize: 11.5, textAlign: 'center', paddingHorizontal: 26, lineHeight: 20 } });
