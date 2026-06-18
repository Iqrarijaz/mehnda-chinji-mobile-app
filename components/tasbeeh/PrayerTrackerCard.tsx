import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ThemedText } from '@/components/themedText';

export type PrayerStatus = 'unchecked' | 'on_time' | 'late' | 'missed';
export type PrayerKey = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

interface PrayerTrackerCardProps {
    colors: any;
    accentColor: string;
    log: Record<PrayerKey, PrayerStatus>;
    onToggle: (prayerKey: PrayerKey) => void;
}

const PRAYERS: { key: PrayerKey; label: string; time: string }[] = [
    { key: 'fajr', label: 'Fajr', time: 'Dawn' },
    { key: 'dhuhr', label: 'Dhuhr', time: 'Noon' },
    { key: 'asr', label: 'Asr', time: 'Afternoon' },
    { key: 'maghrib', label: 'Maghrib', time: 'Sunset' },
    { key: 'isha', label: 'Isha', time: 'Night' },
];

export const PrayerTrackerCard = React.memo(({
    colors,
    accentColor,
    log = { fajr: 'unchecked', dhuhr: 'unchecked', asr: 'unchecked', maghrib: 'unchecked', isha: 'unchecked' },
    onToggle
}: PrayerTrackerCardProps) => {

    const handlePress = (key: PrayerKey) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onToggle(key);
    };

    const getStatusDetails = (status: PrayerStatus) => {
        switch (status) {
            case 'on_time':
                return { icon: 'checkmark-circle', color: '#059669', label: 'On Time' };
            case 'late':
                return { icon: 'time', color: '#F59E0B', label: 'Late' };
            case 'missed':
                return { icon: 'close-circle', color: '#EF4444', label: 'Missed' };
            default:
                return { icon: 'ellipse-outline', color: colors.textSecondary, label: 'Not Logged' };
        }
    };

    return (
        <View style={[styles.card, { backgroundColor: colors.card }]}>
            <ThemedText style={[styles.title, { color: colors.text }]}>Today's Prayers</ThemedText>
            <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>Tap to cycle: On-Time → Late → Missed → Reset</ThemedText>
            
            <View style={styles.list}>
                {PRAYERS.map((p) => {
                    const status = log[p.key] || 'unchecked';
                    const { icon, color, label } = getStatusDetails(status);

                    return (
                        <TouchableOpacity
                            key={p.key}
                            onPress={() => handlePress(p.key)}
                            style={[styles.row, { borderBottomColor: colors.border }]}
                            activeOpacity={0.7}
                        >
                            <View style={styles.left}>
                                <Ionicons name={icon as any} size={22} color={color} />
                                <View style={{ marginLeft: 12 }}>
                                    <ThemedText style={styles.prayerLabel}>{p.label}</ThemedText>
                                    <ThemedText style={[styles.prayerTime, { color: colors.textSecondary }]}>{p.time}</ThemedText>
                                </View>
                            </View>
                            <View style={[styles.badge, { backgroundColor: color + '12' }]}>
                                <ThemedText style={{ fontSize: 11, fontWeight: '700', color: color }}>
                                    {label}
                                </ThemedText>
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
});

PrayerTrackerCard.displayName = 'PrayerTrackerCard';

const styles = StyleSheet.create({
    card: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
    },
    subtitle: {
        fontSize: 11,
        marginTop: 2,
        marginBottom: 14,
    },
    list: {
        marginTop: 4,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    left: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    prayerLabel: {
        fontSize: 14,
        fontWeight: '600',
    },
    prayerTime: {
        fontSize: 10,
        marginTop: 1,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
});
