import { getForecast, getWeather } from '@/apis/weather';
import { useQuery } from '@tanstack/react-query';

export const useWeather = (city: string) => {
    const weatherQuery = useQuery({
        queryKey: ['weather', city],
        queryFn: () => getWeather(city),
        staleTime: 1000 * 60 * 10,
        gcTime: 1000 * 60 * 30,
    });

    const forecastQuery = useQuery({
        queryKey: ['forecast', city],
        queryFn: () => getForecast(city),
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
