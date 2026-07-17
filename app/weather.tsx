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
import WeatherStats from '@/components/weather/WeatherStats';
import WeatherSunrise from '@/components/weather/WeatherSunrise';
import { BG_GRADIENT } from '@/components/weather/weatherUtils';

import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { useWeatherCity } from '@/context/WeatherContext';
import { useWeather } from '@/hooks/useWeather';

export default function WeatherScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const { theme } = useTheme();
    const colors = Colors[theme];

    const { selectedCity: city, setSelectedCity: setCity } = useWeatherCity();

    const [searchInput, setSearchInput] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const [filteredCities, setFilteredCities] = useState<string[]>([]);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const { weather, forecast, isLoading, refetch } = useWeather(city);

    // ─────────────────────────────────────────────────────────────
    // Search
    // ─────────────────────────────────────────────────────────────

    const handleSubmit = useCallback(() => {
        if (!searchInput.trim()) return;

        setCity(searchInput.trim());
        setSearchInput('');
        setShowDropdown(false);
    }, [searchInput, setCity]);

    const handleSelectCity = useCallback(
        (selectedCity: string) => {
            setCity(`${selectedCity}, PK`);
            setSearchInput('');
            setShowDropdown(false);
        },
        [setCity]
    );

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
                        : BG_GRADIENT
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
                    <View style={[styles.topNav, styles.padded]}>
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

                    {/* Hero — open display on the forest background */}
                    <View style={styles.padded}>
                        <WeatherHero
                            weather={weather}
                            isLoading={isLoading}
                        />
                    </View>

                    {/* Content sheet */}
                    <View style={[styles.sheet, { backgroundColor: colors.background }]}>
                        <View style={styles.grabHandle} />

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
                    </View>

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
        flexGrow: 1,
    },

    padded: {
        paddingHorizontal: 20,
    },

    sheet: {
        flexGrow: 1,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 8,
        marginTop: 20,
    },

    grabHandle: {
        alignSelf: 'center',
        width: 44,
        height: 5,
        borderRadius: 3,
        backgroundColor: 'rgba(0,0,0,0.12)',
        marginBottom: 16,
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