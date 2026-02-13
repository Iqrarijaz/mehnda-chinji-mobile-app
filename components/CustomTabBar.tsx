import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
    const { theme, isDark } = useTheme();
    const colors = Colors[theme];
    const secondaryColor = Colors.dark.secondary;

    const visibleRoutes = state.routes.filter(route => {
        const { options } = descriptors[route.key];
        return (options as any).href !== null;
    });

    const tabCount = visibleRoutes.length;
    const tabWidth = (width - 28 - 16) / tabCount;

    const translateX = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const activeIndex = visibleRoutes.findIndex(route => route.key === state.routes[state.index].key);
        if (activeIndex !== -1) {
            Animated.spring(translateX, {
                toValue: activeIndex * tabWidth,
                useNativeDriver: true,
                bounciness: 4,
                speed: 12,
            }).start();
        }
    }, [state.index, tabWidth, visibleRoutes]);

    return (
        <View style={styles.outerContainer}>
            <LinearGradient
                colors={isDark ? ['#1e293b', '#0F172A'] : ['#25343F', '#1F2937']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.container}
            >
                {/* Specular Edge Highlight */}
                <LinearGradient
                    colors={['rgba(255, 255, 255, 0.2)', 'transparent']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={styles.glassEdge}
                />

                {/* Sliding Indicator (Pill) */}
                <Animated.View
                    style={[
                        styles.indicatorContainer,
                        {
                            width: tabWidth,
                            transform: [{ translateX }],
                        }
                    ]}
                >
                    <LinearGradient
                        colors={[secondaryColor, '#FF7E21']} // Vibrancy gradient
                        style={styles.focusedPill}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                    />
                </Animated.View>

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

                    let iconName = 'house.fill';
                    if (route.name === 'index') iconName = 'house.fill';
                    else if (route.name === 'blood') iconName = 'drop.fill';
                    else if (route.name === 'business') iconName = 'briefcase.fill';
                    else if (route.name === 'chat') iconName = 'message.fill';

                    // @ts-ignore
                    const safeIconName = iconName as import('expo-symbols').SymbolViewProps['name'];

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
                            <IconSymbol
                                name={safeIconName}
                                size={26}
                                color={isFocused ? "#FFFFFF" : "rgba(255, 255, 255, 0.5)"}
                                style={isFocused ? styles.focusedIcon : {}}
                            />
                        </TouchableOpacity>
                    );
                })}
            </LinearGradient>
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
        paddingHorizontal: 14,
        paddingBottom: 18,
    },
    container: {
        flexDirection: 'row',
        borderRadius: 28,
        height: 60,
        alignItems: 'center',
        paddingHorizontal: 8,
        elevation: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 15,
        borderWidth: 1,
        borderColor: '#0f172a',
        overflow: 'hidden',
    },
    glassEdge: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 2,
    },
    tabItem: {
        flex: 1,
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2,
    },
    indicatorContainer: {
        position: 'absolute',
        height: '100%',
        paddingHorizontal: 4,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
        left: 8, // container paddingHorizontal
    },
    focusedPill: {
        width: '85%',
        height: '75%',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
        shadowColor: Colors.dark.secondary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
    },
    focusedIcon: {
        shadowColor: '#FFFFFF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 8,
    },
});
