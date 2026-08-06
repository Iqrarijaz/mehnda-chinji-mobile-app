import React from 'react';
import { Platform, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { SlideInLeft, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { ThemedText } from '../ThemedText';
import { Layout } from '@/constants/layout';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';

const FILTERS = [
    { label: 'All', value: 'ALL' },
    { label: 'System', value: 'SYSTEM' },
    { label: 'Community', value: 'COMMUNITY' },
    { label: 'Activity', value: 'ACTIVITY' },
];

interface Props {
    active: string;
    onSelect: (v: string) => void;
}

const FilterChip = React.memo(({ label, isActive, onPress, colors }: { label: string; value: string; isActive: boolean; onPress: () => void; colors: typeof Colors.light }) => {
    const animStyle = useAnimatedStyle(() => ({
        transform: [{ scale: withSpring(isActive ? 1.04 : 1, { damping: 14 }) }] }));
    return (
        <Animated.View style={animStyle}>
            <TouchableOpacity
                onPress={onPress}
                activeOpacity={0.75}
                style={[styles.chip, { backgroundColor: isActive ? colors.primary : colors.card }]}
            >
                <ThemedText style={[styles.label, { color: isActive ? colors.white : colors.textSecondary }, isActive && styles.labelActive]}>{label}</ThemedText>
            </TouchableOpacity>
        </Animated.View>
    );
});

const NotificationFilterTabs = React.memo(({ active, onSelect }: Props) => {
    const { theme } = useTheme();
    const colors = Colors[theme];
    return (
        <Animated.View entering={SlideInLeft.delay(180).duration(400)}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scroll}
                style={styles.bar}
            >
                {FILTERS.map(f => (
                    <FilterChip
                        key={f.value}
                        label={f.label}
                        value={f.value}
                        isActive={active === f.value}
                        onPress={() => onSelect(f.value)}
                        colors={colors}
                    />
                ))}
            </ScrollView>
        </Animated.View>
    );
});

export default NotificationFilterTabs;

const styles = StyleSheet.create({
    bar: { marginTop: 10 },
    scroll: { paddingHorizontal: 13, gap: 10, paddingTop: 2, paddingBottom: 4 },
    chip: {
        paddingHorizontal: 10,
        paddingVertical: Platform.OS === 'android' ? 5 : 6,
        borderRadius: Layout.borderRadius },
    label: { fontSize: 10, fontWeight: '600' },
    labelActive: { fontWeight: '700' } });
