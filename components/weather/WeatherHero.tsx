import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';
import { ThemedText } from '../ThemedText';
import { getIconName } from './weatherUtils';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';

interface WeatherHeroProps {
    weather: any;
    isLoading: boolean;
}

const WeatherHero = React.memo(({ weather, isLoading }: WeatherHeroProps) => {
    const { theme } = useTheme();
    const colors = Colors[theme];

    if (isLoading && !weather) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: colors.primary }]}>
                <ActivityIndicator size="large" color="#FFFFFF" />
            </View>
        );
    }

    if (!weather) return null;

    return (
        <View style={[styles.heroCard, { backgroundColor: colors.primary }]}>
            {/* Top row: City Name & Date */}
            <View style={styles.locationContainer}>
                <View style={styles.locationRow}>
                    <Ionicons name="location" size={16} color={colors.lime} />
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
            <View style={[styles.metaRow, { backgroundColor: 'rgba(0,0,0,0.18)' }]}>
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
        borderRadius: Layout.borderRadius,
        padding: 16,
        marginBottom: 16 },
    loadingContainer: {
        height: 160,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: Layout.borderRadius,
        marginBottom: 16 },
    locationContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 8,
        marginBottom: 12 },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4 },
    city: {
        fontSize: 13.5,
        fontWeight: '700',
        color: '#FFFFFF' },
    date: {
        fontSize: 10.5,
        color: 'rgba(255, 255, 255, 0.7)',
        fontWeight: '500' },
    mainRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        paddingHorizontal: 4 },
    tempColumn: {
        flexDirection: 'column' },
    temp: {
        fontSize: Platform.OS === 'android' ? 52 : 56,
        fontWeight: '900',
        color: '#FFFFFF',
        lineHeight: Platform.OS === 'android' ? 56 : 60,
        letterSpacing: -1 },
    condition: {
        fontSize: 12.5,
        color: 'rgba(255, 255, 255, 0.85)',
        fontWeight: '600',
        textTransform: 'capitalize',
        marginTop: 2 },
    staticIcon: {




    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: Layout.borderRadius,
        paddingVertical: 8,
        paddingHorizontal: 11 },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4 },
    metaText: {
        color: 'rgba(255, 255, 255, 0.9)',
        fontSize: 10.5,
        fontWeight: '600' },
    metaDivider: {
        width: 1,
        height: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.2)' } });
