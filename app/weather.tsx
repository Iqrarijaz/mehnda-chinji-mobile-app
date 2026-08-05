import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';



import BannerAd from '@/ads/components/BannerAd';
import NativeAd from '@/ads/components/NativeAd';
import WeatherDaily from '@/components/weather/WeatherDaily';
import WeatherHero from '@/components/weather/WeatherHero';
import WeatherHourly from '@/components/weather/WeatherHourly';

import { WeatherCitySwitcher } from '@/components/weather/WeatherCitySwitcher';
import WeatherStats from '@/components/weather/WeatherStats';
import WeatherSunrise from '@/components/weather/WeatherSunrise';
import WeatherDetails from '@/components/weather/WeatherDetails';

import { useQuery } from '@tanstack/react-query';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { useWeatherLocation } from '@/hooks/useWeatherLocation';
import { useWeather } from '@/hooks/useWeather';
import { useSavedCities } from '@/hooks/useSavedCities';
import { SavedCity, getAirQuality, getUVIndex } from '@/apis/weather';
import { Layout } from '@/constants/layout';

function relativeWeatherTime(unixSec: number): string {
    const diffMin = Math.max(0, Math.round((Date.now() - unixSec * 1000) / 60000));
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    return `${Math.floor(diffMin / 60)}h ago`;
}

