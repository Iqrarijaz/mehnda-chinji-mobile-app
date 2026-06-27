import React from 'react';
import { View, StyleSheet, Switch } from 'react-native';
import Animated, { SlideInLeft } from 'react-native-reanimated';
import { ThemedText } from '../ThemedText';

interface ToggleRowProps {
    label: string;
    description: string;
    value: boolean;
    onValueChange: () => void;
    delay: number;
}

const ToggleRow = ({ label, description, value, onValueChange, delay }: ToggleRowProps) => {
    return (
        <Animated.View entering={SlideInLeft.delay(delay).duration(450)} style={styles.row}>
            <View style={styles.textContainer}>
                <ThemedText style={styles.label}>{label}</ThemedText>
                <ThemedText style={styles.description}>{description}</ThemedText>
            </View>
            <Switch
                value={value}
                onValueChange={onValueChange}
                trackColor={{ false: '#E2E8F0', true: '#B2DFDB' }}
                thumbColor={value ? '#009688' : '#94A3B8'}
                ios_backgroundColor="#E2E8F0"
            />
        </Animated.View>
    );
};

export const DataControlToggles = ({
    settings,
    onToggle
}: {
    settings: any,
    onToggle: (key: string) => void
}) => {
    return (
        <Animated.View
            entering={SlideInLeft.delay(400).duration(500)}
            style={styles.container}
        >
            <ThemedText style={styles.sectionTitle}>Data Settings</ThemedText>
            <View style={styles.card}>
                <ToggleRow
                    label="Low Data Mode"
                    description="Reduce image and media quality to save data"
                    value={settings.lowDataMode}
                    onValueChange={() => onToggle('lowDataMode')}
                    delay={500}
                />
                <View style={styles.divider} />
                <ToggleRow
                    label="Download on Wi-Fi Only"
                    description="Prevent large downloads over mobile data"
                    value={settings.downloadWifiOnly}
                    onValueChange={() => onToggle('downloadWifiOnly')}
                    delay={600}
                />
                <View style={styles.divider} />
                <ToggleRow
                    label="Background Data Usage"
                    description="Allow app to use data when in background"
                    value={settings.backgroundUsage}
                    onValueChange={() => onToggle('backgroundUsage')}
                    delay={700}
                />
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 20,
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: '800',
        color: '#94A3B8',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 8,
        marginLeft: 4,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 22,
        padding: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        gap: 16,
    },
    textContainer: {
        flex: 1,
        gap: 2,
    },
    label: {
        fontSize: 13,
        fontWeight: '700',
        color: '#1E293B',
    },
    description: {
        fontSize: 11,
        color: '#64748B',
        fontWeight: '500',
        lineHeight: 16,
    },
    divider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginHorizontal: 4,
    },
});
