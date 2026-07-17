import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import React, { useEffect } from 'react';
import {
    Platform,
    StyleSheet,
    Pressable,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
    Easing,
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    interpolate,
    Extrapolate,
    useAnimatedKeyboard,
} from 'react-native-reanimated';

const isAndroid = Platform.OS === 'android';
/** Content height of the bar (safe-area padding is added below it). */
const BAR_HEIGHT = 58;
/** Soft highlight pill behind the active icon. */
const PILL_WIDTH = 52;
const PILL_HEIGHT = 30;
/** Smooth, iOS-like timing — eases out with no bounce. */
const SMOOTH = { duration: 260, easing: Easing.out(Easing.cubic) };
const SMOOTH_FAST = { duration: 140, easing: Easing.out(Easing.quad) };

interface TabItemProps {
    route: any;
    isFocused: boolean;
    onPress: (routeName: string, routeKey: string, isFocused: boolean, params: any) => void;
    onLongPress: (routeKey: string) => void;
    activeColor: string;
    inactiveColor: string;
    options: any;
}

/**
 * Single tab: icon over an always-present label.
 * Focus animates icon scale and label rise; press gives a soft scale dip.
 */
const TabItem = React.memo(({ route, isFocused, onPress, onLongPress, activeColor, inactiveColor, options }: TabItemProps) => {
    const focus = useSharedValue(isFocused ? 1 : 0);
    const pressScale = useSharedValue(1);

    useEffect(() => {
        focus.value = withTiming(isFocused ? 1 : 0, SMOOTH);
    }, [isFocused, focus]);

    const animatedItemStyle = useAnimatedStyle(() => ({
        transform: [{ scale: pressScale.value }],
    }));

    const animatedIconStyle = useAnimatedStyle(() => ({
        transform: [
            { scale: interpolate(focus.value, [0, 1], [1, 1.08]) },
            { translateY: interpolate(focus.value, [0, 1], [0, -1]) },
        ],
    }));

    const animatedLabelStyle = useAnimatedStyle(() => ({
        opacity: interpolate(focus.value, [0, 1], [0.7, 1]),
        transform: [{ translateY: interpolate(focus.value, [0, 1], [2, 0]) }],
    }));

    const handlePress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { });
        onPress(route.name, route.key, isFocused, route.params);
    };

    const handleLongPress = () => {
        onLongPress(route.key);
    };

    const label = typeof options.tabBarLabel === 'string'
        ? options.tabBarLabel
        : options.title !== undefined
            ? options.title
            : route.name;

    const color = isFocused ? activeColor : inactiveColor;

    return (
        <Pressable
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
            testID={options.tabBarButtonTestID}
            onPress={handlePress}
            onLongPress={handleLongPress}
            onPressIn={() => { pressScale.value = withTiming(0.95, SMOOTH_FAST); }}
            onPressOut={() => { pressScale.value = withTiming(1, SMOOTH); }}
            style={styles.tabItem}
        >
            <Animated.View style={[styles.tabItemInner, animatedItemStyle]}>
                <Animated.View style={[styles.iconWrap, animatedIconStyle]}>
                    {options.tabBarIcon ? (
                        options.tabBarIcon({ focused: isFocused, color, size: 22 })
                    ) : (
                        <Ionicons name="square-outline" size={22} color={color} />
                    )}
                </Animated.View>
                <Animated.Text
                    numberOfLines={1}
                    style={[
                        styles.label,
                        { color, fontWeight: isFocused ? '700' : '500' },
                        animatedLabelStyle,
                    ]}
                >
                    {label}
                </Animated.Text>
            </Animated.View>
        </Pressable>
    );
});

TabItem.displayName = 'TabItem';

/**
 * Integrated iOS-style tab bar: full-width surface with softly rounded top
 * corners, a lime-soft highlight that glides behind the active icon, and
 * smooth eased icon/label motion. No borders, shadows, or elevation — hierarchy
 * comes from the surface contrast against the off-white background.
 */
