import React, { useMemo, useState } from 'react';
import {
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Skeleton from '@/components/common/Skeleton';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/context/ThemeContext';
import { useWeather } from '@/hooks/useWeather';
import { useWeatherLocation } from '@/hooks/useWeatherLocation';
import { getWeatherIconName } from '@/utils/weatherTheme';
import { ThemedText } from '../ThemedText';

interface HomeHeaderWeatherWidgetProps {
    onPress?: () => void;
}

// ── One horizontal weather row: icon + temp beside info stack ──────
interface WeatherRowProps {
    icon?: string;
    temp: number | string;
    conditionLine: string;
    cityLabel: string;
    high: number | null;
    low: number | null;
    pop?: number;
    colors: typeof Colors.light;
    dayLabel?: string;
}

const WeatherRow = React.memo(({
    icon,
    temp,
    conditionLine,
    cityLabel,
    high,
    low,
    pop,
    colors,
    dayLabel
}: WeatherRowProps) => {
    return (
        <View style={styles.weatherCol}>
            <View style={styles.weatherRow}>
                {/* Left Side: City, Day Badge & Conditions */}
                <View style={styles.weatherInfoBlockLeft}>
                    <View style={styles.cityHeaderRow}>
                        <ThemedText style={styles.cityLabelHuge} numberOfLines={1}>
                            {cityLabel}
                        </ThemedText>
                        {dayLabel ? (
                            <View style={[styles.dayBadge, { backgroundColor: colors.lime }]}>
                                <ThemedText style={styles.dayBadgeText}>{dayLabel}</ThemedText>
                            </View>
                        ) : null}
                    </View>

                    <ThemedText style={styles.conditionCity} numberOfLines={1}>
                        {conditionLine}
                    </ThemedText>

                    <View style={styles.hiLoRow}>
                        <View style={styles.hiLoChip}>
                            <Ionicons name="arrow-up" size={10} color={colors.lime} />
                            <ThemedText style={[styles.highLow, { color: colors.lime }]}>
                                {high != null ? `${high}°` : '--'}
                            </ThemedText>
                        </View>
                        <View style={[styles.hiLoChip, { marginLeft: 6 }]}>
                            <Ionicons name="arrow-down" size={10} color="rgba(255,255,255,0.7)" />
                            <ThemedText style={[styles.highLow, { color: 'rgba(255,255,255,0.85)' }]}>
                                {low != null ? `${low}°` : '--'}
                            </ThemedText>
                        </View>
                        {pop ? (
                            <View style={styles.popPill}>
                                <Ionicons name="rainy" size={10} color="#38BDF8" />
                                <ThemedText style={styles.popPillText}>{pop}% rain</ThemedText>
                            </View>
                        ) : null}
                    </View>
                </View>

                {/* Right Side: Icon & Temp */}
                <View style={styles.iconTempBlockRight}>
                    <View style={styles.tempIconRow}>
                        <Ionicons name={getWeatherIconName(icon)} size={38} color="#FFFFFF" />
                        <ThemedText style={styles.tempHuge}>{temp}°</ThemedText>
                    </View>
                </View>
            </View>
        </View>
    );
});
WeatherRow.displayName = 'WeatherRow';

// ── Skeleton Loader Component ──
const WeatherSkeleton = React.memo(({ backgroundColor }: { backgroundColor: string }) => (
    <View style={styles.wrapper}>
        <View style={[styles.card, { backgroundColor, minHeight: 88 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flex: 1, paddingRight: 12 }}>
                    <Skeleton width={'60%'} height={18} />
                    <View style={{ height: 6 }} />
                    <Skeleton width={'40%'} height={13} />
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                        <Skeleton width={48} height={18} borderRadius={4} />
                        <View style={{ width: 6 }} />
                        <Skeleton width={48} height={18} borderRadius={4} />
                    </View>
                </View>
                <View style={{ alignItems: 'flex-end', justifyContent: 'center' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Skeleton width={38} height={38} borderRadius={19} />
                        <Skeleton width={46} height={32} borderRadius={6} />
                    </View>
                </View>
            </View>
        </View>
    </View>
));
WeatherSkeleton.displayName = 'WeatherSkeleton';

const HomeHeaderWeatherWidget = React.memo(({ onPress }: HomeHeaderWeatherWidgetProps) => {
    const { theme } = useTheme();
    const colors = Colors[theme];

    // Current location when permitted, else profile/default city
    const { coords, fallbackCity } = useWeatherLocation();
    const { weather, forecast, isWeatherLoading } = useWeather(
        fallbackCity,
        coords ? { lat: coords.latitude, lon: coords.longitude } : null,
    );

    const icon = weather?.weather?.[0]?.icon;

    // Today's high / low
    const { high, low } = useMemo(() => {
        const list = (forecast as any)?.list;
        if (Array.isArray(list) && list.length) {
            const todayStr = new Date().toISOString().slice(0, 10);
            const temps = list
                .filter((i: any) => new Date(i.dt * 1000).toISOString().slice(0, 10) === todayStr)
                .map((i: any) => i.main?.temp)
                .filter((t: any) => typeof t === 'number');
            if (temps.length) return { high: Math.round(Math.max(...temps)), low: Math.round(Math.min(...temps)) };
        }
        return {
            high: weather ? Math.round(weather.main.temp_max) : null,
            low: weather ? Math.round(weather.main.temp_min) : null
        };
    }, [forecast, weather]);

    // Tomorrow's outlook
    const tomorrow = useMemo(() => {
        const list = (forecast as any)?.list;
        if (!Array.isArray(list) || !list.length) return null;

        const tomorrowDate = new Date();
        tomorrowDate.setDate(tomorrowDate.getDate() + 1);
        const tomorrowStr = tomorrowDate.toISOString().slice(0, 10);

        const dayItems = list.filter((i: any) => new Date(i.dt * 1000).toISOString().slice(0, 10) === tomorrowStr);
        if (!dayItems.length) return null;

        const temps = dayItems.map((i: any) => i.main?.temp).filter((t: any) => typeof t === 'number');
        const pops = dayItems.map((i: any) => i.pop).filter((p: any) => typeof p === 'number');
        const middayItem = dayItems.reduce((closest: any, item: any) => {
            const hour = new Date(item.dt * 1000).getHours();
            const closestHour = closest ? new Date(closest.dt * 1000).getHours() : -99;
            return Math.abs(hour - 12) < Math.abs(closestHour - 12) ? item : closest;
        }, null);

        if (!temps.length || !middayItem) return null;

        return {
            high: Math.round(Math.max(...temps)),
            low: Math.round(Math.min(...temps)),
            icon: middayItem.weather?.[0]?.icon as string | undefined,
            condition: middayItem.weather?.[0]?.main ?? '—',
            pop: pops.length ? Math.round(Math.max(...pops) * 100) : 0,
        };
    }, [forecast]);

    const [activePage] = useState(0);

    if (!weather || isWeatherLoading) {
        return <WeatherSkeleton backgroundColor={colors.primary} />;
    }

    const temp = weather ? Math.round(weather.main.temp) : '--';
    const condition = weather?.weather?.[0]?.main ?? '—';
    const city = (weather?.name || fallbackCity || '').split(',')[0].trim();

    return (
        <View style={styles.wrapper}>
            <TouchableOpacity
                activeOpacity={0.85}
                onPress={onPress}
                style={[styles.card, { backgroundColor: colors.primary, minHeight: 88 }]}
            >
                <View key={activePage}>
                    {activePage === 0 || !tomorrow ? (
                        <WeatherRow
                            icon={icon}
                            temp={temp}
                            conditionLine={condition}
                            cityLabel={city}
                            dayLabel="Today"
                            high={high}
                            low={low}
                            colors={colors}
                        />
                    ) : (
                        <WeatherRow
                            icon={tomorrow.icon}
                            temp={tomorrow.high}
                            conditionLine={tomorrow.condition}
                            cityLabel={city}
                            dayLabel="Tomorrow"
                            high={tomorrow.high}
                            low={tomorrow.low}
                            pop={tomorrow.pop}
                            colors={colors}
                        />
                    )}
                </View>
            </TouchableOpacity>
        </View>
    );
});

HomeHeaderWeatherWidget.displayName = 'HomeHeaderWeatherWidget';
export default HomeHeaderWeatherWidget;

function relativeTime(unixSec?: number): string {
    if (!unixSec) return '';
    const diffMin = Math.max(0, Math.round((Date.now() - unixSec * 1000) / 60000));
    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const h = Math.floor(diffMin / 60);
    return `${h}h ago`;
}

const styles = StyleSheet.create({
    wrapper: {
        width: '100%',
        marginTop: 4,
        marginBottom: 14
    },
    card: {
        borderRadius: Layout.borderRadius,
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.18)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 3
    },
    weatherColWrap: {
        width: '100%',
        justifyContent: 'center'
    },
    weatherCol: {
        justifyContent: 'center'
    },
    weatherRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%'
    },
    weatherInfoBlockLeft: {
        flex: 1,
        justifyContent: 'center',
        paddingRight: 8
    },
    cityHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6
    },
    cityLabelHuge: {
        fontSize: 16,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 0.2
    },
    dayBadge: {
        paddingHorizontal: 6,
        paddingVertical: 0,
        borderRadius: 6
    },
    dayBadgeText: {
        fontSize: 9,
        fontWeight: '800',
        color: '#0F172A',
        textTransform: 'uppercase'
    },
    conditionCity: {
        fontSize: 12,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.9)',
        marginTop: 2
    },
    hiLoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
        flexWrap: 'wrap'
    },
    hiLoChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.15)',
        paddingHorizontal: 5,
        paddingVertical: 2,
        borderRadius: 4
    },
    highLow: {
        fontSize: 10.5,
        fontWeight: '800',
        marginLeft: 2
    },
    popPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        marginLeft: 6,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
        backgroundColor: 'rgba(56, 189, 248, 0.2)'
    },
    popPillText: {
        fontSize: 9.5,
        fontWeight: '700',
        color: '#38BDF8'
    },
    iconTempBlockRight: {
        alignItems: 'flex-end',
        justifyContent: 'center'
    },
    forecastTapArea: {
        alignItems: 'flex-end',
        justifyContent: 'center'
    },
    tempIconRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6
    },
    tempHuge: {
        fontSize: 32,
        fontWeight: '800',
        color: '#FFFFFF',
        lineHeight: 34
    },
    forecastPillContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 4
    },
    updatedInner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3
    },
    updated: {
        fontSize: 9.5,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.7)'
    },
    tapHintPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        paddingHorizontal: 7,
        paddingVertical: 3,
        borderRadius: 12
    },
    tapHintText: {
        fontSize: 9.5,
        fontWeight: '800',
        color: '#0F172A'
    },
    pagerFooterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 8,
        paddingTop: 6,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)'
    },
    pagerDotsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5
    },
    pagerDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: 'rgba(255,255,255,0.3)'
    },
    swipeHintGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3
    },
    swipeHintText: {
        fontSize: 9.5,
        fontWeight: '700'
    }
});
