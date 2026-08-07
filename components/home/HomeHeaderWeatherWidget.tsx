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

// ── Isolated prayer block (re-renders every second for the live countdown) ──
const PrayerBlock = React.memo(({ city, accent }: { city: string; accent: string }) => {
    const { nextPrayer } = useNextPrayer(city);
    return (
        <View style={styles.glassPanel}>
            <ThemedText style={styles.glassLabel}>NEXT PRAYER</ThemedText>
            <View style={styles.prayerNameRow}>
                <Ionicons name="moon-outline" size={13} color={accent} style={{ marginRight: 5 }} />
                <ThemedText style={styles.prayerName} numberOfLines={1}>
                    {nextPrayer?.name ?? '—'}
                </ThemedText>
            </View>
            <ThemedText style={[styles.prayerCountdown, { color: accent }]} numberOfLines={1}>
                {nextPrayer ? `in ${nextPrayer.countdownLabel}` : '· · ·'}
            </ThemedText>
            <ThemedText style={styles.prayerTime}>{nextPrayer?.time ?? ''}</ThemedText>
        </View>
    );
});
PrayerBlock.displayName = 'PrayerBlock';

// ── One horizontal weather row: icon+temp beside a 2-line info stack ──────
// Shared shape for both the "today" and "tomorrow" pager pages, so the
// layout — and the reduced height it buys back — is identical either way.
interface WeatherRowProps {
    width?: number;
    icon?: string;
    temp: number | string;
    conditionLine: string;
    high: number | null;
    low: number | null;
    pop?: number;
    colors: typeof Colors.light;
    animateTemp?: boolean;
}
const WeatherRow = React.memo(({ width, icon, temp, conditionLine, high, low, pop, colors, animateTemp }: WeatherRowProps) => {
    const TempWrap = animateTemp ? Animated.View : View;
    return (
        <View style={[styles.weatherCol, width ? { width } : null]}>
            <View style={styles.weatherRow}>
                <View style={styles.iconTempBlock}>
                    <Ionicons name={getWeatherIconName(icon)} size={32} color="#FFFFFF" />
                    <TempWrap {...(animateTemp ? { key: String(temp), entering: FadeIn.duration(400) } : {})}>
                        <ThemedText style={styles.temp}>{temp}°</ThemedText>
                    </TempWrap>
                </View>

                <View style={[styles.weatherDivider, { backgroundColor: `${colors.lime}55` }]} />

                <View style={styles.weatherInfoBlock}>
                    <ThemedText style={styles.conditionCity} numberOfLines={1}>
                        {conditionLine}
                    </ThemedText>
                    <View style={styles.hiLoRow}>
                        <Ionicons name="arrow-up" size={11} color={colors.lime} />
                        <ThemedText style={[styles.highLow, { color: colors.lime }]}>
                            {high != null ? `${high}°` : '--'}
                        </ThemedText>
                        <Ionicons name="arrow-down" size={11} color={colors.secondary} style={{ marginLeft: 8 }} />
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
                                        conditionLine={`${condition} · ${city}`}
                                        high={high}
                                        low={low}
                                        colors={colors}
                                        animateTemp
                                    />
                                    <WeatherRow
                                        width={pagerWidth}
                                        icon={tomorrow!.icon}
                                        temp={tomorrow!.high}
                                        conditionLine={`Tomorrow · ${tomorrow!.condition}`}
                                        high={tomorrow!.high}
                                        low={tomorrow!.low}
                                        pop={tomorrow!.pop}
                                        colors={colors}
                                    />
                                </ScrollView>
                            ) : (
                                <WeatherRow
                                    icon={icon}
                                    temp={temp}
                                    conditionLine={`${condition} · ${city}`}
                                    high={high}
                                    low={low}
                                    colors={colors}
                                    animateTemp
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

                        {/* Prayer glass panel */}
                        <PrayerBlock city={prayerCity} accent={accent} />
                    </View>

                    <View style={styles.updatedRow}>
                        {updatedLabel ? (
                            <View style={styles.updatedInner}>
                                <Ionicons name="time-outline" size={10} color="rgba(255,255,255,0.7)" />
                                <ThemedText style={styles.updated}>Updated {updatedLabel}</ThemedText>
                            </View>
                        ) : <View />}
                        {/* Tap affordance — the whole card opens the full weather screen */}
                        <View style={styles.tapHint}>
                            <ThemedText style={[styles.tapHintText, { color: colors.secondary }]}>Full forecast</ThemedText>
                            <Ionicons name="chevron-forward" size={11} color={colors.secondary} />
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
        paddingHorizontal: 16,
        paddingVertical: 10,
        marginBottom: 8
    },
    row: {
        flexDirection: 'row',
        alignItems: 'stretch'
    },
    weatherColWrap: {
        flex: WEATHER_FLEX,
        justifyContent: 'center',
        paddingRight: 10
    },
    weatherCol: {
        justifyContent: 'center'
    },
    weatherRow: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    iconTempBlock: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6
    },
    weatherDivider: {
        width: 1,
        height: 30,
        marginHorizontal: 10
    },
    weatherInfoBlock: {
        flex: 1,
        justifyContent: 'center'
    },
    pagerHintRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 6
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
        marginLeft: 8,
        paddingHorizontal: 5,
        paddingVertical: 1,
        borderRadius: 8
    },
    popPillText: {
        fontSize: 9,
        fontWeight: '700'
    },
    temp: {
        fontSize: 26,
        fontWeight: '800',
        color: '#FFFFFF',
        lineHeight: 30
    },
    condition: {
        fontSize: 13,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.9)'
    },
    conditionCity: {
        fontSize: 12.5,
        fontWeight: '700',
        color: '#FFFFFF'
    },
    hiLoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
        flexWrap: 'wrap'
    },
    highLow: {
        fontSize: 12,
        fontWeight: '700',
        marginLeft: 2
    },
    // Glassmorphism panel
    glassPanel: {
        flex: PRAYER_FLEX,
        backgroundColor: 'rgba(255,255,255,0.14)',
        borderRadius: Layout.borderRadius,
        paddingVertical: 6,
        paddingHorizontal: 10,
        justifyContent: 'center'
    },
    glassLabel: {
        fontSize: 9,
        fontWeight: '800',
        letterSpacing: 0.6,
        color: 'rgba(255,255,255,0.75)'
    },
    prayerNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2
    },
    prayerName: {
        fontSize: 16,
        fontWeight: '800',
        color: '#FFFFFF',
        flexShrink: 1
    },
    prayerCountdown: {
        fontSize: 13,
        fontWeight: '800',
        marginTop: 1
    },
    prayerTime: {
        fontSize: 11,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.75)'
    },
    updatedRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 8
    },
    updatedInner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4
    },
    updated: {
        fontSize: 10,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.7)'
    },
    tapHint: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 1
    },
    tapHintText: {
        fontSize: 9.5,
        fontWeight: '700'
    }
});
