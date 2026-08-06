import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/context/ThemeContext';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { LayoutChangeEvent, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming } from 'react-native-reanimated';

type Pref = 'light' | 'dark' | 'system';

const OPTIONS: { key: Pref; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: 'light', label: 'Light', icon: 'sunny-outline' },
    { key: 'dark', label: 'Dark', icon: 'moon-outline' },
    { key: 'system', label: 'System', icon: 'phone-portrait-outline' },
];

/** Segmented Light / Dark / System control for the Appearance setting. */
export const ThemeSelector: React.FC = React.memo(() => {
    const { theme, themePreference, setThemePreference } = useTheme();
    const colors = Colors[theme];

    const [trackWidth, setTrackWidth] = React.useState(0);
    const activeIndex = OPTIONS.findIndex(o => o.key === themePreference);
    const indicatorX = useSharedValue(0);

    const segmentWidth = trackWidth > 0 ? (trackWidth - 6) / OPTIONS.length : 0;

    useEffect(() => {
        if (segmentWidth > 0) {
            indicatorX.value = withTiming(segmentWidth * Math.max(activeIndex, 0), { duration: 220 });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeIndex, segmentWidth]);

    const indicatorStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: indicatorX.value }],
        width: segmentWidth,
    }));

    const onTrackLayout = (e: LayoutChangeEvent) => {
        setTrackWidth(e.nativeEvent.layout.width);
    };

    return (
        <View style={styles.wrap}>
            <View style={styles.labelRow}>
                <View style={[styles.iconWrap, { backgroundColor: `${colors.primary}14` }]}>
                    <Ionicons name="contrast-outline" size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                    <ThemedText style={[styles.label, { color: colors.text }]}>Appearance</ThemedText>
                    <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>
                        Choose how Rehbar looks on this device
                    </ThemedText>
                </View>
            </View>

            <View
                onLayout={onTrackLayout}
                style={[styles.track, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}
            >
                {trackWidth > 0 ? (
                    <Animated.View
                        style={[styles.indicator, { backgroundColor: colors.primary }, indicatorStyle]}
                    />
                ) : null}
                {OPTIONS.map((opt) => {
                    const isActive = opt.key === themePreference;
                    return (
                        <TouchableOpacity
                            key={opt.key}
                            style={styles.segment}
                            activeOpacity={0.75}
                            onPress={() => setThemePreference(opt.key)}
                            accessibilityRole="button"
                            accessibilityState={{ selected: isActive }}
                            accessibilityLabel={`${opt.label} theme`}
                        >
                            <Ionicons
                                name={opt.icon}
                                size={14}
                                color={isActive ? colors.white : colors.textSecondary}
                            />
                            <ThemedText
                                style={[
                                    styles.segmentLabel,
                                    { color: isActive ? colors.white : colors.textSecondary },
                                ]}
                            >
                                {opt.label}
                            </ThemedText>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
});

ThemeSelector.displayName = 'ThemeSelector';

const styles = StyleSheet.create({
    wrap: { paddingHorizontal: 11, paddingTop: 4, paddingBottom: 14 },
    labelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    iconWrap: {
        width: 38, height: 38, borderRadius: Layout.borderRadius,
        justifyContent: 'center', alignItems: 'center', marginRight: 14 },
    label: { fontSize: 12.5, fontWeight: '600', letterSpacing: -0.1 },
    subtitle: { fontSize: 10.5, fontWeight: '400', marginTop: 1 },
    track: {
        flexDirection: 'row',
        borderRadius: Layout.borderRadius,
        borderWidth: 1,
        padding: 3,
        position: 'relative' },
    indicator: {
        position: 'absolute',
        top: 3,
        bottom: 3,
        left: 3,
        borderRadius: Layout.borderRadius - 3 },
    segment: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
        paddingVertical: 9,
        zIndex: 1 },
    segmentLabel: { fontSize: 11, fontWeight: '700' } });
