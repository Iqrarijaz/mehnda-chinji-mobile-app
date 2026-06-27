import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { useWeatherCity } from '@/context/WeatherContext';
import { useWeather } from '@/hooks/useWeather';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Layout } from '@/constants/layout';
import { ThemedText } from '../ThemedText';

interface HomeHeaderWeatherWidgetProps {
    onPress?: () => void;
}

const HomeHeaderWeatherWidget = React.memo(({ onPress }: HomeHeaderWeatherWidgetProps) => {
    const { theme } = useTheme();
    const colors = Colors[theme];

    // 🌐 Shared city from WeatherContext
    const { selectedCity } = useWeatherCity();
    const { weather, isWeatherLoading } = useWeather(selectedCity);

    const getIconName = (icon: string, isNight: boolean) => {
        if (icon.startsWith('01')) return isNight ? 'moon' : 'sunny';
        if (icon.startsWith('02')) return isNight ? 'cloudy-night' : 'partly-sunny';
        if (icon.startsWith('03') || icon.startsWith('04')) return 'cloudy';
        if (icon.startsWith('09') || icon.startsWith('10')) return 'rainy';
        if (icon.startsWith('11')) return 'thunderstorm';
        if (icon.startsWith('13')) return 'snow';
        if (icon.startsWith('50')) return 'cloud';
        return isNight ? 'moon' : 'sunny';
    };

    // Loading state
    if (isWeatherLoading && !weather) {
        return (
            <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={styles.container}>
                <ActivityIndicator color="#FFFFFF" size="small" />
            </TouchableOpacity>
        );
    }

    // Fallback / no data yet
    const icon = weather?.weather?.[0]?.icon ?? '01d';
    const isNight = icon.endsWith('n');
    const temp = weather ? Math.round(weather.main.temp) : '--';
    const condition = weather?.weather?.[0]?.main ?? 'Loading...';
    const feelsLike = weather ? Math.round(weather.main.feels_like) : '--';
    const humidity = weather?.main?.humidity ?? '--';
    const location = weather?.name ? `${weather.name}, PK` : selectedCity;

    // Format sunrise/sunset
    const formatTime = (timestamp?: number) => {
        if (!timestamp) return '--:--';
        const date = new Date(timestamp * 1000);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const sunrise = formatTime(weather?.sys?.sunrise);
    const sunset = formatTime(weather?.sys?.sunset);

    // Determine which event to show (next upcoming event)
    const now = Math.floor(Date.now() / 1000);
    const apiSunrise = weather?.sys?.sunrise;
    const apiSunset = weather?.sys?.sunset;

    // Default to 'Sun Up' if data is missing, else determine next event
    // After midnight but before sunrise -> Sun Up
    // After sunrise but before sunset -> Sun Down
    // After sunset -> Sun Up (next day, but we only have today's timestamp, so we'll show sunrise time as a fallback)
    const isShowingSunrise = apiSunrise && apiSunset ? (now < apiSunrise || now >= apiSunset) : true;

    const timeToShow = isShowingSunrise ? sunrise : sunset;
    const labelToShow = isShowingSunrise ? 'Sun Up' : 'Sun Down';
    const iconToShow = isShowingSunrise ? 'sunny-outline' : 'moon-outline';
    const iconColor = isShowingSunrise ? '#FFD700' : '#E0E0E0';

    return (
        <TouchableOpacity
            activeOpacity={0.8}
            onPress={onPress}
            style={[styles.container, {
                paddingVertical: 12,
                paddingHorizontal: 16,
                backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(255, 255, 255, 0.12)',
                borderColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(255, 255, 255, 0.1)',
            }]}
        >
            <View style={styles.leftSection}>
                <View style={styles.mainTempRow}>
                    <Ionicons
                        name={getIconName(icon, isNight) as any}
                        size={28}
                        color={isNight ? '#E0E0E0' : '#FFD700'}
                    />
                    <ThemedText style={styles.tempText}>{temp}°</ThemedText>
                </View>
                <ThemedText style={styles.conditionText}>{condition}</ThemedText>
            </View>

            <View style={styles.divider} />

            <View style={styles.rightSection}>
                <View style={styles.locationRow}>
                    <Ionicons name="location" size={14} color="#FFFFFF" style={{ opacity: 0.8 }} />
                    <ThemedText style={styles.locationText} numberOfLines={1}>{location}</ThemedText>
                </View>
                <View style={[styles.detailsRow, { marginBottom: 8 }]}>
                    <View style={styles.detailItem}>
                        <Ionicons name="thermometer-outline" size={12} color="#FFFFFF" style={{ opacity: 0.8 }} />
                        <ThemedText style={styles.detailLabel}>Feels</ThemedText>
                        <ThemedText style={styles.detailValue}>{feelsLike}°</ThemedText>
                    </View>
                    <View style={[styles.detailItem, { marginLeft: 16 }]}>
                        <Ionicons name="water-outline" size={12} color="#FFFFFF" style={{ opacity: 0.8 }} />
                        <ThemedText style={styles.detailLabel}>Drops</ThemedText>
                        <ThemedText style={styles.detailValue}>{humidity}%</ThemedText>
                    </View>
                </View>
                <View style={styles.detailsRow}>
                    <View style={styles.detailItem}>
                        <Ionicons name={iconToShow} size={12} color={iconColor} style={{ opacity: 0.9 }} />
                        <ThemedText style={styles.detailLabel}>{labelToShow}</ThemedText>
                        <ThemedText style={styles.detailValue}>{timeToShow}</ThemedText>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
});

export default HomeHeaderWeatherWidget;

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        padding: 14,
        borderRadius: Layout.headerBorderRadius,
        marginBottom: 16,
        alignItems: 'center',
        borderWidth: 1,
    },
    leftSection: {
        flex: 3,
        justifyContent: 'center',
    },
    mainTempRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    tempText: {
        fontSize: 26,
        fontWeight: '800',
        color: '#FFFFFF',
        paddingTop: 2,
    },
    conditionText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#FFFFFF',
        opacity: 0.85,
        marginTop: 2,
    },
    divider: {
        width: 1,
        height: '70%',
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        marginHorizontal: 14,
    },
    rightSection: {
        flex: 6.5,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 6,
    },
    locationText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFFFFF',
        flex: 1,
    },
    detailsRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    detailLabel: {
        fontSize: 10,
        fontWeight: '600',
        color: '#FFFFFF',
        opacity: 0.7,
        textTransform: 'uppercase',
    },
    detailValue: {
        fontSize: 12,
        fontWeight: '700',
        color: '#FFFFFF',
        marginLeft: 2,
    },
});
