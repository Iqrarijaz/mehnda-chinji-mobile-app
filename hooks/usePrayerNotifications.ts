import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { clientStorage } from '@/utils/storage';
import moment from 'moment';
import { setupAdhanChannel, ADHAN_CHANNEL_ID } from '@/components/notification/channel';

const LAST_SCHEDULED_KEY = 'last_prayer_scheduled_info_v4';

export const usePrayerNotifications = (
    calendarData: any,
    selectedCity: string
) => {
    // Schedule rolling 7-day prayer notifications
    useEffect(() => {
        if (!calendarData?.data || !Array.isArray(calendarData.data) || !selectedCity) return;

        const scheduleAdhanNotifications = async () => {
            try {
                // 1. Request/Check permissions
                const { status: existingStatus } = await Notifications.getPermissionsAsync();
                let finalStatus = existingStatus;
                if (existingStatus !== 'granted') {
                    const { status } = await Notifications.requestPermissionsAsync();
                    finalStatus = status;
                }

                if (finalStatus !== 'granted') {
                    console.log('Skipping Adhan scheduling: Push permissions not granted.');
                    return;
                }

                // 2. Setup Android Channel
                await setupAdhanChannel();

                // 3. Check if we actually need to reschedule
                const todayStr = moment().format('YYYY-MM-DD');
                const storedInfo = await clientStorage.getItem(LAST_SCHEDULED_KEY);
                const info = storedInfo ? JSON.parse(storedInfo) : null;

                if (info && info.date === todayStr && info.city === selectedCity) {
                    console.log('ℹ️ Prayer notifications already scheduled for today (v3). Skipping.');
                    return;
                }

                console.log(`📡 Scheduling rolling 7-day prayers (v3) for ${selectedCity}...`);

                // 4. Clear old pending notifications
                await Notifications.cancelAllScheduledNotificationsAsync();

                const now = moment();
                let scheduledCount = 0;
                const prayersToSchedule = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
                const prayerNamesUrdu: Record<string, string> = {
                    Fajr: "فجر",
                    Dhuhr: "ظہر",
                    Asr: "عصر",
                    Maghrib: "مغرب",
                    Isha: "عشاء"
                };
                // 5. Schedule next 7 days from calendar
                const upcomingDays = calendarData.data.filter((day: any) => {
                    const dayDate = moment(day.date.readable, 'DD MMM YYYY');
                    return dayDate.isSameOrAfter(now, 'day');
                }).slice(0, 7);

                for (const day of upcomingDays) {
                    const dateStr = day.date.readable;
                    const timings = day.timings;

                    for (const prayerName of prayersToSchedule) {
                        const rawTime = timings[prayerName];
                        if (!rawTime) continue;

                        const cleanTime = rawTime.split(' ')[0];
                        const triggerMoment = moment(`${dateStr} ${cleanTime}`, 'DD MMM YYYY HH:mm');
                        const urduName = prayerNamesUrdu[prayerName];

                        if (triggerMoment.isAfter(now)) {

                            await Notifications.scheduleNotificationAsync({
                                content: {
                                    title: `🕌 اللهُ أَكْبَر — وقتِ نماز ${urduName}`,
                                    body: `اللهُ أَكْبَر! آپ کے گرد و نواح میں نماز ${urduName} کا وقت ہو چکا ہے۔`,
                                    sound: "azaan",
                                    data: { prayerName }
                                },
                                trigger: {
                                    type: Notifications.SchedulableTriggerInputTypes.DATE,
                                    date: triggerMoment.toDate(),
                                    channelId: ADHAN_CHANNEL_ID,
                                },
                            });
                            scheduledCount++;
                        }
                    }
                }
                // 6. Save scheduling state
                await clientStorage.setItem(LAST_SCHEDULED_KEY, JSON.stringify({
                    date: todayStr,
                    city: selectedCity
                }));

            } catch (error) {
                console.warn('Failed to schedule rolling prayer notifications', error);
            }
        };

        scheduleAdhanNotifications();

    }, [calendarData, selectedCity]);

    useEffect(() => {
        const subscription = Notifications.addNotificationReceivedListener((notification) => {
            const prayerName = notification.request.content.data?.prayerName;
            if (prayerName) {
                console.log(`🕌 Prayer notification received for: ${prayerName}`);
            }
        });

        return () => {
            subscription.remove();
        };
    }, []);
};
