import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { Layout } from '@/constants/layout';

interface ContactAndLocationProps {
    place: any;
    address: string;
    primaryColor: string;
}

export const ContactAndLocation = React.memo(({ place, address, primaryColor }: ContactAndLocationProps) => {
    const { theme } = useTheme();
    const colors = Colors[theme];

    return (
        <View style={styles.detailSection}>
            <ThemedText style={[styles.sectionHeading, { color: colors.textSecondary }]}>
                Contact & Location
            </ThemedText>

            <View style={styles.infoListItem}>
                <View style={[styles.infoListIcon, { backgroundColor: primaryColor + '10' }]}>
                    <Ionicons name="location" size={12} color={primaryColor} />
                </View>
                <View style={styles.infoListContent}>
                    <ThemedText style={[styles.infoListLabel, { color: colors.textSecondary }]}>Address</ThemedText>
                    <ThemedText style={[styles.infoListVal, { color: colors.text }]}>{address}</ThemedText>
                    {(place.village || place.city) && (
                        <ThemedText style={[styles.infoListSub, { color: colors.textSecondary }]}>
                            {[place.village, place.city].filter(Boolean).join(', ')}
                        </ThemedText>
                    )}
                </View>
            </View>

            {place.timing && (
                <View style={styles.infoListItem}>
                    <View style={[styles.infoListIcon, { backgroundColor: '#F59E0B10' }]}>
                        <Ionicons name="time" size={12} color="#F59E0B" />
                    </View>
                    <View style={styles.infoListContent}>
                        <ThemedText style={[styles.infoListLabel, { color: colors.textSecondary }]}>Operational Hours</ThemedText>
                        <ThemedText style={[styles.infoListVal, { color: colors.text }]}>{place.timing}</ThemedText>
                    </View>
                </View>
            )}
        </View>
    );
});

ContactAndLocation.displayName = 'ContactAndLocation';

const styles = StyleSheet.create({
    detailSection: {
        gap: 6 },
    sectionHeading: {
        fontSize: 10,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: 4 },
    infoListItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
        gap: 12 },
    infoListIcon: {
        width: 26,
        height: 26,
        borderRadius: Layout.borderRadius,
        justifyContent: 'center',
        alignItems: 'center' },
    infoListContent: {
        flex: 1 },
    infoListLabel: {
        fontSize: 9,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5 },
    infoListVal: {
        fontSize: 12,
        fontWeight: '500',
        marginTop: -2 },
    infoListSub: {
        fontSize: 11,
        marginTop: 1 } });
