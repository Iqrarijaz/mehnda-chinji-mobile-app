import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const WEATHER_CITY_KEY = 'weather_selected_city';
const DEFAULT_CITY = 'Talagang, PK';

interface WeatherContextType {
    selectedCity: string;
    setSelectedCity: (city: string) => void;
}

const WeatherContext = createContext<WeatherContextType>({
    selectedCity: DEFAULT_CITY,
    setSelectedCity: () => { },
});

export function WeatherProvider({ children }: { children: React.ReactNode }) {
    const [selectedCity, setSelectedCityState] = useState(DEFAULT_CITY);

    // Load persisted city on mount
    useEffect(() => {
        AsyncStorage.getItem(WEATHER_CITY_KEY).then(value => {
            if (value) setSelectedCityState(value);
        }).catch(() => { });
    }, []);

    const setSelectedCity = useCallback((city: string) => {
        setSelectedCityState(city);
        AsyncStorage.setItem(WEATHER_CITY_KEY, city).catch(() => { });
    }, []);

    const value = useMemo(() => ({ selectedCity, setSelectedCity }), [selectedCity, setSelectedCity]);

    return (
        <WeatherContext.Provider value={value}>
            {children}
        </WeatherContext.Provider>
    );
}

export const useWeatherCity = () => useContext(WeatherContext);
