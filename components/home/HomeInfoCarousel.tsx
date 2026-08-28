import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
    ImageBackground,
    LayoutChangeEvent,
    NativeScrollEvent,
    NativeSyntheticEvent,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';

import Skeleton from '@/components/common/Skeleton';
import { FuelSlide } from '@/components/home/slides/FuelSlide';
import { WeatherSlide } from '@/components/home/slides/WeatherSlide';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { useFuelSummary } from '@/hooks/useFuel';
import { useWeather } from '@/hooks/useWeather';
import { useWeatherLocation } from '@/hooks/useWeatherLocation';
import { buildDailyForecast } from '@/utils/forecastDaily';

const WEATHER_BG = require('@/assets/images/widgets/weather_bg.png');
const FUEL_BG = require('@/assets/images/widgets/fuel_bg.png');

// Both plates are authored 2:1 with their safe zones measured at that ratio, so
// the card tracks that aspect and the art is never cropped in the common case.
//
// MIN_CARD_HEIGHT is the floor the content genuinely needs: on a narrow phone
// pure aspect sizing yields a box too short for the stack, and since the card
// clips its overflow a slide would be silently cut off rather than visibly
// break. Below that width the card grows taller than 2:1 and cover-crops a few
// percent off the sides, which the safe zones absorb.
const CARD_ASPECT = 1.9;
const MIN_CARD_HEIGHT = 182;

interface HomeInfoCarouselProps {
    onWeatherPress?: () => void;
    onFuelPress?: () => void;
}

function relativeTime(unixSec?: number): string {
    if (!unixSec) return '';
    const diffMin = Math.max(0, Math.round((Date.now() - unixSec * 1000) / 60000));
    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    return `${Math.floor(diffMin / 60)}h ago`;
}

const CarouselSkeleton = React.memo(function CarouselSkeleton() {
    return (
        <View style={styles.wrapper}>
            <View style={[styles.card, styles.skeletonCard]}>
                <Skeleton width={96} height={16} borderRadius={8} />
                <View style={{ height: 10 }} />
                <Skeleton width={'52%'} height={38} borderRadius={8} />
                <View style={{ height: 10 }} />
                <Skeleton width={'42%'} height={13} borderRadius={6} />
                <View style={{ flex: 1 }} />
                <Skeleton width={'100%'} height={38} borderRadius={10} />
            </View>
        </View>
    );
});

