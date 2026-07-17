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
    useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    interpolate,
    Extrapolate,
    useAnimatedKeyboard,
} from 'react-native-reanimated';

const isAndroid = Platform.OS === 'android';
const BAR_HEIGHT = isAndroid ? 62 : 64;
const ACTIVE_CIRCLE = 44;

interface TabItemProps {
    route: any;
    isFocused: boolean;
    onPress: (routeName: string, routeKey: string, isFocused: boolean, params: any) => void;
    onLongPress: (routeKey: string) => void;
    color: string;
    options: any;
}

const TabItem = React.memo(({ route, isFocused, onPress, onLongPress, color, options }: TabItemProps) => {
    const focusScale = useSharedValue(isFocused ? 1 : 0.92);

    useEffect(() => {
        focusScale.value = withSpring(isFocused ? 1.06 : 0.92, { damping: 14, stiffness: 260 });
    }, [isFocused, focusScale]);

    const animatedIconStyle = useAnimatedStyle(() => ({
        transform: [{ scale: focusScale.value }],
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

    return (
        <Pressable
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
            testID={options.tabBarButtonTestID}
            onPress={handlePress}
            onLongPress={handleLongPress}
            style={({ pressed }) => [
                styles.tabItem,
                { opacity: pressed ? 0.7 : 1 }
            ]}
        >
            <Animated.View style={[styles.iconWrap, animatedIconStyle]}>
                {options.tabBarIcon ? (
                    options.tabBarIcon({ focused: isFocused, color, size: 24 })
                ) : (
                    <Ionicons
                        name="square-outline"
                        size={24}
                        color={color}
                    />
                )}
            </Animated.View>
        </Pressable>
    );
});

/**
 * Floating white pill tab bar — active tab sits in a soft-green circle
 * that springs between positions (reference design language).
 */
export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
    const { theme } = useTheme();
    const insets = useSafeAreaInsets();
    const colors = Colors[theme];
    const { width: windowWidth } = useWindowDimensions();

    // ─── Consolidated Route & Dimensions Selector ────────────────────────────
    const { visibleRoutes, tabWidth, FULL_WIDTH } = React.useMemo(() => {
        // Routes hidden from the tab bar (registered with href: null in _layout)
        const HIDDEN_ROUTES = new Set<string>([]);
        const routes = state.routes.filter((route) => {
            if (HIDDEN_ROUTES.has(route.name)) return false;
            const { options } = descriptors[route.key];
            if ((options as any).href === null) return false;
            return true;
        });
        const baseWidth = isAndroid ? windowWidth - 40 : windowWidth - 36;
        const fWidth = Math.min(baseWidth, 600);
        const tWidth = routes.length > 0 ? fWidth / routes.length : 0;
        return {
            visibleRoutes: routes,
            tabWidth: tWidth,
            FULL_WIDTH: fWidth,
        };
    }, [state.routes, descriptors, windowWidth]);

    // ─── Shared Values (UI Thread Animations) ─────────────────────────────────
    const indicatorX = useSharedValue(0);
    // ─── JSI-Powered UI-Thread Keyboard Height Tracking ────────────────────────
    const keyboard = useAnimatedKeyboard();

    // ─── Active Route Tracking (for sliding active circle) ───────────────────
    useEffect(() => {
        const activeIndex = visibleRoutes.findIndex(
            (route) => route.key === state.routes[state.index].key,
        );
        if (activeIndex !== -1 && tabWidth > 0) {
            indicatorX.value = withSpring(
                activeIndex * tabWidth + (tabWidth - ACTIVE_CIRCLE) / 2,
                { damping: 16, stiffness: 220 },
            );
        }
    }, [state.index, tabWidth, visibleRoutes, indicatorX]);

    // ─── UI-Thread Animated Styles ───────────────────────────────────────────
    const animatedContainerStyle = useAnimatedStyle(() => {
        const keyboardY = interpolate(
            keyboard.height.value,
            [0, 100], // Start sliding down as keyboard opens
            [0, BAR_HEIGHT + insets.bottom + 30],
            Extrapolate.CLAMP
        );

        return {
            transform: [
                { translateY: keyboardY }
            ],
            opacity: interpolate(
                keyboardY,
                [0, BAR_HEIGHT + insets.bottom + 30],
                [1, 0],
                Extrapolate.CLAMP
            ),
        };
    });

    const animatedIndicatorStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateX: indicatorX.value }],
        };
    });

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

    const bottomPadding = isAndroid ? insets.bottom + 6 : insets.bottom + 8;

    return (
        <View
            style={[
                styles.outerContainer,
                { paddingBottom: bottomPadding },
            ]}
            pointerEvents="box-none"
        >
            <Animated.View
                style={[
                    styles.container,
                    {
                        backgroundColor: colors.card,
                        width: FULL_WIDTH,
                        borderRadius: BAR_HEIGHT / 2,
                    },
                    animatedContainerStyle,
                ]}
                pointerEvents="auto"
            >
                {/* Sliding active circle */}
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
                    const color = isFocused ? colors.primary : colors.textSecondary;

                    return (
                        <TabItem
                            key={route.name}
                            route={route}
                            isFocused={isFocused}
                            onPress={handlePress}
                            onLongPress={handleLongPress}
                            color={color}
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
        alignItems: 'center',
        backgroundColor: 'transparent',
        zIndex: 999, // Ensure it floats above the content
    },
    container: {
        flexDirection: 'row',
        height: BAR_HEIGHT,
        alignItems: 'center',
        justifyContent: 'space-between',
        overflow: 'hidden',
    },
    indicator: {
        position: 'absolute',
        left: 0,
        top: (BAR_HEIGHT - ACTIVE_CIRCLE) / 2,
        width: ACTIVE_CIRCLE,
        height: ACTIVE_CIRCLE,
        borderRadius: ACTIVE_CIRCLE / 2,
    },
    tabItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        width: '100%',
    },
    iconWrap: {
        alignItems: 'center',
        justifyContent: 'center',
    },
});
