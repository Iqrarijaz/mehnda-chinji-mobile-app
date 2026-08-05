import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import React, { useEffect } from 'react';
import {
    Platform,
    StyleSheet,
    Text,
    Pressable,
    View,
    useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSpring,
    interpolate,
    Extrapolate,
    ReduceMotion,
    useAnimatedKeyboard } from 'react-native-reanimated';

const isAndroid = Platform.OS === 'android';
const BAR_HEIGHT = isAndroid ? 56 : 60;

interface TabItemProps {
    route: any;
    isFocused: boolean;
    onPress: (routeName: string, routeKey: string, isFocused: boolean, params: any) => void;
    onLongPress: (routeKey: string) => void;
    color: string;
    options: any;
}

const TabItem = React.memo(({ route, isFocused, onPress, onLongPress, color, options }: TabItemProps) => {
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
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarButtonTestID}
            onPress={handlePress}
            onLongPress={handleLongPress}
            style={({ pressed }) => [
                styles.tabItem,
                { opacity: pressed ? 0.7 : 1 }
            ]}
        >
            {options.tabBarIcon ? (
                options.tabBarIcon({ focused: isFocused, color, size: 22 })
            ) : (
                <Ionicons
                    name="square-outline"
                    size={22}
                    color={color}
                    style={{ marginBottom: 2 }}
                />
            )}
            <Text
                style={[
                    styles.label,
                    { color, fontWeight: isFocused ? '700' : '500' },
                ]}
            >
                {label}
            </Text>
        </Pressable>
    );
});

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
            FULL_WIDTH: fWidth };
    }, [state.routes, descriptors, windowWidth]);

    // ─── Shared Values (UI Thread Animations) ─────────────────────────────────
    const indicatorX = useSharedValue(0);
    // ─── JSI-Powered UI-Thread Keyboard Height Tracking ────────────────────────
    const keyboard = useAnimatedKeyboard();

    // ─── Active Route Tracking (for sliding indicator) ───────────────────────
    useEffect(() => {
        const activeIndex = visibleRoutes.findIndex(
            (route) => route.key === state.routes[state.index].key,
        );
        if (activeIndex !== -1 && tabWidth > 0) {
            indicatorX.value = withTiming(activeIndex * tabWidth, {
                duration: 250 });
        }
    }, [state.index, tabWidth, visibleRoutes]);

    // ─── UI-Thread Animated Styles ───────────────────────────────────────────
    const animatedContainerStyle = useAnimatedStyle(() => {
        const slideDownY = 0; // Removed chat slide logic

        const keyboardY = interpolate(
            keyboard.height.value,
            [0, 100], // Start sliding down as keyboard opens
            [0, BAR_HEIGHT + insets.bottom + 30],
            Extrapolate.CLAMP
        );

        const combinedTranslateY = Math.max(slideDownY, keyboardY);

        return {
            transform: [
                { translateY: combinedTranslateY }
            ],
            opacity: interpolate(
                combinedTranslateY,
                [0, BAR_HEIGHT + insets.bottom + 30],
                [1, 0],
                Extrapolate.CLAMP
            ) };
    });

    const animatedIndicatorStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateX: indicatorX.value }] };
    });

    // ─── Stable Press Handlers to Maintain Memoization ────────────────────────
    const handlePress = React.useCallback((routeName: string, routeKey: string, isFocused: boolean, params: any) => {
        const event = navigation.emit({
            type: 'tabPress',
            target: routeKey,
            canPreventDefault: true });
        if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(routeName, params);
        }
    }, [navigation]);

    const handleLongPress = React.useCallback((routeKey: string) => {
        navigation.emit({ type: 'tabLongPress', target: routeKey });
    }, [navigation]);

    const homeRoute = visibleRoutes[0];
    const onHomePress = React.useCallback(() => {
        if (!homeRoute) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { });
        const event = navigation.emit({
            type: 'tabPress',
            target: homeRoute.key,
            canPreventDefault: true });
        if (!event.defaultPrevented) {
            navigation.navigate(homeRoute.name, homeRoute.params);
        }
    }, [homeRoute, navigation]);

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
                        backgroundColor: colors.primary,
                        width: FULL_WIDTH,
                        borderRadius: isAndroid ? 29 : 30 },
                    animatedContainerStyle,
                ]}
                pointerEvents="auto"
            >
                {/* Sliding indicator */}
                {tabWidth > 0 && (
                    <Animated.View
                        style={[
                            styles.indicator,
                            {
                                width: tabWidth,
                                backgroundColor: 'rgba(255, 255, 255, 0.1)' },
                            animatedIndicatorStyle,
                        ]}
                    />
                )}

                {/* Render all tabs in order */}
                {visibleRoutes.map((route) => {
                    const { options } = descriptors[route.key];
                    const isFocused = state.routes[state.index].key === route.key;
                    const color = isFocused ? colors.white : 'rgba(255, 255, 255, 0.6)';

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
        zIndex: 999, // Ensure it floats above the chat content
    },
    container: {
        flexDirection: 'row',
        height: BAR_HEIGHT,
        alignItems: 'center',
        justifyContent: 'space-between',
        overflow: 'hidden' },
    indicator: {
        position: 'absolute',
        top: 0,
        left: 0,
        height: '100%',
        borderRadius: isAndroid ? 29 : 30 },
    tabItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        width: '100%' },
    label: {
        fontSize: 9 } });
