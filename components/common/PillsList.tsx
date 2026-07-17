import React, { useEffect } from 'react';
import { View, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import Animated, {
    Easing,
    interpolateColor,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/colors';

export interface PillItem {
    id: string;
    label: string;
}

export interface PillsListProps {
    data: PillItem[];
    selectedId: string;
    onSelect: (id: string) => void;
    activeColor?: string;
    containerStyle?: ViewStyle;
}

const SMOOTH = { duration: 220, easing: Easing.out(Easing.cubic) };

interface PillProps {
    item: PillItem;
    isActive: boolean;
    onSelect: (id: string) => void;
    activeColor: string;
    inactiveColor: string;
    inactiveText: string;
}

/** Single chip — smooth color/scale transition when it becomes active. */
const Pill = React.memo(function Pill({ item, isActive, onSelect, activeColor, inactiveColor, inactiveText }: PillProps) {
    const active = useSharedValue(isActive ? 1 : 0);
    const pressScale = useSharedValue(1);

    useEffect(() => {
        active.value = withTiming(isActive ? 1 : 0, SMOOTH);
    }, [isActive, active]);

    const animatedStyle = useAnimatedStyle(() => ({
        backgroundColor: interpolateColor(active.value, [0, 1], [inactiveColor, activeColor]),
        transform: [{ scale: pressScale.value * (1 + active.value * 0.02) }],
    }));

    return (
        <Pressable
            onPress={() => onSelect(item.id)}
            onPressIn={() => { pressScale.value = withTiming(0.96, { duration: 100, easing: Easing.out(Easing.quad) }); }}
            onPressOut={() => { pressScale.value = withTiming(1, SMOOTH); }}
            accessibilityRole="button"
            accessibilityState={isActive ? { selected: true } : {}}
        >
            <Animated.View style={[styles.tab, animatedStyle]}>
                <ThemedText style={[
                    styles.tabText,
                    { color: isActive ? '#FFFFFF' : inactiveText },
                ]}>
                    {item.label}
                </ThemedText>
            </Animated.View>
        </Pressable>
    );
});

export const PillsList = React.memo(function PillsList({
    data,
    selectedId,
    onSelect,
    activeColor,
    containerStyle,
}: PillsListProps) {
    const { theme } = useTheme();
    const colors = Colors[theme];

    const resolvedActiveColor = activeColor || colors.primary;

    return (
        <View style={[styles.tabsContainer, containerStyle]}>
            <FlashList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={data}
                extraData={selectedId}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <Pill
                        item={item}
                        isActive={selectedId === item.id}
                        onSelect={onSelect}
                        activeColor={resolvedActiveColor}
                        inactiveColor={colors.card}
                        inactiveText={colors.textSecondary}
                    />
                )}
                contentContainerStyle={styles.tabsList}
            />
        </View>
    );
});

const styles = StyleSheet.create({
    tabsContainer: {
        paddingVertical: 12,
    },
    tabsList: {
        paddingHorizontal: 14,
    },
    tab: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 999,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
    },
    tabText: {
        fontSize: 12,
        fontWeight: '700',
    },
});
