import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/context/ThemeContext';
import { Guest } from '@/types/cricket';

interface GuestCardProps {
    guest: Guest;
}

export const GuestCard = React.memo(function GuestCard({ guest }: GuestCardProps) {
    const { theme } = useTheme();
    const colors = Colors[theme];

    const getInitials = (name: string) => {
        if (!name) return 'G';
        return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    };

    return (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.avatarContainer}>
                {guest.image ? (
                    <Image source={{ uri: guest.image }} style={styles.avatar} />
                ) : (
                    <View style={[styles.initialsAvatar, { backgroundColor: `${colors.secondary}20` }]}>
                        <ThemedText style={[styles.initialsText, { color: colors.secondary }]}>
                            {getInitials(guest.name)}
                        </ThemedText>
                    </View>
                )}
            </View>

            <View style={styles.info}>
                <ThemedText style={[styles.name, { color: colors.text }]} numberOfLines={1}>
                    {guest.name}
                </ThemedText>
                <ThemedText style={[styles.title, { color: colors.secondary }]} numberOfLines={1}>
                    {guest.title}
                </ThemedText>
            </View>
        </View>
    );
});

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderRadius: Layout.borderRadius - 4
        marginBottom: 8,
        gap: 10
    },
    avatarContainer: {
        width: 38,
        height: 38,
        borderRadius: 19,
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
        fontSize: 13,
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
    title: {
        fontSize: 11,
        fontWeight: '600'
    }
});
