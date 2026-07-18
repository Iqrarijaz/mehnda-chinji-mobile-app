import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';

interface TravelRouteProps {
    route: any[];
    primaryColor: string;
}

const capitalize = (str: string) => {
    if (!str || typeof str !== 'string') return '';
    const words = str.toLowerCase().split(' ');
    return words.map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

export function TravelRoute({ route, primaryColor }: TravelRouteProps) {
    const { theme } = useTheme();
    const colors = Colors[theme];

    if (!Array.isArray(route) || route.length === 0) return null;

    return (
        <View style={styles.detailSection}>
            <ThemedText style={[styles.sectionHeading, { color: colors.textSecondary }]}>
                Travel Route
            </ThemedText>
            <View style={styles.routeContainer}>
                {route.map((r: any, idx: number) => (
                    <View key={idx} style={styles.routeItem}>
                        <View style={styles.routeDotContainer}>
                            <View style={[styles.routeDot, { backgroundColor: primaryColor }]} />
                            {idx !== route.length - 1 && <View style={[styles.routeLine, { backgroundColor: colors.border }]} />}
                        </View>
                        <View style={styles.routeInfo}>
                            <ThemedText style={[styles.routeCity, { color: colors.text }]}>{capitalize(r.city)}</ThemedText>
                            <ThemedText style={[styles.routeTime, { color: colors.textSecondary }]}>{r.time}</ThemedText>
                        </View>
                    </View>
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    detailSection: {
        gap: 6,
    },
    sectionHeading: {
        fontSize: 10,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: 4,
    },
    routeContainer: {
        marginTop: 4,
        marginLeft: 4,
    },
    routeItem: {
        flexDirection: 'row',
        gap: 16,
    },
    routeDotContainer: {
        alignItems: 'center',
        width: 12,
    },
    routeDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginTop: 6,
    },
    routeLine: {
        width: 2,
        flex: 1,
        marginVertical: 2,
    },
    routeInfo: {
        flex: 1,
        paddingBottom: 12,
    },
    routeCity: {
        fontSize: 11,
        fontWeight: '700',
        marginBottom: 2,
    },
    routeTime: {
        fontSize: 11,
        fontWeight: '500',
    },
});
