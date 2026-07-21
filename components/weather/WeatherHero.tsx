import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';
import { ThemedText } from '../ThemedText';
import { getIconName } from './weatherUtils';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/colors';

interface WeatherHeroProps {
    weather: any;
    isLoading: boolean;
}

const WeatherHero = React.memo(({ weather, isLoading }: WeatherHeroProps) => {
    const { theme } = useTheme();
    const colors = Colors[theme];
    if (isLoading && !weather) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FFFFFF" />
            </View>
        );
    }

    if (!weather) return null;

    return (
        <View style={styles.heroCard}>
            {/* Top row: City Name & Date */}
            <View style={styles.locationContainer}>
                <View style={styles.locationRow}>
                    <Ionicons name="location" size={16} color="rgba(255,255,255,0.9)" />
                    <ThemedText style={styles.city}>{weather.name}</ThemedText>
                </View>
                <ThemedText style={styles.date}>
                    {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </ThemedText>
            </View>

            {/* Middle Row: Temperature & Icon */}
            <View style={styles.mainRow}>
                <View style={styles.tempColumn}>
                    <ThemedText style={styles.temp}>{Math.round(weather.main.temp)}°</ThemedText>
                    <ThemedText style={styles.condition}>{weather.weather[0].description}</ThemedText>
                </View>

                <Ionicons
                    name={getIconName(weather.weather[0].icon) as any}
                    size={Platform.OS === 'android' ? 64 : 70}
                    color="rgba(255,255,255,0.95)"
                    style={styles.staticIcon}
                />
            </View>

            {/* Bottom Row: Meta Info Pills (Feels Like, High/Low) */}
            <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                    <Ionicons name="thermometer-outline" size={13} color="rgba(255,255,255,0.7)" />
                    <ThemedText style={styles.metaText}>Feels {Math.round(weather.main.feels_like)}°</ThemedText>
                </View>
                <View style={styles.metaDivider} />
                <View style={styles.metaItem}>
                    <Ionicons name="arrow-up" size={13} color={colors.secondary} />
                    <ThemedText style={styles.metaText}>H: {Math.round(weather.main.temp_max)}°</ThemedText>
                </View>
                <View style={styles.metaDivider} />
                <View style={styles.metaItem}>
                    <Ionicons name="arrow-down" size={13} color={colors.lime} />
                    <ThemedText style={styles.metaText}>L: {Math.round(weather.main.temp_min)}°</ThemedText>
                </View>
            </View>
        </View>
    );
});

export default WeatherHero;

const styles = StyleSheet.create({
    heroCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.12)',
        borderRadius: 16,
        borderColor: 'rgba(255, 255, 255, 0.15)',
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
    },
    loadingContainer: {
        height: 150,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.12)',
        borderRadius: 16,
        marginBottom: 16,
    },
    locationContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
        paddingBottom: 10,
        marginBottom: 12,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    city: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    date: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.7)',
        fontWeight: '500',
    },
    mainRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    tempColumn: {
        flexDirection: 'column',
    },
    temp: {
        fontSize: Platform.OS === 'android' ? 52 : 56,
        fontWeight: '900',
        color: '#FFFFFF',
        lineHeight: Platform.OS === 'android' ? 56 : 60,
        letterSpacing: -1,
    },
    condition: {
        fontSize: 15,
        color: 'rgba(255, 255, 255, 0.85)',
        fontWeight: '600',
        textTransform: 'capitalize',
        marginTop: 2,
    },
    staticIcon: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderRadius: 12,
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaText: {
        color: 'rgba(255, 255, 255, 0.9)',
        fontSize: 12,
        fontWeight: '600',
    },
    metaDivider: {
        width: 1,
        height: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
});
