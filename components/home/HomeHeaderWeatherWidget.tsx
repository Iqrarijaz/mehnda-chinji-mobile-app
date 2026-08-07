import React, { useEffect, useMemo, useRef, useState } from 'react';
import { LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent, StyleSheet, View, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
    FadeIn,
    FadeInDown,
    Easing,
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withSequence,
    withTiming,
    withDelay } from 'react-native-reanimated';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/context/ThemeContext';
import { useWeather } from '@/hooks/useWeather';
import { useWeatherLocation } from '@/hooks/useWeatherLocation';
import { useNextPrayer } from '@/hooks/useNextPrayer';
import { getWeatherIconName } from '@/utils/weatherTheme';
import { ThemedText } from '../ThemedText';

interface HomeHeaderWeatherWidgetProps {
    onPress?: () => void;
}

// Prayer column gets a fixed share of the card's width, weather gets the
// rest — expressed as flex weights so they always sum to the same ratio
// regardless of device width.
const WEATHER_FLEX = 65;
const PRAYER_FLEX = 35;



// ── One horizontal weather row: icon+temp beside a 2-line info stack ──────
// Shared shape for both the "today" and "tomorrow" pager pages, so the
// layout — and the reduced height it buys back — is identical either way.
interface WeatherRowProps {
    width?: number;
    icon?: string;
    temp: number | string;
    conditionLine: string;
    cityLabel: string;
    high: number | null;
    low: number | null;
    pop?: number;
    colors: typeof Colors.light;
    animateTemp?: boolean;
    updatedLabel?: string;
    showFullForecast?: boolean;
}
const WeatherRow = React.memo(({ width, icon, temp, conditionLine, cityLabel, high, low, pop, colors, animateTemp, updatedLabel, showFullForecast }: WeatherRowProps) => {
    const TempWrap = animateTemp ? Animated.View : View;
    return (
        <View style={[styles.weatherCol, width ? { width } : null]}>
            <View style={[styles.weatherRow, { justifyContent: 'space-between', width: '100%' }]}>
                
                {/* Left Side: City & Conditions */}
                <View style={styles.weatherInfoBlockLeft}>
                    <ThemedText style={styles.cityLabelHuge} numberOfLines={1}>
                        {cityLabel}
                    </ThemedText>
                    <ThemedText style={styles.conditionCity} numberOfLines={1}>
                        {conditionLine}
                    </ThemedText>
                    <View style={styles.hiLoRow}>
                        <Ionicons name="arrow-up" size={10} color={colors.lime} />
                        <ThemedText style={[styles.highLow, { color: colors.lime }]}>
                            {high != null ? `${high}°` : '--'}
                        </ThemedText>
                        <Ionicons name="arrow-down" size={10} color={colors.secondary} style={{ marginLeft: 6 }} />
                        <ThemedText style={[styles.highLow, { color: colors.secondary }]}>
                            {low != null ? `${low}°` : '--'}
                        </ThemedText>
                        {pop ? (
                            <View style={[styles.popPill, { backgroundColor: `${colors.secondary}33` }]}>
                                <Ionicons name="rainy" size={9} color={colors.secondary} />
                                <ThemedText style={[styles.popPillText, { color: colors.secondary }]}>{pop}%</ThemedText>
                            </View>
                        ) : null}
                    </View>
                </View>

                {/* Right Side: Big Icon, Temp, Updated, & Affordance */}
                <View style={styles.iconTempBlockRight}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Ionicons name={getWeatherIconName(icon)} size={36} color="#FFFFFF" />
                        <TempWrap key={animateTemp ? String(temp) : undefined} {...(animateTemp ? { entering: FadeIn.duration(400) } : {})}>
                            <ThemedText style={styles.tempHuge}>{temp}°</ThemedText>
                        </TempWrap>
                    </View>
                    
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                        {updatedLabel && (
                            <View style={styles.updatedInner}>
                                <Ionicons name="time-outline" size={9} color="rgba(255,255,255,0.7)" />
                                <ThemedText style={styles.updated}>{updatedLabel}</ThemedText>
                            </View>
                        )}
                        
                        {showFullForecast && (
                            <View style={styles.tapHint}>
                                <ThemedText style={[styles.tapHintText, { color: colors.secondary }]}>Forecast</ThemedText>
                                <Ionicons name="chevron-forward" size={10} color={colors.secondary} />
                            </View>
                        )}
                    </View>
                </View>
                
            </View>
        </View>
    );
});
WeatherRow.displayName = 'WeatherRow';

