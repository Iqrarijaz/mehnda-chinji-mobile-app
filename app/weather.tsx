import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { SlideInLeft } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import cities from '../data/cities.json';

import { useWeather } from '@/hooks/useWeather';
import { useWeatherCity } from '@/context/WeatherContext';
import WeatherDaily from '@/components/weather/WeatherDaily';
import WeatherHero from '@/components/weather/WeatherHero';
import WeatherHourly from '@/components/weather/WeatherHourly';
import WeatherSearchBar from '@/components/weather/WeatherSearchBar';
import WeatherStats from '@/components/weather/WeatherStats';
import WeatherSunrise from '@/components/weather/WeatherSunrise';
import { BG_GRADIENT } from '@/components/weather/weatherUtils';

export default function WeatherScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    // 🌐 Shared city — persisted and synced with home widget
    const { selectedCity: city, setSelectedCity: setCity } = useWeatherCity();
    const [searchInput, setSearchInput] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const [filteredCities, setFilteredCities] = useState<string[]>([]);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const { weather, forecast, isLoading, refetch } = useWeather(city);

    const handleSubmit = useCallback(() => {
        if (searchInput.trim()) {
            setCity(searchInput.trim());
            setSearchInput('');
            setShowDropdown(false);
        }
    }, [searchInput]);

    const handleSelectCity = useCallback((selectedCity: string) => {
        setCity(selectedCity + ', PK');
        setSearchInput('');
        setShowDropdown(false);
    }, []);

    const handleChangeText = useCallback((text: string) => {
        setSearchInput(text);
        if (text.trim().length > 0) {
            const filtered = (cities as string[])
                .filter(c => c.toLowerCase().includes(text.toLowerCase()))
                .slice(0, 8);
            setFilteredCities(filtered);
            setShowDropdown(filtered.length > 0);
        } else {
            setShowDropdown(false);
        }
    }, []);

    const handleClear = useCallback(() => {
        setSearchInput('');
        setShowDropdown(false);
    }, []);

    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true);
        await refetch();
        setIsRefreshing(false);
    }, [refetch]);

    // ── Hourly data ──────────────────────────────────────────────────────────
    const hourlyData = useMemo(() => {
        if (!forecast) return [];
        return forecast.list.slice(0, 8).map((item: any) => {
            const date = new Date(item.dt * 1000);
            const hours = date.getHours();
            const ampm = hours >= 12 ? 'PM' : 'AM';
            const h = hours % 12 || 12;
            return { time: `${h}${ampm}`, icon: item.weather[0].icon, temp: Math.round(item.main.temp) };
        });
    }, [forecast]);

    // ── Daily data ───────────────────────────────────────────────────────────
    const dailyData = useMemo(() => {
        if (!forecast) return [];
        const todayStr = new Date().toISOString().split('T')[0];
        const dayGroups: { [key: string]: any[] } = {};
        forecast.list.forEach((item: any) => {
            const dateStr = new Date(item.dt * 1000).toISOString().split('T')[0];
            if (dateStr !== todayStr) {
                if (!dayGroups[dateStr]) dayGroups[dateStr] = [];
                dayGroups[dateStr].push(item);
            }
        });
        return Object.keys(dayGroups).sort().slice(0, 7).map(dateKey => {
            const entries = dayGroups[dateKey];
            const noon = entries.find((e: any) => (e.dt_txt || '').includes('12:00:00')) || entries[Math.floor(entries.length / 2)];
            const temps = entries.map((e: any) => Math.round(e.main.temp));
            return {
                day: new Date(noon.dt * 1000).toLocaleDateString('en-US', { weekday: 'short' }),
                icon: noon.weather[0].icon,
                high: Math.max(...temps),
                low: Math.min(...temps),
                pop: Math.round((noon.pop || 0) * 100),
            };
        });
    }, [forecast]);

    // ── Sunrise / Sunset ─────────────────────────────────────────────────────
    const sunrise = weather?.sys?.sunrise
        ? new Date(weather.sys.sunrise * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
        : '--';
    const sunset = weather?.sys?.sunset
        ? new Date(weather.sys.sunset * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
        : '--';

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            <LinearGradient colors={BG_GRADIENT} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} />

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView
                    contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 40 }]}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#FFFFFF" />
                    }
                >
                    {/* Top Nav */}
                    <Animated.View entering={SlideInLeft.duration(400)} style={styles.topNav}>
                        <TouchableOpacity
                            onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}
                            style={styles.backBtn}
                        >
                            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
                        </TouchableOpacity>

                        <WeatherSearchBar
                            searchInput={searchInput}
                            filteredCities={filteredCities}
                            showDropdown={showDropdown}
                            onChangeText={handleChangeText}
                            onSubmit={handleSubmit}
                            onClear={handleClear}
                            onSelectCity={handleSelectCity}
                        />
                    </Animated.View>

                    {/* Sections */}
                    <WeatherHero weather={weather} isLoading={isLoading} />
                    <WeatherStats weather={weather} forecast={forecast} />
                    <WeatherHourly data={hourlyData} />
                    <WeatherDaily data={dailyData} />
                    {weather && <WeatherSunrise sunrise={sunrise} sunset={sunset} />}
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scroll: { paddingHorizontal: 20 },
    topNav: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
        gap: 12,
        zIndex: 1000,
        elevation: 1000,
    },
    backBtn: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