export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
    const { theme } = useTheme();
    const insets = useSafeAreaInsets();
    const colors = Colors[theme];

    const [barWidth, setBarWidth] = React.useState(0);

    // ─── Visible Routes (unchanged filtering logic) ──────────────────────────
    const visibleRoutes = React.useMemo(() => {
        // Routes hidden from the tab bar (registered with href: null in _layout)
        const HIDDEN_ROUTES = new Set<string>([]);
        return state.routes.filter((route) => {
            if (HIDDEN_ROUTES.has(route.name)) return false;
            const { options } = descriptors[route.key];
            if ((options as any).href === null) return false;
            return true;
        });
    }, [state.routes, descriptors]);

    const tabWidth = visibleRoutes.length > 0 && barWidth > 0
        ? (barWidth - styles.container.paddingHorizontal * 2) / visibleRoutes.length
        : 0;

    // ─── Shared Values (UI Thread Animations) ─────────────────────────────────
    const indicatorX = useSharedValue(0);
    const indicatorShown = useSharedValue(0);
    // ─── JSI-Powered UI-Thread Keyboard Height Tracking ────────────────────────
    const keyboard = useAnimatedKeyboard();

    // ─── Active Route Tracking (sliding soft highlight) ──────────────────────
    useEffect(() => {
        const activeIndex = visibleRoutes.findIndex(
            (route) => route.key === state.routes[state.index].key,
        );
        if (activeIndex !== -1 && tabWidth > 0) {
            const target = styles.container.paddingHorizontal
                + activeIndex * tabWidth
                + (tabWidth - PILL_WIDTH) / 2;
            if (indicatorShown.value === 0) {
                // First layout: place without animating, then fade in.
                indicatorX.value = target;
                indicatorShown.value = withTiming(1, { duration: 180 });
            } else {
                indicatorX.value = withTiming(target, SMOOTH);
            }
        }
    }, [state.index, tabWidth, visibleRoutes, indicatorX, indicatorShown]);

    // ─── UI-Thread Animated Styles ───────────────────────────────────────────
    const bottomPadding = Math.max(insets.bottom, isAndroid ? 10 : 8);

    const animatedContainerStyle = useAnimatedStyle(() => {
        const keyboardY = interpolate(
            keyboard.height.value,
            [0, 100], // Start sliding down as keyboard opens
            [0, BAR_HEIGHT + bottomPadding + 30],
            Extrapolate.CLAMP
        );

        return {
            transform: [{ translateY: keyboardY }],
            opacity: interpolate(
                keyboardY,
                [0, BAR_HEIGHT + bottomPadding + 30],
                [1, 0],
                Extrapolate.CLAMP
            ),
        };
    });

    const animatedIndicatorStyle = useAnimatedStyle(() => ({
        opacity: indicatorShown.value,
        transform: [{ translateX: indicatorX.value }],
    }));

    // ─── Stable Press Handlers to Maintain Memoization ────────────────────────
    const handlePress = React.useCallback((routeName: string, routeKey: string, isFocused: boolean, params: any) => {
        const event = navigation.emit({
            type: 'tabPress',
            target: routeKey,
            canPreventDefault: true,
        });
        if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(routeName, params);
        }
    }, [navigation]);

    const handleLongPress = React.useCallback((routeKey: string) => {
        navigation.emit({ type: 'tabLongPress', target: routeKey });
    }, [navigation]);

    return (
        <View style={styles.outerContainer} pointerEvents="box-none">
            <Animated.View
                onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}
                style={[
                    styles.container,
                    {
                        backgroundColor: colors.card,
                        paddingBottom: bottomPadding,
                    },
                    animatedContainerStyle,
                ]}
                pointerEvents="auto"
            >
                {/* Soft highlight that springs behind the active icon */}
                {tabWidth > 0 && (
                    <Animated.View
                        style={[
                            styles.indicator,
                            { backgroundColor: colors.limeSoft },
                            animatedIndicatorStyle,
                        ]}
                    />
                )}

                {/* Render all tabs in order */}
                {visibleRoutes.map((route) => {
                    const { options } = descriptors[route.key];
                    const isFocused = state.routes[state.index].key === route.key;

                    return (
                        <TabItem
                            key={route.name}
                            route={route}
                            isFocused={isFocused}
                            onPress={handlePress}
                            onLongPress={handleLongPress}
                            activeColor={colors.primary}
                            inactiveColor={colors.textSecondary}
                            options={options}
                        />
                    );
                })}
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    outerContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'transparent',
        zIndex: 999, // Ensure it floats above the content
    },
    container: {
        flexDirection: 'row',
        alignItems: 'stretch',
        width: '100%',
        height: undefined,
        minHeight: BAR_HEIGHT,
        paddingHorizontal: 12,
        paddingTop: 8,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        overflow: 'hidden',
    },
    indicator: {
        position: 'absolute',
        top: 8,
        left: 0,
        width: PILL_WIDTH,
        height: PILL_HEIGHT,
        borderRadius: PILL_HEIGHT / 2,
    },
    tabItem: {
        flex: 1,
        minHeight: 50,
    },
    tabItemInner: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'flex-start',
    },
    iconWrap: {
        width: PILL_WIDTH,
        height: PILL_HEIGHT,
        alignItems: 'center',
        justifyContent: 'center',
    },
    label: {
        fontSize: 10,
        marginTop: 3,
        letterSpacing: 0.1,
    },
});
