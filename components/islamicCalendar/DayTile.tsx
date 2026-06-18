import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/themedText';
import { CalendarDay } from '@/apis/quran';

interface DayTileProps {
    day: CalendarDay | null;
    isToday: boolean;
    isSelected: boolean;
    colors: any;
    accentColor: string;
    onPress: () => void;
}

export const DayTile = React.memo(({ day, isToday, isSelected, colors, accentColor, onPress }: DayTileProps) => {
    if (!day) {
        return <View style={styles.dayTileEmpty} />;
    }

    const isWeekend = day.gregorian.weekday.en === 'Sunday' || day.gregorian.weekday.en === 'Saturday';

    return (
        <TouchableOpacity 
            activeOpacity={0.75}
            onPress={onPress}
            style={[
                styles.dayTile, 
                { backgroundColor: colors.card, borderColor: colors.border },
                isWeekend && { backgroundColor: colors.card + '80' },
                isToday && { borderColor: accentColor, borderWidth: 1.5, backgroundColor: accentColor + '08' },
                isSelected && { backgroundColor: accentColor, borderColor: accentColor }
            ]}
        >
            <View style={styles.tileHeader}>
                <ThemedText style={[
                    styles.gregorianDayText, 
                    { color: isSelected ? '#FFFFFFaa' : colors.textSecondary },
                ]}>
                    {day.gregorian.day}
                </ThemedText>
            </View>
            
            <ThemedText style={[
                styles.hijriDayText, 
                { color: isSelected ? '#FFFFFF' : (isToday ? accentColor : colors.text) }
            ]}>
                {day.hijri.day}
            </ThemedText>
        </TouchableOpacity>
    );
});

DayTile.displayName = 'DayTile';

const styles = StyleSheet.create({
    dayTile: {
        width: '12.28%', // Matches 7 columns in grid (12.28% * 7 + margins ~= 100%)
        height: 54,
        margin: '1%',
        borderRadius: 12,
        padding: 5,
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
    },
    dayTileEmpty: {
        width: '12.28%',
        height: 54,
        margin: '1%',
    },
    tileHeader: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'flex-start',
    },
    gregorianDayText: {
        fontSize: 8.5,
        fontWeight: '600',
    },
    hijriDayText: {
        fontSize: 16,
        fontWeight: '800',
        marginTop: -3,
    },
});
