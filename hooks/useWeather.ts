import { getForecast, getWeather, WeatherCoords } from '@/apis/weather';
import { useQuery } from '@tanstack/react-query';

export const useWeather = (city: string, coords?: WeatherCoords | null) => {
    // Coordinates take precedence over the city name; the query key encodes
    // whichever location source is active so the cache stays correct.
    const locationKey = coords ? `coords:${coords.lat.toFixed(3)},${coords.lon.toFixed(3)}` : `city:${city}`;

    const weatherQuery = useQuery({
        queryKey: ['weather', locationKey],
        queryFn: () => getWeather(city, coords),
        staleTime: 1000 * 60 * 10,
        gcTime: 1000 * 60 * 30,
    });

    const forecastQuery = useQuery({
        queryKey: ['forecast', locationKey],
        queryFn: () => getForecast(city, coords),
        staleTime: 1000 * 60 * 10,
        gcTime: 1000 * 60 * 30,
    });

    return {
        weather: weatherQuery.data,
        forecast: forecastQuery.data,
        isWeatherLoading: weatherQuery.isLoading,
        isForecastLoading: forecastQuery.isLoading,
        isLoading: weatherQuery.isLoading || forecastQuery.isLoading,
        refetch: () => {
            weatherQuery.refetch();
            forecastQuery.refetch();
        },
    };
};