// ── Loading skeleton (shimmering blocks) ──
const Skeleton = ({ backgroundColor }: { backgroundColor: string }) => {
    const shimmer = useSharedValue(0.4);
    React.useEffect(() => {
        shimmer.value = withRepeat(withTiming(0.9, { duration: 850, easing: Easing.inOut(Easing.ease) }), -1, true);
    }, []);
    const style = useAnimatedStyle(() => ({ opacity: shimmer.value }));
    const Block = ({ w, h, mt = 0 }: { w: number | string; h: number; mt?: number }) => (
        <Animated.View style={[{ width: w as any, height: h, borderRadius: Layout.borderRadius, backgroundColor: 'rgba(255,255,255,0.25)', marginTop: mt }, style]} />
    );
    return (
        <View style={[styles.card, { backgroundColor }]}>
            <View style={styles.row}>
                <View style={{ flex: WEATHER_FLEX, flexDirection: 'row', alignItems: 'center' }}>
                    <Block w={44} h={44} />
                    <View style={{ marginLeft: 12, flex: 1 }}>
                        <Block w={'70%'} h={12} />
                        <Block w={'50%'} h={10} mt={8} />
                    </View>
                </View>
                <View style={[styles.glassPanel, { justifyContent: 'center' }]}>
                    <Block w={'70%'} h={10} />
                    <Block w={'55%'} h={16} mt={6} />
                    <Block w={'45%'} h={10} mt={6} />
                </View>
            </View>
        </View>
    );
};

