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
    onEdit?: () => void;
}

export const TournamentCard = React.memo(function TournamentCard({ tournament, onPress, onEdit }: TournamentCardProps) {
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
                    backgroundColor: colors.cardBg
                }
            ]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            {/* Banner Image - Full Width */}
            <View style={styles.imageContainer}>
                {tournament.bannerImage ? (
                    <Image source={{ uri: tournament.bannerImage }} style={styles.bannerImage} resizeMode="cover" />
                ) : (
                    <View style={[styles.defaultBanner, { backgroundColor: `${colors.primary}20` }]}>
                        <Ionicons name="trophy-outline" size={36} color={colors.primary} />
                    </View>
                )}

                {/* Status Badge */}
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(tournament.status) }]}>
                    {tournament.status === 'LIVE' && <View style={styles.liveDot} />}
                    <ThemedText style={styles.statusText}>{tournament.status}</ThemedText>
                </View>

                {/* Format Pill */}
                <View style={[styles.formatBadge, { backgroundColor: colors.surface }]}>
                    <ThemedText style={[styles.formatText, { color: colors.text }]}>
                        {tournament.format}
                    </ThemedText>
                </View>

                {/* Edit Button */}
                {onEdit && (
                    <TouchableOpacity
                        style={[styles.editBtn, { backgroundColor: colors.primary }]}
                        onPress={onEdit}
                    >
                        <Ionicons name="pencil" size={14} color="#FFFFFF" />
                    </TouchableOpacity>
                )}
            </View>

            {/* Card Content - Compact */}
            <View style={styles.content}>
                <ThemedText style={[styles.title, { color: colors.text }]} numberOfLines={1}>
                    {tournament.name}
                </ThemedText>

                <View style={styles.infoRow}>
                    <Ionicons name="location-outline" size={12} color={colors.primary} />
                    <ThemedText style={[styles.infoText, { color: colors.textSecondary }]} numberOfLines={1}>
                        {tournament.venue} • {tournament.city}
                    </ThemedText>
                </View>

                {/* Prize & Teams Row */}
                <View style={styles.quickInfo}>
                    {tournament.prizes?.winnerPrize ? (
                        <View style={styles.infoPill}>
                            <Ionicons name="ribbon-outline" size={11} color={colors.secondary} />
                            <ThemedText style={[styles.pillLabel, { color: colors.secondary }]} numberOfLines={1}>
                                {tournament.prizes.winnerPrize}
                            </ThemedText>
                        </View>
                    ) : null}

                    <View style={styles.infoPill}>
                        <Ionicons name="people-outline" size={11} color={colors.primary} />
                        <ThemedText style={[styles.pillLabel, { color: colors.primary }]}>
                            {tournament.teams?.length || 0} Teams
                        </ThemedText>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
});

const styles = StyleSheet.create({
    card: {
        borderRadius: Layout.borderRadius,
        marginHorizontal: 4,
        marginBottom: 10,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2
    },
    imageContainer: {
        height: 100,
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
        top: 8,
        left: 8,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 7,
        paddingVertical: 2,
        borderRadius: 12,
        gap: 3
    },
    liveDot: {
        width: 5,
        height: 5,
        borderRadius: 2.5,
        backgroundColor: '#FFFFFF'
    },
    statusText: {
        color: '#FFFFFF',
        fontSize: 9,
        fontWeight: '800',
        letterSpacing: 0.3
    },
    formatBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        paddingHorizontal: 7,
        paddingVertical: 3,
        borderRadius: 12
    },
    formatText: {
        fontSize: 9,
        fontWeight: '700'
    },
    editBtn: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center'
    },
    content: {
        padding: 9,
        gap: 4
    },
    title: {
        fontSize: 13,
        fontWeight: '800',
        letterSpacing: -0.2
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3
    },
    infoText: {
        fontSize: 11,
        fontWeight: '500'
    },
    quickInfo: {
        flexDirection: 'row',
        gap: 6,
        marginTop: 3
    },
    infoPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 10,
        backgroundColor: 'transparent'
    },
    pillLabel: {
        fontSize: 10,
        fontWeight: '600'
    }
});
