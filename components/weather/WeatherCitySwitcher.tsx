import React from 'react';
import { ScrollView, TouchableOpacity, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '../ThemedText';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { SavedCity } from '@/apis/weather';

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
 * Sits on the weather screen's gradient, so the active chip uses a solid white
 * glass fill and inactive chips a translucent one.
 */
export const WeatherCitySwitcher = React.memo(({
    cities,
    activeKey,
    onSelectCurrent,
    onSelectCity,
    onManage,
}: WeatherCitySwitcherProps) => {
    const { theme } = useTheme();
    const colors = Colors[theme];

    const Chip = ({ active, icon, label, onPress, accent }: { active: boolean; icon: any; label: string; onPress: () => void; accent?: string }) => (
        <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
            {active ? (
                <View style={[styles.chip, styles.chipActive]}>
                    <Ionicons name={icon} size={14} color={colors.primary} style={{ marginRight: 5 }} />
                    <ThemedText style={[styles.chipText, { color: colors.primary }]} numberOfLines={1}>{label}</ThemedText>
                </View>
            ) : (
                <View style={styles.chip}>
                    <Ionicons name={icon} size={14} color={accent || 'rgba(255,255,255,0.9)'} style={{ marginRight: 5 }} />
                    <ThemedText style={styles.chipTextInactive} numberOfLines={1}>{label}</ThemedText>
                </View>
            )}
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

            <TouchableOpacity onPress={onManage} activeOpacity={0.8}>
                <LinearGradient
                    colors={[colors.lime, colors.secondary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.manageChip}
                >
                    <Ionicons name="add" size={16} color="#FFFFFF" />
                    <ThemedText style={styles.manageText}>Manage</ThemedText>
                </LinearGradient>
            </TouchableOpacity>
        </ScrollView>
    );
});

WeatherCitySwitcher.displayName = 'WeatherCitySwitcher';

const styles = StyleSheet.create({
    row: { gap: 8, paddingVertical: 4, paddingRight: 8 },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.16)',
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: 'rgba(255,255,255,0.25)',
        borderRadius: 999,
        paddingHorizontal: 12,
        height: 34,
        maxWidth: 150,
    },
    chipActive: {
        backgroundColor: '#FFFFFF',
        borderColor: '#FFFFFF',
    },
    chipText: { fontSize: 13, fontWeight: '800', flexShrink: 1 },
    chipTextInactive: { fontSize: 13, fontWeight: '700', color: '#FFFFFF', flexShrink: 1 },
    manageChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        borderRadius: 999,
        paddingHorizontal: 12,
        height: 34,
    },
    manageText: { fontSize: 13, fontWeight: '800', color: '#FFFFFF' },
});
