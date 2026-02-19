import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, LayoutChangeEvent, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
    const { theme, isDark } = useTheme(); // Note: Design requested is light floating pill, we can adapt for dark mode but stick to requests for now.
    const insets = useSafeAreaInsets();
    const primaryColor = Colors[theme].tint;
    const inactiveColor = '#94a3b8'; // Always light since background is dark

    const visibleRoutes = state.routes.filter(route => {
        const { options } = descriptors[route.key];
        // Hide chat tab for now as requested
        if (route.name === 'chat') return false;
        return (options as any).href !== null;
    });

    const [layout, setLayout] = useState({ width: 0, height: 0 });
    const tabCount = visibleRoutes.length;
    const tabWidth = layout.width / tabCount;

    const translateX = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const activeIndex = visibleRoutes.findIndex(route => route.key === state.routes[state.index].key);
        if (activeIndex !== -1 && tabWidth > 0) {
            Animated.spring(translateX, {
                toValue: activeIndex * tabWidth,
                useNativeDriver: true,
                bounciness: 0,
                speed: 12,
            }).start();
        }
    }, [state.index, tabWidth, visibleRoutes]);

    const onLayout = (e: LayoutChangeEvent) => {
        setLayout(e.nativeEvent.layout);
    };

    return (
        <View style={[styles.outerContainer, { paddingBottom: insets.bottom + 8 }]}>
            <View style={[styles.container, { backgroundColor: '#004030' }]} onLayout={onLayout}>
                {/* Sliding Indicator */}
                {tabWidth > 0 && (
                    <Animated.View
                        style={[
                            styles.indicator,
                            {
                                width: tabWidth,
                                height: '100%',
                                transform: [{ translateX }],
                                backgroundColor: 'rgba(255, 255, 255, 0.1)'
                            }
                        ]}
                    />
                )}

                {visibleRoutes.map((route, index) => {
                    const { options } = descriptors[route.key];
                    const isFocused = state.routes[state.index].key === route.key;

                    const onPress = () => {
                        const event = navigation.emit({
                            type: 'tabPress',
                            target: route.key,
                            canPreventDefault: true,
                        });

                        if (!isFocused && !event.defaultPrevented) {
                            navigation.navigate(route.name, route.params);
                        }
                    };

                    const onLongPress = () => {
                        navigation.emit({
                            type: 'tabLongPress',
                            target: route.key,
                        });
                    };

                    let iconName: keyof typeof Ionicons.glyphMap = 'home';
                    let label = 'Home';

                    if (route.name === 'index') { iconName = isFocused ? 'home' : 'home-outline'; label = 'Home'; }
                    else if (route.name === 'business') { iconName = isFocused ? 'briefcase' : 'briefcase-outline'; label = 'Business'; }
                    else if (route.name === 'blood') { iconName = isFocused ? 'water' : 'water-outline'; label = 'Donors'; }
                    else if (route.name === 'chat') { iconName = isFocused ? 'chatbubbles' : 'chatbubbles-outline'; label = 'Chat'; }

                    // Dark Mode Logic:
                    // Selected: White
                    // Unselected: Primary Color (Tint)
                    // Light Mode Logic (keeping existing or defaulting):
                    // Selected: White (as per existing code activeColor)
                    // Unselected: Inactive Color

                    const activeColor = '#FFFFFF';
                    const inactiveColorCalculated = isDark ? primaryColor : inactiveColor;
                    const color = isFocused ? activeColor : inactiveColorCalculated;

                    return (
                        <TouchableOpacity
                            key={route.name}
                            accessibilityRole="button"
                            accessibilityState={isFocused ? { selected: true } : {}}
                            accessibilityLabel={options.tabBarAccessibilityLabel}
                            testID={options.tabBarButtonTestID}
                            onPress={onPress}
                            onLongPress={onLongPress}
                            style={styles.tabItem}
                            activeOpacity={0.7}
                        >
                            <Ionicons
                                name={iconName}
                                size={22}
                                color={color}
                                style={{ marginBottom: 2 }}
                            />
                            <Text style={[styles.label, { color, fontWeight: isFocused ? '600' : '400' }]}>
                                {label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
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
    },
    container: {
        flexDirection: 'row',
        width: width - 36, // Reduced width (2px more margin each side)
        height: 60, // Reduced height (64 - 2)
        borderRadius: 30, // Reduced radius (32 - 1 or match height/2)
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
        overflow: 'hidden', // Clip the sliding indicator
    },
    indicator: {
        position: 'absolute',
        top: 0,
        left: 0,
        borderRadius: 30, // Match container radius
    },
    tabItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        zIndex: 1,
    },
    label: {
        fontSize: 10,
    }
});
