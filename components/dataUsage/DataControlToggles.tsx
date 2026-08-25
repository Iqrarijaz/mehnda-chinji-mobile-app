import React from 'react';
import { View, StyleSheet, Switch } from 'react-native';
import Animated, { SlideInLeft } from 'react-native-reanimated';
import { ThemedText } from '../ThemedText';
import { Layout } from '@/constants/layout';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';

interface ToggleRowProps {
    label: string;
    description: string;
    value: boolean;
    onValueChange: () => void;
    delay: number;
    colors: typeof Colors.light;
}

const ToggleRow = React.memo(({ label, description, value, onValueChange, delay, colors }: ToggleRowProps) => {
    return (
        <Animated.View entering={SlideInLeft.delay(delay).duration(450)} style={styles.row}>
            <View style={styles.textContainer}>
                <ThemedText style={[styles.label, { color: colors.text }]}>{label}</ThemedText>
                <ThemedText style={[styles.description, { color: colors.textSecondary }]}>{description}</ThemedText>
            </View>
            <Switch
                value={value}
                onValueChange={onValueChange}
                trackColor={{ false: colors.inputBackground, true: `${colors.primary}55` }}
                thumbColor={value ? colors.primary : colors.placeholder}
                ios_backgroundColor={colors.inputBackground}
            />
        </Animated.View>
    );
});

export const DataControlToggles = React.memo(({
    settings,
    onToggle
}: {
    settings: any,
    onToggle: (key: string) => void
}) => {
    const { theme } = useTheme();
    const colors = Colors[theme];
    return (
        <Animated.View
            entering={SlideInLeft.delay(400).duration(500)}
            style={styles.container}
        >
            <ThemedText style={[styles.sectionTitle, { color: colors.textSecondary }]}>Data Settings</ThemedText>
            <View style={[styles.card, { backgroundColor: colors.card }]}>
                <ToggleRow
                    label="Low Data Mode"
                    description="Reduce image and media quality to save data"
                    value={settings.lowDataMode}
                    onValueChange={() => onToggle('lowDataMode')}
                    delay={500}
                    colors={colors}
                />
                <View style={[styles.divider, { backgroundColor: colors.divider }]} />
                <ToggleRow
                    label="Download on Wi-Fi Only"
                    description="Prevent large downloads over mobile data"
                    value={settings.downloadWifiOnly}
                    onValueChange={() => onToggle('downloadWifiOnly')}
                    delay={600}
                    colors={colors}
                />
                <View style={[styles.divider, { backgroundColor: colors.divider }]} />
                <ToggleRow
                    label="Background Data Usage"
                    description="Allow app to use data when in background"
                    value={settings.backgroundUsage}
                    onValueChange={() => onToggle('backgroundUsage')}
                    delay={700}
                    colors={colors}
                />
            </View>
        </Animated.View>
    );
});

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 16,
        marginBottom: 12 },
    sectionTitle: {
        fontSize: 10,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 8,
        marginLeft: 4 },
    card: {
        borderRadius: Layout.borderRadius,
        padding: 10 },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 7,
        gap: 16 },
    textContainer: {
        flex: 1,
        gap: 2 },
    label: {
        fontSize: 11.5,
        fontWeight: '700' },
    description: {
        fontSize: 10,
        fontWeight: '500',
        lineHeight: 16 },
    divider: {
        height: 1,
        marginHorizontal: 4 } });
