import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import cities from '../data/cities.json';

import BannerAd from '@/ads/components/BannerAd';
import NativeAd from '@/ads/components/NativeAd';
import WeatherDaily from '@/components/weather/WeatherDaily';
import WeatherHero from '@/components/weather/WeatherHero';
import WeatherHourly from '@/components/weather/WeatherHourly';
import WeatherSearchBar from '@/components/weather/WeatherSearchBar';
import { WeatherCitySwitcher } from '@/components/weather/WeatherCitySwitcher';
import WeatherStats from '@/components/weather/WeatherStats';
import WeatherSunrise from '@/components/weather/WeatherSunrise';
import { getWeatherGradient } from '@/utils/weatherTheme';

import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { useWeatherLocation } from '@/hooks/useWeatherLocation';
import { useWeather } from '@/hooks/useWeather';
import { useSavedCities } from '@/hooks/useSavedCities';
import { SavedCity } from '@/apis/weather';

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
        : (selected.lat != null ? `${selected.lat.toFixed(3)},${(selected.lon as number).toFixed(3)}` : '__search__');

    const [searchInput, setSearchInput] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const [filteredCities, setFilteredCities] = useState<string[]>([]);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const { weather, forecast, isLoading, refetch } = useWeather(effectiveCity, effectiveCoords);

    // ─────────────────────────────────────────────────────────────
    // Search
    // ─────────────────────────────────────────────────────────────

    const handleSubmit = useCallback(() => {
        if (!searchInput.trim()) return;

        setSelected({ name: searchInput.trim() });
        setSearchInput('');
        setShowDropdown(false);
    }, [searchInput]);

    const handleSelectCity = useCallback(
        (selectedCity: string) => {
            setSelected({ name: `${selectedCity}, PK` });
            setSearchInput('');
            setShowDropdown(false);
        },
        []
    );

    // Saved-city switcher handlers.
    const selectCurrent = useCallback(() => setSelected(null), []);
    const selectSavedCity = useCallback(
        (c: SavedCity) => setSelected({ name: c.name, lat: c.latitude, lon: c.longitude }),
        [],
    );
    const openManageCities = useCallback(() => router.push('/weather/manage-cities' as any), [router]);

    const handleChangeText = useCallback((text: string) => {
        setSearchInput(text);

        if (!text.trim()) {
            setShowDropdown(false);
            return;
        }

        const filtered = (cities as string[])
            .filter(city =>
                city.toLowerCase().includes(text.toLowerCase())
            )
            .slice(0, 8);

        setFilteredCities(filtered);
        setShowDropdown(filtered.length > 0);
    }, []);

    const handleClear = useCallback(() => {
        setSearchInput('');
        setShowDropdown(false);
        // Clearing the search returns to the current-location default.
        setSelected(null);
    }, []);

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

        return forecast.list.slice(0, 8).map((item: any) => {
            const date = new Date(item.dt * 1000);

            const hours = date.getHours();
            const ampm = hours >= 12 ? 'PM' : 'AM';
            const hour = hours % 12 || 12;

            return {
                time: `${hour}${ampm}`,
                icon: item.weather[0].icon,
                temp: Math.round(item.main.temp),
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
                        weekday: 'short',
                    }),

                    date: new Date(
                        representative.dt * 1000
                    ).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                    }),

                    icon: representative.weather[0].icon,
                    high: Math.max(...temps),
                    low: Math.min(...temps),
                    pop: Math.round(
                        (representative.pop || 0) * 100
                    ),
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
                hour12: true,
            }
        )
        : '--';

    const sunset = weather?.sys?.sunset
        ? new Date(weather.sys.sunset * 1000).toLocaleTimeString(
            'en-US',
            {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
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

            <LinearGradient
                colors={
                    theme === 'dark'
                        ? [colors.background, colors.background]
                        : getWeatherGradient(weather?.weather?.[0]?.icon, { primary: colors.primary, secondary: colors.secondary, lime: colors.lime })
                }
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
            />

            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    contentContainerStyle={[
                        styles.scrollContent,
                        {
                            paddingTop: insets.top + 16,
                            paddingBottom: insets.bottom + 40,
                        },
                    ]}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefreshing}
                            onRefresh={handleRefresh}
                            tintColor="#FFFFFF"
                        />
                    }
                >
                    {/* Header */}
                    <View style={styles.topNav}>
                        <TouchableOpacity
                            activeOpacity={0.8}
                            style={styles.backBtn}
                            onPress={() =>
                                router.canGoBack()
                                    ? router.back()
                                    : router.replace('/(drawer)/(tabs)' as any)
                            }
                        >
                            <Ionicons
                                name="arrow-back"
                                size={22}
                                color="#FFFFFF"
                            />
                        </TouchableOpacity>

                        <View style={styles.searchWrapper}>
                            <WeatherSearchBar
                                searchInput={searchInput}
                                filteredCities={filteredCities}
                                showDropdown={showDropdown}
                                onChangeText={handleChangeText}
                                onSubmit={handleSubmit}
                                onClear={handleClear}
                                onSelectCity={handleSelectCity}
                            />
                        </View>
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

                    <NativeAd placement="weather" />

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

                <View style={styles.bannerContainer}>
                    <BannerAd placement="weather" />
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    flex: {
        flex: 1,
    },

    container: {
        flex: 1,
    },

    scrollContent: {
        paddingHorizontal: 20,
        flexGrow: 1,
    },

    topNav: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        marginBottom: 24,
        zIndex: 9999,
        overflow: 'visible',
    },

    backBtn: {
        width: 42,
        height: 42,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.18)',
    },

    searchWrapper: {
        flex: 1,
        zIndex: 9999,
        overflow: 'visible',
    },

    bannerContainer: {
        justifyContent: 'center',
        // minHeight: 60,
        marginBottom: 26,
    },
});