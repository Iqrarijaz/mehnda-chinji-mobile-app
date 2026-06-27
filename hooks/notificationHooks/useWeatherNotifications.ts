import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { clientStorage } from '@/utils/storage';
import moment from '@/utils/dayjs';
import { useNotificationStore } from '@/store/notificationStore';
import { getForecast } from '@/apis/weather';

const LAST_WEATHER_SCHEDULED_KEY = 'last_weather_scheduled_info_v1';
const WEATHER_NOTIFICATION_ID = 'weather_rain_alert';

export const useWeatherNotifications = (selectedCity: string) => {
    const preferences = useNotificationStore((state) => state.preferences);
    const weatherEnabled = preferences?.weather;

    useEffect(() => {
        const scheduleWeatherAlert = async () => {
            try {
                if (!weatherEnabled) {
                    console.log('🌧️ Weather notifications disabled. Cancelling scheduled alerts...');
                    await Notifications.cancelScheduledNotificationAsync(WEATHER_NOTIFICATION_ID);
                    await clientStorage.removeItem(LAST_WEATHER_SCHEDULED_KEY);
                    return;
                }

                if (!selectedCity) return;

                // 1. Request/Check permissions
                const { status: existingStatus } = await Notifications.getPermissionsAsync();
                let finalStatus = existingStatus;
                if (existingStatus !== 'granted') {
                    const { status } = await Notifications.requestPermissionsAsync();
                    finalStatus = status;
                }

                if (finalStatus !== 'granted') {
                    console.log('Skipping weather scheduling: Push permissions not granted.');
                    return;
                }

                // 2. Check if already scheduled today for the same city
                const todayStr = moment().format('YYYY-MM-DD');
                const storedInfo = await clientStorage.getItem(LAST_WEATHER_SCHEDULED_KEY);
                const info = storedInfo ? JSON.parse(storedInfo) : null;

                if (info && info.date === todayStr && info.city === selectedCity) {
                    console.log('ℹ️ Weather notifications already checked/scheduled for today. Skipping.');
                    return;
                }

                console.log(`📡 Fetching weather forecast to check rain for ${selectedCity}...`);
                const forecastData = await getForecast(selectedCity);
                if (!forecastData || !Array.isArray(forecastData.list)) return;

                // 3. Find tomorrow's forecast entries
                const tomorrowStr = moment().add(1, 'day').format('YYYY-MM-DD');
                const tomorrowForecasts = forecastData.list.filter((item: any) => {
                    const itemDate = moment(item.dt * 1000).format('YYYY-MM-DD');
                    return itemDate === tomorrowStr;
                });

                // 4. Check for rain chance tomorrow
                const rainEntry = tomorrowForecasts.find((item: any) => {
                    const hasRainKeyword = item.weather?.some((w: any) =>
                        /rain|drizzle|thunderstorm/i.test(w.main || '') ||
                        /rain|drizzle|thunderstorm/i.test(w.description || '')
                    );
                    const hasHighPop = item.pop && item.pop > 0.2; // Probability of precipitation > 20%
                    return hasRainKeyword || hasHighPop;
                });

                if (rainEntry) {
                    const popPercentage = Math.round((rainEntry.pop || 0.3) * 100);
                    const weatherDesc = rainEntry.weather?.[0]?.description || 'rain';
                    const cityNameClean = selectedCity.split(',')[0].trim();

                    console.log(`🌧️ Rain detected for tomorrow! Pop: ${popPercentage}%, Desc: ${weatherDesc}. Scheduling notification...`);

                    // Determine trigger time: 8:00 PM today
                    let triggerDate = moment().hour(20).minute(0).second(0);
                    if (moment().isAfter(triggerDate)) {
                        // If it's already past 8:00 PM today, trigger in 10 seconds
                        triggerDate = moment().add(10, 'seconds');
                    }

                    await Notifications.scheduleNotificationAsync({
                        identifier: WEATHER_NOTIFICATION_ID,
                        content: {
                            title: '🌧️ Rain Alert / بارش کا الرٹ',
                            body: `There is a ${popPercentage}% chance of ${weatherDesc} tomorrow in ${cityNameClean.charAt(0).toUpperCase() + cityNameClean.slice(1)}. Carry an umbrella! / کل بارش کا امکان ہے۔`,
                            data: { type: 'weather_rain' }
                        },
                        trigger: {
                            type: Notifications.SchedulableTriggerInputTypes.DATE,
                            date: triggerDate.toDate(),
                        },
                    });
                } else {
                    console.log('☀️ No rain chance detected for tomorrow. Cancelling any scheduled weather alert.');
                    await Notifications.cancelScheduledNotificationAsync(WEATHER_NOTIFICATION_ID);
                }

                // 5. Save scheduling state
                await clientStorage.setItem(LAST_WEATHER_SCHEDULED_KEY, JSON.stringify({
                    date: todayStr,
                    city: selectedCity
                }));

            } catch (error) {
                console.warn('Failed to schedule weather notification', error);
            }
        };

        scheduleWeatherAlert();
    }, [selectedCity, weatherEnabled]);
};
