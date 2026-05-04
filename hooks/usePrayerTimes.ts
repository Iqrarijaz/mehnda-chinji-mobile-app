import { useQuery } from '@tanstack/react-query';
import { getPrayerTimes, getPrayerCalendar } from '../apis/prayerTimes';

export const PRAYER_TIMES_QUERY_KEY = 'prayerTimes';

export function usePrayerTimes(city: string) {
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: [PRAYER_TIMES_QUERY_KEY, city],
        queryFn: () => getPrayerTimes(city),
        enabled: !!city,
        staleTime: 1000 * 60 * 60 * 4, // 4 hours
        refetchOnWindowFocus: true,
    });

    return {
        prayerData: data,
        isPrayerLoading: isLoading,
        prayerError: error,
        refetchPrayer: refetch,
    };
}

export function usePrayerCalendar(city: string) {
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: [PRAYER_TIMES_QUERY_KEY, 'calendar', city],
        queryFn: () => getPrayerCalendar(city),
        enabled: !!city,
        staleTime: 1000 * 60 * 60 * 24, // 24 hours
    });

    return {
        calendarData: data,
        isCalendarLoading: isLoading,
        calendarError: error,
    };
}
