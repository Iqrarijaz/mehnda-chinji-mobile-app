import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';
import { ThemedText } from '../ThemedText';
import { getIconName } from './weatherUtils';

interface WeatherHeroProps {
    weather: any;
    isLoading: boolean;
}

/**
 * Open hero — temperature and condition rendered directly on the forest
 * background (no card box), with a single translucent meta pill beneath.
 */
const WeatherHero = React.memo(({ weather, isLoading }: WeatherHeroProps) => {
    if (isLoading && !weather) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FFFFFF" />
            </View>
        );
    }

    if (!weather) return null;

    return (
        <View style={styles.hero}>
            {/* Location & date */}
            <View style={styles.locationRow}>
                <Ionicons name="location" size={15} color="rgba(255,255,255,0.85)" />
                <ThemedText style={styles.city}>{weather.name}</ThemedText>
            </View>
            <ThemedText style={styles.date}>
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </ThemedText>

            {/* Temperature & condition */}
            <View style={styles.mainRow}>
                <ThemedText style={styles.temp}>{Math.round(weather.main.temp)}°</ThemedText>
                <Ionicons
                    name={getIconName(weather.weather[0].icon) as any}
                    size={Platform.OS === 'android' ? 58 : 64}
                    color="rgba(255,255,255,0.95)"
                />
            </View>
            <ThemedText style={styles.condition}>{weather.weather[0].description}</ThemedText>

            {/* Meta pill */}
            <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                    <Ionicons name="thermometer-outline" size={13} color="rgba(255,255,255,0.75)" />
                    <ThemedText style={styles.metaText}>Feels {Math.round(weather.main.feels_like)}°</ThemedText>
                </View>
                <View style={styles.metaDivider} />
                <View style={styles.metaItem}>
                    <Ionicons name="arrow-up" size={13} color="rgba(255,255,255,0.75)" />
                    <ThemedText style={styles.metaText}>H: {Math.round(weather.main.temp_max)}°</ThemedText>
                </View>
                <View style={styles.metaDivider} />
                <View style={styles.metaItem}>
                    <Ionicons name="arrow-down" size={13} color="rgba(255,255,255,0.75)" />
                    <ThemedText style={styles.metaText}>L: {Math.round(weather.main.temp_min)}°</ThemedText>
                </View>
            </View>
        </View>
    );
});

export default WeatherHero;

const styles = StyleSheet.create({
    hero: {
        alignItems: 'center',
        paddingTop: 4,
    },
    loadingContainer: {
        height: 180,
        justifyContent: 'center',
        alignItems: 'center',
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    city: {
        fontSize: 17,
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: 0.2,
    },
    date: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.7)',
        fontWeight: '500',
        marginTop: 3,
    },
    mainRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        marginTop: 6,
    },
    temp: {
        fontSize: Platform.OS === 'android' ? 76 : 82,
        fontWeight: '800',
        color: '#FFFFFF',
        lineHeight: Platform.OS === 'android' ? 84 : 90,
        letterSpacing: -2,
    },
    condition: {
        fontSize: 15,
        color: 'rgba(255, 255, 255, 0.85)',
        fontWeight: '600',
        textTransform: 'capitalize',
        marginTop: -4,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.12)',
        borderRadius: 999,
        paddingVertical: 9,
        paddingHorizontal: 18,
        gap: 14,
        marginTop: 16,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaText: {
        color: 'rgba(255, 255, 255, 0.92)',
        fontSize: 12,
        fontWeight: '600',
    },
    metaDivider: {
        width: 1,
        height: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
    },
});
