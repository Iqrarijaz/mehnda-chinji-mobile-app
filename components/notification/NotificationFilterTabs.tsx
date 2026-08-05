import React from 'react';
import { Platform, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { SlideInLeft, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { ThemedText } from '../ThemedText';
import { Layout } from '@/constants/layout';

const PRIMARY = '#006666';

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

const FilterChip = React.memo(({ label, value, isActive, onPress }: { label: string; value: string; isActive: boolean; onPress: () => void }) => {
    const animStyle = useAnimatedStyle(() => ({
        transform: [{ scale: withSpring(isActive ? 1.04 : 1, { damping: 14 }) }] }));
    return (
        <Animated.View style={animStyle}>
            <TouchableOpacity
                onPress={onPress}
                activeOpacity={0.75}
                style={[styles.chip, isActive && styles.chipActive]}
            >
                <ThemedText style={[styles.label, isActive && styles.labelActive]}>{label}</ThemedText>
            </TouchableOpacity>
        </Animated.View>
    );
});

const NotificationFilterTabs = React.memo(({ active, onSelect }: Props) => (
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
                />
            ))}
        </ScrollView>
    </Animated.View>
));

export default NotificationFilterTabs;

const styles = StyleSheet.create({
    bar: { marginTop: 10 },
    scroll: { paddingHorizontal: 13, gap: 10, paddingTop: 2, paddingBottom: 4 },
    chip: {
        paddingHorizontal: 10,
        paddingVertical: Platform.OS === 'android' ? 5 : 6,
        borderRadius: Layout.borderRadius,
        backgroundColor: '#FFFFFF' },
    chipActive: { backgroundColor: PRIMARY },
    label: { fontSize: 10, fontWeight: '600', color: '#64748B' },
    labelActive: { color: '#FFFFFF', fontWeight: '700' } });
