import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React from 'react';
import {
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
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
    onGPS,
}: WeatherSearchBarProps) => {
    const { theme, isDark } = useTheme();
    const colors = Colors[theme];

    return (
        <View style={styles.wrapper}>
            {/* Input pill */}
            <BlurView intensity={40} tint="light" style={styles.inputBlur}>
                <Ionicons name="search" size={16} color="rgba(255,255,255,0.7)" style={{ marginRight: 8 }} />
                <TextInput
                    placeholder="Search city..."
                    placeholderTextColor="rgba(255,255,255,0.6)"
                    style={styles.input}
                    value={searchInput}
                    onChangeText={onChangeText}
                    onSubmitEditing={onSubmit}
                    returnKeyType="search"
                />
                {searchInput.length > 0 && (
                    <TouchableOpacity onPress={onClear}>
                        <Ionicons name="close-circle" size={16} color="rgba(255,255,255,0.6)" />
                    </TouchableOpacity>
                )}
                {onGPS && searchInput.length === 0 && (
                    <TouchableOpacity onPress={onGPS} style={{ marginLeft: 8 }}>
                        <Ionicons name="location" size={18} color="rgba(255,255,255,0.8)" />
                    </TouchableOpacity>
                )}
            </BlurView>

            {/* Dropdown */}
            {showDropdown && filteredCities.length > 0 && (
                <View style={[styles.dropdown, { backgroundColor: colors.card, shadowColor: isDark ? 'transparent' : '#000' }]}>
                    {filteredCities.map((item, i) => (
                        <TouchableOpacity
                            key={i}
                            style={[
                                styles.dropItem,
                                i < filteredCities.length - 1 && styles.dropItemBorder,
                                i < filteredCities.length - 1 && { borderBottomColor: colors.border }
                            ]}
                            onPress={() => onSelectCity(item)}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
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
    inputBlur: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        height: 44,
        borderRadius: Layout.borderRadius,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.25)',
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    input: { flex: 1, color: '#FFFFFF', fontSize: 14 },

    // Dropdown
    dropdown: {
        position: 'absolute',
        top: 48,
        left: 0,
        right: 0,
        borderRadius: Layout.borderRadius,
        zIndex: 9999,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
        overflow: 'hidden',
    },
    dropItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 13,
    },
    dropItemBorder: {
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    dropText: {
        fontSize: 14,
        fontWeight: '600',
    },
});
