import React from 'react';
import { View, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/context/ThemeContext';
import { Tournament } from '@/types/cricket';

interface TournamentCardProps {
    tournament: Tournament;
    onPress: () => void;
}

export const TournamentCard = React.memo(function TournamentCard({ tournament, onPress }: TournamentCardProps) {
    const { theme } = useTheme();
    const colors = Colors[theme];

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'LIVE': return colors.danger;
            case 'UPCOMING': return colors.primary;
            case 'COMPLETED': return colors.success;
            default: return colors.icon;
        }
    };

    return (
        <TouchableOpacity
            style={[
                styles.card,
                {
                    backgroundColor: colors.cardBg,
                    borderColor: colors.border
                }
            ]}
            onPress={onPress}
            activeOpacity={0.8}
        >
            {/* Banner or Default Image */}
            <View style={styles.imageContainer}>
                {tournament.bannerImage ? (
                    <Image source={{ uri: tournament.bannerImage }} style={styles.bannerImage} resizeMode="cover" />
                ) : (
                    <View style={[styles.defaultBanner, { backgroundColor: `${colors.primary}20` }]}>
                        <Ionicons name="trophy-outline" size={40} color={colors.primary} />
                    </View>
                )}

                {/* Status Badge */}
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(tournament.status) }]}>
                    {tournament.status === 'LIVE' && <View style={styles.liveDot} />}
                    <ThemedText style={styles.statusText}>{tournament.status}</ThemedText>
                </View>

                {/* Format Badge */}
                <View style={[styles.formatBadge, { backgroundColor: colors.surface }]}>
                    <ThemedText style={[styles.formatText, { color: colors.text }]}>
                        {tournament.format} • {tournament.defaultMaxOvers} Ov
                    </ThemedText>
                </View>
            </View>

            {/* Card Content */}
            <View style={styles.content}>
                <ThemedText style={[styles.title, { color: colors.text }]} numberOfLines={1}>
                    {tournament.name}
                </ThemedText>

                <View style={styles.infoRow}>
                    <Ionicons name="location-outline" size={14} color={colors.primary} />
                    <ThemedText style={[styles.infoText, { color: colors.textSecondary }]} numberOfLines={1}>
                        {tournament.venue}, {tournament.city}
                    </ThemedText>
                </View>

                {/* Prize Summary */}
                {tournament.prizes?.winnerPrize ? (
                    <View style={[styles.prizeRow, { backgroundColor: `${colors.accent}15` }]}>
                        <Ionicons name="ribbon-outline" size={14} color={colors.secondary} />
                        <ThemedText style={[styles.prizeText, { color: colors.secondary }]}>
                            Winner: {tournament.prizes.winnerPrize}
                        </ThemedText>
                    </View>
                ) : null}

                {/* Footer Teams Count & Organizers */}
                <View style={styles.footer}>
                    <View style={styles.teamBadge}>
                        <Ionicons name="people-outline" size={13} color={colors.icon} />
                        <ThemedText style={[styles.footerText, { color: colors.textSecondary }]}>
                            {tournament.teams?.length || 0} Teams
                        </ThemedText>
                    </View>

                    {tournament.organizers && tournament.organizers.length > 0 ? (
                        <ThemedText style={[styles.footerText, { color: colors.textSecondary }]}>
                            Org: {tournament.organizers[0].name}
                        </ThemedText>
                    ) : null}
                </View>
            </View>
        </TouchableOpacity>
    );
});

const styles = StyleSheet.create({
    card: {
        borderRadius: Layout.borderRadius,
        marginBottom: 14,
        overflow: 'hidden'
    },
    imageContainer: {
        height: 120,
        width: '100%',
        position: 'relative'
    },
    bannerImage: {
        width: '100%',
        height: '100%'
    },
    defaultBanner: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center'
    },
    statusBadge: {
        position: 'absolute',
        top: 10,
        left: 10,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        gap: 4
    },
    liveDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#FFFFFF'
    },
    statusText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.5
    },
    formatBadge: {
        position: 'absolute',
        top: 10,
        right: 10,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8
    },
    formatText: {
        fontSize: 10,
        fontWeight: '700'
    },
    content: {
        padding: 12,
        gap: 6
    },
    title: {
        fontSize: 15,
        fontWeight: '800',
        letterSpacing: -0.2
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4
    },
    infoText: {
        fontSize: 12,
        fontWeight: '500'
    },
    prizeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        marginTop: 2
    },
    prizeText: {
        fontSize: 11.5,
        fontWeight: '700'
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 4,
        paddingTop: 6,
        borderTopColor: 'rgba(150,150,150,0.1)'
    },
    teamBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4
    },
    footerText: {
        fontSize: 11,
        fontWeight: '600'
    }
});