const HomeHeaderWeatherWidget = React.memo(({ onPress }: HomeHeaderWeatherWidgetProps) => {
    const { theme } = useTheme();
    const colors = Colors[theme];

    // Current location when permitted, else the profile/default city.
    const { coords, fallbackCity } = useWeatherLocation();
    const { weather, forecast, isWeatherLoading } = useWeather(
        fallbackCity,
        coords ? { lat: coords.latitude, lon: coords.longitude } : null,
    );

    const icon = weather?.weather?.[0]?.icon;

    // Today's high / low from the 3-hourly forecast (falls back to current).
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

    // Tomorrow's outlook — same 3-hourly list, next calendar day. The
    // representative icon/condition comes from whichever slot sits closest
    // to midday, so "Tomorrow" doesn't show a random early-morning icon.
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

    const [activePage, setActivePage] = useState(0);
    const widgetWidth = useRef(0);
    const [pagerWidth, setPagerWidth] = useState(0);

    const handlePagerLayout = (e: LayoutChangeEvent) => {
        widgetWidth.current = e.nativeEvent.layout.width;
        setPagerWidth(e.nativeEvent.layout.width);
    };

    const handlePageScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        if (!widgetWidth.current) return;
        const page = Math.round(e.nativeEvent.contentOffset.x / widgetWidth.current);
        setActivePage(page);
    };

    // One-time nudge on the swipe hint chevron so first-time users notice
    // the card pages sideways, instead of relying on the dots alone.
    const hasPager = !!tomorrow;
    const nudge = useSharedValue(0);
    useEffect(() => {
        if (!hasPager) return;
        nudge.value = withDelay(
            600,
            withSequence(
                withTiming(5, { duration: 260, easing: Easing.out(Easing.quad) }),
                withTiming(0, { duration: 260, easing: Easing.in(Easing.quad) }),
                withTiming(5, { duration: 260, easing: Easing.out(Easing.quad) }),
                withTiming(0, { duration: 260, easing: Easing.in(Easing.quad) })
            )
        );
    }, [hasPager, nudge]);
    const nudgeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: nudge.value }] }));

    if (isWeatherLoading && !weather) {
        return (
            <Pressable onPress={onPress}>
                <Skeleton backgroundColor={colors.primary} />
            </Pressable>
        );
    }

    const temp = weather ? Math.round(weather.main.temp) : '--';
    const condition = weather?.weather?.[0]?.main ?? '—';
    const city = (weather?.name || fallbackCity || '').split(',')[0].trim();
    const prayerCity = city || 'Talagang';
    // Fixed lime accent for the prayer panel — kept independent of the
    // weather condition so it stays legible regardless of what the
    // weather column is showing.
    const accent = colors.lime;
    const updatedLabel = relativeTime(weather?.dt);

    return (
        <Animated.View entering={FadeInDown.duration(450)}>
            <Pressable onPress={onPress} style={({ pressed }) => pressed && { opacity: 0.92 }}>
                <View style={[styles.card, { backgroundColor: colors.primary }]}>
                    <View style={styles.row}>
                        {/* Weather column — swipes to Tomorrow's outlook when forecast data allows */}
                        <View style={styles.weatherColWrap} onLayout={handlePagerLayout}>
                            {hasPager && pagerWidth > 0 ? (
                                <ScrollView
                                    horizontal
                                    pagingEnabled
                                    showsHorizontalScrollIndicator={false}
                                    onScroll={handlePageScroll}
                                    scrollEventThrottle={32}
                                >
                                    <WeatherRow
                                        width={pagerWidth}
                                        icon={icon}
                                        temp={temp}
                                        conditionLine={condition}
                                        cityLabel={city}
                                        high={high}
                                        low={low}
                                        colors={colors}
                                        animateTemp
                                        updatedLabel={updatedLabel}
                                        showFullForecast={true}
                                    />
                                    <WeatherRow
                                        width={pagerWidth}
                                        icon={tomorrow!.icon}
                                        temp={tomorrow!.high}
                                        conditionLine={`Tomorrow · ${tomorrow!.condition}`}
                                        cityLabel={city}
                                        high={tomorrow!.high}
                                        low={tomorrow!.low}
                                        pop={tomorrow!.pop}
                                        colors={colors}
                                        showFullForecast={true}
                                    />
                                </ScrollView>
                            ) : (
                                <WeatherRow
                                    icon={icon}
                                    temp={temp}
                                    conditionLine={condition}
                                    cityLabel={city}
                                    high={high}
                                    low={low}
                                    colors={colors}
                                    animateTemp
                                    updatedLabel={updatedLabel}
                                    showFullForecast={true}
                                />
                            )}

                            {hasPager && pagerWidth > 0 ? (
                                <View style={styles.pagerHintRow}>
                                    <View style={styles.pagerDots}>
                                        <View style={[styles.pagerDot, activePage === 0 && { backgroundColor: colors.lime, width: 14 }]} />
                                        <View style={[styles.pagerDot, activePage === 1 && { backgroundColor: colors.lime, width: 14 }]} />
                                    </View>
                                    <Animated.View style={nudgeStyle}>
                                        <Ionicons name="chevron-forward" size={12} color={colors.lime} />
                                    </Animated.View>
                                    <ThemedText style={[styles.swipeHintText, { color: colors.lime }]}>
                                        {activePage === 0 ? 'Swipe for tomorrow' : 'Swipe back for today'}
                                    </ThemedText>
                                </View>
                            ) : null}
                        </View>
                    </View>
                </View>
            </Pressable>
        </Animated.View>
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
    card: {
        borderRadius: Layout.borderRadius,
        paddingHorizontal: 12,
        paddingVertical: 5,
        marginBottom: 4
    },
    row: {
        flexDirection: 'row',
        alignItems: 'stretch'
    },
    weatherColWrap: {
        width: '100%',
        justifyContent: 'center',
        paddingRight: 0
    },
    weatherCol: {
        justifyContent: 'center'
    },
    weatherRow: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    weatherInfoBlockLeft: {
        flex: 1,
        justifyContent: 'center',
        paddingRight: 8
    },
    cityLabelHuge: {
        fontSize: 15,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 1
    },
    iconTempBlockRight: {
        flexDirection: 'column',
        alignItems: 'flex-end',
        justifyContent: 'center'
    },
    tempHuge: {
        fontSize: 30,
        fontWeight: '800',
        color: '#FFFFFF',
        lineHeight: 32
    },
    conditionCity: {
        fontSize: 11.5,
        fontWeight: '700',
        color: '#FFFFFF'
    },
    pagerHintRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 2
    },
    pagerDots: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginRight: 2
    },
    pagerDot: {
        width: 5,
        height: 5,
        borderRadius: 3,
        backgroundColor: 'rgba(255,255,255,0.35)'
    },
    swipeHintText: {
        fontSize: 9,
        fontWeight: '700',
        marginLeft: 2
    },
    popPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        marginLeft: 6,
        paddingHorizontal: 4,
        paddingVertical: 1,
        borderRadius: 6
    },
    popPillText: {
        fontSize: 9,
        fontWeight: '700'
    },
    hiLoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
        flexWrap: 'wrap'
    },
    highLow: {
        fontSize: 11,
        fontWeight: '700',
        marginLeft: 2
    },

    updatedRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 2
    },
    updatedInner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3
    },
    updated: {
        fontSize: 9,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.7)'
    },
    tapHint: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 1
    },
    tapHintText: {
        fontSize: 9,
        fontWeight: '700'
    }
});
