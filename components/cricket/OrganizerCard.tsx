import React from 'react';
import { View, TouchableOpacity, StyleSheet, Image, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/context/ThemeContext';
import { Organizer } from '@/types/cricket';

interface OrganizerCardProps {
    organizer: Organizer;
}

export const OrganizerCard = React.memo(function OrganizerCard({ organizer }: OrganizerCardProps) {
    const { theme } = useTheme();
    const colors = Colors[theme];

    const getInitials = (name: string) => {
        if (!name) return 'O';
        return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    };

    const handleCall = () => {
        if (organizer.phone) {
            Linking.openURL(`tel:${organizer.phone}`);
        }
    };

    return (
        <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <View style={styles.avatarContainer}>
                {organizer.image ? (
                    <Image source={{ uri: organizer.image }} style={styles.avatar} />
                ) : (
                    <View style={[styles.initialsAvatar, { backgroundColor: `${colors.primary}20` }]}>
                        <ThemedText style={[styles.initialsText, { color: colors.primary }]}>
                            {getInitials(organizer.name)}
                        </ThemedText>
                    </View>
                )}
            </View>

            <View style={styles.info}>
                <ThemedText style={[styles.name, { color: colors.text }]} numberOfLines={1}>
                    {organizer.name}
                </ThemedText>
                <ThemedText style={[styles.role, { color: colors.primary }]} numberOfLines={1}>
                    {organizer.role}
                </ThemedText>
                {organizer.phone ? (
                    <ThemedText style={[styles.phone, { color: colors.textSecondary }]} numberOfLines={1}>
                        {organizer.phone}
                    </ThemedText>
                ) : null}
            </View>

            {organizer.phone ? (
                <TouchableOpacity
                    style={[styles.callBtn, { backgroundColor: colors.primary }]}
                    onPress={handleCall}
                    activeOpacity={0.7}
                >
                    <Ionicons name="call" size={14} color="#FFFFFF" />
                </TouchableOpacity>
            ) : null}
        </View>
    );
});

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderRadius: Layout.borderRadius
        width: 220,
        marginRight: 10,
        gap: 10
    },
    avatarContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        overflow: 'hidden'
    },
    avatar: {
        width: '100%',
        height: '100%'
    },
    initialsAvatar: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center'
    },
    initialsText: {
        fontSize: 14,
        fontWeight: '800'
    },
    info: {
        flex: 1,
        gap: 2
    },
    name: {
        fontSize: 13,
        fontWeight: '700'
    },
    role: {
        fontSize: 11,
        fontWeight: '600'
    },
    phone: {
        fontSize: 10.5
    },
    callBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center'
    }
});
