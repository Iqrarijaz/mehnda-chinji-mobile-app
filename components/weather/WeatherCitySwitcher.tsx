import React from 'react';
import { ScrollView, TouchableOpacity, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '../ThemedText';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { SavedCity } from '@/apis/weather';
import { Layout } from '@/constants/layout';

interface WeatherCitySwitcherProps {
    cities: SavedCity[];
    /** null → current location / default is active. */
    activeKey: string | null;
    onSelectCurrent: () => void;
    onSelectCity: (city: SavedCity) => void;
    onManage: () => void;
}

export const cityKey = (c: SavedCity) => `${c.latitude.toFixed(3)},${c.longitude.toFixed(3)}`;

/**
 * Horizontal chip switcher: Current Location + saved cities + Manage.
 * Sits on a white background, so chips use solid primary/secondary colours.
 */
export const WeatherCitySwitcher = React.memo(({
    cities,
    activeKey,
    onSelectCurrent,
    onSelectCity,
    onManage }: WeatherCitySwitcherProps) => {
    const { theme } = useTheme();
    const colors = Colors[theme];

    const Chip = ({ active, icon, label, onPress, accent }: { active: boolean; icon: any; label: string; onPress: () => void; accent?: string }) => (
        <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
            <View style={[
                styles.chip,
                active
                    ? { backgroundColor: colors.primary }
                    : { backgroundColor: `${colors.primary}0D` },
            ]}>
                <Ionicons
                    name={icon}
                    size={14}
                    color={active ? '#FFFFFF' : (accent || colors.primary)}
                    style={{ marginRight: 5 }}
                />
                <ThemedText
                    style={[styles.chipText, { color: active ? '#FFFFFF' : colors.text }]}
                    numberOfLines={1}
                >
                    {label}
                </ThemedText>
            </View>
        </TouchableOpacity>
    );

    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.row}
            keyboardShouldPersistTaps="handled"
        >
            <Chip active={activeKey === null} icon="navigate" label="Current" onPress={onSelectCurrent} accent={colors.lime} />

            {cities.map((c) => (
                <Chip
                    key={cityKey(c)}
                    active={activeKey === cityKey(c)}
                    icon={c.isDefault ? 'star' : 'location'}
                    label={c.name.split(',')[0]}
                    onPress={() => onSelectCity(c)}
                    accent={c.isDefault ? colors.secondary : undefined}
                />
            ))}

            {/* Manage button — solid secondary */}
            <TouchableOpacity onPress={onManage} activeOpacity={0.8}>
                <View style={[styles.manageChip, { backgroundColor: colors.secondary }]}>
                    <Ionicons name="add" size={16} color="#FFFFFF" />
                    <ThemedText style={styles.manageText}>Manage</ThemedText>
                </View>
            </TouchableOpacity>
        </ScrollView>
    );
});

WeatherCitySwitcher.displayName = 'WeatherCitySwitcher';

const styles = StyleSheet.create({
    row: { gap: 8, paddingVertical: 4, paddingRight: 7 },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: Layout.borderRadius,
        paddingHorizontal: 10,
        height: 34,
        maxWidth: 150 },
    chipText: { fontSize: 11.5, fontWeight: '700', flexShrink: 1 },
    manageChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        borderRadius: Layout.borderRadius,
        paddingHorizontal: 10,
        height: 34 },
    manageText: { fontSize: 11.5, fontWeight: '800', color: '#FFFFFF' } });