export default function WeatherScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const { theme } = useTheme();
    const colors = Colors[theme];

    // Same resolution as the home widget: current GPS location when permission
    // is granted, otherwise the profile/Default city. Keeps the screens in sync.
    const { coords, fallbackCity } = useWeatherLocation();
    const { cities: savedCities } = useSavedCities();

    // Explicit selection overrides the auto location: a saved city (with coords),
    // or a free-text search (name only). null → auto (current / default).
    const [selected, setSelected] = useState<{ name: string; lat?: number; lon?: number } | null>(null);

    const effectiveCoords = selected
        ? (selected.lat != null ? { lat: selected.lat, lon: selected.lon as number } : null)
        : (coords ? { lat: coords.latitude, lon: coords.longitude } : null);
    const effectiveCity = selected?.name || fallbackCity;

    const activeCityKey = !selected
        ? null
        : (selected.lat != null ? `${selected.lat.toFixed(3)},${(selected.lon as number).toFixed(3)}` : null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const { weather, forecast, isLoading, refetch } = useWeather(effectiveCity, effectiveCoords);

    // Supplementary coord-based data: air quality (OpenWeather) + UV (Open-Meteo).
    const airQuery = useQuery({
        queryKey: ['airQuality', effectiveCoords?.lat, effectiveCoords?.lon],
        queryFn: () => getAirQuality(effectiveCoords!.lat, effectiveCoords!.lon),
        enabled: !!effectiveCoords,
        staleTime: 1000 * 60 * 30
    });
    const uvQuery = useQuery({
        queryKey: ['uvIndex', effectiveCoords?.lat, effectiveCoords?.lon],
        queryFn: () => getUVIndex(effectiveCoords!.lat, effectiveCoords!.lon),
        enabled: !!effectiveCoords,
        staleTime: 1000 * 60 * 30
    });

    const aqi = (airQuery.data as any)?.main?.aqi ?? null;
    const uv = uvQuery.data ?? null;
    const visibilityKm = weather?.visibility != null ? Math.round(weather.visibility / 1000) : null;
    const updatedLabel = weather?.dt ? relativeWeatherTime(weather.dt) : '';

    // ─────────────────────────────────────────────────────────────
    // Search
    // ─────────────────────────────────────────────────────────────

    const selectCurrent = useCallback(() => setSelected(null), []);
    const selectSavedCity = useCallback(
        (c: SavedCity) => setSelected({ name: c.name, lat: c.latitude, lon: c.longitude }),
        [],
    );
    const openManageCities = useCallback(() => router.push('/weather/manage-cities' as any), [router]);

    // ─────────────────────────────────────────────────────────────
    // Refresh
    // ─────────────────────────────────────────────────────────────

    const handleRefresh = useCallback(async () => {
        try {
            setIsRefreshing(true);
            await refetch();
        } finally {
            setIsRefreshing(false);
        }
    }, [refetch]);

    // ─────────────────────────────────────────────────────────────
    // Hourly Forecast
    // ─────────────────────────────────────────────────────────────

    const hourlyData = useMemo(() => {
        if (!forecast) return [];

        // 16 x 3-hour steps = 48h of forecast — enough that the hourly chart
        // genuinely needs to scroll, matching the "slider" behaviour.
        return forecast.list.slice(0, 16).map((item: any) => {
            const date = new Date(item.dt * 1000);

            const hours = date.getHours();
            const ampm = hours >= 12 ? 'PM' : 'AM';
            const hour = hours % 12 || 12;

            return {
                time: `${hour}${ampm}`,
                icon: item.weather[0].icon,
                temp: Math.round(item.main.temp),
                pop: Math.round((item.pop || 0) * 100)
            };
        });
    }, [forecast]);

    // ─────────────────────────────────────────────────────────────
    // Daily Forecast
    // ─────────────────────────────────────────────────────────────

    const dailyData = useMemo(() => {
        if (!forecast) return [];

        const todayStr = new Date().toISOString().split('T')[0];

        const groupedDays: Record<string, any[]> = {};

        forecast.list.forEach((item: any) => {
            const dateStr = new Date(item.dt * 1000)
                .toISOString()
                .split('T')[0];

            if (dateStr === todayStr) return;

            if (!groupedDays[dateStr]) {
                groupedDays[dateStr] = [];
            }

            groupedDays[dateStr].push(item);
        });

        return Object.keys(groupedDays)
            .sort()
            .slice(0, 7)
            .map(dateKey => {
                const entries = groupedDays[dateKey];

                const representative =
                    entries.find((e: any) =>
                        (e.dt_txt || '').includes('12:00:00')
                    ) || entries[Math.floor(entries.length / 2)];

                const temps = entries.map((e: any) =>
                    Math.round(e.main.temp)
                );

                return {
                    day: new Date(
                        representative.dt * 1000
                    ).toLocaleDateString('en-US', {
                        weekday: 'short'
                    }),

                    date: new Date(
                        representative.dt * 1000
                    ).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                    }),

                    icon: representative.weather[0].icon,
                    high: Math.max(...temps),
                    low: Math.min(...temps),
                    pop: Math.round(
                        (representative.pop || 0) * 100
                    )
                };
            });
    }, [forecast]);

    // ─────────────────────────────────────────────────────────────
    // Sunrise / Sunset
    // ─────────────────────────────────────────────────────────────

    const sunrise = weather?.sys?.sunrise
        ? new Date(weather.sys.sunrise * 1000).toLocaleTimeString(
            'en-US',
            {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            }
        )
        : '--';

    const sunset = weather?.sys?.sunset
        ? new Date(weather.sys.sunset * 1000).toLocaleTimeString(
            'en-US',
            {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            }
        )
        : '--';

    return (
        <View
            style={[
                styles.container,
                { backgroundColor: colors.background },
            ]}
        >
            <Stack.Screen options={{ headerShown: false }} />

            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    contentContainerStyle={[
                        styles.scrollContent,
                        {
                            paddingTop: insets.top + 16,
                            paddingBottom: insets.bottom + 40
                        },
                    ]}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefreshing}
                            onRefresh={handleRefresh}
                            tintColor={colors.primary}
                        />
                    }
                >
                    {/* Header */}
                    <View style={styles.topNav}>
                        <TouchableOpacity
                            activeOpacity={0.8}
                            style={[styles.backBtn, { backgroundColor: `${colors.primary}14` }]}
                            onPress={() =>
                                router.canGoBack()
                                    ? router.back()
                                    : router.replace('/(drawer)/(tabs)' as any)
                            }
                        >
                            <Ionicons
                                name="arrow-back"
                                size={22}
                                color={colors.primary}
                            />
                        </TouchableOpacity>
                    </View>

                    {/* Saved-city switcher */}
                    <WeatherCitySwitcher
                        cities={savedCities}
                        activeKey={activeCityKey}
                        onSelectCurrent={selectCurrent}
                        onSelectCity={selectSavedCity}
                        onManage={openManageCities}
                    />

                    {/* Hero */}
                    <WeatherHero
                        weather={weather}
                        isLoading={isLoading}
                    />

                    {/* Stats */}
                    <WeatherStats
                        weather={weather}
                        forecast={forecast}
                    />

                    {/* Details: visibility, UV, air quality, last updated */}
                    {weather ? (
                        <WeatherDetails
                            visibilityKm={visibilityKm}
                            uv={uv}
                            aqi={aqi}
                            updatedLabel={updatedLabel}
                        />
                    ) : null}

                    <View style={{ backgroundColor: colors.cardBg, padding: 7, borderRadius: Layout.borderRadius, marginBottom: 16 }}>
                        <NativeAd placement="weather" />
                    </View>

                    {/* Hourly */}
                    <WeatherHourly data={hourlyData} />

                    {/* Daily */}
                    <WeatherDaily data={dailyData} />

                    {/* Sunrise */}
                    {weather && (
                        <WeatherSunrise
                            sunrise={sunrise}
                            sunset={sunset}
                        />
                    )}

                </ScrollView>

                <View style={[styles.bannerContainer, { paddingBottom: insets.bottom }]}>
                    <BannerAd placement="weather" />
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    flex: {
        flex: 1
    },

    container: {
        flex: 1
    },

    scrollContent: {
        paddingHorizontal: 16,
        flexGrow: 1
    },

    topNav: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        marginBottom: 24,
        zIndex: 9999,
        overflow: 'visible'
    },

    backBtn: {
        width: 46,
        height: 46,
        borderRadius: Layout.borderRadius,
        justifyContent: 'center',
        alignItems: 'center'
    },

    bannerContainer: {
        justifyContent: 'center',
        marginBottom: 8
    }
});