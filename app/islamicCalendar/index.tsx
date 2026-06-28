import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getHijriCalendar, CalendarDay } from '@/apis/quran';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { analyticsService, AnalyticsEvents } from '@/analytics';

// Import refactored components
import { CalendarHeader } from '@/components/islamicCalendar/CalendarHeader';
import { MonthSelector } from '@/components/islamicCalendar/MonthSelector';
import { DayTile } from '@/components/islamicCalendar/DayTile';
import { MicroFeedback } from '@/components/feedback/MicroFeedback';

const ACCENT = '#059669'; // Emerald green
const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const IslamicCalendarScreenComponent = () => {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { theme } = useTheme();
    const colors = Colors[theme];

    // Current Date details for initial state
    const today = useMemo(() => new Date(), []);
    const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1); // 1-indexed
    const [currentYear, setCurrentYear] = useState(today.getFullYear());

    // State to hold the selected day details
    const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);

    useEffect(() => {
        analyticsService.trackEvent(AnalyticsEvents.ISLAMIC_CALENDAR_VIEWED);
    }, []);

    // Fetch monthly calendar data
    const {
        data: calendarResponse,
        isLoading: calendarLoading,
        isError: calendarError,
        refetch: refetchCalendar
    } = useQuery({
        queryKey: ['hijri-calendar', currentMonth, currentYear],
        queryFn: () => getHijriCalendar(currentMonth, currentYear),
    });

    const calendarData = calendarResponse?.data || [];

    // Extract current Hijri year from calendar days to show in the month label
    const activeHijriYear = useMemo(() => {
        if (calendarData.length > 0) {
            return calendarData[0].hijri.year;
        }
        return '1447'; // Fallback
    }, [calendarData]);

    // Auto-select today or first day when month/year changes
    useEffect(() => {
        if (calendarData.length > 0) {
            const todayDay = calendarData.find((day) => {
                if (!day) return false;
                const d = parseInt(day.gregorian.day, 10);
                const m = day.gregorian.month.number;
                const y = parseInt(day.gregorian.year, 10);
                return d === today.getDate() && m === (today.getMonth() + 1) && y === today.getFullYear();
            });
            setSelectedDay(todayDay || calendarData[0]);
        }
    }, [calendarData, today]);

    // Format current month label (Gregorian & Hijri)
    const monthHeaderLabel = useMemo(() => {
        if (calendarData.length === 0) {
            return { gregorian: 'Loading...', hijri: '' };
        }
        const gregMonth = calendarData[0].gregorian.month.en;
        const hijriMonths = Array.from(new Set(calendarData.map(d => d.hijri.month.en)));
        return {
            gregorian: `${gregMonth} ${currentYear}`,
            hijri: hijriMonths.join(' - ') + ` ${activeHijriYear} AH`
        };
    }, [calendarData, currentYear, activeHijriYear]);

    // Prepare calendar grid days including leading empty cells for offset alignment
    const gridDays = useMemo(() => {
        if (calendarData.length === 0) return [];

        const firstDay = calendarData[0];
        const startDayName = firstDay.gregorian.weekday.en;
        const startIndex = WEEKDAY_NAMES.indexOf(startDayName);

        const days = [];
        // Prepend empty slots
        for (let i = 0; i < startIndex; i++) {
            days.push(null);
        }
        // Append actual days
        days.push(...calendarData);
        return days;
    }, [calendarData]);

    // Navigate months helpers
    const handlePrevMonth = useCallback(() => {
        if (currentMonth === 1) {
            setCurrentMonth(12);
            setCurrentYear(prev => prev - 1);
        } else {
            setCurrentMonth(prev => prev - 1);
        }
    }, [currentMonth]);

    const handleNextMonth = useCallback(() => {
        if (currentMonth === 12) {
            setCurrentMonth(1);
            setCurrentYear(prev => prev + 1);
        } else {
            setCurrentMonth(prev => prev + 1);
        }
    }, [currentMonth]);

    const handleBack = useCallback(() => {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace('/');
        }
    }, [router]);

    return (
        <View style={[styles.root, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{ headerShown: false }} />

            <View style={styles.backgroundImage}>
                {/* Header Component */}
                <CalendarHeader
                    insetsTop={insets.top}
                    colors={colors}
                    onBack={handleBack}
                />

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
                >
                    {/* Month Selector Component */}
                    <MonthSelector
                        colors={colors}
                        accentColor={ACCENT}
                        gregorianLabel={monthHeaderLabel.gregorian}
                        hijriLabel={monthHeaderLabel.hijri}
                        onPrev={handlePrevMonth}
                        onNext={handleNextMonth}
                    />

                    {/* Weekdays Header Row */}
                    <View style={styles.weekdaysRow}>
                        {WEEKDAYS.map((day, idx) => {
                            const isWeekend = idx === 0 || idx === 6; // Sunday is 0, Saturday is 6
                            return (
                                <ThemedText
                                    key={idx}
                                    style={[
                                        styles.weekdayText,
                                        { color: isWeekend ? '#EF4444' : colors.textSecondary }
                                    ]}
                                >
                                    {day}
                                </ThemedText>
                            );
                        })}
                    </View>

                    {/* Calendar Monthly Day Grid */}
                    {calendarLoading ? (
                        <View style={styles.centeredHeight}>
                            <ActivityIndicator size="large" color={ACCENT} />
                        </View>
                    ) : calendarError ? (
                        <View style={styles.centeredHeight}>
                            <Ionicons name="alert-circle-outline" size={36} color="#EF4444" />
                            <ThemedText style={{ marginTop: 8, fontSize: 13, color: colors.textSecondary }}>Failed to load calendar</ThemedText>
                            <TouchableOpacity onPress={() => refetchCalendar()} style={styles.retryBtn}>
                                <ThemedText style={styles.retryText}>Retry</ThemedText>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={[styles.gridContainer, { backgroundColor: colors.card + '30', borderColor: colors.border }]}>
                            {gridDays.map((day, index) => {
                                const isToday = day ? (
                                    parseInt(day.gregorian.day, 10) === today.getDate() &&
                                    day.gregorian.month.number === (today.getMonth() + 1) &&
                                    parseInt(day.gregorian.year, 10) === today.getFullYear()
                                ) : false;

                                const isSelected = !!(day && selectedDay && day.gregorian.date === selectedDay.gregorian.date);

                                return (
                                    <DayTile
                                        key={day ? day.gregorian.date : `empty-${index}`}
                                        day={day}
                                        isToday={isToday}
                                        isSelected={isSelected}
                                        colors={colors}
                                        accentColor={ACCENT}
                                        onPress={() => day && setSelectedDay(day)}
                                    />
                                );
                            })}
                        </View>
                    )}

                    {/* Day Details Card */}
                    {selectedDay && (
                        <View style={[styles.detailCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <View style={styles.detailHeader}>
                                <View style={styles.detailHijriWrapper}>
                                    <ThemedText style={[styles.detailHijriDate, { color: ACCENT }]} type="defaultSemiBold">
                                        {selectedDay.hijri.day} {selectedDay.hijri.month.en} {selectedDay.hijri.year} AH
                                    </ThemedText>
                                    <ThemedText style={[styles.detailWeekday, { color: colors.textSecondary }]}>
                                        {selectedDay.hijri.weekday.en} • {selectedDay.hijri.weekday.ar}
                                    </ThemedText>
                                </View>
                                <View style={[styles.detailGregorianWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
                                    <ThemedText style={[styles.detailGregorianDate, { color: colors.text }]} type="defaultSemiBold">
                                        {selectedDay.gregorian.day} {selectedDay.gregorian.month.en.substring(0, 3)}
                                    </ThemedText>
                                </View>
                            </View>
                        </View>
                    )}

                    {/* Feedback Widget */}
                    <MicroFeedback componentName="islamic_calendar" />
                </ScrollView>
            </View>
        </View>
    );
}

export default React.memo(IslamicCalendarScreenComponent);

const styles = StyleSheet.create({
    root: {
        flex: 1,
    },
    backgroundImage: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    scrollContent: {
        paddingTop: 8,
    },
    weekdaysRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginTop: 18,
        marginBottom: 8,
    },
    weekdayText: {
        width: '14.28%',
        textAlign: 'center',
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginHorizontal: 16,
        borderRadius: 20,
        borderWidth: 1,
    },
    centeredHeight: {
        height: 200,
        justifyContent: 'center',
        alignItems: 'center',
    },
    retryBtn: {
        marginTop: 12,
        backgroundColor: ACCENT,
        paddingHorizontal: 18,
        paddingVertical: 8,
        borderRadius: 10,
    },
    retryText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '700',
    },
    detailCard: {
        marginHorizontal: 20,
        marginTop: 20,
        borderRadius: 18,
        borderWidth: 1,
        padding: 16,
    },
    detailHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    detailHijriWrapper: {
        flex: 1,
        paddingRight: 12,
    },
    detailHijriDate: {
        fontSize: 15,
        fontWeight: '800',
    },
    detailWeekday: {
        fontSize: 12,
        fontWeight: '600',
        marginTop: 2,
    },
    detailGregorianWrapper: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    detailGregorianDate: {
        fontSize: 12,
        fontWeight: '800',
    },
});