function HomeInfoCarouselComponent({ onWeatherPress, onFuelPress }: HomeInfoCarouselProps) {
    const { theme } = useTheme();
    const colors = Colors[theme];

    const { coords, fallbackCity } = useWeatherLocation();
    const { weather, forecast, isWeatherLoading } = useWeather(
        fallbackCity,
        coords ? { lat: coords.latitude, lon: coords.longitude } : null,
    );
    const { summary } = useFuelSummary();

    const days = useMemo(() => buildDailyForecast((forecast as any)?.list, 5), [forecast]);

    const { high, low } = useMemo(() => {
        if (days.length) return { high: days[0].high, low: days[0].low };
        return {
            high: weather ? Math.round(weather.main.temp_max) : null,
            low: weather ? Math.round(weather.main.temp_min) : null,
        };
    }, [days, weather]);

    // The page width has to be measured rather than derived from the window:
    // the card sits inside the header's padding, so window width would overshoot
    // and every page would settle slightly off-centre.
    const [pageWidth, setPageWidth] = useState(0);
    const [page, setPage] = useState(0);
    const scrollRef = useRef<ScrollView>(null);

    const onLayout = useCallback((e: LayoutChangeEvent) => {
        const w = Math.round(e.nativeEvent.layout.width);
        if (w > 0) setPageWidth(prev => (prev === w ? prev : w));
    }, []);

    const onMomentumEnd = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
        if (!pageWidth) return;
        const next = Math.round(e.nativeEvent.contentOffset.x / pageWidth);
        setPage(prev => (prev === next ? prev : next));
    }, [pageWidth]);

    const goTo = useCallback((index: number) => {
        if (!pageWidth) return;
        scrollRef.current?.scrollTo({ x: index * pageWidth, animated: true });
        setPage(index);
    }, [pageWidth]);

    if (!weather || isWeatherLoading) return <CarouselSkeleton />;

    const fuelItems = summary?.items ?? [];
    // The fuel slide only earns its place once there is something to show;
    // otherwise the carousel is a single page and the dots disappear with it.
    const hasFuel = fuelItems.some(i => i.available);
    const slideCount = hasFuel ? 2 : 1;

    const slides = [
        {
            key: 'weather',
            bg: WEATHER_BG,
            onPress: onWeatherPress,
            content: (
                <WeatherSlide
                    colors={colors}
                    city={(weather.name || fallbackCity || '').split(',')[0].trim()}
                    updated={relativeTime(weather.dt)}
                    temp={Math.round(weather.main.temp)}
                    condition={weather.weather?.[0]?.main ?? '—'}
                    icon={weather.weather?.[0]?.icon}
                    high={high}
                    low={low}
                    humidity={weather.main.humidity}
                    windMs={weather.wind.speed}
                    feelsLike={weather.main.feels_like}
                    days={days}
                />
            ),
        },
        ...(hasFuel ? [{
            key: 'fuel',
            bg: FUEL_BG,
            onPress: onFuelPress,
            content: <FuelSlide items={fuelItems} days={summary?.days ?? 7} colors={colors} />,
        }] : []),
    ];

    return (
        <View style={styles.wrapper}>
            <View style={styles.card} onLayout={onLayout}>
                <ScrollView
                    ref={scrollRef}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onMomentumScrollEnd={onMomentumEnd}
                    scrollEnabled={slideCount > 1}
                    // Without this the pages jump when the width is remeasured
                    // on rotation or a split-screen resize.
                    contentOffset={{ x: page * pageWidth, y: 0 }}
                >
                    {slides.map(slide => (
                        <TouchableOpacity
                            key={slide.key}
                            activeOpacity={0.92}
                            onPress={slide.onPress}
                            // Rendering at width 0 before measurement would let
                            // every page collapse onto the same offset.
                            style={{ width: pageWidth || undefined }}
                        >
                            <ImageBackground
                                source={slide.bg}
                                style={styles.bg}
                                imageStyle={styles.bgImage}
                                resizeMode="cover"
                            >
                                {/* No scrim: each plate's own gradients were tuned
                                    until its safe zones cleared AA against white,
                                    so another layer would only dull the art. */}
                                <View style={styles.content}>{slide.content}</View>
                            </ImageBackground>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Pagination sits inside the card, over the art, rather than
                    below it -- the card keeps one silhouette and the dots do not
                    add height to the header. */}
                {slideCount > 1 ? (
                    <View style={styles.dots} pointerEvents="box-none">
                        {slides.map((slide, i) => (
                            <TouchableOpacity
                                key={slide.key}
                                onPress={() => goTo(i)}
                                // The dot itself is tiny; the touch target is not.
                                hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
                                style={[
                                    styles.dot,
                                    i === page ? styles.dotActive : styles.dotIdle,
                                ]}
                            />
                        ))}
                    </View>
                ) : null}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: { width: '100%', marginTop: 4, marginBottom: 14 },
    card: {
        width: '100%',
        aspectRatio: CARD_ASPECT,
        minHeight: MIN_CARD_HEIGHT,
        borderRadius: 22,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.18,
        shadowRadius: 12,
        elevation: 4,
    },
    skeletonCard: { backgroundColor: 'rgba(255,255,255,0.10)', padding: 14 },

    bg: { flex: 1 },
    bgImage: { borderRadius: 22 },
    // Bottom padding clears the dot rail (bottom 8 + height 5) with a few
    // points to spare, so a slide's last row cannot sit under it.
    content: { flex: 1, paddingHorizontal: 14, paddingTop: 11, paddingBottom: 18 },

    dots: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 8,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 5,
    },
    dot: { height: 5, borderRadius: 3 },
    dotIdle: { width: 5, backgroundColor: 'rgba(255,255,255,0.42)' },
    dotActive: { width: 16, backgroundColor: '#FFFFFF' },
});

export const HomeInfoCarousel = React.memo(HomeInfoCarouselComponent);
HomeInfoCarousel.displayName = 'HomeInfoCarousel';
