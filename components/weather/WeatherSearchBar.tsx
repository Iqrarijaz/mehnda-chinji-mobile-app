import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View } from 'react-native';
import { ThemedText } from '../ThemedText';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';

interface WeatherSearchBarProps {
    searchInput: string;
    filteredCities: string[];
    showDropdown: boolean;
    onChangeText: (t: string) => void;
    onSubmit: () => void;
    onClear: () => void;
    onSelectCity: (city: string) => void;
    onGPS?: () => void;
}

const WeatherSearchBar = React.memo(({
    searchInput,
    filteredCities,
    showDropdown,
    onChangeText,
    onSubmit,
    onClear,
    onSelectCity,
    onGPS }: WeatherSearchBarProps) => {
    const { theme, isDark } = useTheme();
    const colors = Colors[theme];

    return (
        <View style={styles.wrapper}>
            {/* Input pill — solid card background */}
            <View style={[
                styles.inputPill,
                {
                    backgroundColor: colors.cardBg },
            ]}>
                <Ionicons name="search" size={16} color={colors.primary} style={{ marginRight: 8 }} />
                <TextInput
                    placeholder="Search city..."
                    placeholderTextColor={colors.textSecondary}
                    style={[styles.input, { color: colors.text }]}
                    value={searchInput}
                    onChangeText={onChangeText}
                    onSubmitEditing={onSubmit}
                    returnKeyType="search"
                />
                {searchInput.length > 0 && (
                    <TouchableOpacity onPress={onClear}>
                        <Ionicons name="close-circle" size={16} color={colors.textSecondary} />
                    </TouchableOpacity>
                )}
                {onGPS && searchInput.length === 0 && (
                    <TouchableOpacity onPress={onGPS} style={{ marginLeft: 8 }}>
                        <Ionicons name="location" size={18} color={colors.primary} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Dropdown */}
            {showDropdown && filteredCities.length > 0 && (
                <View style={[styles.dropdown, { backgroundColor: colors.cardBg }]}>
                    {filteredCities.map((item, i) => (
                        <TouchableOpacity
                            key={i}
                            style={[
                                styles.dropItem,
                            ]}
                            onPress={() => onSelectCity(item)}
                        >
                            <ThemedText style={[styles.dropText, { color: colors.text }]}>{item}</ThemedText>
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </View>
    );
});

export default WeatherSearchBar;

const styles = StyleSheet.create({
    wrapper: { flex: 1, position: 'relative', zIndex: 100 },
    inputPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        height: 46,
        borderRadius: Layout.borderRadius },
    input: { flex: 1, fontSize: 14 },

    // Dropdown
    dropdown: {
        position: 'absolute',
        top: 48,
        left: 0,
        right: 0,
        borderRadius: Layout.borderRadius,
        zIndex: 9999,



        overflow: 'hidden' },
    dropItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 13 },
    dropItemBorder: {},
    dropText: {
        fontSize: 14,
        fontWeight: '600' } });
