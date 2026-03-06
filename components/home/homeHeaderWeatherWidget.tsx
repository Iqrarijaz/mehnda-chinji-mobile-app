import { useWeather } from '@/hooks/useWeather';
import { useWeatherCity } from '@/context/WeatherContext';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '../themedText';

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

    return (
        <TouchableOpacity
            activeOpacity={0.8}
            onPress={onPress}
            style={styles.container}
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
                <View style={styles.detailsRow}>
                    <View style={styles.detailItem}>
                        <ThemedText style={styles.detailLabel}>Feels like</ThemedText>
                        <ThemedText style={styles.detailValue}>{feelsLike}°</ThemedText>
                    </View>
                    <View style={[styles.detailItem, { marginLeft: 16 }]}>
                        <ThemedText style={styles.detailLabel}>Humidity</ThemedText>
                        <ThemedText style={styles.detailValue}>{humidity}%</ThemedText>
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
        borderRadius: 18,
        marginBottom: 16,
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.12)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    leftSection: {
        flex: 1,
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
        flex: 1.2,
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
        gap: 2,
    },
    detailLabel: {
        fontSize: 10,
        fontWeight: '600',
        color: '#FFFFFF',
        opacity: 0.6,
        textTransform: 'uppercase',
    },
    detailValue: {
        fontSize: 13,
        fontWeight: '700',
        color: '#FFFFFF',
    },
});
