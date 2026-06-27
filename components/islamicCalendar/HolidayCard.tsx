import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { IslamicHoliday } from '@/apis/quran';

interface HolidayCardProps {
    holiday: IslamicHoliday;
    colors: any;
    accentColor: string;
    countdown: string | null;
}

export const HolidayCard = React.memo(({ holiday, colors, accentColor, countdown }: HolidayCardProps) => {
    const isPassed = countdown === 'Passed';
    const isToday = countdown === 'Today 🎉';

    // Safely extract holiday properties to avoid runtime type crashes
    const eventName = holiday?.event || 'Islamic Event';
    const gregorianDate = holiday?.date || '';
    const hijriDay = holiday?.hijriDate?.day || '';
    const hijriMonth = holiday?.hijriDate?.month || '';

    // Determine card accent border color based on status
    const cardBorderColor = isPassed ? colors.border : (isToday ? '#EF4444' : accentColor);

    return (
        <View style={[styles.holidayCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {/* Elegant Left Accent Bar */}
            <View style={[styles.leftAccentBar, { backgroundColor: cardBorderColor }]} />

            <View style={styles.contentWrapper}>
                <View style={styles.holidayLeft}>
                    <ThemedText style={styles.holidayEvent} type="defaultSemiBold">
                        {eventName}
                    </ThemedText>
                    <View style={styles.dateRow}>
                        <Ionicons name="calendar-outline" size={11} color={colors.textSecondary} style={styles.calendarIcon} />
                        <ThemedText style={[styles.holidayDate, { color: colors.textSecondary }]}>
                            {gregorianDate}{gregorianDate && hijriDay ? '  |  ' : ''}{hijriDay} {hijriMonth}
                        </ThemedText>
                    </View>
                </View>

                {countdown && (
                    <View
                        style={[
                            styles.countdownBadge,
                            {
                                backgroundColor: isPassed
                                    ? colors.border + '60'
                                    : (isToday ? '#EF444415' : accentColor + '10')
                            }
                        ]}
                    >
                        <ThemedText
                            style={[
                                styles.countdownText,
                                {
                                    color: isPassed
                                        ? colors.textSecondary
                                        : (isToday ? '#EF4444' : accentColor)
                                }
                            ]}
                        >
                            {countdown}
                        </ThemedText>
                    </View>
                )}
            </View>
        </View>
    );
});

HolidayCard.displayName = 'HolidayCard';

const styles = StyleSheet.create({
    holidayCard: {
        flexDirection: 'row',
        borderRadius: 14,
        marginVertical: 6,
        borderWidth: 1,
        overflow: 'hidden',
    },
    leftAccentBar: {
        width: 4.5,
        height: '100%',
    },
    contentWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        paddingHorizontal: 16,
    },
    holidayLeft: {
        flex: 1,
        marginRight: 12,
    },
    holidayEvent: {
        fontSize: 14.5,
        fontWeight: '700',
        lineHeight: 18,
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 5,
    },
    calendarIcon: {
        marginRight: 4,
    },
    holidayDate: {
        fontSize: 11,
        fontWeight: '600',
    },
    countdownBadge: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    countdownText: {
        fontSize: 10,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
});
